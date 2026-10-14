'use strict';

// Build a separate, immutable copy of the published Manager game. The game
// checkout, its existing browser careers, and its online services are untouched.
// A dry run is the default. --write is required to create a release.
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');
const { assertPlainPath } = require('../lib/library.cjs');
const { validatePath, validateVersion, validateManifest, within } = require('../lib/manifest.cjs');

const REPO = path.resolve(__dirname, '../..');
const ENTRY = 'index.html';
const ASSET_ROOTS = ['assets', 'badge_pack', 'data', 'vendor'];
const OVERLAYS = ['app.js', 'career-bootstrap.js', 'career-expansion.js', 'velmora-quidditch-engine.js'];
const EXCLUDED_DIRS = new Set(['assets/manager/qa', 'assets/manager/tools', 'assets/manager/contact-sheets']);
const SUPABASE_VERSION = '2.116.0';
const STATIC_EXTENSION = /\.(?:js|css|png|webp|jpg|jpeg|svg|gif|ico|json|mp3|wav|ogg|mp4|woff2?|ttf|otf|csv|txt|md)$/i;

function excludeFile(relative) {
  const name = path.posix.basename(relative);
  return /(?:^|[-.])validation(?:[-.]|$)/i.test(name) ||
    /^(?:IMPLEMENTATION_PROMPT\.md|SHA256SUMS\.txt)$/i.test(name) ||
    /\.(?:zip|cjs|py|map)$/i.test(name);
}

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function walk(directory, prefix, excluded) {
  await assertPlainPath(directory);
  const files = [];
  for (const item of await fsp.readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}/${item.name}`;
    validatePath(relative);
    if (item.isSymbolicLink()) throw new Error('Release sources cannot include linked files.');
    if (item.isDirectory()) {
      if (EXCLUDED_DIRS.has(relative)) excluded.push(relative + '/');
      else files.push(...await walk(path.join(directory, item.name), relative, excluded));
    } else if (item.isFile()) {
      if (excludeFile(relative)) { excluded.push(relative); continue; }
      if (!STATIC_EXTENSION.test(relative) && relative !== 'vendor/PAKO_LICENSE') throw new Error('Review unexpected Manager asset before packaging: ' + relative);
      files.push(relative);
    } else throw new Error('Unsupported release source type.');
  }
  return files;
}

function rewriteIntegrationURLs(text) {
  return text.replace(/https:\/\/repocompany\.uk\/game-integrations\/manager\/(app|career-bootstrap|career-expansion|velmora-quidditch-engine)\.js(?:\?[^\s"'`<>]*)?/g, '$1.js');
}

function nativeRuntime(filename, source) {
  source = rewriteIntegrationURLs(source);
  if (filename === 'career-bootstrap.js') {
    return `(async function(){\n  if(!window.REPO_MANAGER_LAUNCHER)throw new Error('Open Manager from your Repo Company library.');\n  await window.REPO_MANAGER_LAUNCHER.bootstrap();\n  const script=document.createElement('script');script.src='app.js';document.body.appendChild(script);\n})().catch(error=>{console.error('[Manager launcher] Startup failed',error);});\n`;
  }
  if (filename === 'app.js') {
    const marker = '  window.VELMORA_MANAGER_DEBUG={';
    if (!source.includes(marker) || !source.includes('async function saveCareerStateDurable()')) throw new Error('Manager career save hook changed; review before packaging.');
    source = source.replace(marker, `  window.REPO_MANAGER_CAREER=Object.freeze({save:async()=>{\n    if(careerHasStarted()&&!await saveCareerStateDurable())throw new Error('Career save failed. Keep Manager open and retry.');\n    await window.VelmoraCareerStore?.flush?.();\n  }});\n` + marker);
  }
  if (filename === 'velmora-quidditch-engine.js') {
    const marker = '  function catchUpTo(targetSeconds,maxSteps=36000,maxWorkMs=Infinity){';
    const api = 'window.VelmoraQuidditchEngine={';
    if (!source.includes(marker) || !source.includes(api)) throw new Error('Manager match pause hook changed; review before packaging.');
    source = source.replace(marker, marker + '\n    if(window.REPO_MANAGER_LAUNCHER?.paused){matchdayRebaseClock();return;}');
    source = source.replace(api, api + 'rebaseLauncherClock:matchdayRebaseClock,');
  }
  return source;
}

