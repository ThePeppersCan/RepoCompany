'use strict';
const path = require('node:path');
const { clean } = require('./message-notifications.cjs');

class TaskbarAttention {
  constructor({window, nativeImage, root, platform = process.platform}) {
    Object.assign(this, {window, nativeImage, root});
    this.enabled = platform === 'win32';
    this.identity = null; this.count = 0; this.flashing = false;
    this.seen = new Set(); this.images = new Map();
    this.onFocus = () => this.stopFlash();
    window.on('focus', this.onFocus);
  }
  available() { return this.enabled && !this.window.isDestroyed(); }
  image(count) {
    const key = count > 9 ? '9plus' : String(count);
    if (!this.images.has(key)) {
      const image = this.nativeImage.createEmpty();
      for (const size of [16, 32]) {
        const png = this.nativeImage.createFromPath(path.join(this.root, 'renderer/assets/unread', `${key}-${size}.png`));
        image.addRepresentation({scaleFactor: size / 16, buffer: png.toPNG()});
      }
      this.images.set(key, image);
    }
    return this.images.get(key);
  }
  sync(identity, count) {
    if (!this.available()) return;
    if (identity !== this.identity) {
      this.stopFlash(); this.seen.clear(); this.identity = identity;
    }
    const next = identity && Number.isInteger(count) && count > 0 ? Math.min(999, count) : 0;
    if (next !== this.count) {
      this.window.setOverlayIcon(next ? this.image(next) : null, next ? `Wibs: ${next} unread message${next === 1 ? '' : 's'}` : '');
      this.count = next;
    }
    if (!next) this.stopFlash();
  }
  notify(data) {
    const message = clean(data);
    if (!this.available() || !this.identity || !message || this.seen.has(message.id)) return;
    this.seen.add(message.id);
    if (this.seen.size > 100) this.seen.delete(this.seen.values().next().value);
    if (!this.window.isFocused() && !this.flashing) {
      this.window.flashFrame(true); this.flashing = true;
    }
  }
  stopFlash() {
    if (this.flashing && this.available()) this.window.flashFrame(false);
    this.flashing = false;
  }
  dispose() {
    this.sync(null, 0); this.window.removeListener('focus', this.onFocus);
    this.seen.clear(); this.images.clear(); this.enabled = false;
  }
}
module.exports = {TaskbarAttention};
