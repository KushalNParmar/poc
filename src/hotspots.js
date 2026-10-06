const THREE = window.THREE;
const SVG_NS = 'http://www.w3.org/2000/svg';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = point => [point.x, point.y, point.z].every(Number.isFinite);

function svgElement(name, className) {
  const element = document.createElementNS(SVG_NS, name);
  element.setAttribute('class', className);
  return element;
}

/** DOM text stays readable while the pins inherit the smoothed object's 3D pose. */
export class TrackedHotspots {
  constructor(layer, accessibleLayer, onSelect) {
    this.layer = layer;
    this.accessibleLayer = accessibleLayer;
    this.onSelect = onSelect;
    this.svg = svgElement('svg', 'hotspot-lines');
    this.svg.setAttribute('aria-hidden', 'true');
    this.svg.setAttribute('focusable', 'false');
    this.brackets = svgElement('path', 'brk');
    this.leaders = svgElement('g', 'leads');
    this.svg.append(this.brackets, this.leaders);
    this.layer.replaceChildren(this.svg);
    this.items = [];
    this.rects = [];
    this.measurements = new Map();
    document.fonts?.ready.then(() => this.measurements.clear());
    this.world = new THREE.Vector3();
    this.projected = new THREE.Vector3();
    this.activeIndex = null;
    this.tracked = false;
    this.cardsFit = false;
    this.labelsEnabled = true;
    this.layer.hidden = true;
  }

  setTarget(target, experience) {
    this.target = target;
    this.experience = experience;
    this.items.forEach(item => { item.pin.remove(); item.label.remove(); item.line.remove(); });
    this.items = [];
    this.measurements.clear();
    this.accessibleLayer?.replaceChildren();
    experience.hotspots.forEach((hotspot, index) => {
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'pin';
      pin.dataset.i = String(index);
      pin.dataset.hotspotId = hotspot.id;
      pin.setAttribute('aria-label', `${hotspot.title}: ${hotspot.subtitle}`);
      pin.setAttribute('aria-controls', 'sessionBar');
      const label = document.createElement('button');
      label.type = 'button';
      label.className = 'label';
      label.dataset.i = String(index);
      label.dataset.hotspotId = hotspot.id;
      label.setAttribute('aria-controls', 'sessionBar');
      const arrow = document.createElement('i');
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      const title = document.createElement('b');
      title.textContent = hotspot.title;
      const subtitle = document.createElement('small');
      subtitle.textContent = hotspot.subtitle;
      label.append(arrow, title, subtitle);
      for (const element of [pin, label]) element.addEventListener('click', () => this.onSelect(index));
      const line = svgElement('line', 'lead');
      line.setAttribute('stroke', '#e2c27a');
      line.setAttribute('stroke-opacity', '.7');
      line.setAttribute('stroke-width', '1');
      this.leaders.append(line);
      this.layer.append(label, pin);
      const accessible = document.createElement('li');
      accessible.textContent = `${hotspot.title}: ${hotspot.subtitle}`;
      this.accessibleLayer?.append(accessible);
      this.items.push({ pin, label, line, hotspot,
        anchor: new THREE.Vector3(...target.annotationAnchors[index]), x: 0, y: 0, onScreen: false });
    });
    this.setActive(null);
    this.reset();
  }

  setActive(index) {
    this.activeIndex = Number.isInteger(index) && this.items[index] ? index : null;
    this.items.forEach((item, itemIndex) => {
      const active = itemIndex === this.activeIndex;
      for (const element of [item.pin, item.label]) {
        element.classList.toggle('active', active);
        element.setAttribute('aria-pressed', String(active));
      }
    });
  }

  reset() {
    this.tracked = false;
    this.cardsFit = false;
    this.rects.length = 0;
    this.draw();
  }

  setVisibility(tracked, labelsEnabled) {
    this.tracked = tracked;
    this.labelsEnabled = labelsEnabled;
    this.draw();
  }

  draw() {
    this.layer.hidden = !this.tracked;
    this.layer.classList.toggle('hidden-labels', !this.labelsEnabled);
    const showCards = this.tracked && this.labelsEnabled && this.cardsFit;
    this.leaders.style.display = showCards ? '' : 'none';
    this.items.forEach(item => {
      item.pin.hidden = !this.tracked || !item.onScreen;
      item.label.hidden = !showCards;
    });
    if (this.accessibleLayer) this.accessibleLayer.hidden = !this.tracked;
  }