async function auditDependencies(files, { baselineRoot } = {}) {
  const missing = new Map(), remote = new Set();
  let literalReferences = 0;
  function inspect(raw, from, relativeToFile = false) {
    const value = raw.trim();
    if (!value || value.startsWith('#') || value.startsWith('%23') || value.startsWith('data:') || value.startsWith('blob:') || value.includes('${')) return;
    if (/^(?:https?:)?\/\//.test(value)) { remote.add(value); return; }
    if (/^[a-z]+:/i.test(value)) return;
    const pathname = value.split(/[?#]/)[0];
    const resolved = pathname.startsWith('/') ? pathname.slice(1) : path.posix.normalize(path.posix.join(relativeToFile ? path.posix.dirname(from) : '', pathname));
    literalReferences++;
    if (!files.has(resolved)) missing.set(`${from} -> ${resolved}`, { from, path: resolved, literal: pathname });
  }
  for (const [relative, file] of files) {
    if (!/\.(?:html|js|css|json)$/.test(relative) || relative === 'vendor/supabase.js' || relative === 'launcher/achievement-runtime.js') continue;
    const source = file.buffer ? file.buffer.toString('utf8') : await fsp.readFile(file.source, 'utf8');
    if (/\.html$/.test(relative)) for (const match of source.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/g)) inspect(match[1], relative, true);
    if (/\.(?:css|html)$/.test(relative)) for (const match of source.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/g)) inspect(match[1], relative, true);
    if (/\.(?:js|json)$/.test(relative)) for (const match of source.matchAll(/["'`]((?:\.?\/?(?:assets|data|badge_pack)\/)[^"'`\r\n<>]*?\.(?:png|webp|jpg|jpeg|svg|gif|ico|json|mp3|wav|ogg|mp4|woff2?|ttf|otf|js|css))(?:\?[^"'`]*)?["'`]/g)) inspect(match[1], relative);
  }
  // The manager renderer builds URLs from this manifest at runtime. Include
  // every mask, alternate face and thumbnail, not only the visible defaults.
  const manager = files.get('assets/manager/manager-assets.json');
  if (manager) {
    const data = JSON.parse(await fsp.readFile(manager.source, 'utf8'));
    function visit(value) {
      if (typeof value === 'string' && /\.(?:png|webp|jpg)$/i.test(value) && value.includes('/')) inspect(value, 'assets/manager/manager-assets.json', true);
      else if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') Object.values(value).forEach(visit);
    }
    visit(data);
  }
  const publishedMissingReferences = [], requiredMissing = [];
  for (const [description, item] of missing) {
    // The published source already contains optional/fallback artwork entries
    // with no matching asset. Record those for native QA, but do not turn them
    // into silent new regressions. Entry resources, code, fonts, and manifests
    // are always required; only a literal already in the base build qualifies.
    let known = false;
    if (baselineRoot && /\.(?:js|css)$/.test(item.from) && /\.(?:png|webp|jpg|jpeg|svg|mp3|wav|ogg)$/.test(item.path)) {
      try {
        const original = await fsp.readFile(path.join(baselineRoot, item.from), 'utf8');
        known = original.includes(item.literal) && !fs.existsSync(path.join(baselineRoot, item.path));
      } catch (_) {}
    }
    (known ? publishedMissingReferences : requiredMissing).push(description);
  }
  if (requiredMissing.length) throw new Error('Missing Manager dependencies:\n' + requiredMissing.sort().join('\n'));
  return { literalReferences, remoteReferences: [...remote].sort(), publishedMissingReferences: publishedMissingReferences.sort() };
}

async function prepareManager({ source, repoSource = REPO, output = path.join(REPO, 'desktop/releases/manager'), version = '0.1.0-preview.1', write = false, baseUrl } = {}) {
  if (!source) throw new Error('Pass --source with the published velmora-manager-web/dist folder.');
  source = path.resolve(source); repoSource = path.resolve(repoSource); output = path.resolve(output);
  validateVersion(version);
  await assertPlainPath(source); await assertPlainPath(repoSource);
  for (const input of [source, repoSource]) if (output === input || within(output, input)) throw new Error('Release output cannot contain a source checkout.');
  if (within(source, output)) throw new Error('Release output must be separate from the game source.');
  const files = new Map(), excluded = [];
  for (const entry of await fsp.readdir(source, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Release sources cannot include linked files.');
    if (entry.isFile() && (entry.name === ENTRY || /\.(?:js|css)$/.test(entry.name))) {
      if (/(?:^|[.-])(?:test|spec|report|capture)(?:[.-]|$)/i.test(entry.name)) throw new Error('Unexpected development file in published Manager runtime: ' + entry.name);
      files.set(entry.name, { source: path.join(source, entry.name) });
    }
  }
  for (const prefix of ASSET_ROOTS) for (const relative of await walk(path.join(source, prefix), prefix, excluded)) files.set(relative, { source: path.join(source, ...relative.split('/')) });
  const integrations = path.join(repoSource, 'game-integrations/manager');
  for (const filename of OVERLAYS) {
    const file = path.join(integrations, filename); await assertPlainPath(file);
    files.set(filename, { buffer: Buffer.from(nativeRuntime(filename, await fsp.readFile(file, 'utf8'))) });
  }
  files.set('launcher/achievement-runtime.js', { source: path.join(integrations, 'achievement-runtime.js') });
  const sdk = path.join(repoSource, 'vendor/supabase.js');
  await assertPlainPath(sdk);
  const sdkText = await fsp.readFile(sdk, 'utf8');
  if (!sdkText.slice(0,1000).includes(`@supabase/supabase-js@${SUPABASE_VERSION}/`)) throw new Error('Bundled Supabase SDK must match the published Manager version.');
  files.set('vendor/supabase.js', { source: sdk });

  // The published player-setup stylesheet names a background that is also 404
  // on the live site. Reuse its existing title artwork; do not ship a broken
  // startup image request or introduce artwork from the unpublished game tree.
  const playerCSS = await fsp.readFile(path.join(source, 'player-career.css'), 'utf8');
  const absentBackground = 'assets/ui-v2/main-menu-bg.webp';
  if (playerCSS.split(absentBackground).length !== 2 || !files.has('assets/ui-v2/main-menu-clean-v2.png')) throw new Error('Review the published Manager player-setup background before packaging.');
  files.set('player-career.css', { buffer: Buffer.from(playerCSS.replace(absentBackground, 'assets/ui-v2/main-menu-clean-v2.png')) });

  let html = rewriteIntegrationURLs(await fsp.readFile(path.join(source, ENTRY), 'utf8'));
  if (!/<script\b[^>]*src=["']career-bootstrap\.js(?:\?[^"']*)?["']/.test(html)) throw new Error('Manager entry structure changed; review native integration before packaging.');
  const sdkURL = `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@${SUPABASE_VERSION}`;
  if (!html.includes(sdkURL)) throw new Error('Manager SDK reference changed; review before packaging.');
  html = html.replace(sdkURL, 'vendor/supabase.js');
  // Native protocol injects the bundled achievement observer at the original
  // account origin; an older remote observer must not be loaded a second time.
  html = html.replace(/<script\b[^>]*\bsrc=["'][^"']*(?:game-integrations\/manager\/achievement-runtime\.js|game-achievements-client\.js)[^"']*["'][^>]*>\s*<\/script>/gi, '');
  files.set(ENTRY, { buffer: Buffer.from(html) });
  const dependencies = await auditDependencies(files, { baselineRoot: source });
  const manifest = { schemaVersion: 1, gameId: 'manager', version, entry: ENTRY, ...(baseUrl ? { baseUrl } : {}), files: [] };
  for (const [relative, file] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    validatePath(relative);
    if (file.source) await assertPlainPath(file.source);
    const size = file.buffer ? file.buffer.length : (await fsp.stat(file.source)).size;
    const digest = file.buffer ? crypto.createHash('sha256').update(file.buffer).digest('hex') : await sha256(file.source);
    manifest.files.push({ path: relative, size, sha256: digest });
  }
  validateManifest(manifest, { id: 'manager', entry: ENTRY, origin: 'https://manager.repocompany.uk', approvedOrigins: ['https://repocompany.uk'] }, baseUrl ? { manifestURL: new URL('manifest.json', baseUrl).href } : { developmentRoot: path.join(output, 'payload') });
  const report = { gameId: 'manager', version, fileCount: files.size, bytes: manifest.files.reduce((sum, file) => sum + file.size, 0), source, repoSource, output, written: write, entry: ENTRY, overlays: OVERLAYS.concat('launcher/achievement-runtime.js'), corrections: ['player-career.css: missing main-menu-bg.webp uses existing main-menu-clean-v2.png'], bundledSupabaseVersion: SUPABASE_VERSION, excluded: excluded.sort(), dependencies, developmentOnly: !baseUrl };
  if (write) {
    await assertPlainPath(output, true);
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
    else if (['--source', '--repo-source', '--output', '--version', '--base-url'].includes(arg) && args[i + 1]) options[arg === '--base-url' ? 'baseUrl' : arg === '--repo-source' ? 'repoSource' : arg.slice(2)] = args[++i];
    else throw new Error('Unknown or incomplete preparation option: ' + arg);
  }
  prepareManager(options).then(report => process.stdout.write(JSON.stringify(report, null, 2) + '\n')).catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}

module.exports = { prepareManager, auditDependencies, rewriteIntegrationURLs, nativeRuntime };
