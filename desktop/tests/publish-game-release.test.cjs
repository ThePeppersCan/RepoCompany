'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs/promises'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { publishGameRelease, parseArgs } = require('../tools/publish-game-release.cjs');
const { prepareReleaseFeed } = require('../tools/prepare-release-feed.cjs');
const { safeRemove } = require('../lib/library.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ENTRY = { morogue: 'interface/vampire-survivor/index.html', moratales: 'preview.html', manager: 'index.html', 'comp-run': 'index.html' };
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-release-gate-test-')); t.after(() => safeRemove(os.tmpdir(), root));
  const games = {}, calls = []; let tweak = () => {};
  for (const [id, entry] of Object.entries(ENTRY)) {
    const release = path.join(root, id); games[id] = release;
    const bytes = Buffer.from('<!doctype html><title>' + id + '</title>'); await fs.mkdir(path.dirname(path.join(release, 'payload', entry)), { recursive: true }); await fs.writeFile(path.join(release, 'payload', entry), bytes);
    await fs.writeFile(path.join(release, 'manifest.json'), JSON.stringify({ schemaVersion: 1, gameId: id, version: '0.1.0-preview.1', entry, files: [{ path: entry, size: bytes.length, sha256: hash(bytes) }] }));
  }
  const dependencies = {
    async verifyImpl(options) {
      assert.equal(options.reuseVerifiedFrom, undefined, 'publication does not reuse old live responses');
      const body = await fs.readFile(path.join(options.release, 'manifest.json')), raw = JSON.parse(body);
      calls.push('verify:' + raw.gameId);
      const sourceOrigin = raw.gameId === 'comp-run' ? 'https://comp-run.fluffy-star-4855.chatgpt.site' : 'https://' + raw.gameId + '.repocompany.uk';
      const report = { gameId: raw.gameId, version: raw.version, release: options.release, manifestSha256: hash(body), completedAt: new Date().toISOString(), sourceAudit: null, files: raw.files.map(file => ({ path: file.path, sourceURL: sourceOrigin + '/' + (raw.gameId === 'comp-run' && file.path === 'index.html' ? '' : file.path), manifestSha256: file.sha256, manifestBytes: file.size, installedSha256: file.sha256, installedBytes: file.size, liveSha256: file.sha256, liveBytes: file.size, manifestIntact: true, equal: true, exact: true, transform: null, status: 200 })), summary: { equal: raw.files.length, different: [], errors: [] } };
      await tweak(report, options);
      await fs.mkdir(options.output, { recursive: true }); await fs.writeFile(path.join(options.output, 'report.json'), JSON.stringify(report));
      return report;
    },
    async prepareImpl(options) { calls.push('stage'); return prepareReleaseFeed(options); },
    async deployImpl({ output }) { calls.push('deploy'); assert.equal(output, path.join(root, 'stage')); return { stdout: 'fixture publication result', stderr: '' }; }
  };
  const options = { output: path.join(root, 'stage'), auditOutput: path.join(root, 'audits'), games };
  return { root, games, calls, options, dependencies, tweak: fn => { tweak = fn; }, run: extra => publishGameRelease({ ...options, ...extra }, dependencies) };
}
test('fresh all-game parity is required before staging; deploy is opt-in', async t => {
  const f = await fixture(t), result = await f.run();
  assert.deepEqual(f.calls, ['verify:morogue', 'verify:moratales', 'verify:manager', 'verify:comp-run', 'stage']);
  assert.equal(result.deployed, false); assert.equal(result.games.length, 4);
  assert(result.games.every(game => /^[a-f0-9]{64}$/.test(game.manifestSha256)));
  const evidence = JSON.parse(await fs.readFile(path.join(f.options.auditOutput, 'release-gate.json'))); assert.equal(evidence.deployed, false);
});
test('explicit deployment only runs after all receipts and staged manifests pass', async t => {
  const f = await fixture(t), result = await f.run({ deploy: true });
  assert.deepEqual(f.calls, ['verify:morogue', 'verify:moratales', 'verify:manager', 'verify:comp-run', 'stage', 'deploy']); assert.equal(result.deployed, true);
  assert.equal(JSON.parse(await fs.readFile(path.join(f.options.auditOutput, 'deployment.json'))).deployed, true);
});
test('same-version success claims cannot bypass file, source, or live provenance checks', async t => {
  const mutations = [
    r => { r.files[0].equal = false; }, r => { r.files[0].installedSha256 = '0'.repeat(64); },
    r => { r.manifestSha256 = '0'.repeat(64); }, r => { r.files[0].sourceURL = 'https://elsewhere.test/game.js'; },
    r => { r.files[0].liveSha256 = undefined; }, r => { r.sourceAudit = { reused: true }; },
    r => { r.files = []; }, r => { r.files[0].error = 'partial capture'; }
  ];
  for (const mutate of mutations) {
    const f = await fixture(t); f.tweak(mutate); await assert.rejects(f.run({ deploy: true }));
    assert(!f.calls.includes('stage')); assert(!f.calls.includes('deploy'));
  }
});
test('a manifest changed during another game audit is caught before staging', async t => {
  const f = await fixture(t); f.tweak(async report => {
    if (report.gameId === 'manager') { const file = path.join(f.games.morogue, 'manifest.json'), raw = JSON.parse(await fs.readFile(file)); raw.version = '0.1.0-preview.9'; await fs.writeFile(file, JSON.stringify(raw)); }
  });
  await assert.rejects(f.run({ deploy: true }), /changed during/); assert(!f.calls.includes('stage')); assert(!f.calls.includes('deploy'));
});
test('a staged feed changed away from the verified package is never deployed', async t => {
  const f = await fixture(t), prepare = f.dependencies.prepareImpl;
  f.dependencies.prepareImpl = async options => { const result = await prepare(options); const file = path.join(options.output, 'morogue/manifest.json'), raw = JSON.parse(await fs.readFile(file)); raw.version = '0.1.0-preview.9'; await fs.writeFile(file, JSON.stringify(raw)); return result; };
  await assert.rejects(f.run({ deploy: true }), /Staged feed does not match/); assert(!f.calls.includes('deploy'));
});
test('incremental publication audits all games and replaces only the changed release', async t => {
  const f = await fixture(t), base = path.join(f.root, 'base'); await prepareReleaseFeed({ output: base, replacements: f.games });
  const oldManager = await fs.readFile(path.join(base, 'manager/manifest.json'));
  const file = path.join(f.games.morogue, 'manifest.json'), raw = JSON.parse(await fs.readFile(file)); raw.version = '0.1.0-preview.2'; await fs.writeFile(file, JSON.stringify(raw));
  const result = await f.run({ base }); assert.deepEqual(result.replacements, ['morogue']); assert(f.calls.includes('verify:manager'));
  assert.deepEqual(await fs.readFile(path.join(f.options.output, 'manager/manifest.json')), oldManager);
});
test('first COMP-RUN publication audits all four games and preserves the legacy three-game feed', async t => {
  const f = await fixture(t), base = path.join(f.root, 'base'); await prepareReleaseFeed({ output: base, replacements: f.games });
  await fs.rm(path.join(base, 'comp-run'), { recursive: true });
  const legacy = new Map();
  for (const id of ['morogue', 'moratales', 'manager']) legacy.set(id, await fs.readFile(path.join(base, id, 'manifest.json')));
  const historical = Buffer.from('retain every previously distributed blob'), historicalName = hash(historical) + '.bin';
  await fs.writeFile(path.join(base, 'blobs', historicalName), historical);
  const result = await f.run({ base });
  assert.deepEqual(result.replacements, ['comp-run']); assert.equal(result.games.length, 4);
  assert.deepEqual(f.calls, ['verify:morogue', 'verify:moratales', 'verify:manager', 'verify:comp-run', 'stage']);
  for (const [id, bytes] of legacy) assert.deepEqual(await fs.readFile(path.join(f.options.output, id, 'manifest.json')), bytes);
  assert.deepEqual(await fs.readFile(path.join(f.options.output, 'blobs', historicalName)), historical);
  assert.equal(JSON.parse(await fs.readFile(path.join(f.options.output, 'comp-run/manifest.json'))).gameId, 'comp-run');
});
test('COMP-RUN publication rejects transforms, byte drift and incorrect source paths even when equality is claimed', async t => {
  for (const mutate of [
    row => { row.exact = false; }, row => { row.transform = 'normalized line endings'; },
    row => { row.liveSha256 = '0'.repeat(64); }, row => { row.liveBytes++; },
    row => { row.sourceURL = 'https://comp-run.fluffy-star-4855.chatgpt.site/other.html'; },
    row => { row.sourceURL = 'https://comp-run.fluffy-star-4855.chatgpt.site/index.html'; },
    row => { row.sourceURL = 'https://unapproved.example/'; },
    row => { row.sourceURL = 'https://repocompany.uk/game-integrations/comp-run/index.html'; }
  ]) {
    const f = await fixture(t); f.tweak(report => { if (report.gameId === 'comp-run') mutate(report.files[0]); });
    await assert.rejects(f.run({ deploy: true }), /COMP-RUN|outside the published game/);
    assert(!f.calls.includes('stage')); assert(!f.calls.includes('deploy'));
  }
});
test('CLI has no parity skip/reuse switch and refuses partial game lists or overlapping outputs', async t => {
  assert.throws(() => parseArgs(['--skip-parity', 'true'])); assert.throws(() => parseArgs(['--reuse', 'old-report']));
  const options = parseArgs(['--output', 'stage', '--audit-output', 'audits', '--game', 'morogue=m', '--game', 'moratales=t', '--game', 'manager=v', '--game', 'comp-run=c', '--deploy']); assert.equal(options.deploy, true); assert.equal(options.games['comp-run'], 'c');
  const f = await fixture(t);
  await assert.rejects(f.run({ games: { morogue: f.games.morogue } }), /all four/);
  await assert.rejects(f.run({ auditOutput: path.join(f.options.output, 'audit') }), /outside static/);
  assert.equal(f.calls.length, 0);
});