  project(local, root, camera, viewport) {
    this.world.copy(local).applyMatrix4(root.matrixWorld);
    this.projected.copy(this.world).applyMatrix4(camera.matrixWorldInverse);
    if (!finite(this.projected) || this.projected.z >= 0) return null;
    this.projected.copy(this.world).project(camera);
    if (!finite(this.projected) || this.projected.z <= -1 || this.projected.z >= 1) return null;
    return { x: (this.projected.x + 1) * viewport.width / 2,
      y: (1 - this.projected.y) * viewport.height / 2 };
  }

  measure(width) {
    const cached = this.measurements.get(width);
    this.items.forEach((item, index) => {
      item.label.style.width = `${width}px`;
      // Hidden cards cannot be measured. Keep the layer visually hidden until
      // every position has been committed in this same animation frame.
      if (cached) {
        item.width = cached[index].width;
        item.height = cached[index].height;
      } else {
        item.label.hidden = false;
        item.width = item.label.offsetWidth;
        item.height = item.label.offsetHeight;
      }
    });
    if (!cached && this.items.every(item => item.width > 0 && item.height > 0)) {
      this.measurements.set(width, this.items.map(item => ({ width: item.width, height: item.height })));
    }
  }

  preferred(item, safe) {
    const side = item.hotspot.labelSide;
    if (side === 'top') return { x: item.x - item.width / 2, y: item.y - item.height - 28 };
    if (side === 'bottom') return { x: item.x - item.width / 2, y: item.y + 28 };
    if (side === 'left') {
      const x = Math.max(safe.x, item.x - item.width - 24);
      return { x, y: x + item.width > item.x - 22 ? item.y - item.height - 28 : item.y - item.height / 2 };
    }
    const x = Math.min(safe.x + safe.width - item.width, item.x + 24);
    return { x, y: x < item.x + 22 ? item.y + 28 : item.y - item.height / 2 };
  }

  layout(safe) {
    const gap = 10;
    if (safe.width < 80 || safe.height < 30) return false;
    const width = Math.min(170, Math.floor((safe.width - gap) / 2));
    this.measure(width);
    if (this.items.some(item => !(item.width > 0 && item.height > 0))) return false;
    let rows = this.target.id === 'keyboard' ? [[0, 1], [3, 2]] : [[0], [1], [2], [3]];
    const totalHeight = list => list.reduce((sum, row) => sum + Math.max(...row.map(index => this.items[index].height)), 0) + (list.length - 1) * gap;
    if (totalHeight(rows) > safe.height && this.target.id !== 'keyboard') rows = [[0], [1, 2], [3]];
    if (totalHeight(rows) > safe.height) rows = this.target.id === 'keyboard' ? [[0, 1], [3, 2]] : [[0, 2], [1, 3]];
    // Wide, short landscape viewports can fit all four readable labels in a row.
    if (totalHeight(rows) > safe.height && safe.width >= 4 * 128 + 3 * gap) {
      this.measure(Math.min(170, Math.floor((safe.width - 3 * gap) / 4)));
      rows = this.target.id === 'keyboard' ? [[0, 3, 1, 2]] : [[1, 0, 3, 2]];
    }
    if (totalHeight(rows) > safe.height) return false;
    const packedRows = rows.map(indices => {
      const items = indices.map(index => this.items[index]);
      items.forEach(item => { item.preferred = this.preferred(item, safe); });
      return { indices, height: Math.max(...items.map(item => item.height)),
        y: items.reduce((sum, item) => sum + item.preferred.y, 0) / items.length };
    });
    let top = safe.y;
    for (const row of packedRows) { row.min = top; top += row.height + gap; }
    let bottom = safe.y + safe.height;
    for (let i = packedRows.length - 1; i >= 0; i--) {
      const row = packedRows[i];
      row.max = bottom - row.height;
      row.y = clamp(row.y, row.min, row.max);
      bottom = row.max - gap;
    }
    // Stable row membership keeps cards from trading places as the object moves.
    for (let pass = 0; pass < 8; pass++) {
      for (let i = 1; i < packedRows.length; i++) {
        const a = packedRows[i - 1], b = packedRows[i];
        const overlap = a.y + a.height + gap - b.y;
        if (overlap <= 0) continue;
        const up = Math.min(overlap / 2, a.y - a.min);
        const down = Math.min(overlap - up, b.max - b.y);
        a.y -= Math.min(overlap - down, a.y - a.min);
        b.y += down;
      }
    }
    for (let i = 1; i < packedRows.length; i++) {
      const previous = packedRows[i - 1];
      packedRows[i].y = Math.max(packedRows[i].y, previous.y + previous.height + gap);
    }
    this.rects.length = 0;
    for (const row of packedRows) {
      const rowItems = row.indices.map(index => this.items[index]);
      let minX = safe.x;
      rowItems.forEach((item, index) => {
        const remaining = rowItems.slice(index + 1).reduce((sum, other) => sum + other.width + gap, 0);
        item.rect = { x: clamp(item.preferred.x, minX, safe.x + safe.width - item.width - remaining),
          y: row.y + (row.height - item.height) / 2, width: item.width, height: item.height };
        minX = item.rect.x + item.width + gap;
      });
    }
    for (const item of this.items) {
      const rect = item.rect;
      item.label.style.left = `${rect.x.toFixed(2)}px`;
      item.label.style.top = `${rect.y.toFixed(2)}px`;
      item.line.setAttribute('x1', item.x.toFixed(2));
      item.line.setAttribute('y1', item.y.toFixed(2));
      item.line.setAttribute('x2', clamp(item.x, rect.x, rect.x + rect.width).toFixed(2));
      item.line.setAttribute('y2', clamp(item.y, rect.y, rect.y + rect.height).toFixed(2));
      this.rects.push({ ...rect });
    }
    return true;
  }

