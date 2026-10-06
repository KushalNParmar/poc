const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appRoot = process.env.QA_APP_ROOT || path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(appRoot, 'src', name), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
const checks = [];

function harness() {
  const events = [];
  let active = false;
  let label = null;
  let pose = null;
  let pendingInit = null;
  let pendingNetwork = null;
  let pendingDestroy = null;
  const callbacks = [];
  const engine = {
    holdInit: false,
    holdNetwork: false,
    holdDestroy: false,
    nextInitError: null,
    nextNetworkError: null,
    throwDetect: false,
    init(options) {
      assert.equal(active, false, 'Only one singleton core may be active.');
      active = true;
      callbacks.push(options.callbackReady);
      events.push(['init', options.followZRot, structuredClone(options.scanSettings)]);
      const finish = () => {
        const error = engine.nextInitError;
        engine.nextInitError = null;
        options.callbackReady(error);
      };
      if (engine.holdInit) pendingInit = finish;
      else finish();
    },
    set_NN(network, callback, options) {
      events.push(['network', network.label, options.paramsPerLabel]);
      label = network.label;
      const finish = () => {
        const error = engine.nextNetworkError;
        engine.nextNetworkError = null;
        callback(error);
      };
      if (engine.holdNetwork) pendingNetwork = finish;
      else finish();
    },
    detect() {
      assert(active, 'Inference requires an active core.');
      events.push(['detect', label]);
      if (engine.throwDetect) throw new Error('Synthetic GPU failure');
      return pose || { label: false, detectScore: 0 };
    },
    reset_state() { events.push(['reset']); },
    set_source() { events.push(['source']); },
    destroy() {
      events.push(['destroy']);
      if (engine.holdDestroy) return new Promise(resolve => {
        pendingDestroy = () => { active = false; resolve(); };
      });
      active = false;
      return Promise.resolve();
    },
  };
  const context = vm.createContext({
    window: { WEBARROCKSOBJECT: engine }, structuredClone, setTimeout, clearTimeout,
  });
  vm.runInContext(read('config.js').replace(/export /g, '')
    + '\nglobalThis.profiles = Object.values(TARGETS); globalThis.autoSettings = CONFIG.autoDetection;', context);
  vm.runInContext(read('tracker.js').replace('export class ObjectTracker', 'class ObjectTracker'), context);
  vm.runInContext(read('auto-tracker.js').replace(/^import .*\n/, '')
    .replace('export class AutoObjectTracker', 'class AutoObjectTracker')
    + '\nglobalThis.AutoTracker = AutoObjectTracker;', context);
  const targets = Array.from(context.profiles);
  const failures = [];
  const video = { videoWidth: 640, videoHeight: 480 };
  const create = () => new context.AutoTracker({
    video, canvas: {}, targets,
    networks: new Map(targets.map(target => [target.id, { label: target.label }])),
    settings: context.autoSettings,
    onFatal: error => failures.push(error),
  });
  return {
    engine, events, callbacks, failures, targets, video, create,
    count: name => events.filter(event => event[0] === name).length,
    setPose(target = targets[0], changes = {}) {
      pose = {
        label: target.label, detectScore: 0.99, positionScale: [0.5, 0.5, 0.4, 0.4],
        pitch: 0, yaw: 0, roll: 0, ...changes,
      };
    },
    miss() { pose = null; },
    releaseInit() { const finish = pendingInit; pendingInit = null; finish?.(); },
    releaseNetwork() { const finish = pendingNetwork; pendingNetwork = null; finish?.(); },
    releaseDestroy() { const finish = pendingDestroy; pendingDestroy = null; finish?.(); },
  };
}

async function exhaustCandidate(controller, start = 0) {
  for (let frame = 0; frame < 31; frame += 1) controller.step(start + frame * 61);
  await tick();
}

