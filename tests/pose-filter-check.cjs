const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appRoot = process.env.QA_APP_ROOT || path.resolve(__dirname, '..');
const THREE = require(path.join(appRoot, 'vendor/three/three.min.js'));
const source = fs.readFileSync(path.join(appRoot, 'src/pose-filter.js'), 'utf8');
const context = vm.createContext({ window: { THREE } });
vm.runInContext(source.replace('export class OneEuroPoseFilter', 'class OneEuroPoseFilter') +
  '\nglobalThis.TestFilter = OneEuroPoseFilter;', context);
const OneEuroPoseFilter = context.TestFilter;
const configSource = fs.readFileSync(path.join(appRoot, 'src/config.js'), 'utf8');
vm.runInContext(configSource.replace(/export /g, '') + '\nglobalThis.TestConfig = CONFIG;', context);
const CONFIG = context.TestConfig;
assert(CONFIG.smoothing, 'Production smoothing configuration must be present.');
const axis = new THREE.Vector3(0, 1, 0);
const origin = new THREE.Vector3(0, 0, -4);
const identity = new THREE.Quaternion();
const yaw = angle => new THREE.Quaternion().setFromAxisAngle(axis, angle);
const rms = values => Math.sqrt(values.reduce((sum, x) => sum + x * x, 0) / values.length);
const angle = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a.dot(b))));
function random(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1;
}

const report = { settings: CONFIG.smoothing, jitter: [], motion: [], legacyComparison: [], checks: [] };
for (const fps of [15, 30, 60]) {
  const filter = new OneEuroPoseFilter(CONFIG.smoothing);
  const noise = random(192);
  const rawPosition = [], filteredPosition = [], rawAngle = [], filteredAngle = [];
  for (let frame = 0; frame < fps * 12; frame++) {
    const p = origin.clone().add(new THREE.Vector3(noise(), noise(), noise()).multiplyScalar(0.035));
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(noise() * 0.045, noise() * 0.045, noise() * 0.045));
    assert.equal(filter.update(p, q, frame / fps), true);
    if (frame < fps * 2) continue;
    rawPosition.push(p.distanceTo(origin));
    filteredPosition.push(filter.position.distanceTo(origin));
    rawAngle.push(angle(q, identity));
    filteredAngle.push(angle(filter.quaternion, identity));
  }
  const positionReduction = 1 - rms(filteredPosition) / rms(rawPosition);
  const rotationReduction = 1 - rms(filteredAngle) / rms(rawAngle);
  assert(positionReduction > 0.48, `Position jitter reduction at ${fps} fps: ${positionReduction}`);
  assert(rotationReduction > 0.43, `Rotation jitter reduction at ${fps} fps: ${rotationReduction}`);
  report.jitter.push({ detectionFps: fps, positionRmsReductionPercent: +(positionReduction * 100).toFixed(1),
    rotationRmsReductionPercent: +(rotationReduction * 100).toFixed(1) });

  // Include production render interpolation and sample-and-hold
  // between detections, so measured latency is not just the filter in isolation.
  const moving = new OneEuroPoseFilter(CONFIG.smoothing);
  const renderedPosition = origin.clone();
  const renderedQuaternion = identity.clone();
  const renderFps = 60;
  const alpha = 1 - Math.exp(-1 / (renderFps * CONFIG.smoothing.renderTimeConstant));
  const positionLags = [], rotationLags = [];
  for (let frame = 0; frame < renderFps * 5; frame++) {
    const t = frame / renderFps;
    const motionTime = Math.max(0, t - 1);
    const p = origin.clone().setX(motionTime * 0.8);
    const q = yaw(motionTime * Math.PI / 2);
    if (frame % (renderFps / fps) === 0) moving.update(p, q, t);
    renderedPosition.lerp(moving.position, alpha);
    renderedQuaternion.slerp(moving.quaternion, alpha);
    if (t > 2) {
      positionLags.push(p.distanceTo(renderedPosition) / 0.8);
      rotationLags.push(angle(q, renderedQuaternion) / (Math.PI / 2));
    }
  }
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  const positionLag = mean(positionLags);
  const rotationLag = mean(rotationLags);
  assert(positionLag < 0.14, `Position motion latency at ${fps} fps: ${positionLag}`);
  assert(rotationLag < 0.12, `Rotation motion latency at ${fps} fps: ${rotationLag}`);
  report.motion.push({ detectionFps: fps, positionLagMs: +(positionLag * 1000).toFixed(1),
    rotationLagMs: +(rotationLag * 1000).toFixed(1), includesRenderSmoothingMs: CONFIG.smoothing.renderTimeConstant * 1000 });
}

