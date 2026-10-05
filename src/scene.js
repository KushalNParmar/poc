import { CONFIG } from './config.js';
import { createAnnotation } from './annotations.js';
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
    this.annotations = [];
    this.labelsEnabled = true;
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, 'ZXY');
    this.quaternion = new THREE.Quaternion();
    this.cameraWorldQuaternion = new THREE.Quaternion();
    this.mode = 'idle';
    this.resize();
  }

  async load() {
    if (this.ready) return;
    // Preserve the existing label layout without loading an invisible 3D model.
    const bounds = new THREE.Box3(
      new THREE.Vector3(...CONFIG.annotationBounds.min),
      new THREE.Vector3(...CONFIG.annotationBounds.max),
    );
    CONFIG.annotations.forEach(definition => {
      const annotation = createAnnotation(definition, bounds, this.renderer);
      this.annotationGroup.add(annotation.group);
      this.annotations.push(annotation);
      // A text equivalent for screen readers; the visible cards are 3D meshes.
      const element = document.createElement('li');
      element.textContent = `${definition.title}: ${definition.detail}`;
      this.labelLayer.append(element);
    });
    this.ready = true;
  }

  setMode(mode, video = null) {
    this.mode = mode;
    this.video = video;
    this.root.visible = false;
    this.root.position.set(0, 0, 0);
    this.root.quaternion.identity();
    this.content.position.set(...(mode === 'ar' ? CONFIG.annotationOffset : [0, 0, 0]));
    this.content.rotation.set(...CONFIG.annotationRotation);
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
    this.poseFilter.reset();
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
    this.annotationGroup.visible = this.labelsEnabled;
    this.labelLayer.hidden = !(this.root.visible && this.labelsEnabled);
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
    this.drawLabels();
    if (this.root.visible && this.labelsEnabled) {
      this.scene.updateMatrixWorld(true);
      this.camera.getWorldQuaternion(this.cameraWorldQuaternion);
      this.annotations.forEach(annotation => annotation.updateFacing(this.cameraWorldQuaternion));
    }
    this.renderer.render(this.scene, this.camera);
  }
}
