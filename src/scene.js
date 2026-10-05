import { CONFIG } from './config.js';
import { createAnnotation } from './annotations.js';

const THREE = window.THREE;

export class ToasterScene {
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
    this.root.name = 'cup-anchor';
    this.root.visible = false;
    this.content = new THREE.Group();
    this.content.name = 'toaster-and-annotations';
    this.root.add(this.content);
    this.scene.add(this.root);
    this.stabilizer = WebARRocksThreeStabilizer.instance({ obj3D: this.root, n: 2 });
    const hemisphere = new THREE.HemisphereLight(0xe6f4ff, 0x69796a, 0.8);
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(2, 4, 3);
    this.scene.add(hemisphere, key);
    const room = new THREE.RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environment.texture;
    room.traverse(object => {
      object.geometry?.dispose();
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => m.dispose());
    });
    pmrem.dispose();
    this.annotationGroup = new THREE.Group();
    this.annotationGroup.name = 'model-relative-labels';
    this.content.add(this.annotationGroup);
    this.annotations = [];
    this.labelsEnabled = true;
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, 'ZXY');
    this.quaternion = new THREE.Quaternion();
    this.mode = 'idle';
    this.resize();
  }

  async load() {
    const draco = new THREE.DRACOLoader();
    draco.setDecoderPath('./vendor/three/draco/');
    draco.setWorkerLimit(1);
    const loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(draco);
    let gltf;
    try {
      gltf = await loader.loadAsync(CONFIG.modelUrl);
    } finally {
      draco.dispose();
    }
    this.model = gltf.scene;
    const box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = CONFIG.modelWidth / Math.max(size.x, size.z);
    if (!Number.isFinite(scale) || scale <= 0) throw new Error('The toaster model has invalid dimensions.');
    this.model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    this.model.scale.setScalar(scale);
    this.content.add(this.model);
    this.content.updateMatrixWorld(true);
    // Compute bounds in content-local space, independent of the current AR pose.
    const bounds = new THREE.Box3();
    const inverseContent = this.content.matrixWorld.clone().invert();
    this.model.traverse(object => {
      if (!object.isMesh) return;
      object.geometry.computeBoundingBox();
      const localMatrix = inverseContent.clone().multiply(object.matrixWorld);
      bounds.union(object.geometry.boundingBox.clone().applyMatrix4(localMatrix));
    });
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
    this.content.position.set(...(mode === 'ar' ? CONFIG.modelOffset : [0, 0, 0]));
    this.content.rotation.set(...CONFIG.modelRotation);
    this.stabilizer.reset();
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

  updatePose(state, reset = false) {
    const s = state.positionScale?.[2];
    if (!(s > 0) || ![...state.positionScale, state.pitch, state.yaw, state.roll].every(Number.isFinite)) return false;
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
    if (reset) this.stabilizer.reset();
    this.stabilizer.update(this.position, this.quaternion);
    return true;
  }

  drawLabels() {
    this.annotationGroup.visible = this.labelsEnabled;
    this.labelLayer.hidden = !(this.root.visible && this.labelsEnabled);
  }

  render() {
    this.drawLabels();
    this.renderer.render(this.scene, this.camera);
  }
}
