'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { LauncherUpdater, verifyWindowsSignature } = require('../lib/updater.cjs');
const config = { url: 'https://repocompany.uk/releases/launcher/', publisherName: 'CN=Repo Company, O=Repo Company, C=GB' };
function engine(disk = { publisherName: config.publisherName }) {
  return Object.assign(new EventEmitter(), { configOnDisk: { value: Promise.resolve(disk) }, verifyUpdateCodeSignature() {}, setFeedURL(value) { this.feed = value; }, async checkForUpdates() { this.checked = true; this.emit('update-not-available'); } });
}

test('does not enable preview auto-updates or feeds without an explicit publisher', async () => {
  for (const settings of [{ config, packaged: false }, { config: { url: config.url }, packaged: true }]) {
    const updater = new LauncherUpdater({ ...settings, engineFactory: () => { throw new Error('Must not load updater.'); } });
    assert.equal((await updater.check()).status, 'unconfigured');
  }
});

test('requires publisher identity in shipped app-update.yml, not only the URL config', async () => {
  for (const disk of [{}, { publisherName: '' }, { publisherName: 'Other Publisher' }]) {
    const native = engine(disk), updater = new LauncherUpdater({ config, packaged: true, engineFactory: () => native });
    assert.equal((await updater.check()).status, 'error'); assert.equal(native.checked, undefined); assert.equal(updater.engine, null);
  }
});

test('enables only matching signing configuration and uses the strict Windows verifier', async () => {
  const native = engine(), updater = new LauncherUpdater({ config, packaged: true, engineFactory: () => native });
  assert.equal((await updater.check()).status, 'current');
  assert.equal(native.verifyUpdateCodeSignature, verifyWindowsSignature); assert.equal(native.disableWebInstaller, true);
  assert.equal(native.allowDowngrade, false); assert.equal(native.allowPrerelease, false); assert.equal(native.autoInstallOnAppQuit, true);
});

test('untrusted feeds and missing on-disk configuration fail without an unhandled rejection', async () => {
  const badFeed = new LauncherUpdater({ config: { ...config, url: 'https://other.test/feed' }, packaged: true });
  assert.equal((await badFeed.check()).status, 'error');
  const native = engine(); native.configOnDisk = { get value() { throw new Error('Missing app-update.yml'); } };
  assert.equal((await new LauncherUpdater({ config, packaged: true, engineFactory: () => native }).check()).status, 'error');
});

test('signature validation fails closed for tool failures, wrong signer, invalid status, path mismatch and malformed output', async () => {
  const file = path.resolve('fixture-update.exe');
  for (const result of [
    { error: new Error('PowerShell missing') },
    { stderr: 'Signature command failed' },
    { stdout: 'not JSON' },
    { stdout: JSON.stringify({ Status: 1, Path: file, Subject: config.publisherName }) },
    { stdout: JSON.stringify({ Status: 0, Path: file, Subject: 'Other' }) },
    { stdout: JSON.stringify({ Status: 0, Path: path.resolve('other.exe'), Subject: config.publisherName }) },
  ]) {
    const status = await verifyWindowsSignature([config.publisherName], file, { execFileImpl: (_exe, _args, _options, done) => done(result.error, result.stdout || '', result.stderr || '') });
    assert.equal(typeof status, 'string');
  }
});

test('signature validation uses hidden no-shell execution and requires Windows Valid status and exact signer', async () => {
  const file = path.resolve("fixture-'special-update.exe");
  const status = await verifyWindowsSignature([config.publisherName], file, { execFileImpl: (_exe, args, options, done) => {
    assert.equal(options.shell, false); assert.equal(options.windowsHide, true); assert.equal(options.timeout, 20000);
    const script = Buffer.from(args.at(-1), 'base64').toString('utf16le'); assert.match(script, /fixture-''special/);
    done(null, JSON.stringify({ Status: 0, Path: file, Subject: config.publisherName }), '');
  } });
  assert.equal(status, null);
});
