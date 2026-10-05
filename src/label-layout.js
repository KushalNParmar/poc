const THREE = window.THREE;

const finiteVector = value => [value.x, value.y, value.z].every(Number.isFinite);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Screen-space card layout; the tracked anchors remain in object-local space. */
export class LabelLayout {
  constructor({ minWidth = 128, maxWidth = 184, gap = 12, verticalOffset = 18 } = {}) {
    this.minWidth = Number.isFinite(minWidth) && minWidth > 0 ? minWidth : 128;
    this.maxWidth = Number.isFinite(maxWidth) && maxWidth >= this.minWidth ? maxWidth : Math.max(184, this.minWidth);
    this.gap = Number.isFinite(gap) && gap >= 0 ? gap : 12;
    this.verticalOffset = Number.isFinite(verticalOffset) ? verticalOffset : 18;
    this.rects = [];
    this.items = [];
    this.scratch = new THREE.Vector3();
    this.groupScale = new THREE.Vector3();
  }

  item(index) {
    if (!this.items[index]) {
      this.items[index] = {
        anchorWorld: new THREE.Vector3(),
        projected: new THREE.Vector3(),
        localPosition: new THREE.Vector3(),
      };
    }
    return this.items[index];
  }

  // Always keep the same top-to-bottom order. A binary overlap test would
  // otherwise make cards jump when a slowly moving anchor crosses a threshold.
  prepareRects(count, safe, scale) {
    const bottom = safe.y + safe.height;
    let fits = true;
    for (let i = 0; i < count; i++) {
      const item = this.items[i];
      item.width = Math.min(safe.width, item.idealWidth * scale);
      item.height = item.width * item.aspect;
      const centerX = item.anchorX + item.side * (item.width / 2 + this.gap);
      item.x = clamp(centerX - item.width / 2, safe.x, safe.x + safe.width - item.width);
      item.desiredY = item.anchorY + item.shiftY - item.height / 2;
      item.earliest = safe.y;
      for (let j = 0; j < i; j++) {
        const other = this.items[j];
        item.earliest = Math.max(item.earliest, other.earliest + other.height + this.gap);
      }
      if (item.earliest + item.height > bottom + 1e-7) fits = false;
    }
    for (let i = count - 1; i >= 0; i--) {
      const item = this.items[i];
      item.latest = bottom - item.height;
      for (let j = i + 1; j < count; j++) {
        const other = this.items[j];
        item.latest = Math.min(item.latest, other.latest - this.gap - item.height);
      }
      if (item.earliest > item.latest + 1e-7) fits = false;
      item.y = clamp(item.desiredY, item.earliest, Math.max(item.earliest, item.latest));
    }
    return fits;
  }

  pack(count) {
    // Share the displacement between colliding cards instead of pushing every
    // card below the first. Fixed iteration/order makes this deterministic.
    for (let pass = 0; pass < 32; pass++) {
      let moved = false;
      for (let i = 0; i < count; i++) {
        const a = this.items[i];
        for (let j = i + 1; j < count; j++) {
          const b = this.items[j];
          const overlap = a.y + a.height + this.gap - b.y;
          if (overlap <= 1e-6) continue;
          const upRoom = Math.max(0, a.y - a.earliest);
          const downRoom = Math.max(0, b.latest - b.y);
          let up = Math.min(overlap / 2, upRoom);
          const down = Math.min(overlap - up, downRoom);
          up = Math.min(overlap - down, upRoom);
          a.y -= up;
          b.y += down;
          moved = moved || up + down > 1e-7;
        }
      }
      if (!moved) break;
    }
    // Resolve floating-point residuals within the precomputed feasible bounds.
    for (let i = 0; i < count; i++) {
      const item = this.items[i];
      let top = item.earliest;
      for (let j = 0; j < i; j++) {
        const other = this.items[j];
        top = Math.max(top, other.y + other.height + this.gap);
      }
      item.y = clamp(item.y, top, Math.max(top, item.latest));
    }
  }

