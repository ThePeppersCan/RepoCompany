'use strict';

const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const { fileURLToPath } = require('node:url');
const { validateId, validatePath, validateVersion, validateManifest, trustedURL, within, MAX_MANIFEST_BYTES } = require('./manifest.cjs');

const abortError = () => Object.assign(new Error('Download cancelled.'), { name: 'AbortError' });
function throwIfAborted(signal) { if (signal?.aborted) throw abortError(); }

// Reject junctions and symlinks before touching a managed path, including ancestors.
// Install roots belong to this app; game content is never allowed to choose them.
async function assertPlainPath(target, allowMissing = false) {
  const absolute = path.resolve(target), parsed = path.parse(absolute);
  let current = parsed.root;
  for (const part of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { const stat = await fsp.lstat(current); if (stat.isSymbolicLink()) throw new Error('Linked installation paths are not supported.'); }
    catch (error) { if (allowMissing && error.code === 'ENOENT') return; throw error; }
  }
}

async function assertPlainTree(target) {
  await assertPlainPath(target);
  const stat = await fsp.lstat(target);
  if (stat.isDirectory()) for (const item of await fsp.readdir(target)) await assertPlainTree(path.join(target, item));
  else if (!stat.isFile()) throw new Error('Unsupported installation file type.');
}

