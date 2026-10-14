'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const SIGNING_CONTEXT = Buffer.from('Repo Company Launcher Update v1\n', 'utf8');
const FEED_URL = 'https://repocompany.uk/releases/launcher/latest.json';
const PUBLISHER = 'Repo Company Update Key';
const MAX_INSTALLER_BYTES = 1024 * 1024 * 1024;
const plain = value => value && typeof value === 'object' && !Array.isArray(value);
function fields(value, expected) {
  if (!plain(value) || Object.keys(value).length !== expected.length || expected.some(key => !Object.hasOwn(value, key))) throw Error('Invalid update metadata fields.');
}
function version(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,6})\.(0|[1-9]\d{0,6})\.(0|[1-9]\d{0,6})$/.test(value)) throw Error('Invalid stable update version.');
  return value.split('.').map(Number);
}
function compareVersions(a, b) { const x = version(a), y = version(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1; return 0; }
function base64(value, length, maximum = length) {
  if (typeof value !== 'string' || value.length > Math.ceil(maximum / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw Error('Invalid update encoding.');
  const bytes = Buffer.from(value, 'base64');
  if (!bytes.length || (length && bytes.length !== length) || bytes.length > maximum || bytes.toString('base64') !== value) throw Error('Invalid update encoding.');
  return bytes;
}
function validateConfig(config) {
  if (!plain(config) || config.url !== FEED_URL || config.keyId !== 'repo-launcher-2026-01' || config.publisherName !== PUBLISHER || !Number.isSafeInteger(config.minSequence) || config.minSequence < 1 || typeof config.publicKey !== 'string' || config.publicKey.length > 2048) throw Error('Launcher update trust configuration is invalid.');
  const key = crypto.createPublicKey(config.publicKey);
  if (key.asymmetricKeyType !== 'ed25519') throw Error('An Ed25519 update key is required.');
  return key;
}
function validateHighWater(value) {
  fields(value, ['schemaVersion', 'sequence', 'version', 'payloadSha256']);
  if (value.schemaVersion !== 1 || !Number.isSafeInteger(value.sequence) || value.sequence < 1 || !/^[a-f0-9]{64}$/.test(value.payloadSha256)) throw Error('Saved update trust state is invalid.');
  version(value.version); return value;
}
function validatePayload(payload, config, { now = Date.now(), currentVersion, highWater = null } = {}) {
  fields(payload, ['schemaVersion', 'appId', 'channel', 'platform', 'arch', 'version', 'sequence', 'issuedAt', 'expiresAt', 'sourceCommit', 'installer']);
  if (payload.schemaVersion !== 1 || payload.appId !== 'uk.repocompany.launcher' || payload.channel !== 'stable' || payload.platform !== 'win32' || payload.arch !== 'x64') throw Error('This update belongs to a different application or platform.');
  version(payload.version);
  if (!Number.isSafeInteger(payload.sequence) || payload.sequence < config.minSequence || !/^[a-f0-9]{40}$/.test(payload.sourceCommit)) throw Error('Invalid update release identity.');
  const issued = Date.parse(payload.issuedAt), expires = Date.parse(payload.expiresAt);
  if (typeof payload.issuedAt !== 'string' || typeof payload.expiresAt !== 'string' || !Number.isFinite(issued) || !Number.isFinite(expires) || new Date(issued).toISOString() !== payload.issuedAt || new Date(expires).toISOString() !== payload.expiresAt || issued > now + 300000 || expires <= now || expires <= issued || expires - issued > 366 * 86400000) throw Error('The signed update information is expired or has invalid dates.');
  fields(payload.installer, ['url', 'size', 'sha512']);
  const expected = `https://github.com/ThePeppersCan/RepoCompany/releases/download/launcher-v${payload.version}/Repo-Company-${payload.version}-Windows-x64.exe`;
  if (payload.installer.url !== expected || !Number.isSafeInteger(payload.installer.size) || payload.installer.size < 1 || payload.installer.size > MAX_INSTALLER_BYTES) throw Error('The signed installer location or size is invalid.');
  base64(payload.installer.sha512, 64);
  if (currentVersion !== undefined && compareVersions(payload.version, currentVersion) < 0) throw Error('An older launcher release cannot replace this installation.');
  if (highWater) {
    validateHighWater(highWater);
    if (payload.sequence < highWater.sequence || compareVersions(payload.version, highWater.version) < 0) throw Error('An older update manifest was replayed.');
  }
  return payload;
}
function verifyManifest(envelope, config, options = {}) {
  const key = validateConfig(config);
  fields(envelope, ['schemaVersion', 'keyId', 'payload', 'signature']);
  if (envelope.schemaVersion !== 1 || envelope.keyId !== config.keyId) throw Error('The update signing key is not trusted.');
  const bytes = base64(envelope.payload, null, 32768), signature = base64(envelope.signature, 64);
  if (!crypto.verify(null, Buffer.concat([SIGNING_CONTEXT, bytes]), key, signature)) throw Error('The update signature is invalid.');
  let payload; try { payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw Error('The signed update payload is invalid.'); }
  validatePayload(payload, config, options);
  const payloadSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (options.highWater?.sequence === payload.sequence && options.highWater.payloadSha256 !== payloadSha256) throw Error('A different manifest reused the same release sequence.');
  Object.freeze(payload.installer); Object.freeze(payload);
  const file = Object.freeze({ url: payload.installer.url, size: payload.installer.size, sha512: payload.installer.sha512 });
  const info = Object.freeze({ version: payload.version, files: Object.freeze([file]), releaseDate: payload.issuedAt });
  return Object.freeze({ payload, payloadSha256, envelope: Object.freeze({ ...envelope }), info });
}
async function verifyInstaller(file, release, { temporary = false } = {}) {
  if (typeof file !== 'string' || !path.isAbsolute(file) || /[\x00-\x1f]/.test(file)) throw Error('The downloaded installer path is invalid.');
  const name = path.basename(new URL(release.payload.installer.url).pathname), actual = path.basename(file);
  if (actual !== name && !(temporary && actual.startsWith('temp-') && actual.endsWith(name))) throw Error('The installer filename does not match the signed release.');
  const before = await fsp.lstat(file);
  if (!before.isFile() || before.isSymbolicLink() || before.size !== release.payload.installer.size) throw Error('The installer size or file type does not match the signed release.');
  const handle = await fsp.open(file, 'r');
  try {
    const stat = await handle.stat(), hash = crypto.createHash('sha512');
    if (stat.size !== before.size || stat.ino !== before.ino || stat.dev !== before.dev) throw Error('The installer changed during verification.');
    for await (const chunk of fs.createReadStream(file, { fd: handle.fd, autoClose: false, start: 0 })) hash.update(chunk);
    const after = await handle.stat(), named = await fsp.lstat(file);
    if (after.size !== stat.size || after.mtimeMs !== stat.mtimeMs || named.ino !== stat.ino || named.dev !== stat.dev || named.size !== stat.size || named.mtimeMs !== stat.mtimeMs || hash.digest('base64') !== release.payload.installer.sha512) throw Error('The installer does not match the signed release.');
  } finally { await handle.close(); }
}
module.exports = { SIGNING_CONTEXT, FEED_URL, PUBLISHER, MAX_INSTALLER_BYTES, validateConfig, validatePayload, validateHighWater, verifyManifest, verifyInstaller, compareVersions };
