/** Camera-only guidance; the header and sheet remain above this layer. */
export class TrackingRecovery {
  constructor(stage) {
    this.stage = stage;
    this.element = stage.querySelector('#trackingRecovery');
    this.title = stage.querySelector('#recoveryTitle');
    this.message = stage.querySelector('#recoveryMessage');
    this.header = stage.querySelector('#arTopbar');
    this.sheet = stage.querySelector('#sessionBar');
    this.targetId = null;
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.element.hidden) this.layout();
    });
    for (const element of [stage, this.header, this.sheet]) this.resizeObserver.observe(element);
  }

  show(target) {
    if (!target) return;
    if (this.targetId !== target.id) {
      this.targetId = target.id;
      const name = target.id === 'sprite' ? 'Sprite can' : target.name.toLowerCase();
      this.title.textContent = `Align your ${name}`;
      this.message.textContent = `Keep the whole ${name} clearly visible in the camera and hold steady.`;
      for (const icon of this.element.querySelectorAll('[data-recovery-icon]')) {
        icon.toggleAttribute('hidden', icon.dataset.recoveryIcon !== target.id);
      }
    }
    if (!this.element.hidden) return;
    this.element.hidden = false;
    this.layout();
  }

  hide() {
    this.element.hidden = true;
  }

  layout() {
    const stage = this.stage.getBoundingClientRect();
    const top = this.header.hidden ? 16 : this.header.getBoundingClientRect().bottom - stage.top + 18;
    const bottom = this.sheet.hidden ? 16 : stage.bottom - this.sheet.getBoundingClientRect().top + 18;
    const height = Math.max(0, stage.height - top - bottom);
    this.element.style.setProperty('--recovery-top', `${top}px`);
    this.element.style.setProperty('--recovery-bottom', `${bottom}px`);
    this.element.dataset.compact = String(height < 240);
  }
}