// Same projection motion at different depths must receive identical smoothing.
const near = new OneEuroPoseFilter(CONFIG.smoothing), far = new OneEuroPoseFilter(CONFIG.smoothing);
for (let frame = 0; frame < 100; frame++) {
  const p = new THREE.Vector3(Math.sin(frame / 15) * 0.5, 0, -2 - frame / 100);
  near.update(p, identity, frame / 30);
  far.update(p.clone().multiplyScalar(4), identity, frame / 30);
  assert(near.position.distanceTo(far.position.clone().divideScalar(4)) < 1e-10);
}
report.checks.push('Depth-normalized response is identical at 1× and 4× distance.');

const wrapped = new OneEuroPoseFilter(CONFIG.smoothing);
wrapped.update(origin, yaw(179 * Math.PI / 180), 0);
for (let frame = 1; frame <= 60; frame++) {
  const q = yaw((-179 + Math.sin(frame) * 0.1) * Math.PI / 180);
  if (frame % 2) q.set(-q.x, -q.y, -q.z, -q.w);
  wrapped.update(origin, q, frame / 30);
  assert(angle(wrapped.quaternion, yaw(Math.PI)) < 2 * Math.PI / 180);
  assert(Math.abs(wrapped.quaternion.length() - 1) < 1e-12);
}
report.checks.push('179° → −179° and alternating q/−q stay on the shortest arc without flips.');

const lifecycle = new OneEuroPoseFilter(CONFIG.smoothing);
assert.equal(lifecycle.update(origin, identity, NaN), false);
assert.equal(lifecycle.initialized, false);
assert.equal(lifecycle.update(origin, new THREE.Quaternion(0, 0, 0, 0), 0), false);
assert.equal(lifecycle.update(origin, identity, 0), true);
const snapshot = () => JSON.stringify([lifecycle.position.toArray(), lifecycle.quaternion.toArray(), lifecycle.timestamp]);
const before = snapshot();
for (const badTime of [0, -1, Infinity, NaN]) assert.equal(lifecycle.update(new THREE.Vector3(2, 0, -4), yaw(1), badTime), false);
assert.equal(lifecycle.update(new THREE.Vector3(NaN, 0, -4), identity, 0.03), false);
assert.equal(snapshot(), before);
// A 100 ms missed-detection interval should retain filtering history.
assert.equal(lifecycle.update(origin.clone().setX(0.03), yaw(0.04), 0.1), true);
assert(lifecycle.position.x > 0 && lifecycle.position.x < 0.03);
assert(angle(lifecycle.quaternion, identity) < 0.04);
// A long interruption snaps to a fresh object pose, instead of interpolating
// through stale history or carrying a large derivative into future updates.
const reacquiredPosition = new THREE.Vector3(3, 1, -2);
const reacquiredQuaternion = yaw(2.3);
assert.equal(lifecycle.update(reacquiredPosition, reacquiredQuaternion, 1), true);
assert(lifecycle.position.equals(reacquiredPosition));
assert(angle(lifecycle.quaternion, reacquiredQuaternion) < 1e-7);
assert.equal(lifecycle.positionVelocity.length(), 0);
assert.equal(lifecycle.angularVelocity.length(), 0);
lifecycle.reset();
assert.equal(lifecycle.initialized, false);
assert.equal(lifecycle.update(origin, identity, 0), true);
assert(lifecycle.position.equals(origin));
report.checks.push('Invalid/stale timestamps and invalid poses leave output unchanged.');
report.checks.push('Short misses retain smoothing; long gaps and explicit reset snap to a fresh pose.');