async function safeRemove(root, target) {
  if (!within(root, target)) throw new Error('Refusing to remove a path outside the game library.');
  try { await assertPlainTree(target); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  await fsp.rm(target, { recursive: true, force: false });
}

async function readBoundedFile(file, limit) {
  await assertPlainPath(file);
  const stat = await fsp.stat(file);
  if (!stat.isFile() || stat.size > limit) throw new Error('Release metadata exceeds its size limit.');
  const chunks = []; let size = 0;
  for await (const chunk of fs.createReadStream(file)) {
    size += chunk.length; if (size > limit) throw new Error('Release metadata exceeds its size limit.'); chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readResponse(response, limit, signal) {
  if (!response.ok || !response.body) throw new Error(`Release service returned HTTP ${response.status}.`);
  const chunks = []; let size = 0;
  for await (const part of response.body) {
    throwIfAborted(signal); const chunk = Buffer.from(part); size += chunk.length;
    if (size > limit) throw new Error('Release metadata exceeds its size limit.'); chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

class Library extends EventEmitter {
  constructor({ root, catalog, fetchImpl = global.fetch, onProgress } = {}) {
    super();
    if (!root || !path.isAbsolute(root)) throw new Error('A native absolute library root is required.');
    this.root = path.resolve(root);
    this.fetchImpl = fetchImpl;
    this.games = new Map(); this.states = {}; this.installed = new Map(); this.operations = new Map();
    this.initialized = false; this.onProgress = onProgress;
    for (const game of catalog?.games || []) {
      validateId(game.id); validatePath(game.entry);
      if (this.games.has(game.id)) throw new Error('Duplicate game id.');
      this.games.set(game.id, Object.freeze({ ...game }));
      this.states[game.id] = { id: game.id, status: 'not-installed', version: null, availableVersion: null, bytes: 0, totalBytes: 0, progress: 0, error: null };
    }
  }

  _game(id) { validateId(id); const game = this.games.get(id); if (!game) throw new Error('Unknown game.'); return game; }
  _directory(id) { this._game(id); return path.join(this.root, 'games', id); }
  snapshot() { return structuredClone(this.states); }
  _set(id, fields) { Object.assign(this.states[id], fields); const snapshot = this.snapshot(); this.emit('change', snapshot); this.onProgress?.(snapshot); }

  async init() {
    if (this.initialized) return this.snapshot();
    await assertPlainPath(this.root, true); await fsp.mkdir(path.join(this.root, 'games'), { recursive: true }); await assertPlainPath(this.root);
    for (const [id, game] of this.games) {
      const directory = this._directory(id);
      try {
        const pointer = JSON.parse(await readBoundedFile(path.join(directory, 'active.json'), 4096));
        if (!/^[a-f0-9-]{36}$/.test(pointer.installId) || pointer.schemaVersion !== 1 || pointer.gameId !== id) throw new Error('Invalid installed release record.');
        validateVersion(pointer.version); validatePath(pointer.entry);
        if (pointer.entry !== game.entry) throw new Error('Installed entry does not match the game catalogue.');
        const versionDirectory = path.join(directory, 'versions', pointer.installId);
        await assertPlainPath(path.join(versionDirectory, pointer.entry));
        if (!(await fsp.stat(path.join(versionDirectory, pointer.entry))).isFile()) throw new Error('Installed entry is missing.');
        this.installed.set(id, { directory: versionDirectory, version: pointer.version, entry: pointer.entry });
        this._set(id, { status: 'installed', version: pointer.version, installedPath: versionDirectory });
      } catch (error) {
        if (error.code !== 'ENOENT') this._set(id, { status: 'error', error: 'The installed game needs repair: ' + error.message });
      }
      // Interrupted downloads are disposable; active version directories stay intact.
      await safeRemove(this.root, path.join(directory, 'staging'));
    }
    this.initialized = true; return this.snapshot();
  }

  getInstalled(id) { this._game(id); const record = this.installed.get(id); return record ? { ...record } : null; }
  isBusy(id) { this._game(id); return this.operations.has(id); }

  async _manifest(game, signal) {
    throwIfAborted(signal);
    if (game.developmentManifest) {
      if (typeof game.developmentManifest !== 'string' || !path.isAbsolute(game.developmentManifest)) throw new Error('Development manifest must be an explicit native path.');
      const raw = await readBoundedFile(game.developmentManifest, MAX_MANIFEST_BYTES);
      throwIfAborted(signal);
      return validateManifest(JSON.parse(raw), game, { developmentRoot: path.join(path.dirname(game.developmentManifest), 'payload') });
    }
    if (!game.manifestUrl) throw new Error('This game does not have a downloadable release yet.');
    const manifestURL = trustedURL(game.manifestUrl, game);
    const requestSignal = AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(30000)]);
    const response = await this.fetchImpl(manifestURL, { signal: requestSignal, redirect: 'error', credentials: 'omit', cache: 'no-store' });
    if (response.url) trustedURL(response.url, game);
    const raw = await readResponse(response, MAX_MANIFEST_BYTES, requestSignal);
    return validateManifest(JSON.parse(raw), game, { manifestURL });
  }

  async checkUpdates() {
    if (!this.initialized) await this.init();
    for (const [id, game] of this.games) {
      if (this.operations.has(id) || (!game.manifestUrl && !game.developmentManifest)) continue;
      try { const manifest = await this._manifest(game); this._set(id, { availableVersion: manifest.version, error: null }); }
      catch (error) { this._set(id, { error: 'Update check failed: ' + error.message }); }
    }
    return this.snapshot();
  }

  // An explicit install of an existing game is also its repair path. Build a
  // fresh verified directory even when the published version has not changed.
  async install(id) { return this._start(id, { repair: true }); }
  async update(id) { if (!this.getInstalled(id)) throw new Error('Install this game before updating it.'); return this._start(id); }

  async _start(id, { repair = false } = {}) {
    const game = this._game(id);
    if (!this.initialized) throw new Error('Initialize the game library first.');
    if (this.operations.has(id)) throw new Error('This game already has a library operation in progress.');
    const controller = new AbortController();
    const operation = { controller, promise: null };
    this.operations.set(id, operation);
    operation.promise = this._install(game, controller.signal, repair).finally(() => this.operations.delete(id));
    return operation.promise;
  }

  async _download(file, destination, game, signal, progress) {
    throwIfAborted(signal);
    let body;
    if (file.source.startsWith('file:')) {
      if (!game.developmentManifest) throw new Error('Local package sources are disabled.');
      const sourcePath = fileURLToPath(file.source);
      await assertPlainPath(sourcePath);
      const stat = await fsp.stat(sourcePath);
      if (!stat.isFile() || stat.size !== file.size) throw new Error('Local release file size does not match its manifest.');
      body = fs.createReadStream(sourcePath, { signal });
    } else {
      const response = await this.fetchImpl(trustedURL(file.source, game), { signal: AbortSignal.any([signal, AbortSignal.timeout(5 * 60 * 1000)]), redirect: 'error', credentials: 'omit', cache: 'no-store' });
      if (response.url) trustedURL(response.url, game);
      if (!response.ok || !response.body) throw new Error(`Download returned HTTP ${response.status}.`);
      body = response.body;
    }
    await assertPlainPath(path.dirname(destination), true);
    await fsp.mkdir(path.dirname(destination), { recursive: true });
    await assertPlainPath(path.dirname(destination));
    const handle = await fsp.open(destination, 'wx', 0o600);
    const hash = crypto.createHash('sha256'); let count = 0;
    try {
      for await (const part of body) {
        throwIfAborted(signal); const chunk = Buffer.from(part); count += chunk.length;
        if (count > file.size) throw new Error('Download exceeded its declared file size.');
        hash.update(chunk);
        let offset = 0;
        while (offset < chunk.length) { const written = await handle.write(chunk, offset, chunk.length - offset); if (!written.bytesWritten) throw new Error('Unable to write game data.'); offset += written.bytesWritten; }
        progress(chunk.length);
      }
      throwIfAborted(signal);
      if (count !== file.size || hash.digest('hex') !== file.sha256) throw new Error('Release checksum verification failed.');
      await handle.sync();
    } finally { await handle.close(); }
  }

  async _install(game, signal, repair = false) {
    const id = game.id, previous = this.installed.get(id), directory = this._directory(id);
    const installId = crypto.randomUUID(), stage = path.join(directory, 'staging', installId), finalDirectory = path.join(directory, 'versions', installId);
    let committed = false;
    const pointerTemp = path.join(directory, `active-${installId}.tmp`);
    this._set(id, { status: previous ? 'updating' : 'downloading', error: null, bytes: 0, totalBytes: 0, progress: 0 });
    try {
      const manifest = await this._manifest(game, signal);
      this._set(id, { availableVersion: manifest.version, totalBytes: manifest.totalBytes });
      if (!repair && previous?.version === manifest.version) { this._set(id, { status: 'installed', progress: 1 }); return this.getInstalled(id); }
      await assertPlainPath(stage, true); await fsp.mkdir(stage, { recursive: true });
      let bytes = 0, lastUpdate = 0;
      const downloads = new AbortController(), downloadSignal = AbortSignal.any([signal, downloads.signal]);
      let nextFile = 0, downloadFailure;
      const worker = async () => {
        try { while (nextFile < manifest.files.length) {
          throwIfAborted(downloadSignal);
          const file = manifest.files[nextFile++];
          await this._download(file, path.join(stage, ...file.path.split('/')), game, downloadSignal, count => {
          bytes += count;
          if (Date.now() - lastUpdate >= 100) { lastUpdate = Date.now(); this._set(id, { bytes, progress: manifest.totalBytes ? bytes / manifest.totalBytes : 0 }); }
          });
        } } catch (error) { if (!downloadFailure) downloadFailure = error; downloads.abort(); }
      };
      // Await every writer before cleanup, including after cancellation or a bad checksum.
      await Promise.all(Array.from({ length: Math.min(4, manifest.files.length) }, worker));
      if (downloadFailure) throw downloadFailure;
      this._set(id, { status: 'verifying', bytes, progress: 1 });
      throwIfAborted(signal);
      await assertPlainTree(stage);
      await assertPlainPath(path.dirname(finalDirectory), true); await fsp.mkdir(path.dirname(finalDirectory), { recursive: true });
      await fsp.rename(stage, finalDirectory);
      const record = { schemaVersion: 1, gameId: id, installId, version: manifest.version, entry: manifest.entry };
      const pointerHandle = await fsp.open(pointerTemp, 'wx', 0o600);
      try { await pointerHandle.writeFile(JSON.stringify(record)); await pointerHandle.sync(); } finally { await pointerHandle.close(); }
      throwIfAborted(signal); await assertPlainPath(path.join(directory, 'active.json'), true);
      await fsp.rename(pointerTemp, path.join(directory, 'active.json')); // Atomic activation; the old release remains valid until here.
      committed = true;
      this.installed.set(id, { directory: finalDirectory, version: manifest.version, entry: manifest.entry });
      this._set(id, { status: 'installed', version: manifest.version, installedPath: finalDirectory, bytes, totalBytes: bytes, progress: 1, error: null });
      // Keep the previous version for safe rollback; uninstall removes all versions.
      return this.getInstalled(id);
    } catch (error) {
      this._set(id, { status: signal.aborted ? (previous ? 'installed' : 'not-installed') : 'error', bytes: 0, progress: previous ? 1 : 0, error: signal.aborted ? null : error.message });
      if (signal.aborted) throw abortError();
      throw error;
    } finally {
      await safeRemove(this.root, stage);
      await safeRemove(this.root, pointerTemp);
      if (!committed) await safeRemove(this.root, finalDirectory);
    }
  }

  async cancel(id) {
    this._game(id); const operation = this.operations.get(id);
    if (operation) { operation.controller?.abort(); try { await operation.promise; } catch (error) { if (error.name !== 'AbortError') throw error; } }
    return this.snapshot();
  }

  async uninstall(id) {
    this._game(id);
    if (!this.initialized) throw new Error('Initialize the game library first.');
    if (this.operations.has(id)) throw new Error('Cancel the game download before uninstalling.');
    const operation = { controller: null, promise: null };
    this.operations.set(id, operation);
    operation.promise = (async () => {
      await safeRemove(this.root, this._directory(id));
      this.installed.delete(id);
      delete this.states[id].installedPath;
      this._set(id, { status: 'not-installed', version: null, bytes: 0, totalBytes: 0, progress: 0, error: null });
      return this.snapshot();
    })().finally(() => this.operations.delete(id));
    return operation.promise;
  }
}

module.exports = { Library, assertPlainPath, safeRemove };
