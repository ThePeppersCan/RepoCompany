'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Preferences } = require('../lib/preferences.cjs');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-preferences-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'preferences.json');
  return { root, file, preferences: await new Preferences(file).init() };
}
test('automatic game updates default on and a device opt-out survives restarting the launcher', async t => {
  const { file, preferences } = await fixture(t);
  assert.deepEqual(preferences.snapshot(), { automaticGameUpdates: true, discordPresence: true });
  await preferences.setAutomaticGameUpdates(false);
  assert.deepEqual((await new Preferences(file).init()).snapshot(), { automaticGameUpdates: false, discordPresence: true });
  await preferences.setAutomaticGameUpdates(true);
  assert.deepEqual((await new Preferences(file).init()).snapshot(), { automaticGameUpdates: true, discordPresence: true });
  assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf8')), { version: 1, automaticGameUpdates: true, discordPresence: true });
});
test('invalid settings cannot persist paths or account data, and snapshots cannot mutate the preference', async t => {
  const { file, preferences } = await fixture(t);
  for (const value of ['false', 0, null, {}, { automaticGameUpdates: false, accountId: 'other' }]) await assert.rejects(preferences.setAutomaticGameUpdates(value), /on or off/);
  const snapshot = preferences.snapshot(); snapshot.automaticGameUpdates = false;
  assert.equal(preferences.snapshot().automaticGameUpdates, true);
  await assert.rejects(fs.access(file), { code: 'ENOENT' });
});
test('ordered toggles persist the last choice and a failed write keeps the previous setting', async t => {
  const { file, preferences } = await fixture(t);
  await Promise.all([preferences.setAutomaticGameUpdates(false), preferences.setAutomaticGameUpdates(true), preferences.setAutomaticGameUpdates(false)]);
  assert.equal((await new Preferences(file).init()).snapshot().automaticGameUpdates, false);
  // A directory in place of the destination makes atomic rename fail on every OS.
  await fs.rm(file); await fs.mkdir(file);
  await assert.rejects(preferences.setAutomaticGameUpdates(true));
  assert.equal(preferences.snapshot().automaticGameUpdates, false);
  await fs.rm(file, { recursive: true });
  await preferences.setAutomaticGameUpdates(true);
  assert.equal((await new Preferences(file).init()).snapshot().automaticGameUpdates, true);
});
test('missing or damaged optional preferences safely retain the default', async t => {
  const { file } = await fixture(t);
  for (const value of ['broken json', '{"version":1,"automaticGameUpdates":"false"}', '{"version":2,"automaticGameUpdates":false}']) {
    await fs.writeFile(file, value);
    assert.equal((await new Preferences(file).init()).snapshot().automaticGameUpdates, true);
  }
});

test('Discord opt-out persists independently and older update preferences migrate without resetting', async t => {
  const { file } = await fixture(t);
  await fs.writeFile(file, JSON.stringify({ version: 1, automaticGameUpdates: false }));
  const preferences = await new Preferences(file).init();
  assert.deepEqual(preferences.snapshot(), { automaticGameUpdates: false, discordPresence: true });
  await preferences.setDiscordPresence(false);
  await preferences.setAutomaticGameUpdates(true);
  assert.deepEqual((await new Preferences(file).init()).snapshot(), { automaticGameUpdates: true, discordPresence: false });
  for (const value of ['false', 0, null, {}]) await assert.rejects(preferences.setDiscordPresence(value), /on or off/);
});

