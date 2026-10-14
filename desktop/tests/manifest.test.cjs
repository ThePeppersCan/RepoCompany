'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const { validateManifest, validatePath, validateId, trustedURL } = require('../lib/manifest.cjs');

const game = { id: 'morogue', entry: 'index.html', origin: 'https://morogue.repocompany.uk' };
const options = { manifestURL: 'https://morogue.repocompany.uk/releases/manifest.json' };
function manifest() { return { schemaVersion: 1, gameId: game.id, version: '1.0.0', entry: 'index.html', files: [{ path: 'index.html', size: 0, sha256: crypto.createHash('sha256').digest('hex') }] }; }

test('resolves release assets only within configured HTTPS origins', () => {
  assert.equal(validateManifest(manifest(), game, options).files[0].source, 'https://morogue.repocompany.uk/releases/index.html');
  for (const url of ['http://morogue.repocompany.uk/file', 'https://morogue.repocompany.uk.evil.test/file', 'https://evil.test/file', 'file:///C:/test', 'https://user:pass@morogue.repocompany.uk/file']) assert.throws(() => trustedURL(url, game));
});

test('rejects traversal, Windows device names, alternate streams, aliases, and encoded paths', () => {
  for (const value of ['../index.html', '/index.html', 'a/../../x', 'a\\x', 'C:/x', 'x:stream', 'CON', 'CONIN$', 'CONOUT$', 'aux.txt', 'dir/NUL.js', 'com1.txt', 'LPT¹.log', 'a./x', 'a /x', 'a//x', 'a/%2e%2e/x', 'a/%252e/x', 'x\u0000.html']) assert.throws(() => validatePath(value), value);
  for (const value of ['../morogue', 'CON', '', 'morogue/x', 'Morogue']) assert.throws(() => validateId(value));
});

test('rejects colliding files, missing entry, oversized files, invalid hashes, and wrong game', () => {
  for (const mutate of [
    m => { m.files.push({ ...m.files[0], path: 'INDEX.html' }); },
    m => { m.files.push({ ...m.files[0], path: 'index.html/child' }); },
    m => { m.entry = 'missing.html'; },
    m => { m.files[0].size = 5 * 1024 ** 3; },
    m => { m.files[0].size = -1; },
    m => { m.files[0].sha256 = 'bad'; },
    m => { m.gameId = 'another-game'; },
    m => { m.files[0].url = 'https://evil.test/file'; },
    m => { m.baseUrl = 'file:///C:/'; },
  ]) { const m = manifest(); mutate(m); assert.throws(() => validateManifest(m, game, options)); }
});

test('development manifests cannot introduce their own arbitrary sources', () => {
  const m = manifest(), local = { developmentRoot: path.resolve('fixtures/payload') };
  assert.match(validateManifest(m, game, local).files[0].source, /^file:/);
  m.files[0].url = 'file:///C:/secret';
  assert.throws(() => validateManifest(m, game, local));
});
