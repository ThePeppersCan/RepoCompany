'use strict';

// This builds a separate, immutable launcher payload. It never rewrites the game
// checkout or publishes anything. Dry-run is the default; pass --write to build.
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');
const { assertPlainPath } = require('../lib/library.cjs');
const { validatePath, validateVersion, validateManifest, within } = require('../lib/manifest.cjs');

const REPO = path.resolve(__dirname, '../..');
const ENTRY = 'interface/vampire-survivor/index.html';
const ROOTS = ['interface/vampire-survivor', 'assets/morogue', 'assets/vampire-survivor'];
const SINGLE_FILES = ['interface/arrival-character.js', 'interface/town-ui-font.js'];

async function walk(directory, prefix = '') {
  await assertPlainPath(directory);
  const output = [];
  for (const item of await fsp.readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${item.name}` : item.name;
    validatePath(relative);
    if (item.isSymbolicLink()) throw new Error('Release sources cannot include linked files.');
    if (item.isDirectory()) output.push(...await walk(path.join(directory, item.name), relative));
    else if (item.isFile()) output.push(relative);
    else throw new Error('Unsupported release source type.');
  }
  return output;
}

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function prepareMorogue({ source, output = path.join(REPO, 'desktop/releases/morogue'), version = '0.1.0-dev', write = false, baseUrl } = {}) {
  if (!source) throw new Error('Pass --source with the existing dist-web folder.');
  source = path.resolve(source); output = path.resolve(output);
  validateVersion(version); await assertPlainPath(source);
  if (output === source || within(source, output) || within(output, source)) throw new Error('Release output must be separate from the game source.');
  const files = new Map();
  for (const prefix of ROOTS) for (const relative of await walk(path.join(source, prefix))) files.set(`${prefix}/${relative}`, { source: path.join(source, prefix, relative) });
  for (const relative of SINGLE_FILES) files.set(relative, { source: path.join(source, relative) });
  for (const filename of await fsp.readdir(path.join(source, 'assets/branding'))) if (/^morogue-[a-z0-9-]+\.png$/.test(filename)) files.set(`assets/branding/${filename}`, { source: path.join(source, 'assets/branding', filename) });
  for (const filename of ['game.js', 'builds.js']) files.set(`interface/vampire-survivor/${filename}`, { source: path.join(REPO, 'game-integrations/morogue', filename) });
  files.set('launcher/achievement-runtime.js', { source: path.join(REPO, 'game-integrations/morogue/achievement-runtime.js') });
  let html = await fsp.readFile(path.join(source, ENTRY), 'utf8');
  // The native protocol injects the bundled achievement runtime at the account
  // origin; remove older online runtime tags to avoid double observation hooks.
  html = html.replace(/<script\b[^>]*\bsrc=["'][^"']*(?:game-integrations\/morogue\/achievement-runtime\.js|achievement-adapter-morogue\.js)[^"']*["'][^>]*>\s*<\/script>/gi, '');
  for (const filename of ['game.js', 'builds.js']) {
    const escaped = filename.replace('.', '\\.');
    html = html.replace(new RegExp(`https://repocompany\\.uk/game-integrations/morogue/${escaped}(?:\\?[^"']*)?`, 'g'), `interface/vampire-survivor/${filename}`);
  }
  if (!html.includes('interface/vampire-survivor/app.js')) throw new Error('Morogue entry structure changed; review native integration before packaging.');
  files.set(ENTRY, { buffer: Buffer.from(html) });

  // Validate complete literal local references. Dynamic asset families are
  // included as whole folders above; URLs for account APIs stay online.
  const missing = new Set();
  for (const [relative, file] of files) {
    if (!/\.(js|css|html|webmanifest)$/.test(relative)) continue;
    const text = file.buffer ? file.buffer.toString('utf8') : await fsp.readFile(file.source, 'utf8');
    for (const match of text.matchAll(/(?:["'`(])(?:\.\.\/)*(?<asset>(?:assets|interface)\/[A-Za-z0-9_./-]+\.[a-z0-9]{2,12})(?=["'`)\s?])/g)) {
      const asset = match.groups.asset;
      if (!files.has(asset)) missing.add(asset);
    }
  }
  if (missing.size) throw new Error('Missing Morogue dependencies: ' + [...missing].join(', '));

  const manifest = { schemaVersion: 1, gameId: 'morogue', version, entry: ENTRY, ...(baseUrl ? { baseUrl } : {}), files: [] };
  for (const [relative, file] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    validatePath(relative);
    if (file.source) await assertPlainPath(file.source);
    const size = file.buffer ? file.buffer.length : (await fsp.stat(file.source)).size;
    const digest = file.buffer ? crypto.createHash('sha256').update(file.buffer).digest('hex') : await sha256(file.source);
    manifest.files.push({ path: relative, size, sha256: digest });
  }
  validateManifest(manifest, { id: 'morogue', entry: ENTRY, origin: 'https://morogue.repocompany.uk' }, baseUrl ? { manifestURL: new URL('manifest.json', baseUrl).href } : { developmentRoot: path.join(output, 'payload') });
  const report = { gameId: 'morogue', version, fileCount: files.size, bytes: manifest.files.reduce((sum, file) => sum + file.size, 0), source, output, written: write, entry: ENTRY, overlays: ['game.js', 'builds.js', 'achievement-runtime.js'], developmentOnly: !baseUrl };
  if (write) {
    await assertPlainPath(output, true);
    // Never overwrite a prepared release. Select a new output/version instead.
    await fsp.mkdir(output, { recursive: true });
    const lock = await fsp.open(path.join(output, '.preparing'), 'wx');
    try {
      try { await fsp.access(path.join(output, 'manifest.json')); throw new Error('Release already exists; use a fresh --output directory.'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      for (const [relative, file] of files) {
        const destination = path.join(output, 'payload', ...relative.split('/'));
        await assertPlainPath(path.dirname(destination), true);
        await fsp.mkdir(path.dirname(destination), { recursive: true });
        if (file.buffer) await fsp.writeFile(destination, file.buffer, { flag: 'wx' });
        else await fsp.copyFile(file.source, destination, fs.constants.COPYFILE_EXCL);
      }
      // Recheck copied files, so a source edited during preparation cannot
      // produce a manifest whose hashes disagree with the payload.
      for (const file of manifest.files) if (await sha256(path.join(output, 'payload', file.path)) !== file.sha256) throw new Error('A source changed while packaging; use a fresh output and retry.');
      await fsp.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
      await fsp.writeFile(path.join(output, 'package-report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    } finally { await lock.close(); await fsp.unlink(path.join(output, '.preparing')); }
  }
  return report;
}

if (require.main === module) {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--write') options.write = true;
    else if (['--source', '--output', '--version', '--base-url'].includes(arg) && args[i + 1]) options[arg === '--base-url' ? 'baseUrl' : arg.slice(2)] = args[++i];
    else throw new Error('Unknown or incomplete preparation option: ' + arg);
  }
  prepareMorogue(options).then(report => process.stdout.write(JSON.stringify(report, null, 2) + '\n')).catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}

module.exports = { prepareMorogue };