for (const fps of [15, 30, 60]) {
  const jump = new OneEuroPoseFilter(CONFIG.smoothing);
  jump.update(origin, identity, 0);
  const destination = origin.clone().setX(1);
  let settledAt = null;
  for (let frame = 1; frame <= fps; frame++) {
    jump.update(destination, yaw(Math.PI / 2), frame / fps);
    if (settledAt === null && jump.position.distanceTo(destination) < 0.1 && angle(jump.quaternion, yaw(Math.PI / 2)) < Math.PI / 20) {
      settledAt = frame / fps;
    }
  }
  assert(settledAt !== null && settledAt <= 0.15, `Fast camera move must not freeze: ${fps} fps settled=${settledAt}`);
  report.checks.push(`A 1-unit / 90° fast move reaches 90% within ${Math.round(settledAt * 1000)} ms at ${fps} fps (filter only).`);
}

// Compare complete displayed stationary poses with the previously used n=2
// stabilizer. Both pipelines receive exactly the same noisy detections.
const legacyFile = path.join(appRoot, 'vendor/webar/WebARRocksThreeStabilizer.js');
if (fs.existsSync(legacyFile)) {
  const legacySource = fs.readFileSync(legacyFile, 'utf8');
  for (const fps of [15, 30, 60]) {
    let now = 0;
    const legacyContext = vm.createContext({ THREE, performance: { now: () => now * 1000 }, module: { exports: {} } });
    vm.runInContext(legacySource, legacyContext);
    const oldRoot = new THREE.Object3D();
    const oldFilter = legacyContext.module.exports.instance({ obj3D: oldRoot, n: 2 });
    const nextFilter = new OneEuroPoseFilter(CONFIG.smoothing);
    const nextPosition = origin.clone(), nextQuaternion = identity.clone();
    const noise = random(321);
    const renderFps = 60;
    const renderAlpha = 1 - Math.exp(-1 / (renderFps * CONFIG.smoothing.renderTimeConstant));
    const oldPositionError = [], nextPositionError = [], oldRotationError = [], nextRotationError = [];
    for (let frame = 0; frame < renderFps * 12; frame++) {
      now = frame / renderFps;
      if (frame % (renderFps / fps) === 0) {
        const p = origin.clone().add(new THREE.Vector3(noise(), noise(), noise()).multiplyScalar(0.035));
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(noise() * 0.045, noise() * 0.045, noise() * 0.045));
        oldFilter.update(p, q);
        nextFilter.update(p, q, now);
        if (frame === 0) {
          nextPosition.copy(p);
          nextQuaternion.copy(q);
        }
      }
      nextPosition.lerp(nextFilter.position, renderAlpha);
      nextQuaternion.slerp(nextFilter.quaternion, renderAlpha);
      if (now > 2) {
        oldPositionError.push(oldRoot.position.distanceTo(origin));
        nextPositionError.push(nextPosition.distanceTo(origin));
        oldRotationError.push(angle(oldRoot.quaternion, identity));
        nextRotationError.push(angle(nextQuaternion, identity));
      }
    }
    const positionReduction = 1 - rms(nextPositionError) / rms(oldPositionError);
    const rotationReduction = 1 - rms(nextRotationError) / rms(oldRotationError);
    assert(positionReduction > 0.3, `Improvement over old position stabilizer at ${fps} fps: ${positionReduction}`);
    assert(rotationReduction > 0.4, `Improvement over old rotation stabilizer at ${fps} fps: ${rotationReduction}`);
    report.legacyComparison.push({ detectionFps: fps,
      positionRmsReductionPercent: +(positionReduction * 100).toFixed(1),
      rotationRmsReductionPercent: +(rotationReduction * 100).toFixed(1) });
  }
} else {
  report.checks.push('Legacy comparison skipped: unused vendor stabilizer is absent.');
}

console.log(JSON.stringify(report, null, 2));
