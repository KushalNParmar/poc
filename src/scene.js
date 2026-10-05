import { CONFIG, TARGETS, DEFAULT_TARGET_ID } from './config.js';
import { createAnnotation } from './annotations.js';
import { OneEuroPoseFilter } from './pose-filter.js';
import { LabelLayout } from './label-layout.js';

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
    this.target = TARGETS[DEFAULT_TARGET_ID];
    this.labelLayout = new LabelLayout();
    this.layoutVisible = false;
    this.topbar = stage.querySelector('.topbar');
    this.sessionBar = stage.querySelector('#sessionBar');
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
    CONFIG.annotations.forEach((definition, index) => {
      const annotation = createAnnotation(definition, this.target.annotationAnchors[index], this.renderer);
      this.annotationGroup.add(annotation.group);
      this.annotations.push(annotation);
      // A text equivalent for screen readers; the visible cards are 3D meshes.
      const element = document.createElement('li');
      element.textContent = `${definition.title}: ${definition.detail}`;
      this.labelLayer.append(element);
    });
    this.ready = true;
  }

  setTarget(target) {
    this.target = target;
    this.annotations.forEach((annotation, index) => annotation.setAnchor(target.annotationAnchors[index]));
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
    this.labelLayout.reset();
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
    this.annotationGroup.visible = this.labelsEnabled && this.layoutVisible;
    this.labelLayer.hidden = !(this.root.visible && this.annotationGroup.visible);
  }

  getSafeRect() {
    const stage = this.stage.getBoundingClientRect();
    const margin = 12;
    let top = margin;
    let bottom = stage.height - margin;
    if (this.topbar && !this.topbar.hidden) {
      const rect = this.topbar.getBoundingClientRect();
      if (rect.height > 0) top = Math.max(top, rect.bottom - stage.top + margin);
    }
    if (this.sessionBar && !this.sessionBar.hidden) {
      const rect = this.sessionBar.getBoundingClientRect();
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
    if (this.root.visible && this.labelsEnabled) {
      this.scene.updateMatrixWorld(true);
      this.camera.getWorldQuaternion(this.cameraWorldQuaternion);
      this.annotations.forEach(annotation => annotation.updateFacing(this.cameraWorldQuaternion));
      this.layoutVisible = this.labelLayout.update(this.annotations, this.camera, this, this.getSafeRect());
      if (this.layoutVisible) this.annotations.forEach(annotation => annotation.updateLeader());
    }
    this.drawLabels();
    this.renderer.render(this.scene, this.camera);
  }
}
