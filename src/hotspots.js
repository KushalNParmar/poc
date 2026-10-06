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
    this.leaders = svgElement('g', 'leads');
    this.svg.append(this.leaders);
    this.layer.replaceChildren(this.svg);
    this.items = [];
    this.rects = [];
    this.measurements = new Map();
    document.fonts?.ready.then(() => this.measurements.clear());
    this.world = new THREE.Vector3();
    this.projected = new THREE.Vector3();
    this.activeIndex = null;
    this.sideOrder = new Map();
    this.cardinalSides = new Map();
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
    this.sideOrder.clear();
    this.cardinalSides.clear();
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
        anchor: new THREE.Vector3(...target.annotationAnchors[index]), x: null, y: null, valid: false, rect: null, onScreen: false });
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
    this.sideOrder.clear();
    this.cardinalSides.clear();
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
      item.pin.hidden = !this.tracked || !item.valid;
      item.pin.tabIndex = item.onScreen ? 0 : -1;
      item.label.hidden = !showCards || !item.valid;
      item.label.tabIndex = item.labelOnScreen ? 0 : -1;
      item.line.style.display = item.valid ? '' : 'none';
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

  // Follow projected spatial order, but require a deliberate reversal before
  // swapping slots. Small pose noise must not make complete cards trade places.
  orderedSide(side, items, horizontal = side === 'top' || side === 'bottom') {
    const coordinate = horizontal ? 'x' : 'y';
    if (!this.sideOrder.has(side)) {
      this.sideOrder.set(side, items.slice().sort((a, b) => a[coordinate] - b[coordinate]
        || this.items.indexOf(a) - this.items.indexOf(b)).map(item => this.items.indexOf(item)));
    }
    const order = this.sideOrder.get(side);
    for (const item of items) {
      const index = this.items.indexOf(item);
      if (order.includes(index)) continue;
      const before = order.findIndex(other => this.items[other].valid
        && this.items[other][coordinate] > item[coordinate]);
      if (before < 0) order.push(index);
      else order.splice(before, 0, index);
    }
    const sorted = items.slice().sort((a, b) => order.indexOf(this.items.indexOf(a)) - order.indexOf(this.items.indexOf(b)));
    for (let pass = 0; pass < sorted.length; pass++) for (let i = 1; i < sorted.length; i++) {
      if (sorted[i - 1][coordinate] > sorted[i][coordinate] + 28) {
        [sorted[i - 1], sorted[i]] = [sorted[i], sorted[i - 1]];
      }
    }
    const visibleOrder = sorted.map(item => this.items.indexOf(item));
    this.sideOrder.set(side, [...visibleOrder, ...order.filter(index => !visibleOrder.includes(index))]);
    return sorted;
  }

  spread(items, horizontal, gap) {
    if (!items.length) return;
    const position = horizontal ? 'x' : 'y';
    const size = horizontal ? 'width' : 'height';
    // Separate along the outward rail, sharing displacement so a small target
    // receives balanced labels without ever moving its tracked anchor points.
    for (const item of items) item.rect[position] = item[position] - item[size] / 2;
    for (let pass = 0; pass < items.length; pass++) {
      for (let i = 1; i < items.length; i++) {
        const a = items[i - 1], b = items[i];
        const overlap = a.rect[position] + a[size] + gap - b.rect[position];
        if (overlap > 0) {
          a.rect[position] -= overlap / 2;
          b.rect[position] += overlap / 2;
        }
      }
    }
  }

  assignCardinalSides(items, hull) {
    const sides = ['top', 'left', 'right', 'bottom'];
    const cost = (item, side) => side === 'top' ? item.y - hull.top
      : side === 'bottom' ? hull.bottom - item.y
      : side === 'left' ? item.x - hull.left : hull.right - item.x;
    let best = null, bestScore = Infinity;
    const visit = (index, available, assignment, score) => {
      if (index === items.length) {
        if (score < bestScore) { best = [...assignment]; bestScore = score; }
        return;
      }
      const item = items[index];
      for (const side of available) {
        // Prefer the supplied reference at exact geometric ties; subsequent
        // frames use hysteresis rather than swapping sides on tiny movements.
        const tie = side === item.hotspot.labelSide ? 0 : .001;
        visit(index + 1, available.filter(value => value !== side), [...assignment, side], score + cost(item, side) + tie);
      }
    };
    visit(0, sides, [], 0);
    const previous = items.map(item => this.cardinalSides.get(this.items.indexOf(item)));
    const hasPrevious = previous.every(Boolean) && new Set(previous).size === items.length;
    const previousScore = hasPrevious ? items.reduce((sum, item, index) => sum + cost(item, previous[index]), 0) : Infinity;
    const chosen = bestScore < previousScore - 28 ? best : previous;
    items.forEach((item, index) => {
      item.layoutSide = chosen[index];
      this.cardinalSides.set(this.items.indexOf(item), chosen[index]);
    });
  }

  leaderEndpoint(item, pins) {
    const rect = item.rect;
    const side = item.layoutSide;
    const horizontalRail = side === 'top' || side === 'bottom';
    const start = horizontalRail ? rect.x + 8 : rect.y + 8;
    const end = horizontalRail ? rect.x + rect.width - 8 : rect.y + rect.height - 8;
    const preferred = clamp(horizontalRail ? item.x : item.y, start, end);
    let best = null, bestScore = Infinity, previous = null;
    const choices = [preferred, start, end, (start + end) / 2, start * .75 + end * .25, start * .25 + end * .75];
    for (const [index, value] of choices.entries()) {
      const x = horizontalRail ? value : side === 'left' ? rect.x + rect.width : rect.x;
      const y = horizontalRail ? side === 'top' ? rect.y + rect.height : rect.y : value;
      const dx = x - item.x, dy = y - item.y;
      const lengthSq = dx * dx + dy * dy;
      let score = Math.sqrt(lengthSq);
      for (const pin of pins) {
        if (pin === item || lengthSq === 0) continue;
        const t = clamp(((pin.x - item.x) * dx + (pin.y - item.y) * dy) / lengthSq, 0, 1);
        const distance = Math.hypot(pin.x - item.x - t * dx, pin.y - item.y - t * dy);
        // Prefer a short alternative attachment point if the direct leader
        // would run through another pin's visual/touch region.
        score += Math.max(0, 24 - distance) * 100;
      }
      const candidate = { x, y, index, score };
      if (index === item.leaderChoice) previous = candidate;
      if (score < bestScore) { bestScore = score; best = candidate; }
    }
    // Keep nearly equivalent routing choices from flickering on noisy poses.
    if (previous && previous.score <= bestScore + 12) best = previous;
    item.leaderChoice = best.index;
    return best;
  }

  layout() {
    const gap = 28;
    this.measure(170);
    const valid = this.items.filter(item => item.valid);
    if (!valid.length || valid.some(item => !(item.width > 0 && item.height > 0))) return false;
    const hull = {
      left: Math.min(...valid.map(item => item.x)),
      right: Math.max(...valid.map(item => item.x)),
      top: Math.min(...valid.map(item => item.y)),
      bottom: Math.max(...valid.map(item => item.y)),
    };
    valid.forEach(item => { item.layoutSide = item.hotspot.labelSide; });
    if (this.target.id === 'keyboard') {
      const verticalOrder = this.orderedSide('keyboard-vertical', valid, false);
      verticalOrder.forEach((item, index) => {
        item.layoutSide = index < Math.ceil(verticalOrder.length / 2) ? 'top' : 'bottom';
      });
    } else this.assignCardinalSides(valid, hull);
    const sides = {};
    for (const side of ['top', 'bottom', 'left', 'right']) {
      sides[side] = this.orderedSide(side, valid.filter(item => item.layoutSide === side));
      for (const item of sides[side]) item.rect = { x: 0, y: 0, width: item.width, height: item.height };
    }
    for (const side of ['left', 'right']) {
      const items = sides[side];
      this.spread(items, false, gap);
      for (const item of items) item.rect.x = side === 'left' ? hull.left - gap - item.width : hull.right + gap;
    }
    // Keep top/bottom rails clear of side cards as well as every physical pin.
    const sideCards = [...sides.left, ...sides.right];
    const topRail = Math.min(hull.top, ...sideCards.map(item => item.rect.y)) - gap;
    const bottomRail = Math.max(hull.bottom, ...sideCards.map(item => item.rect.y + item.height)) + gap;
    for (const side of ['top', 'bottom']) {
      const items = sides[side];
      this.spread(items, true, gap);
      for (const item of items) item.rect.y = side === 'top' ? topRail - item.height : bottomRail;
    }
    this.rects = this.items.map(item => item.valid ? { ...item.rect } : null);
    for (const item of valid) {
      const rect = item.rect;
      const end = this.leaderEndpoint(item, valid);
      item.labelOnScreen = rect.x < this.viewport.width && rect.x + rect.width > 0
        && rect.y < this.viewport.height && rect.y + rect.height > 0;
      item.label.style.left = `${rect.x.toFixed(2)}px`;
      item.label.style.top = `${rect.y.toFixed(2)}px`;
      item.line.setAttribute('x1', item.x.toFixed(2));
      item.line.setAttribute('y1', item.y.toFixed(2));
      item.line.setAttribute('x2', end.x.toFixed(2));
      item.line.setAttribute('y2', end.y.toFixed(2));
    }
    return true;
  }

  update(root, camera, viewport) {
    if (!this.items.length || !root.visible || !(viewport.width > 0 && viewport.height > 0)) return false;
    camera.updateMatrixWorld(true);
    this.viewport = viewport;
    this.layer.hidden = false;
    this.layer.style.visibility = 'hidden';
    this.svg.setAttribute('viewBox', `0 0 ${viewport.width} ${viewport.height}`);
    this.svg.setAttribute('width', viewport.width);
    this.svg.setAttribute('height', viewport.height);
    let validCount = 0;
    for (const item of this.items) {
      const point = this.project(item.anchor, root, camera, viewport);
      item.valid = Boolean(point);
      item.onScreen = !!point && point.x >= -24 && point.x <= viewport.width + 24 && point.y >= -24 && point.y <= viewport.height + 24;
      if (!point) {
        item.x = item.y = null;
        item.rect = null;
        item.pin.style.left = item.pin.style.top = '';
        item.label.style.left = item.label.style.top = '';
        for (const attribute of ['x1', 'y1', 'x2', 'y2']) item.line.removeAttribute(attribute);
        continue;
      }
      validCount++;
      item.x = point.x;
      item.y = point.y;
      item.pin.style.left = `${item.x.toFixed(2)}px`;
      item.pin.style.top = `${item.y.toFixed(2)}px`;
    }
    if (!validCount) {
      this.layer.style.visibility = '';
      this.reset();
      return false;
    }
    // Screen edges never change the layout. Offscreen pins can still have a
    // visible label, and the stage clips content naturally as the object moves.
    this.cardsFit = this.layout();
    this.tracked = true;
    this.layer.style.visibility = '';
    this.draw();
    return true;
  }
}
