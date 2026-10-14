'use strict';
const { EventEmitter } = require('node:events');

class Account extends EventEmitter {
  constructor({ config, getSession, fetchImpl }) {
    super(); this.config = config; this.getSession = getSession; this.fetch = fetchImpl;
    this.state = { status: 'checking', username: '', displayName: '', error: '' };
    this.identity = null; this.token = null; this.pending = null;
  }
  snapshot() { return { ...this.state }; }
  set(state, identity = null, token = null) {
    this.identity = identity; this.token = token; this.state = state; this.emit('change', this.snapshot());
  }
  async refresh() {
    if (this.pending) return this.pending;
    this.pending = this._refresh().finally(() => { this.pending = null; });
    return this.pending;
  }
  async _refresh() {
    try {
      const session = await this.getSession();
      if (!session?.access_token) {
        this.set({ status: 'signed-out', username: '', displayName: '', error: '' }); return this.snapshot();
      }
      if (typeof session.access_token !== 'string' || session.access_token.length > 16384) throw new Error('Invalid account session.');
      const response = await this.fetch(this.config.authOrigin + '/auth/v1/user', {
        headers: { apikey: this.config.authKey, Authorization: 'Bearer ' + session.access_token },
        signal: AbortSignal.timeout(10000)
      });
      if (response.status === 401 || response.status === 403) {
        this.set({ status: 'signed-out', username: '', displayName: '', error: 'Sign in again to connect your account.' }); return this.snapshot();
      }
      if (!response.ok) throw new Error('Your account service is temporarily unavailable.');
      const user = await response.json();
      if (!user?.id || user.id !== session.user?.id) throw new Error('Your account could not be verified.');
      const profileResponse = await this.fetch(this.config.portalOrigin + '/api/dashboard/state', {
        headers: { Authorization: 'Bearer ' + session.access_token }, signal: AbortSignal.timeout(10000)
      });
      if (!profileResponse.ok) throw new Error('Your profile could not be loaded. Please retry.');
      const profile = await profileResponse.json();
      if (typeof profile.username !== 'string' || !/^[a-zA-Z0-9_-]{3,16}$/.test(profile.username)) throw new Error('Your player profile is unavailable.');
      const latest = await this.getSession();
      if (latest?.user?.id !== user.id || latest.access_token !== session.access_token) throw new Error('Your account changed while connecting.');
      // Account tokens stay in the main process and the existing website auth store.
      this.set({ status: 'online', username: profile.username, displayName: profile.profile?.display_name || profile.username, error: '' }, user.id, session.access_token);
    } catch (error) {
      this.set({ ...this.state, status: 'offline', error: error.message === 'Portal unavailable' ? 'Connect to Repo Company to sign in.' : 'Your account connection is unavailable. Reconnect to play.' });
    }
    return this.snapshot();
  }
  async requireOnline(gameOrigin) {
    await this.refresh();
    if (this.state.status !== 'online' || !this.identity || !this.token) throw new Error(this.state.error || 'Sign in to Repo Company before playing.');
    if (gameOrigin) {
      const response = await this.fetch(gameOrigin + '/api/leaderboards/account', {
        headers: { Authorization: 'Bearer ' + this.token }, signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error('Morogue could not connect to your account. Please retry.');
      const player = await response.json();
      if (player.id !== this.identity) throw new Error('Your game account has changed. Sign in again.');
    }
    return this.identity;
  }
}
module.exports = { Account };