(async () => {
  {
    const h = harness();
    const c = h.create();
    await c.init();
    assert.equal(c.step(0).phase, 'searching');
    c.step(2000);
    assert.equal(h.count('init'), 1, 'Elapsed time alone cannot exhaust a candidate.');
    for (let i = 1; i <= 27; i += 1) c.step(2000 + i);
    assert.equal(h.count('init'), 1, 'Twenty-nine inferences are below the minimum budget.');
    assert.equal(c.step(2030).phase, 'switching');
    await tick();
    assert.equal(c.target.id, 'keyboard');
    assert.equal(h.count('destroy'), 1);
    // Plenty of frames alone also cannot exhaust the next candidate.
    for (let i = 0; i < 35; i += 1) c.step(3000 + i);
    assert.equal(c.target.id, 'keyboard');
    c.step(4800);
    await tick();
    assert.equal(c.target.id, 'sprite');
    await exhaustCandidate(c, 6000);
    assert.equal(c.target.id, 'cup');
    assert.deepEqual(h.events.filter(e => e[0] === 'init').map(e => e[1]), [true, false, true, true]);
    assert.deepEqual(h.events.filter(e => e[0] === 'network').map(e => e[1]), ['CUP', 'KEYBOARD', 'SPRITECAN', 'CUP']);
    await c.destroy();
    checks.push('Search requires elapsed time AND actual inference frames; all three profiles rotate with serialized cleanup.');
  }

  {
    const h = harness();
    const c = h.create();
    await c.init();
    h.setPose();
    for (let t = 0; t < 3; t += 1) assert.equal(c.step(t).state, null);
    h.setPose(h.targets[0], { detectScore: 0.91 });
    c.step(3);
    h.setPose();
    for (let t = 4; t < 7; t += 1) assert.equal(c.step(t).phase, 'searching');
    h.setPose(h.targets[0], { yaw: NaN });
    c.step(7);
    h.setPose(h.targets[1]);
    c.step(8);
    h.setPose(h.targets[0], { positionScale: [0.5, 0.5, 0, 0.4] });
    c.step(9);
    h.setPose();
    c.step(10); c.step(11); c.step(12);
    assert.equal(c.step(13).phase, 'tracking');
    assert.equal(c.step(14).target.id, 'cup');
    h.setPose(h.targets[0], { detectScore: 0.7 });
    assert(c.step(15).state, 'Locked tracking uses the engine’s keep-tracking acceptance.');
    h.miss();
    assert.equal(c.step(20).phase, 'tracking');
    assert.equal(c.step(1000).state, null);
    h.setPose();
    assert(c.step(1400).state);
    h.miss();
    c.step(1500);
    assert.equal(c.step(2999).phase, 'tracking');
    assert.equal(c.step(3000).phase, 'switching');
    await tick();
    assert.equal(c.target.id, 'keyboard');
    await c.destroy();
    checks.push('Four consecutive confident finite poses lock; weak, wrong-label and invalid poses cannot confirm; transient misses do not switch.');
  }

  {
    const h = harness();
    const c = h.create();
    await c.init();
    h.setPose();
    c.step(1); c.step(2); c.step(3);
    const count = h.count('detect');
    c.step(3); c.step(2); c.step(NaN); c.step(Infinity);
    assert.equal(h.count('detect'), count);
    c.reset();
    assert.equal(h.count('init'), 1);
    assert.equal(h.count('destroy'), 0);
    assert.equal(c.step(4).phase, 'searching');
    c.step(5); c.step(6);
    assert.equal(c.step(7).phase, 'tracking');
    c.resume();
    assert.equal(c.step(100000).phase, 'searching');
    assert.equal(h.count('init'), 1);
    // The source adapter still updates camera dimensions without replacing NN.
    h.video.videoWidth = 480;
    h.video.videoHeight = 640;
    c.step(100001);
    assert.equal(h.count('source'), 1);
    await c.destroy();
    checks.push('Rescan/resume clear lock and timing without rebuilding; invalid timestamps do not consume frames; source rotation remains supported.');
  }

  for (const hold of ['holdInit', 'holdNetwork']) {
    const h = harness();
    h.engine[hold] = true;
    const c = h.create();
    const starting = c.init().then(() => null, error => error);
    await tick();
    c.reset();
    c.resume();
    await c.destroy();
    assert(await starting, 'Canceled initial startup must reject.');
    h.engine[hold] = false;
    const retry = h.create();
    await retry.init();
    h.releaseInit(); h.releaseNetwork();
    h.callbacks[0]('GLCONTEXT_LOST');
    await tick();
    assert.equal(h.failures.length, 0, 'Late callbacks from canceled startup must not report errors.');
    h.setPose();
    retry.step(0); retry.step(1); retry.step(2);
    assert.equal(retry.step(3).phase, 'tracking');
    await retry.destroy();
    assert.equal(h.count('destroy'), 2, 'Partial startup and subsequent retry each release their core.');
  }
  checks.push('Closing during core or network callback waits releases the singleton; late callbacks cannot affect a retry.');

  {
    const h = harness();
    const c = h.create();
    await c.init();
    h.engine.holdDestroy = true;
    await exhaustCandidate(c);
    assert.equal(h.count('init'), 1, 'Next init must await previous destroy completion.');
    const stopping = c.destroy();
    c.reset(); c.resume(); c.step(20000);
    h.releaseDestroy();
    await stopping;
    await tick();
    assert.equal(h.count('init'), 1, 'Closing during transition must never start another core.');
    assert.equal(h.failures.length, 0);
    checks.push('Slow destruction serializes switching; close/rescan during transition cannot restart a stopped controller.');
  }

  {
    const h = harness();
    const c = h.create();
    await c.init();
    h.engine.holdNetwork = true;
    await exhaustCandidate(c);
    assert.equal(c.phase, 'switching');
    c.reset(); c.resume();
    h.engine.holdNetwork = false;
    h.releaseNetwork();
    await tick();
    assert.equal(c.target.id, 'keyboard');
    h.setPose(h.targets[1]);
    for (let frame = 0; frame < 3; frame += 1) assert.equal(c.step(5000 + frame).phase, 'searching');
    assert.equal(c.step(5003).phase, 'tracking');
    await c.destroy();
    checks.push('Rescan while the next model loads enters fresh confirmation instead of starting an overlapping transition.');
  }

  for (const errorStage of ['nextInitError', 'nextNetworkError']) {
    const h = harness();
    h.engine[errorStage] = 'INVALID_NN';
    const broken = h.create();
    await assert.rejects(broken.init());
    assert.equal(h.count('destroy'), 1);
    await broken.destroy();
    const retry = h.create();
    await retry.init();
    await retry.destroy();
    assert.equal(h.failures.length, 0, 'Initial failure is returned to init caller, not duplicated as a fatal notification.');
  }
  checks.push('Failed core/network startup cleans partial resources and allows a fresh controller to start.');

  {
    const h = harness();
    const c = h.create();
    await c.init();
    h.engine.nextNetworkError = 'INVALID_NN';
    await exhaustCandidate(c);
    assert.equal(h.failures.length, 1);
    assert(c.failed);
    c.step(20000); c.reset();
    await c.destroy();
    assert.equal(h.failures.length, 1);
    checks.push('Background switch failure reports once, stops scheduling and releases the failed core.');
  }

  {
    const h = harness();
    const c = h.create();
    await c.init();
    h.engine.throwDetect = true;
    c.step(0); c.step(1);
    assert.equal(h.failures.length, 1);
    await c.destroy();
    for (const callback of h.callbacks) callback('GLCONTEXT_LOST');
    assert.equal(h.failures.length, 1);
    checks.push('Inference failure reports once; context-loss callbacks after close remain silent.');
  }

  console.log(JSON.stringify({ result: 'PASS', checks }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