  update(root, camera, viewport, safe) {
    if (!this.items.length || !root.visible) return false;
    camera.updateMatrixWorld(true);
    this.layer.hidden = false;
    this.layer.style.visibility = 'hidden';
    this.svg.setAttribute('viewBox', `0 0 ${viewport.width} ${viewport.height}`);
    this.svg.setAttribute('width', viewport.width);
    this.svg.setAttribute('height', viewport.height);
    let onScreen = 0;
    for (const item of this.items) {
      const point = this.project(item.anchor, root, camera, viewport);
      item.onScreen = !!point && point.x >= 0 && point.x <= viewport.width && point.y >= 0 && point.y <= viewport.height;
      if (item.onScreen) onScreen++;
      if (!point) continue;
      item.x = point.x;
      item.y = point.y;
      item.pin.style.left = `${item.x.toFixed(2)}px`;
      item.pin.style.top = `${item.y.toFixed(2)}px`;
    }
    if (!onScreen) {
      this.layer.style.visibility = '';
      this.reset();
      return false;
    }
    const bounds = this.target.annotationBounds;
    const points = [];
    for (const x of [bounds[0][0], bounds[1][0]]) for (const y of [bounds[0][1], bounds[1][1]]) for (const z of [bounds[0][2], bounds[1][2]]) {
      const point = this.project(new THREE.Vector3(x, y, z), root, camera, viewport);
      if (point) points.push(point);
    }
    if (points.length === 8) {
      const x0 = Math.min(...points.map(point => point.x)) - 10;
      const x1 = Math.max(...points.map(point => point.x)) + 10;
      const y0 = Math.min(...points.map(point => point.y)) - 10;
      const y1 = Math.max(...points.map(point => point.y)) + 10;
      const size = Math.min(16, (x1 - x0) / 4, (y1 - y0) / 4);
      this.brackets.setAttribute('d', `M${x0} ${y0 + size}V${y0}H${x0 + size} M${x1 - size} ${y0}H${x1}V${y0 + size} M${x0} ${y1 - size}V${y1}H${x0 + size} M${x1 - size} ${y1}H${x1}V${y1 - size}`);
    } else this.brackets.setAttribute('d', '');
    this.cardsFit = this.layout(safe);
    this.tracked = true;
    this.layer.style.visibility = '';
    this.draw();
    return true;
  }
}
