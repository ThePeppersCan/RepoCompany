'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { SIGNING_CONTEXT, verifyManifest, compareVersions } = require('../lib/update-manifest.cjs');
const keys = crypto.generateKeyPairSync('ed25519');
const config = { url: 'https://repocompany.uk/releases/launcher/latest.json', keyId: 'repo-launcher-2026-01', publicKey: keys.publicKey.export({ type: 'spki', format: 'pem' }), minSequence: 6, publisherName: 'Repo Company Update Key' };
const now = Date.parse('2026-10-14T12:00:00.000Z');
function payload() { return { schemaVersion: 1, appId: 'uk.repocompany.launcher', channel: 'stable', platform: 'win32', arch: 'x64', version: '0.1.6', sequence: 6, issuedAt: new Date(now - 60000).toISOString(), expiresAt: new Date(now + 86400000).toISOString(), sourceCommit: 'a'.repeat(40), installer: { url: 'https://github.com/ThePeppersCan/RepoCompany/releases/download/launcher-v0.1.6/Repo-Company-0.1.6-Windows-x64.exe', size: 4, sha512: crypto.createHash('sha512').update('test').digest('base64') } }; }
function sign(value = payload(), privateKey = keys.privateKey, context = SIGNING_CONTEXT) { const bytes = Buffer.from(JSON.stringify(value)); return { schemaVersion: 1, keyId: config.keyId, payload: bytes.toString('base64'), signature: crypto.sign(null, Buffer.concat([context, bytes]), privateKey).toString('base64') }; }
const verify = (envelope, options = {}) => verifyManifest(envelope, config, { now, currentVersion: '0.1.5', ...options });

test('pinned Ed25519 signature binds the exact release payload and only yields immutable verified download metadata', () => {
  const release = verify(sign());
  assert.equal(release.info.version, '0.1.6'); assert.equal(release.info.files.length, 1);
  assert.equal(release.info.files[0].sha512, release.payload.installer.sha512);
  assert.ok(Object.isFrozen(release) && Object.isFrozen(release.payload.installer) && Object.isFrozen(release.info.files[0]));
  assert.equal(compareVersions('0.1.10', '0.1.9'), 1);
});
test('tampered bytes, wrong key, unsigned envelope, wrong domain and alternate base64 encodings fail', () => {
  const original = sign(); const changed = payload(); changed.installer.size++;
  const other = crypto.generateKeyPairSync('ed25519');
  for (const envelope of [
    { ...original, payload: Buffer.from(JSON.stringify(changed)).toString('base64') },
    sign(payload(), other.privateKey), sign(payload(), keys.privateKey, Buffer.from('different product\n')),
    { ...original, signature: '' }, { ...original, signature: original.signature + '\n' },
    { ...original, keyId: 'untrusted-key' }, { ...original, extra: true }, { payload: original.payload }
  ]) assert.throws(() => verify(envelope));
});
test('even correctly signed malformed, expired, future, cross-product and redirected release metadata fails', () => {
  const mutations = [
    p => { p.appId = 'other'; }, p => { p.arch = 'arm64'; }, p => { p.channel = 'beta'; }, p => { p.version = '0.1.06'; },
    p => { p.sequence = 5; }, p => { p.sequence = 6.5; }, p => { p.sourceCommit = 'unknown'; },
    p => { p.expiresAt = new Date(now).toISOString(); }, p => { p.issuedAt = new Date(now + 300001).toISOString(); },
    p => { p.expiresAt = new Date(now + 367 * 86400000).toISOString(); },
    p => { p.installer.url += '?redirect=evil'; }, p => { p.installer.url = p.installer.url.replace('ThePeppersCan', 'other'); },
    p => { p.installer.size = 0; }, p => { p.installer.size = 2 ** 32; }, p => { p.installer.sha512 = 'abc'; },
    p => { p.installer.extra = true; }, p => { p.extra = true; }
  ];
  for (const change of mutations) { const p = payload(); change(p); assert.throws(() => verify(sign(p))); }
  assert.throws(() => verifyManifest(sign(), { ...config, url: 'https://evil.test/latest.json' }, { now }));
});
test('installed version and persisted sequence/hash prevent downgrade, replay and sequence reuse', () => {
  const envelope = sign(), release = verify(envelope);
  const highWater = { schemaVersion: 1, sequence: 6, version: '0.1.6', payloadSha256: release.payloadSha256 };
  assert.equal(verify(envelope, { highWater }).payloadSha256, release.payloadSha256);
  assert.throws(() => verify(envelope, { currentVersion: '0.1.7' }), /older/);
  assert.throws(() => verify(envelope, { highWater: { ...highWater, sequence: 7 } }), /replayed/);
  const changed = payload(); changed.expiresAt = new Date(now + 2 * 86400000).toISOString();
  assert.throws(() => verify(sign(changed), { highWater }), /reused/);
  assert.throws(() => verify(envelope, { highWater: { ...highWater, version: '0.1.7' } }), /replayed/);
});
