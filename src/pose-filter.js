const THREE = window.THREE;
const TWO_PI = 2 * Math.PI;

const DEFAULTS = Object.freeze({
  positionMinCutoff: 0.8,
  positionBeta: 8,
  rotationMinCutoff: 0.8,
  rotationBeta: 1.8,
  derivativeCutoff: 1,
  maxGapSeconds: 0.3,
});

function alpha(cutoff, dt) {
  return 1 / (1 + 1 / (TWO_PI * cutoff * dt));
}

function finiteVector(value) {
  return value && [value.x, value.y, value.z].every(Number.isFinite);
}

/**
 * Speed-adaptive low-pass filtering, following the One Euro filter principle:
 * https://gery.casiez.net/1euro/
 * Position derivatives are normalized by camera depth; rotation derivatives
 * use signed quaternion log vectors instead of Euler angles or unsigned speed.
 */
export class OneEuroPoseFilter {
  constructor(options = {}) {
    this.options = {};
    for (const [key, fallback] of Object.entries(DEFAULTS)) {
      const value = options[key];
      const valid = Number.isFinite(value) && (key.endsWith('Beta') ? value >= 0 : value > 0);
      this.options[key] = valid ? value : fallback;
    }
    Object.freeze(this.options);
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.previousPosition = new THREE.Vector3();
    this.previousQuaternion = new THREE.Quaternion();
    this.positionVelocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3();
    this.sampleQuaternion = new THREE.Quaternion();
    this.deltaQuaternion = new THREE.Quaternion();
    this.rawPositionVelocity = new THREE.Vector3();
    this.rawAngularVelocity = new THREE.Vector3();
    this.reset();
  }

  reset() {
    this.initialized = false;
    this.timestamp = null;
    this.positionVelocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
  }

  update(position, quaternion, timestampSeconds) {
    if (!finiteVector(position) || !finiteVector(quaternion) ||
        !Number.isFinite(quaternion.w) || !Number.isFinite(timestampSeconds)) return false;
    const quaternionLengthSq = quaternion.x ** 2 + quaternion.y ** 2 + quaternion.z ** 2 + quaternion.w ** 2;
    if (!Number.isFinite(quaternionLengthSq) || quaternionLengthSq < 1e-12) return false;
    const dt = this.initialized ? timestampSeconds - this.timestamp : 0;
    // Duplicate, stale and implausibly close samples must not advance the filter.
    if (this.initialized && dt < 1e-6) return false;
    this.sampleQuaternion.copy(quaternion).normalize();

    if (!this.initialized || dt > this.options.maxGapSeconds) {
      this.position.copy(position);
      this.quaternion.copy(this.sampleQuaternion);
      this.positionVelocity.set(0, 0, 0);
      this.angularVelocity.set(0, 0, 0);
      this.initialized = true;
    } else {
      // q and -q describe the same orientation. Keep samples on one hemisphere.
      if (this.previousQuaternion.dot(this.sampleQuaternion) < 0) {
        this.sampleQuaternion.set(-this.sampleQuaternion.x, -this.sampleQuaternion.y,
          -this.sampleQuaternion.z, -this.sampleQuaternion.w);
      }
      const depth = Math.max(0.1, (Math.abs(position.z) + Math.abs(this.previousPosition.z)) / 2);
      this.rawPositionVelocity.copy(position).sub(this.previousPosition).multiplyScalar(1 / (dt * depth));

      // Express the shortest rotation delta in the common camera coordinate frame.
      this.deltaQuaternion.copy(this.previousQuaternion).invert().premultiply(this.sampleQuaternion).normalize();
      const { x, y, z, w } = this.deltaQuaternion;
      const sinHalfAngle = Math.hypot(x, y, z);
      const angularScale = sinHalfAngle > 1e-8
        ? 2 * Math.atan2(sinHalfAngle, Math.max(0, w)) / (sinHalfAngle * dt)
        : 2 / dt;
      this.rawAngularVelocity.set(x, y, z).multiplyScalar(angularScale);
      if (!finiteVector(this.rawPositionVelocity) || !finiteVector(this.rawAngularVelocity)) return false;

      const derivativeAlpha = alpha(this.options.derivativeCutoff, dt);
      this.positionVelocity.lerp(this.rawPositionVelocity, derivativeAlpha);
      this.angularVelocity.lerp(this.rawAngularVelocity, derivativeAlpha);
      const positionCutoff = this.options.positionMinCutoff + this.options.positionBeta * this.positionVelocity.length();
      const rotationCutoff = this.options.rotationMinCutoff + this.options.rotationBeta * this.angularVelocity.length();
      this.position.lerp(position, alpha(positionCutoff, dt));
      this.quaternion.slerp(this.sampleQuaternion, alpha(rotationCutoff, dt)).normalize();
    }

    this.previousPosition.copy(position);
    this.previousQuaternion.copy(this.sampleQuaternion);
    this.timestamp = timestampSeconds;
    return true;
  }
}
