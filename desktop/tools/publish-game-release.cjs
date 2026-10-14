'use strict';
// Default release workflow: fresh full-file web parity for ALL games, then
// immutable staging. Publishing needs an explicit --deploy flag. Nothing here
// writes account data, rebuilds games, or modifies the reviewed packages.
const fs = require('node:fs/promises'), path = require('node:path'), crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { prepareReleaseFeed } = require('./prepare-release-feed.cjs');
const { verifyGameParity } = require('./verify-game-parity.cjs');
const { validateManifest, within, MAX_MANIFEST_BYTES } = require('../lib/manifest.cjs');
const { assertPlainPath } = require('../lib/library.cjs');
const REPO = path.resolve(__dirname, '../..');
const GAMES = { morogue: 'interface/vampire-survivor/index.html', moratales: 'preview.html', manager: 'index.html' };
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function check(value, message) { if (!value) throw Error(message); }
function overlap(a, b) { return path.relative(a, b) === '' || within(a, b) || within(b, a); }
async function exists(file) { try { await fs.lstat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
async function manifestAt(directory, id, remote = false) {
  const filename = path.join(directory, 'manifest.json'); await assertPlainPath(filename);
  check((await fs.stat(filename)).size <= MAX_MANIFEST_BYTES, 'Release manifest exceeds its size limit.');
  const bytes = await fs.readFile(filename), raw = JSON.parse(bytes.toString('utf8'));
  check(bytes.length <= MAX_MANIFEST_BYTES, 'Release manifest changed while reading.');
  validateManifest(raw, { id, entry: GAMES[id], origin: 'https://repo-company-games.pages.dev' }, remote ? { manifestURL: 'https://repo-company-games.pages.dev/' + id + '/manifest.json' } : { developmentRoot: path.join(directory, 'payload') });
  return { raw, sha256: hash(bytes) };
}
function identity(raw) {
  return JSON.stringify({ schemaVersion: raw.schemaVersion, gameId: raw.gameId, version: raw.version, entry: raw.entry, files: raw.files.map(({ path, size, sha256 }) => ({ path, size, sha256: sha256.toLowerCase() })).sort((a, b) => a.path.localeCompare(b.path)) });
}
function verifyReceipt(report, id, release, manifest) {
  check(report?.gameId === id && report.version === manifest.raw.version && path.resolve(report.release) === release, 'Parity receipt belongs to a different release: ' + id);
  check(report.manifestSha256 === manifest.sha256 && !report.sourceAudit, 'Parity receipt must bind this exact manifest and a fresh live audit: ' + id);
  const files = new Map(manifest.raw.files.map(file => [file.path, file])), seen = new Set();
  check(Array.isArray(report.files) && report.files.length === files.size, 'Parity receipt must cover every package file: ' + id);
  for (const row of report.files) {
    const file = files.get(row.path);
    check(file && !seen.has(row.path), 'Parity receipt has an unknown or duplicate file: ' + id);
    seen.add(row.path);
    check(row.equal === true && row.manifestIntact === true && !row.error && row.status === 200, 'Published game differs from installed content: ' + id + '/' + row.path);
    check(row.manifestSha256 === file.sha256 && row.installedSha256 === file.sha256 && row.manifestBytes === file.size && row.installedBytes === file.size, 'Parity receipt file hash/size mismatch: ' + id + '/' + row.path);
    check(typeof row.sourceURL === 'string' && /^[a-f0-9]{64}$/.test(row.liveSha256) && Number.isSafeInteger(row.liveBytes) && row.liveBytes >= 0, 'Parity receipt lacks original URL/hash evidence: ' + id + '/' + row.path);
    const source = new URL(row.sourceURL);
    check(source.protocol === 'https:' && !source.username && !source.password && !source.hash, 'Parity receipt source is not trusted HTTPS.');
    check(source.origin === `https://${id}.repocompany.uk` || source.origin === 'https://repocompany.uk' && (source.pathname.startsWith('/game-integrations/' + id + '/') || id === 'manager' && source.pathname === '/vendor/supabase.js'), 'Parity receipt source is outside the published game: ' + row.sourceURL);
  }
  check(report.summary?.equal === files.size && !report.summary.different?.length && !report.summary.errors?.length, 'Parity audit did not pass every file: ' + id);
}
async function deployStatic({ output }) {
  // Execute the installed CLI directly with Node: no shell interpolation and no
  // ambient website Functions picked up from the RepoCompany working directory.
  const wrangler = path.join(REPO, 'node_modules/wrangler/bin/wrangler.js');
  await assertPlainPath(wrangler);
  return promisify(execFile)(process.execPath, [wrangler, 'pages', 'deploy', '.', '--project-name', 'repo-company-games', '--branch', 'main'], { cwd: output, windowsHide: true, shell: false, maxBuffer: 16 * 1024 * 1024 });
}
async function publishGameRelease({ output, auditOutput, base, games, deploy = false, onProgress = () => {} } = {}, { verifyImpl = verifyGameParity, prepareImpl = prepareReleaseFeed, deployImpl = deployStatic } = {}) {
  check(typeof output === 'string' && typeof auditOutput === 'string', 'Provide fresh --output and --audit-output directories.');
  output = path.resolve(output); auditOutput = path.resolve(auditOutput); base = base && path.resolve(base);
  check(!overlap(output, REPO), 'Static deployment staging must be outside the website checkout.');
  check(!overlap(output, auditOutput), 'Audit evidence must be outside static deployment staging.');
  check(games && Object.keys(games).length === 3 && Object.keys(GAMES).every(id => typeof games[id] === 'string' && games[id]), 'Provide all three --game id=reviewed-package-directory arguments.');
  const releases = Object.fromEntries(Object.entries(games).map(([id, directory]) => [id, path.resolve(directory)]));
  for (const directory of [base, ...Object.values(releases)].filter(Boolean)) {
    check(!overlap(output, directory) && !overlap(auditOutput, directory), 'Outputs must not overlap source releases or the previous feed.');
  }
  await assertPlainPath(output, true); await assertPlainPath(auditOutput, true);
  check(!await exists(output) && !await exists(auditOutput), 'Use new output and audit directories; existing evidence is never overwritten.');
  const packages = new Map();
  for (const id of Object.keys(GAMES)) packages.set(id, await manifestAt(releases[id], id));
  await fs.mkdir(auditOutput, { recursive: true });
  const receipts = [], replacements = {};
  for (const id of Object.keys(GAMES)) {
    onProgress({ stage: 'live-parity', gameId: id });
    const report = await verifyImpl({ release: releases[id], output: path.join(auditOutput, id), concurrency: 16, onProgress });
    verifyReceipt(report, id, releases[id], packages.get(id));
    receipts.push({ gameId: id, version: report.version, manifestSha256: report.manifestSha256, report: path.join(auditOutput, id, 'report.json'), completedAt: report.completedAt, verifiedFiles: report.files.length });
  }
  // Do not let a package/manifest edited during another game's audit slip into
  // the stage under an earlier successful receipt. The builder rehashes bytes.
  for (const id of Object.keys(GAMES)) {
    const current = await manifestAt(releases[id], id);
    check(current.sha256 === packages.get(id).sha256, 'Release manifest changed during the parity gate: ' + id);
    if (!base || identity((await manifestAt(path.join(base, id), id, true)).raw) !== identity(current.raw)) replacements[id] = releases[id];
  }
  check(!base || Object.keys(replacements).length, 'All reviewed games match the base feed; there is no new release to publish.');
  onProgress({ stage: 'immutable-staging', games: Object.keys(replacements) });
  const staged = await prepareImpl({ output, base, replacements });
  for (const id of Object.keys(GAMES)) check(identity((await manifestAt(path.join(output, id), id, true)).raw) === identity(packages.get(id).raw), 'Staged feed does not match the parity-verified package: ' + id);
  const evidence = { schemaVersion: 1, verifiedAt: new Date().toISOString(), output, base: base || null, games: receipts, replacements: Object.keys(replacements), staged, deployed: false };
  await fs.writeFile(path.join(auditOutput, 'release-gate.json'), JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx' });
  if (deploy) {
    onProgress({ stage: 'deploying-static-feed', output });
    const result = await deployImpl({ output }); evidence.deployed = true;
    evidence.deploymentOutput = result?.stdout || ''; evidence.deploymentWarnings = result?.stderr || '';
    await fs.writeFile(path.join(auditOutput, 'deployment.json'), JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx' });
  }
  return evidence;
}
function parseArgs(args) {
  const options = { games: {} };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]; if (flag === '--deploy') { check(!options.deploy, 'Duplicate --deploy flag.'); options.deploy = true; continue; }
    const value = args[++i]; check(value && !value.startsWith('--'), 'Incomplete publication option: ' + flag);
    if (['--output', '--audit-output', '--base'].includes(flag)) { const key = flag === '--audit-output' ? 'auditOutput' : flag.slice(2); check(!options[key], 'Duplicate publication option: ' + flag); options[key] = value; }
    else if (flag === '--game') { const match = /^(morogue|moratales|manager)=(.+)$/.exec(value); check(match && !Object.hasOwn(options.games, match[1]), 'Provide each supported --game exactly once.'); options.games[match[1]] = match[2]; }
    else throw Error('Unknown publication option: ' + flag);
  }
  return options;
}
if (require.main === module) {
  let last = 0;
  Promise.resolve().then(() => publishGameRelease({ ...parseArgs(process.argv.slice(2)), onProgress: value => { if (Date.now() - last > 10000 || value.stage) { last = Date.now(); process.stdout.write(JSON.stringify(value) + '\n'); } } })).then(result => process.stdout.write(JSON.stringify(result, null, 2) + '\n')).catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}
module.exports = { publishGameRelease, parseArgs, verifyReceipt };
