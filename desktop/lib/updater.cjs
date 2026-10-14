'use strict';
const { EventEmitter } = require('node:events');
const { execFile } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const { validateConfig, validateHighWater, verifyManifest, verifyInstaller, compareVersions, PUBLISHER } = require('./update-manifest.cjs');

function publishers(value) {
  const result = Array.isArray(value) ? value : [value];
  if (!result.length || result.some(name => typeof name !== 'string' || !name.trim() || name.length > 2048)) throw new Error('A signed publisher identity is required.');
  return [...new Set(result)].sort();
}

// Fail closed if Windows cannot verify Authenticode. electron-updater's default
// verifier can skip verification when PowerShell is unavailable, so use a
// bounded native check with no shell and explicitly compare the signed identity.
function verifyWindowsSignature(publisherNames, file, { execFileImpl = execFile } = {}) {
  const allowed = publishers(publisherNames);
  if (!path.isAbsolute(file) || /[\x00-\x1f]/.test(file)) return Promise.resolve('Invalid installer path.');
  const literal = file.replace(/'/g, "''");
  const script = "$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false); $s=Get-AuthenticodeSignature -LiteralPath '" + literal + "'; if(!$s.SignerCertificate){throw 'Missing signing certificate'}; [pscustomobject]@{Status=[int]$s.Status;Subject=$s.SignerCertificate.Subject;Name=$s.SignerCertificate.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::SimpleName,$false);Path=$s.Path}|ConvertTo-Json -Compress";
  const powershell = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  return new Promise(resolve => {
    execFileImpl(powershell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true, timeout: 20000, maxBuffer: 64 * 1024, shell: false }, (error, stdout, stderr) => {
      if (error || stderr?.trim()) { resolve('Windows could not verify the installer signature.'); return; }
      try {
        const signature = JSON.parse(stdout.replace(/^\uFEFF/, '').trim());
        if (signature.Status !== 0 || typeof signature.Path !== 'string' || path.resolve(signature.Path).toLowerCase() !== path.resolve(file).toLowerCase()) { resolve('The installer has an invalid signature.'); return; }
        const matches = allowed.some(name => name.includes('=') ? name === signature.Subject : name === signature.Name);
        resolve(matches ? null : 'The installer signing identity does not match Repo Company.');
      } catch { resolve('Windows returned an unreadable installer signature.'); }
    });
  });
}

