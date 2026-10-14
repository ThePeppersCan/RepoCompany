'use strict';

const path = require('node:path');
const { pathToFileURL } = require('node:url');

const MAX_MANIFEST_BYTES = 8 * 1024 * 1024;
const MAX_FILE_BYTES = 4 * 1024 ** 3;
const MAX_PACKAGE_BYTES = 32 * 1024 ** 3;
const MAX_FILES = 20000;
const DEVICE = /^(con|conin\$|conout\$|clock\$|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(?:\.|$)/i;

function validateId(value) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(value) || DEVICE.test(value)) throw new Error('Invalid game id.');
  return value;
}

function validatePath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 220 || value.includes('\\') || /[\x00-\x1f\x7f<>:"|?*%#]/.test(value)) throw new Error('Unsafe package path.');
  const parts = value.split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part) || DEVICE.test(part) || part.normalize('NFC') !== part)) throw new Error('Unsafe package path.');
  return value;
}

function validateVersion(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(value) || value.includes('..')) throw new Error('Invalid release version.');
  return value;
}

function within(root, file) {
  const relative = path.relative(path.resolve(root), path.resolve(file));
  return relative !== '' && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

function trustedURL(value, game) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Invalid release URL.'); }
  const origins = [game.origin, ...(game.approvedOrigins || [])].map(origin => new URL(origin).origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || !origins.includes(url.origin)) throw new Error('Release URL is outside trusted HTTPS origins.');
  return url.href;
}

function validateManifest(input, game, { manifestURL, developmentRoot } = {}) {
  validateId(game.id);
  if (!input || input.schemaVersion !== 1 || input.gameId !== game.id) throw new Error('Release manifest does not match this game.');
  const version = validateVersion(input.version);
  const entry = validatePath(input.entry);
  if (game.entry && entry !== game.entry) throw new Error('Release entry does not match the game catalogue.');
  if (!/\.html$/i.test(entry)) throw new Error('Game entry must be an HTML file.');
  if (!Array.isArray(input.files) || input.files.length === 0 || input.files.length > MAX_FILES) throw new Error('Invalid release file count.');
  let baseURL;
  if (!developmentRoot) baseURL = trustedURL(input.baseUrl || new URL('./', trustedURL(manifestURL, game)).href, game);
  let totalBytes = 0;
  const names = new Set();
  const files = input.files.map(file => {
    if (!file || typeof file !== 'object') throw new Error('Invalid release file.');
    const name = validatePath(file.path);
    const folded = name.toLowerCase();
    if (names.has(folded)) throw new Error('Duplicate release path.');
    names.add(folded);
    if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_FILE_BYTES || !/^[a-f0-9]{64}$/i.test(file.sha256)) throw new Error('Invalid release file size or checksum.');
    totalBytes += file.size;
    if (totalBytes > MAX_PACKAGE_BYTES) throw new Error('Release exceeds the package size limit.');
    let source;
    if (developmentRoot) {
      if (file.url !== undefined || input.baseUrl !== undefined) throw new Error('Development packages cannot override local sources.');
      const localPath = path.join(developmentRoot, ...name.split('/'));
      if (!within(developmentRoot, localPath)) throw new Error('Unsafe development source path.');
      source = pathToFileURL(localPath).href;
    } else {
      source = trustedURL(file.url || new URL(name.split('/').map(encodeURIComponent).join('/'), baseURL.endsWith('/') ? baseURL : baseURL + '/').href, game);
    }
    return Object.freeze({ path: name, size: file.size, sha256: file.sha256.toLowerCase(), source });
  });
  for (const name of names) {
    const parts = name.split('/');
    while (parts.length > 1) { parts.pop(); if (names.has(parts.join('/'))) throw new Error('Release file conflicts with a directory.'); }
  }
  if (!files.some(file => file.path === entry)) throw new Error('Release entry is missing.');
  return Object.freeze({ schemaVersion: 1, gameId: game.id, version, entry, totalBytes, files: Object.freeze(files) });
}

module.exports = { validateId, validatePath, validateVersion, trustedURL, validateManifest, within, MAX_MANIFEST_BYTES };
