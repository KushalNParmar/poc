import { EXPERIENCES } from './content.js';

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const link = (cta, ghost = false) => `<a class="cta${ghost ? ' ghost' : ''}" href="${escapeHTML(cta.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(cta.label)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
const mark = '<img src="./assets/leela-mark.png" alt="" width="34" height="30" />';

/** Shared overview and the details of the hotspot the user selected. */
export class ExperienceUI {
  constructor(onSelect) {
    this.onSelect = onSelect;
    this.targetId = null;
    this.activeIndex = -1;
    $('sheetContent').addEventListener('click', event => {
      if (event.target.closest('[data-action="overview"]')) this.overview();
    });
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
    this.onSelect(null);
    this.render();
  }

  open() {
    $('sessionBar').hidden = false;
  }

  overview() {
    this.activeIndex = -1;
    this.onSelect(null);
    this.render();
    $('sheetTitle').focus({ preventScroll: true });
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
    const hotspot = experience?.hotspots[this.activeIndex];
    $('sessionActions').hidden = Boolean(hotspot);
    $('sessionBar').dataset.view = hotspot ? 'detail' : 'overview';
    if (!experience) {
      $('sheetContent').innerHTML = `<div class="sh-head">${mark}<div><h2 class="sh-title" id="sheetTitle" tabindex="-1">Discover the stories around you</h2><p class="sh-sub">Point at a cup, keyboard or Sprite can. Keep the whole object in view and hold steady.</p></div></div>`;
      return;
    }
    if (!hotspot) {
      const sheet = experience.sheet;
      $('sheetContent').innerHTML = `<div class="sh-head">${mark}<div><h2 class="sh-title" id="sheetTitle" tabindex="-1">${escapeHTML(sheet.title)}</h2><p class="sh-sub">${escapeHTML(sheet.subtitle)}</p></div></div><div class="ctarow">${link(sheet.primaryCta)}${link(sheet.secondaryCta, true)}</div>`;
      return;
    }
    $('sheetContent').innerHTML = `<button class="back" type="button" data-action="overview">← Back</button><p class="kicker">${escapeHTML(hotspot.subtitle)}</p><h2 class="sh-title" id="sheetTitle" tabindex="-1">${escapeHTML(hotspot.title)}</h2><p class="sh-detail">${escapeHTML(hotspot.detail)}</p>${link(hotspot.cta)}`;
  }
}