  update(annotations, camera, viewport, safeRect) {
    this.rects.length = 0;
    const count = annotations.length;
    const { width, height } = viewport;
    if (!count || ![width, height, safeRect.x, safeRect.y, safeRect.width, safeRect.height].every(Number.isFinite)
      || width <= 0 || height <= 0 || safeRect.width <= 0 || safeRect.height <= 0) return false;
    const left = Math.max(0, safeRect.x);
    const top = Math.max(0, safeRect.y);
    const right = Math.min(width, safeRect.x + safeRect.width);
    const bottom = Math.min(height, safeRect.y + safeRect.height);
    const safe = { x: left, y: top, width: right - left, height: bottom - top };
    if (safe.width < 1 || safe.height < 1) return false;

    camera.updateMatrixWorld(true);
    let minAnchorX = Infinity, maxAnchorX = -Infinity, minAnchorY = Infinity, maxAnchorY = -Infinity;
    for (let i = 0; i < count; i++) {
      const annotation = annotations[i];
      if (!(annotation.width > 0) || !(annotation.height > 0)
        || !Number.isFinite(annotation.width) || !Number.isFinite(annotation.height)) return false;
      const item = this.item(i);
      annotation.anchor.getWorldPosition(item.anchorWorld);
      this.scratch.copy(item.anchorWorld).applyMatrix4(camera.matrixWorldInverse);
      if (!finiteVector(this.scratch) || this.scratch.z >= 0) return false;
      item.projected.copy(item.anchorWorld).project(camera);
      if (!finiteVector(item.projected) || item.projected.z <= -1 || item.projected.z >= 1) return false;

      item.anchorX = (item.projected.x + 1) * width / 2;
      item.anchorY = (1 - item.projected.y) * height / 2;
      minAnchorX = Math.min(minAnchorX, item.anchorX);
      maxAnchorX = Math.max(maxAnchorX, item.anchorX);
      minAnchorY = Math.min(minAnchorY, item.anchorY);
      maxAnchorY = Math.max(maxAnchorY, item.anchorY);

      // One CSS pixel at this anchor's depth is also one CSS pixel at the card's
      // eventual center: the card is parallel to the camera at the same depth.
      this.scratch.copy(item.projected);
      this.scratch.x += 2 / width;
      this.scratch.unproject(camera);
      item.worldPerPixel = this.scratch.distanceTo(item.anchorWorld);
      annotation.group.getWorldScale(this.groupScale);
      item.parentScale = Math.abs(this.groupScale.x);
      if (!(item.worldPerPixel > 0) || !(item.parentScale > 0)
        || !Number.isFinite(item.worldPerPixel) || !Number.isFinite(item.parentScale)) return false;
      const rawWidth = annotation.width * item.parentScale / item.worldPerPixel;
      item.idealWidth = Math.min(safe.width, clamp(rawWidth, this.minWidth, this.maxWidth));
      item.aspect = annotation.height / annotation.width;
      item.side = annotation.slot === 'right' ? 1 : -1;
      item.shiftY = annotation.slot === 'upper-left' ? -this.verticalOffset
        : annotation.slot === 'lower-left' ? this.verticalOffset : 0;
    }
    // Edge anchors can retain clamped labels; a target entirely outside one
    // viewport edge has no useful on-screen attachment and is not laid out.
    if (maxAnchorX < 0 || minAnchorX > width || maxAnchorY < 0 || minAnchorY > height) return false;

    // Compact landscape fallback uses one continuous scale rather than stepped
    // width changes that could introduce jitter as anchor depths fluctuate.
    let totalHeight = 0, minimumScale = 0;
    for (let i = 0; i < count; i++) {
      const item = this.items[i];
      totalHeight += item.idealWidth * item.aspect;
      minimumScale = Math.max(minimumScale, Math.min(64, safe.width) / item.idealWidth);
    }
    const availableHeight = safe.height - this.gap * (count - 1);
    const scale = Math.min(1, availableHeight / totalHeight);
    if (!Number.isFinite(scale) || scale < minimumScale || !this.prepareRects(count, safe, scale)) return false;
    this.pack(count);

    // Validate all placements before committing any transforms. The caller
    // controls card/leader visibility when an unusable frame returns false.
    for (let i = 0; i < count; i++) {
      const item = this.items[i];
      const annotation = annotations[i];
      item.scale = item.worldPerPixel * item.width / (annotation.width * item.parentScale);
      item.localPosition.set((item.x + item.width / 2) / width * 2 - 1,
        1 - (item.y + item.height / 2) / height * 2, item.projected.z).unproject(camera);
      annotation.group.worldToLocal(item.localPosition);
      if (!finiteVector(item.localPosition) || !Number.isFinite(item.scale) || item.scale <= 0) return false;
    }
    for (let i = 0; i < count; i++) {
      const item = this.items[i];
      annotations[i].card.position.copy(item.localPosition);
      annotations[i].card.scale.setScalar(item.scale);
      this.rects.push({ x: item.x, y: item.y, width: item.width, height: item.height });
    }
    return true;
  }
}
