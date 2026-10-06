import { ObjectTracker } from './tracker.js';

const DEFAULTS = Object.freeze({
  candidateDurationMs: 1800,
  candidateMinFrames: 30,
  confirmationFrames: 4,
  trackingLossMs: 1500,
});

function positive(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Searches one pretrained model at a time, then devotes tracking to its match. */
export class AutoObjectTracker {
  constructor({ video, canvas, targets, networks, settings = {}, onFatal = () => {} }) {
    this.video = video;
    this.canvas = canvas;
    this.targets = Array.isArray(targets) ? [...targets] : [];
    this.networks = networks;
    this.settings = {
      candidateDurationMs: positive(settings.candidateDurationMs, DEFAULTS.candidateDurationMs),
      candidateMinFrames: Math.ceil(positive(settings.candidateMinFrames, DEFAULTS.candidateMinFrames)),
      confirmationFrames: Math.max(4, Math.ceil(positive(settings.confirmationFrames, DEFAULTS.confirmationFrames))),
      trackingLossMs: positive(settings.trackingLossMs, DEFAULTS.trackingLossMs),
    };
    this.onFatal = onFatal;
    this.tracker = null;
    this.target = null;
    this.retainedTargetId = null;
    this.candidateIndex = 0;
    this.phase = 'switching';
    this.stopped = false;
    this.failed = false;
    this.fatalReported = false;
    this.initPromise = null;
    this.transitionPromise = null;
    this.destroyPromise = null;
    this.clearSearch();
  }

  init() {
    if (this.stopped) return Promise.reject(new Error('Automatic object tracking was stopped.'));
    if (this.initPromise) return this.initPromise;
    if (!this.video || !this.canvas || !this.targets.length
      || !this.networks || typeof this.networks.get !== 'function'
      || this.targets.some(target => !target?.id || !this.networks.get(target.id))) {
      return Promise.reject(new Error('Camera, canvas, target profiles and their parsed networks are required.'));
    }
    this.initPromise = this.replaceCandidate(0).then(() => {
      if (this.stopped) throw new Error('Automatic object tracking was stopped.');
      if (this.failed) throw new Error('Automatic object tracking could not start.');
      return this;
    }, error => {
      this.failed = true;
      throw error;
    });
    return this.initPromise;
  }

  clearSearch() {
    this.candidateStartedAt = null;
    this.candidateFrames = 0;
    this.confirmedFrames = 0;
    this.missingSince = null;
    this.lastStepAt = null;
  }

  snapshot(state = null) {
    return {
      phase: this.phase,
      target: this.phase === 'switching' ? null : this.target,
      state: this.phase === 'tracking' ? state : null,
    };
  }

  // Destroy/init also restores init-only followZRot and model-specific scan
  // defaults. Repeated set_NN alone retains old GPU resources in this engine.
  replaceCandidate(index) {
    if (this.transitionPromise || this.stopped || this.failed) return this.transitionPromise || Promise.resolve();
    this.phase = 'switching';
    this.clearSearch();
    const transition = (async () => {
      const previous = this.tracker;
      this.tracker = null;
      if (previous) await previous.destroy();
      if (this.stopped || this.failed) return;

      const target = this.targets[index];
      const next = new ObjectTracker({
        video: this.video,
        canvas: this.canvas,
        target,
        onFatal: error => {
          if (this.tracker === next) this.reportFatal(error);
        },
      });
      this.tracker = next;
      try {
        await next.init(this.networks.get(target.id));
      } catch (error) {
        if (this.tracker === next) this.tracker = null;
        try {
          await next.destroy();
        } catch (cleanupError) {
          // Preserve the actionable startup error if a partly initialized
          // graphics context also rejects its cleanup.
          error.cleanupError = cleanupError;
        }
        if (!this.stopped && !this.failed) throw error;
        return;
      }
      if (this.stopped || this.failed) {
        if (this.tracker === next) this.tracker = null;
        await next.destroy();
        return;
      }
      this.target = target;
      this.candidateIndex = index;
      this.clearSearch();
      this.phase = 'searching';
    })();
    this.transitionPromise = transition;
    const release = () => {
      if (this.transitionPromise === transition) this.transitionPromise = null;
    };
    // Both handlers consume settlement; the caller handles the original error.
    transition.then(release, release);
    return transition;
  }

  nextCandidate() {
    // The UI retains a profile only after its reveal frames have succeeded.
    // Continue inference with that model until the user explicitly rescans.
    if (this.retainedTargetId) return;
    this.replaceCandidate((this.candidateIndex + 1) % this.targets.length)
      .catch(error => this.reportFatal(error));
  }

  retainTarget(targetId) {
    if (this.stopped || this.failed || this.phase !== 'tracking' || !this.tracker?.ready
      || this.target?.id !== targetId) return false;
    this.retainedTargetId = targetId;
    return true;
  }

  validPose(state) {
    return state?.label === this.target.label
      && state.positionScale?.length >= 3
      && Array.from(state.positionScale).every(Number.isFinite)
      && state.positionScale[2] > 0
      && [state.pitch, state.yaw, state.roll, state.score].every(Number.isFinite);
  }

  step(now) {
    if (this.stopped || this.failed || this.phase === 'switching' || !this.tracker?.ready) return this.snapshot();
    // Only actual, new inference frames consume a candidate's search budget.
    if (!Number.isFinite(now) || (this.lastStepAt !== null && now <= this.lastStepAt)) return this.snapshot();
    this.lastStepAt = now;
    let state;
    try {
      state = this.tracker.step();
    } catch (error) {
      this.reportFatal(error);
      return this.snapshot();
    }
    const valid = this.validPose(state);
    if (this.phase === 'tracking') {
      if (valid) {
        this.missingSince = null;
        return this.snapshot(state);
      }
      if (this.missingSince === null) this.missingSince = now;
      if (now - this.missingSince >= this.settings.trackingLossMs) this.nextCandidate();
      return this.snapshot();
    }

    if (this.candidateStartedAt === null) this.candidateStartedAt = now;
    this.candidateFrames += 1;
    const threshold = this.target.loadOptions.paramsPerLabel?.[this.target.label]?.thresholdDetect ?? 0;
    const factor = this.target.detectOptions.thresholdDetectFactor ?? 1;
    this.confirmedFrames = valid && state.score >= threshold * factor ? this.confirmedFrames + 1 : 0;
    if (this.confirmedFrames >= this.settings.confirmationFrames) {
      this.phase = 'tracking';
      this.missingSince = null;
      return this.snapshot(state);
    }
    // A just-found candidate gets its remaining confirmation frames. A miss
    // ends that grace immediately, so flickering detections cannot block search.
    if (this.confirmedFrames === 0
      && now - this.candidateStartedAt >= this.settings.candidateDurationMs
      && this.candidateFrames >= this.settings.candidateMinFrames) this.nextCandidate();
    return this.snapshot();
  }

  reset() {
    if (this.stopped || this.failed) return;
    this.retainedTargetId = null;
    this.clearSearch();
    // A model already being loaded will enter a fresh search when ready.
    if (this.transitionPromise || !this.tracker?.ready) return;
    try {
      this.tracker.reset();
      this.phase = 'searching';
    } catch (error) {
      this.reportFatal(error);
    }
  }

  resume() {
    // A background/foreground transition needs fresh confirmation but must not
    // turn a displayed experience back into an unrestricted object search.
    const retainedTargetId = this.retainedTargetId;
    this.reset();
    if (!this.stopped && !this.failed) this.retainedTargetId = retainedTargetId;
  }

  reportFatal(error) {
    if (this.stopped || this.fatalReported) return;
    this.failed = true;
    this.fatalReported = true;
    this.phase = 'switching';
    this.onFatal(error);
  }

  destroy() {
    if (this.destroyPromise) return this.destroyPromise;
    this.stopped = true;
    this.retainedTargetId = null;
    this.phase = 'switching';
    this.clearSearch();
    this.destroyPromise = (async () => {
      // Cancel an adapter waiting for a callback before awaiting its transition.
      const tracker = this.tracker;
      try {
        if (tracker) await tracker.destroy();
      } finally {
        if (this.transitionPromise) await this.transitionPromise.catch(() => {});
        this.tracker = null;
        this.target = null;
      }
    })();
    return this.destroyPromise;
  }
}