// A supported custom provider receives ONLY already verified metadata. There is
// no second unsigned latest.yml fetch that can change the selected release.
function providerFor(release) {
  const { Provider } = require('electron-updater');
  return class VerifiedReleaseProvider extends Provider {
    constructor(_options, _updater, runtimeOptions) { super({ ...runtimeOptions, isUseMultipleRangeRequest: false }); }
    async getLatestVersion() { return release.info; }
    resolveFiles(info) {
      if (info !== release.info) throw Error('The selected update changed.');
      return [{ url: new URL(release.payload.installer.url), info: release.info.files[0] }];
    }
  };
}
class LauncherUpdater extends EventEmitter {
  constructor({ config, packaged, canRestart = () => false, cacheDir, currentVersion, engineFactory = () => require('electron-updater').autoUpdater, fetchImpl = globalThis.fetch, now = Date.now, verifyFile = verifyInstaller, handoffTimeoutMs = 15000 }) {
    super(); this.config = Object.freeze({ ...(config || {}) }); this.packaged = packaged; this.canRestart = canRestart;
    this.cacheDir = cacheDir; this.currentVersion = currentVersion; this.engineFactory = engineFactory; this.fetch = fetchImpl; this.now = now; this.verifyFile = verifyFile;
    this.handoffTimeoutMs = Math.max(1, Math.min(15000, Number(handoffTimeoutMs) || 15000));
    this.pending = null; this.applying = null; this.engine = null; this.release = null; this.ready = null; this.highWater = null;
    this.disposed = false; this.listeners = []; this.abort = new AbortController(); this.cancelDownload = null;
    this.state = { status: 'unconfigured', message: 'Automatic launcher updates are not available in this installation.' };
  }
  snapshot() { return { ...this.state }; }
  set(state) { if (this.disposed) return; this.state = state; this.emit('change', this.snapshot()); }
  assertActive() { if (this.disposed || this.abort.signal.aborted) throw Error('The launcher updater has closed.'); }
  async assertDiskConfig(engine = this.engine) {
    const disk = await engine.configOnDisk?.value;
    const publisher = disk?.publisherName;
    if (publisher !== PUBLISHER && !(Array.isArray(publisher) && publisher.length === 1 && publisher[0] === PUBLISHER)) throw Error('Launcher update verification metadata is missing.');
  }
  async configure() {
    if (!this.packaged || !this.config.url) return false;
    validateConfig(this.config); compareVersions(this.currentVersion, this.currentVersion);
    if (!this.cacheDir || !path.isAbsolute(this.cacheDir)) throw Error('Launcher update state directory is unavailable.');
    const engine = this.engineFactory();
    // NsisUpdater6 invokes the custom verifier only when publisherName exists.
    await this.assertDiskConfig(engine); this.assertActive();
    if (typeof engine.verifyUpdateCodeSignature !== 'function' || typeof engine.downloadUpdate !== 'function' || typeof engine.quitAndInstall !== 'function' || typeof engine.spawnLog !== 'function') throw Error('This installation cannot safely update.');
    if (engine.currentVersion?.version && engine.currentVersion.version !== this.currentVersion) throw Error('Installed launcher version is inconsistent.');
    engine.autoDownload = false; engine.autoInstallOnAppQuit = false;
    engine.allowDowngrade = false; engine.allowPrerelease = false; engine.disableWebInstaller = true; engine.disableDifferentialDownload = true;
    engine.verifyUpdateCodeSignature = async (names, file) => {
      try {
        this.assertActive();
        if (!this.release || !Array.isArray(names) || names.length !== 1 || names[0] !== PUBLISHER) throw Error('The update signing configuration changed.');
        const release = this.release;
        verifyManifest(release.envelope, this.config, { now: this.now(), currentVersion: this.currentVersion, highWater: this.highWater });
        await this.verifyFile(file, release, { temporary: true }); this.assertActive();
        if (release !== this.release) throw Error('The selected update changed.');
        return null;
      } catch { return 'The installer could not be verified against the trusted release key.'; }
    };
    const listen = (event, callback) => { engine.on(event, callback); this.listeners.push(() => engine.removeListener(event, callback)); };
    listen('download-progress', progress => { if (this.state.status === 'downloading') this.set({ ...this.state, progress: Math.max(0, Math.min(1, Number(progress.percent) / 100 || 0)) }); });
    // EventEmitter error must always be handled. The awaited operation owns the
    // state transition, so update-downloaded cannot advertise an unchecked cache.
    listen('error', () => {});
    this.engine = engine; return true;
  }
  async readHighWater() {
    try { return validateHighWater(JSON.parse(await fs.readFile(path.join(this.cacheDir, 'verified-release.json'), 'utf8'))); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  async saveHighWater(release) {
    const state = { schemaVersion: 1, sequence: release.payload.sequence, version: release.payload.version, payloadSha256: release.payloadSha256 };
    if (JSON.stringify(state) === JSON.stringify(this.highWater)) return;
    await fs.mkdir(this.cacheDir, { recursive: true });
    const target = path.join(this.cacheDir, 'verified-release.json'), temporary = target + '.' + crypto.randomUUID() + '.tmp';
    try {
      const file = await fs.open(temporary, 'wx', 0o600);
      try { await file.writeFile(JSON.stringify(state)); await file.sync(); } finally { await file.close(); }
      this.assertActive(); await fs.rename(temporary, target); this.highWater = state;
    } finally { await fs.unlink(temporary).catch(() => {}); }
  }
  async fetchManifest() {
    const response = await this.fetch(this.config.url, { headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'error', signal: AbortSignal.any([this.abort.signal, AbortSignal.timeout(15000)]) });
    if (!response.ok || (response.url && response.url !== this.config.url) || Number(response.headers.get('content-length')) > 65536) throw Error('The update manifest could not be downloaded safely.');
    const reader = response.body?.getReader(); if (!reader) throw Error('The update manifest is empty.');
    const parts = []; let length = 0;
    try { for (;;) { const { value, done } = await reader.read(); if (done) break; length += value.byteLength; if (length > 65536) { await reader.cancel(); throw Error('The update manifest is too large.'); } parts.push(Buffer.from(value)); } }
    finally { reader.releaseLock(); }
    this.assertActive(); return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(parts)));
  }
  check() {
    if (this.disposed || this.applying || this.ready) return Promise.resolve(this.snapshot());
    if (this.pending) return this.pending;
    this.pending = this._check().finally(() => { this.pending = null; this.cancelDownload = null; });
    return this.pending;
  }
  async _check() {
    try {
      if (!this.engine && !await this.configure()) { this.set(this.state); return this.snapshot(); }
      this.assertActive(); this.set({ status: 'checking', message: 'Checking for launcher updates…' });
      this.highWater = await this.readHighWater();
      const release = verifyManifest(await this.fetchManifest(), this.config, { now: this.now(), currentVersion: this.currentVersion, highWater: this.highWater });
      await this.saveHighWater(release); this.assertActive(); this.release = release;
      if (compareVersions(release.payload.version, this.currentVersion) === 0) { this.set({ status: 'current', message: 'Your launcher is up to date.' }); return this.snapshot(); }
      this.engine.setFeedURL({ provider: 'custom', updateProvider: providerFor(release) });
      const result = await this.engine.checkForUpdates(); this.assertActive();
      if (!result?.isUpdateAvailable || result.updateInfo !== release.info) throw Error('The updater selected unexpected release metadata.');
      this.cancelDownload = result.cancellationToken;
      this.set({ status: 'downloading', version: release.payload.version, message: 'Downloading the next launcher update…' });
      const files = await this.engine.downloadUpdate(result.cancellationToken); this.assertActive();
      if (!Array.isArray(files) || files.length !== 1 || files[0] !== this.engine.installerPath) throw Error('The updater returned an unexpected installer.');
      this.set({ status: 'verifying', version: release.payload.version, message: 'Verifying your launcher update…' });
      // executeDownload reuses cached EXEs without calling the NSIS hook. Always
      // independently verify returned bytes before exposing Ready or installation.
      await this.verifyFile(files[0], release); this.assertActive();
      this.ready = Object.freeze({ release, file: files[0] });
      this.set({ status: 'ready', version: release.payload.version, message: 'Ready to install when you close the launcher.' });
    } catch {
      this.ready = null;
      this.set({ status: 'error', message: 'Could not verify the launcher update. Please try again later.' });
    }
    return this.snapshot();
  }
  applyOnQuit({ restart = false } = {}) {
    if (this.applying) return this.applying;
    if (this.disposed || !this.ready || this.pending || !this.canRestart()) return Promise.resolve(false);
    this.applying = this._applyOnQuit(restart).finally(() => { this.applying = null; });
    return this.applying;
  }
  async launchInstaller(restart) {
    const engine = this.engine, originalSpawn = engine.spawnLog, attempts = [];
    let closed = false, timer, rejectStop;
    const stopped = new Promise((_resolve, reject) => { rejectStop = reject; });
    stopped.catch(() => {}); // Also handle a synchronous quit callback aborting before the first await.
    const abort = () => rejectStop(Error('Installer handoff was interrupted.'));
    timer = setTimeout(() => rejectStop(Error('Installer handoff timed out.')), this.handoffTimeoutMs);
    this.abort.signal.addEventListener('abort', abort, { once: true });
    // NSIS6 returns before spawnLog settles and may retry through elevate.exe.
    // Observe those real launches without altering executable paths or args.
    // Main holds its recursive quit lock while this promise remains pending.
    engine.spawnLog = function (...args) {
      if (closed) return Promise.reject(Error('Installer handoff has closed.'));
      let spawned;
      try { spawned = Promise.resolve(originalSpawn.apply(this, args)); } catch (error) { spawned = Promise.reject(error); }
      spawned = spawned.catch(error => {
        // NSIS's ENOENT fallback uses shell.openPath, which cannot provide the
        // process handoff acknowledgement required here. A missing executable
        // must fail closed instead of taking that unobserved fallback route.
        if (error?.code === 'ENOENT') throw Object.assign(Error('The verified installer executable is unavailable.'), { code: 'ERR_REPO_INSTALLER_UNAVAILABLE' });
        throw error;
      });
      const attempt = { status: 'pending' }; attempts.push(attempt);
      attempt.settled = spawned.then(result => { attempt.status = result === false ? 'failed' : 'started'; }, () => { attempt.status = 'failed'; });
      return spawned;
    };
    try {
      engine.quitAndInstall(true, restart === true);
      if (!attempts.length) throw Error('The updater did not start an installer.');
      for (;;) {
        await Promise.race([Promise.all(attempts.map(attempt => attempt.settled)), stopped]);
        // The engine's rejection handler schedules its elevation retry. Yield
        // through that handler before deciding whether the handoff succeeded.
        await Promise.race([new Promise(resolve => setImmediate(resolve)), stopped]);
        if (attempts.some(attempt => attempt.status === 'pending')) continue;
        if (attempts.at(-1).status !== 'started') throw Error('Windows could not start the update installer.');
        return;
      }
    } finally {
      // Keep the closed gate installed: a delayed failure after timeout cannot
      // launch a fresh elevation fallback once main has released its quit lock.
      closed = true; clearTimeout(timer); this.abort.signal.removeEventListener('abort', abort);
    }
  }
  async _applyOnQuit(restart) {
    const ready = this.ready;
    try {
      this.assertActive(); await this.assertDiskConfig();
      const highWater = await this.readHighWater();
      verifyManifest(ready.release.envelope, this.config, { now: this.now(), currentVersion: this.currentVersion, highWater });
      if (this.engine.installerPath !== ready.file || this.engine.autoInstallOnAppQuit !== false) throw Error('The downloaded update changed.');
      await this.verifyFile(ready.file, ready.release); this.assertActive();
      if (ready !== this.ready || !this.canRestart()) return false;
      // Main must already have saved/disposed views and settled downloads. NSIS
      // starts its installer before emitting app.quit, so a quit veto is too late.
      await this.launchInstaller(restart);
      this.ready = null; this.set({ status: 'installing', version: ready.release.payload.version, message: 'Installing your launcher update…' });
      return true;
    } catch { this.ready = null; this.set({ status: 'error', message: 'The launcher update could not be verified. Your current version is unchanged.' }); return false; }
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.abort.abort(); this.cancelDownload?.cancel?.(); this.ready = null;
    if (this.engine) this.engine.autoInstallOnAppQuit = false;
    for (const remove of this.listeners) remove(); this.listeners.length = 0;
    // Keep a no-op error listener while a cancelled native download settles.
    this.engine?.on('error', () => {});
  }
}
module.exports = { LauncherUpdater, verifyWindowsSignature };
