import { EXPERIENCES } from './content.js';

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const link = (cta, ghost = false) => `<a class="cta${ghost ? ' ghost' : ''}" href="${escapeHTML(cta.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(cta.label)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
const mark = '<img src="./assets/leela-mark.png" alt="" width="34" height="30" />';

/** The reference's overview, hotspot details and collapsible bottom sheet. */
export class ExperienceUI {
  constructor(onSelect) {
    this.onSelect = onSelect;
    this.targetId = null;
    this.activeIndex = -1;
    this.closed = false;
    $('sheetContent').addEventListener('click', event => {
      if (event.target.closest('[data-action="overview"]')) this.overview();
      const highlight = event.target.closest('[data-highlight]');
      if (highlight) this.detail(Number(highlight.dataset.highlight));
    });
    $('stopButton').addEventListener('click', () => this.close());
    $('reopenButton').addEventListener('click', () => this.open());
    this.render();
  }

  setTarget(target) {
    const id = target?.id ?? null;
    if (id === this.targetId) return;
    this.targetId = id;
    this.activeIndex = -1;
    this.onSelect(null);
    this.render();
  }

  reset() {
    this.targetId = null;
    this.activeIndex = -1;
    this.closed = false;
    this.onSelect(null);
    this.render();
  }

  open() {
    this.closed = false;
    $('sessionBar').hidden = false;
    $('reopenButton').hidden = true;
  }

  close() {
    this.closed = true;
    $('sessionBar').hidden = true;
    $('reopenButton').hidden = false;
    $('reopenButton').focus({ preventScroll: true });
  }

  overview() {
    this.activeIndex = -1;
    this.onSelect(null);
    this.render();
  }

  detail(index) {
    const experience = EXPERIENCES[this.targetId];
    if (!experience || !Number.isInteger(index) || !experience.hotspots[index]) return;
    this.activeIndex = index;
    this.onSelect(index);
    this.open();
    this.render();
    // Keyboard users land on the newly revealed content; camera updates never
    // move focus or replace a detail view while the target stays the same.
    $('sheetTitle').focus({ preventScroll: true });
  }

  render() {
    const experience = EXPERIENCES[this.targetId];
    if (!experience) {
      $('sheetContent').innerHTML = `<div class="sh-head">${mark}<div><h2 class="sh-title" id="sheetTitle" tabindex="-1">Discover the stories around you</h2><p class="sh-sub">Point at a cup, keyboard or Sprite can. Keep the whole object in view and hold steady.</p></div></div>`;
      return;
    }
    const hotspot = experience.hotspots[this.activeIndex];
    if (!hotspot) {
      const sheet = experience.sheet;
      $('sheetContent').innerHTML = `<div class="sh-head">${mark}<div><h2 class="sh-title" id="sheetTitle" tabindex="-1">${escapeHTML(sheet.title)}</h2><p class="sh-sub">${escapeHTML(sheet.subtitle)}</p></div></div><div class="ctarow">${link(sheet.primaryCta)}${link(sheet.secondaryCta, true)}</div>`;
      return;
    }
    $('sheetContent').innerHTML = `<button class="back" data-action="overview">← All highlights</button><p class="kicker">${this.activeIndex + 1} of ${experience.hotspots.length} · ${escapeHTML(hotspot.subtitle)}</p><h2 class="sh-title" id="sheetTitle" tabindex="-1">${escapeHTML(hotspot.title)}</h2><p class="sh-detail">${escapeHTML(hotspot.detail)}</p>${link(hotspot.cta)}<div class="dots" aria-label="Highlights">${experience.hotspots.map((item, index) => `<button type="button" data-highlight="${index}" class="${index === this.activeIndex ? 'on' : ''}" aria-label="${escapeHTML(item.title)}" aria-pressed="${index === this.activeIndex}"></button>`).join('')}</div>`;
  }
}
