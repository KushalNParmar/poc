const THREE = window.THREE;
const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 320;

function cardTexture(definition, renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');
  const inset = 4;
  const radius = 42;
  const right = TEXTURE_WIDTH - inset;
  const bottom = TEXTURE_HEIGHT - inset;
  context.beginPath();
  context.moveTo(inset + radius, inset);
  context.lineTo(right - radius, inset);
  context.quadraticCurveTo(right, inset, right, inset + radius);
  context.lineTo(right, bottom - radius);
  context.quadraticCurveTo(right, bottom, right - radius, bottom);
  context.lineTo(inset + radius, bottom);
  context.quadraticCurveTo(inset, bottom, inset, bottom - radius);
  context.lineTo(inset, inset + radius);
  context.quadraticCurveTo(inset, inset, inset + radius, inset);
  context.closePath();
  context.fillStyle = '#ffffff';
  context.fill();
  context.lineWidth = 6;
  context.strokeStyle = '#deded8';
  context.stroke();

  const writeText = (text, size, weight, color, y) => {
    const value = String(text ?? '');
    context.font = `${weight} ${size}px Arial, sans-serif`;
    while (size > 24 && context.measureText(value).width > TEXTURE_WIDTH - 128) {
      size -= 2;
      context.font = `${weight} ${size}px Arial, sans-serif`;
    }
    context.fillStyle = color;
    context.textBaseline = 'middle';
    context.fillText(value, 64, y, TEXTURE_WIDTH - 128);
  };
  writeText(definition.title, 118, 700, '#161616', 117);
  writeText(definition.detail, 86, 400, '#666662', 221);

  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

// Anchor positions follow the object; the text card counter-rotates each frame.
export function createAnnotation(definition, anchorPosition, renderer) {
  const group = new THREE.Group();
  group.name = `annotation-${definition.title}`;
  const anchor = new THREE.Object3D();
  anchor.position.set(...anchorPosition);
  group.add(anchor);

  const card = new THREE.Group();
  card.name = 'annotation-card';
  card.position.copy(anchor.position);
  const width = definition.width || 0.44;
  const height = width * TEXTURE_HEIGHT / TEXTURE_WIDTH;
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: cardTexture(definition, renderer),
    side: THREE.FrontSide,
    transparent: true,
    alphaTest: 0.05,
    // A viewport-clamped card may cross a pointer; keep its text readable.
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const front = new THREE.Mesh(geometry, material);
  front.name = 'annotation-front';
  front.position.z = 0.0002;
  const back = new THREE.Mesh(geometry, material);
  back.name = 'annotation-back';
  back.position.z = -0.0002;
  back.rotation.y = Math.PI;
  card.add(front, back);
  group.add(card);
  let textKey = `${definition.title}\n${definition.detail}`;
  function setText(next) {
    const nextKey = `${next.title}\n${next.detail}`;
    if (nextKey === textKey) return;
    const previousTexture = material.map;
    material.map = cardTexture(next, renderer);
    previousTexture.dispose();
    textKey = nextKey;
    group.name = `annotation-${next.title}`;
  }

  const parentQuaternion = new THREE.Quaternion();
  const inverseCardQuaternion = new THREE.Quaternion();
  const edge = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const leaderMaterial = new THREE.MeshBasicMaterial({
    color: 0x161616, depthTest: false, toneMapped: false,
  });
  const line = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0015, 0.0015, 1, 8),
    leaderMaterial,
  );
  line.name = 'annotation-leader';
  line.renderOrder = 2;
  // A light outline keeps the monochrome pointer visible on dark objects.
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, toneMapped: false });
  const lineOutline = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 1, 8), outlineMaterial);
  lineOutline.renderOrder = 1;
  line.add(lineOutline);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.005, 12, 8), leaderMaterial);
  dot.name = 'annotation-anchor';
  dot.renderOrder = 2;
  const dotOutline = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 8), outlineMaterial);
  dotOutline.renderOrder = 1;
  dot.add(dotOutline);
  dot.position.copy(anchor.position);
  group.add(line, dot);
  function updateFacing(cameraWorldQuaternion) {
    // Parent rotation includes the smoothed tracking pose. Cancel it so the
    // card stays parallel to the camera, with upright, unmirrored text.
    group.getWorldQuaternion(parentQuaternion);
    card.quaternion.copy(parentQuaternion).invert().multiply(cameraWorldQuaternion);
  }

  function updateLeader() {
    // Reconnect the leader to the closest card edge after counter-rotation.
    // Reuse vectors and unit geometry rather than allocating meshes per frame.
    inverseCardQuaternion.copy(card.quaternion).invert();
    edge.copy(anchor.position).sub(card.position).applyQuaternion(inverseCardQuaternion).divide(card.scale);
    const inside = Math.abs(edge.x) <= halfWidth && Math.abs(edge.y) <= halfHeight;
    edge.x = THREE.MathUtils.clamp(edge.x, -halfWidth, halfWidth);
    edge.y = THREE.MathUtils.clamp(edge.y, -halfHeight, halfHeight);
    if (inside) {
      if (halfWidth - Math.abs(edge.x) < halfHeight - Math.abs(edge.y)) {
        edge.x = edge.x < 0 ? -halfWidth : halfWidth;
      } else {
        edge.y = edge.y < 0 ? -halfHeight : halfHeight;
      }
    }
    edge.z = 0;
    edge.multiply(card.scale).applyQuaternion(card.quaternion).add(card.position);
    direction.copy(edge).sub(anchor.position);
    const length = direction.length();
    line.position.copy(anchor.position).add(edge).multiplyScalar(0.5);
    line.scale.y = Math.max(length, 0.00001);
    if (length > 0) line.quaternion.setFromUnitVectors(up, direction.multiplyScalar(1 / length));
    line.visible = length > 0;
  }

  function setAnchor(position) {
    anchor.position.set(...position);
    dot.position.copy(anchor.position);
  }

  return { group, card, front, back, anchor, line, dot, width, height,
    slot: definition.slot, setAnchor, setText, updateFacing, updateLeader };
}
