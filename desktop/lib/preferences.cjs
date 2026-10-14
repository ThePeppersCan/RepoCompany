'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');

// Installation preferences belong to this Windows profile, not a signed-in
// account. Never read or write them through the website's account storage.
class Preferences {
  constructor(file) {
    this.file = file;
    this.automaticGameUpdates = true;
    this.discordPresence = true;
    this.writes = Promise.resolve();
  }
  async init() {
    try {
      const value = JSON.parse(await fs.readFile(this.file, 'utf8'));
      if (value?.version === 1) {
        if (typeof value.automaticGameUpdates === 'boolean') this.automaticGameUpdates = value.automaticGameUpdates;
        if (typeof value.discordPresence === 'boolean') this.discordPresence = value.discordPresence;
      }
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
    return this;
  }
  snapshot() { return { automaticGameUpdates: this.automaticGameUpdates, discordPresence: this.discordPresence }; }
  setAutomaticGameUpdates(value) {
    if (typeof value !== 'boolean') return Promise.reject(new TypeError('Automatic game updates must be on or off.'));
    return this._set('automaticGameUpdates', value);
  }
  setDiscordPresence(value) {
    if (typeof value !== 'boolean') return Promise.reject(new TypeError('Discord activity must be on or off.'));
    return this._set('discordPresence', value);
  }
  _set(key, value) {
    const write = this.writes.then(async () => {
      if (value === this[key]) return this.snapshot();
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const temporary = this.file + '.tmp';
      try {
        await fs.writeFile(temporary, JSON.stringify({ version: 1, ...this.snapshot(), [key]: value }) + '\n', { mode: 0o600 });
        await fs.rename(temporary, this.file);
        this[key] = value;
      } finally { await fs.rm(temporary, { force: true }).catch(() => {}); }
      return this.snapshot();
    });
    this.writes = write.catch(() => {});
    return write;
  }
}
module.exports = { Preferences };
