import { CONFIG, TARGETS, DEFAULT_TARGET_ID } from './config.js';
import { EXPERIENCES } from './content.js';
import { TrackedHotspots } from './hotspots.js';
import { OneEuroPoseFilter } from './pose-filter.js';

const THREE = window.THREE;

export class AnnotationScene {
  constructor(canvas, labelLayer, stage) {
    this.stage = stage;
    this.labelLayer = labelLayer;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, CONFIG.maxPixelRatio));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    this.root = new THREE.Group();
    this.root.name = 'tracked-object-anchor';
    this.root.visible = false;
    this.content = new THREE.Group();
    this.content.name = 'tracked-annotations';
    this.root.add(this.content);
    this.scene.add(this.root);
    this.poseFilter = new OneEuroPoseFilter(CONFIG.smoothing);
    this.lastPoseAt = null;
    this.lastRenderAt = null;
    this.annotationGroup = new THREE.Group();
    this.annotationGroup.name = 'object-relative-labels';
    this.content.add(this.annotationGroup);
    this.target = TARGETS[DEFAULT_TARGET_ID];
    this.onHotspot = () => {};
    this.hotspots = new TrackedHotspots(stage.querySelector('#hotspots'), labelLayer,
      index => this.onHotspot(index));
    this.annotations = this.hotspots.items;
    this.layoutVisible = false;
    this.topbar = stage.querySelector('.topbar');
    this.sessionBar = stage.querySelector('#sessionBar');
    this.labelsEnabled = true;
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, 'ZXY');
    this.quaternion = new THREE.Quaternion();
    this.mode = 'idle';
    this.resize();
  }

  async load() {
    if (this.ready) return;
    this.setTarget(this.target);
    this.ready = true;
  }

  setTarget(target) {
    if (!target || !EXPERIENCES[target.id]) return;
    const changed = this.target?.id !== target.id || !this.hotspots.items.length;
    this.target = target;
    if (changed) {
      this.hotspots.setTarget(target, EXPERIENCES[target.id]);
      this.annotations = this.hotspots.items;
      this.layoutVisible = false;
    }
  }

  setActiveHotspot(index) {
    this.hotspots.setActive(index);
  }

  setMode(mode, video = null, target = this.target) {
    this.mode = mode;
    this.video = video;
    this.root.visible = false;
    this.root.position.set(0, 0, 0);
    this.root.quaternion.identity();
    this.setTarget(target);
    this.resetTracking();
    this.camera.position.set(0, 0, 0);
    this.camera.quaternion.identity();
    this.drawLabels();
    this.resize();
  }

  resize() {
    const { width, height } = this.stage.getBoundingClientRect();
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.clearViewOffset();
    if (this.mode === 'ar' && this.video?.videoWidth && this.video?.videoHeight) {
      const vw = this.video.videoWidth;
      const vh = this.video.videoHeight;
      const aspect = vw / vh;
      // Match the centered object-fit:cover camera video exactly.
      const coverScale = Math.max(width / vw, height / vh);
      const fullWidth = vw * coverScale;
      const fullHeight = vh * coverScale;
      this.camera.fov = Math.min(60, CONFIG.cameraMinDimensionFov * (vh > vw ? 1 / aspect : 1));
      this.camera.aspect = aspect;
      this.camera.setViewOffset(fullWidth, fullHeight, (fullWidth - width) / 2, (fullHeight - height) / 2, width, height);
    } else {
      this.camera.fov = 35;
      this.camera.aspect = width / height;
    }
    this.camera.updateProjectionMatrix();
  }

  resetTracking() {
    this.root.visible = false;
    this.layoutVisible = false;
    this.poseFilter.reset();
    this.hotspots.reset();
    this.lastPoseAt = null;
    this.lastRenderAt = null;
    this.drawLabels();
  }

  updatePose(state, reset = false, timestampMs = performance.now()) {
    const s = state.positionScale?.[2];
    if (!(s > 0) || ![...state.positionScale, state.pitch, state.yaw, state.roll, timestampMs].every(Number.isFinite)) return false;
    // Unit detection-window geometry; same camera-relative convention as upstream.
    const halfTanHorizontal = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * this.camera.aspect;
    const distance = 1 / (2 * s * halfTanHorizontal);
    this.position.set(
      (2 * state.positionScale[0] - 1) * distance * halfTanHorizontal,
      (2 * state.positionScale[1] - 1) * distance * halfTanHorizontal / this.camera.aspect,
      -distance - 0.5,
    );
    this.rotation.set(-(state.pitch - Math.PI / 2), state.yaw + Math.PI, -state.roll);
    this.quaternion.setFromEuler(this.rotation);
    if (reset) this.resetTracking();
    const fresh = !this.poseFilter.initialized || (this.lastPoseAt !== null
      && timestampMs - this.lastPoseAt > CONFIG.smoothing.maxGapSeconds * 1000);
    if (!this.poseFilter.update(this.position, this.quaternion, timestampMs / 1000)) return false;
    this.lastPoseAt = timestampMs;
    if (fresh) {
      // Reacquire at the current pose instead of sliding from a stale position.
      this.root.position.copy(this.poseFilter.position);
      this.root.quaternion.copy(this.poseFilter.quaternion);
      this.lastRenderAt = timestampMs;
    }
    return true;
  }

  drawLabels() {
    this.hotspots.setVisibility(this.root.visible && this.layoutVisible, this.labelsEnabled);
  }

  getSafeRect() {
    const stage = this.stage.getBoundingClientRect();
    const margin = 12;
    // Reserve the notch inset even when the start screen has no top bar.
    const safeTop = parseFloat(getComputedStyle(this.stage).getPropertyValue('--annotation-safe-top')) || 0;
    let top = margin + safeTop;
    let bottom = stage.height - margin;
    if (this.topbar && !this.topbar.hidden) {
      const rect = this.topbar.getBoundingClientRect();
      if (rect.height > 0) top = Math.max(top, rect.bottom - stage.top + margin);
    }
    if (this.sessionBar && !this.sessionBar.hidden && !this.sessionBar.classList.contains('closed')) {
      const rect = this.sessionBar.getBoundingClientRect();
      if (rect.height > 0) bottom = Math.min(bottom, rect.top - stage.top - margin);
    }
    const reopen = this.stage.querySelector('#reopenButton');
    if (reopen && !reopen.hidden) {
      const rect = reopen.getBoundingClientRect();
      if (rect.height > 0) bottom = Math.min(bottom, rect.top - stage.top - margin);
    }
    return { x: margin, y: top, width: Math.max(0, stage.width - margin * 2), height: Math.max(0, bottom - top) };
  }

  render(timestampMs = performance.now()) {
    if (this.poseFilter.initialized && this.lastRenderAt !== null && timestampMs > this.lastRenderAt) {
      const dt = Math.min((timestampMs - this.lastRenderAt) / 1000, 0.1);
      // Frame-time easing smooths the tracked spots between detections.
      const alpha = 1 - Math.exp(-dt / CONFIG.smoothing.renderTimeConstant);
      this.root.position.lerp(this.poseFilter.position, alpha);
      this.root.quaternion.slerp(this.poseFilter.quaternion, alpha);
    }
    this.lastRenderAt = timestampMs;
    if (this.root.visible) {
      this.scene.updateMatrixWorld(true);
      this.layoutVisible = this.hotspots.update(this.root, this.camera, this, this.getSafeRect());
    }
    this.drawLabels();
    this.renderer.render(this.scene, this.camera);
  }
}
