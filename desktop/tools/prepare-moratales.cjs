'use strict';

// Package the existing web build plus reviewed live overlays. Never run the
// game build here: that checkout can contain unrelated, unpublished changes.
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');
const { assertPlainPath } = require('../lib/library.cjs');
const { validatePath, validateVersion, validateManifest, within } = require('../lib/manifest.cjs');

const REPO = path.resolve(__dirname, '../..');
const ENTRY = 'preview.html';
const ORIGIN = 'https://moratales.repocompany.uk';
const RELEASE_ORIGIN = 'https://repo-company-games.pages.dev';
const ROOTS = ['assets', 'interface', 'maps', 'embedded', 'coop'];
const EXCLUDED = ['assets/morogue/', 'assets/vampire-survivor/', 'assets/local-preview/', 'interface/vampire-survivor/'];
const TEXT = /\.(?:js|json|html|css|webmanifest|svg|txt)$/i;
const STATIC = /\.(?:html|js|css|json|webmanifest|ico|png|jpg|jpeg|webp|gif|mp3|wav|ogg|mp4|woff2?|ttf|svg|txt)$/i;
const ACHIEVEMENTS = ['town-cafe-day.js', 'town-cafe-service.js', 'town-kitchen.js', 'town-pleasure.js', 'town-roastery.js'];
const CHARACTERS = ['interface/vampire-survivor/characters.js', 'interface/vampire-survivor/character-bridge.html', 'interface/vampire-survivor/character-bridge.js', 'interface/moratales-character-link.js', 'interface/moratales-character-status.js', 'interface/moratales-account-characters.js'];
const CHARACTER_SCRIPTS = [CHARACTERS[0], ...CHARACTERS.slice(3)];
const KNOWN_NON_ASSETS = new Map([
  ['interface/local-image-source.js|assets/local-preview/index.js', 'File-protocol preview only; native games use HTTPS.'],
  ['interface/main-menu.js|interface/vampire-survivor/index.html', 'Separate Morogue game; the launcher handles this navigation.'],
  ['launcher/achievement-runtime.js|assets/achievements/catalogue.json', 'Achievement metadata is fetched from the Repo account origin.']
]);

async function walk(directory, prefix = '') {
  await assertPlainPath(directory);
  const result = [];
  for (const item of await fsp.readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${item.name}` : item.name;
    validatePath(relative);
    if (item.isSymbolicLink()) throw new Error('Release sources cannot include linked files.');
    if (item.isDirectory()) result.push(...await walk(path.join(directory, item.name), relative));
    else if (item.isFile()) result.push(relative);
    else throw new Error('Unsupported release source type.');
  }
  return result;
}

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  for await (const bytes of fs.createReadStream(file)) hash.update(bytes);
  return hash.digest('hex');
}

function transformHTML(html) {
  if (!/<\/body>/i.test(html) || !html.includes('interface/town-explorer.js')) throw new Error('Moratales entry structure changed; review the native integration.');
  html = html.replace(/<script\b[^>]*\bsrc=["'][^"']*(?:game-integrations\/moratales\/achievement-runtime\.js|achievement-adapter-moratales\.js)[^"']*["'][^>]*>\s*<\/script>/gi, '');
  for (const filename of ACHIEVEMENTS) {
    const escaped = filename.replaceAll('.', '\\.');
    html = html.replace(new RegExp(`https://(?:www\\.)?repocompany\\.uk/game-integrations/moratales/${escaped}(?:\\?[^"']*)?`, 'g'), `interface/${filename}`);
    if (!html.includes(`interface/${filename}`)) throw new Error(`Moratales entry is missing the reviewed ${filename} integration.`);
  }
  // Character sync is the same narrow overlay published by the game Worker.
  // Remove previous copies before appending, preserving exactly one ordered set.
  for (const filename of CHARACTER_SCRIPTS) {
    const escaped = filename.replaceAll('.', '\\.');
    html = html.replace(new RegExp(`<script\\b[^>]*\\bsrc=["']/?${escaped}(?:\\?[^"']*)?["'][^>]*>\\s*</script>`, 'gi'), '');
  }
  return html.replace(/<\/body>/i, CHARACTER_SCRIPTS.map(file => `<script src="/${file}"></script>`).join('') + '</body>');
}

async function readText(file) { return file.buffer ? file.buffer.toString('utf8') : fsp.readFile(file.source, 'utf8'); }

function replaceOnce(text, marker, replacement, label) {
  if (text.split(marker).length !== 2) throw new Error(`Unrecognised prepared ${label}; review native save hooks before packaging.`);
  return text.replace(marker, replacement);
}

function nativeSaveHooks(relative, text) {
  if (relative === 'interface/town-explorer.js') return replaceOnce(text, 'const api={coopNotice:',
    'const api={nativeSave(){if(root.MORATALES_COOP_ACTIVE||root.MORATALES_MENU_OPEN||!life)return;commitSlot();},nativePause(){clear();townAudio.pause();},coopNotice:', relative);
  if (relative === 'coop/worker.js') return replaceOnce(text, 'V.type==="save"&&(Do=!0,cs())',
    'V.type==="save"&&(Do=!0,cs()),V.type==="launcher-save"&&(()=>{const save=Qt?.checkpoint();if(!save){postMessage({type:"launcher-save-result",request:V.request,error:"Finish the current shared action before saving."});return;}postMessage({type:"checkpoint",save,launcherRequest:V.request});postMessage({type:"launcher-save-result",request:V.request});})()', relative);
  if (relative !== 'coop/client.js') return text;
  text = replaceOnce(text, 'function send(m){', 'let nativeSavePending=null,nativeSaveSequence=0,nativeSaveFailure=null;\n function send(m){', relative);
  text = replaceOnce(text, 'worker.onmessage=({data:d})=>{', 'worker.onmessage=({data:d})=>{\n    if(d.type===\'launcher-save-result\'&&nativeSavePending?.request===d.request){const pending=nativeSavePending;nativeSavePending=null;clearTimeout(pending.timer);const failure=d.error||nativeSaveFailure?.message;if(failure)pending.reject(Error(failure));else pending.resolve();}', relative);
  text = replaceOnce(text, "if(d.type==='checkpoint'){try{if(lastPlayingLobby){", "if(d.type==='checkpoint'){if(d.launcherRequest&&(!nativeSavePending||nativeSavePending.request!==d.launcherRequest||nativeSavePending.worker!==worker||nativeSavePending.slot!==slot||nativeSavePending.epoch!==epoch)){nativeSaveFailure=Error('The shared adventure changed while saving. Keep this window open.');return;}try{if(lastPlayingLobby){", relative);
  text = replaceOnce(text, "}catch(e){error('Could not save the shared adventure: '+e.message);}}", "}catch(e){nativeSaveFailure=e;error('Could not save the shared adventure: '+e.message);}}", relative);
  text = replaceOnce(text, 'root.MORATALES_COOP={open,frame,command,', `function nativePause(){keys.clear();worker?.postMessage({type:'playing',playing:false});send({type:'pause'});}
 function nativeSave(){
  if(!root.MORATALES_COOP_ACTIVE||!isHost())return Promise.resolve();
  if(nativeSavePending)return nativeSavePending.promise;
  if(!worker||!lastPlayingLobby)return Promise.reject(Error('The shared adventure is not ready to save.'));
  nativeSaveFailure=null;const request=++nativeSaveSequence;let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const timer=setTimeout(()=>{if(nativeSavePending?.request===request){nativeSavePending=null;reject(Error('The shared adventure did not finish saving. Keep this window open and try again.'));}},8000);
  nativeSavePending={request,promise,resolve,reject,timer,worker,slot,epoch};try{worker.postMessage({type:'launcher-save',request});}catch(error){clearTimeout(timer);nativeSavePending=null;reject(error);}return promise;
 }
 root.MORATALES_COOP={nativePause,nativeSave,open,frame,command,`, relative);
  return text;
}

async function auditAssetClosure(files) {
  const missing = new Set(), references = new Set(), exceptions = new Map(), remoteOrigins = new Map();
  function reference(from, asset) {
    const exception = KNOWN_NON_ASSETS.get(`${from}|${asset}`);
    if (exception) { exceptions.set(asset, exception); return; }
    references.add(asset);
    if (!files.has(asset)) missing.add(`${asset} (from ${from})`);
  }
  for (const [relative, file] of files) {
    if (!TEXT.test(relative)) continue;
    const text = await readText(file);
    // Literal paths cover generated embedded blobs, maps and data-driven assets.
    // Dynamic families are kept as complete folders rather than guessed/pruned.
    for (const match of text.matchAll(/(?:["'`(])(?:\.\.\/|\.\/|\/)*(?<asset>(?:assets|interface|embedded|maps|coop)\/[A-Za-z0-9_./ -]+\.[a-z0-9]{2,12})(?=["'`)\s?])/g)) reference(relative, match.groups.asset);
    // Script and stylesheet URLs can be relative to nested bridge documents.
    if (/\.html$/i.test(relative)) for (const match of text.matchAll(/<(?:script|link|img|source|video)\b[^>]*?\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) {
      const value = match[1];
      if (/^(?:[a-z]+:|\/\/|#)/i.test(value) || value.includes('${')) continue;
      const url = new URL(value, `${ORIGIN}/${relative}`);
      const asset = decodeURIComponent(url.pathname).slice(1);
      reference(relative, asset);
    }
    for (const match of text.matchAll(/https?:\/\/[^\s"'`<>\\)]+/g)) {
      try { const origin = new URL(match[0]).origin; remoteOrigins.set(origin, (remoteOrigins.get(origin) || 0) + 1); } catch { /* Non-URL source text. */ }
    }
  }
  if (missing.size) throw new Error('Missing Moratales dependencies: ' + [...missing].sort().join(', '));
  return { literalAssetCount: references.size, missing: [], exceptions: Object.fromEntries(exceptions), remoteOrigins: Object.fromEntries([...remoteOrigins].sort()) };
}

async function verifyRelease(directory, manifest) {
  await assertPlainPath(directory);
  for (const file of manifest.files) {
    validatePath(file.path);
    const target = path.join(directory, 'payload', ...file.path.split('/'));
    await assertPlainPath(target);
    if ((await fsp.stat(target)).size !== file.size || await sha256(target) !== file.sha256) throw new Error(`Release content changed: ${file.path}. Use a fresh version; never republish this release.`);
  }
  return { gameId: manifest.gameId, version: manifest.version, verifiedFiles: manifest.files.length };
}

async function writeRelease(output, files, manifest, report) {
  await assertPlainPath(output, true);
  await fsp.mkdir(output, { recursive: true });
  const lock = await fsp.open(path.join(output, '.preparing'), 'wx');
  try {
    try { await fsp.access(path.join(output, 'manifest.json')); throw new Error('Release already exists; use a fresh --output directory and version.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    for (const [relative, file] of files) {
      validatePath(relative);
      const target = path.join(output, 'payload', ...relative.split('/'));
      await assertPlainPath(path.dirname(target), true);
      await fsp.mkdir(path.dirname(target), { recursive: true });
      if (file.buffer) await fsp.writeFile(target, file.buffer, { flag: 'wx' });
      else if (TEXT.test(relative)) await fsp.copyFile(file.source, target, fs.constants.COPYFILE_EXCL);
      // No copy fallback: silently duplicating 1.3GB could exhaust the drive.
      else await fsp.link(file.source, target);
    }
    await verifyRelease(output, manifest);
    await fsp.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    await fsp.writeFile(path.join(output, 'package-report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  } finally { await lock.close(); await fsp.unlink(path.join(output, '.preparing')); }
}

async function prepareMoratales({ source, gameRoot, output = path.join(REPO, 'desktop/releases/moratales'), version = '0.1.0-preview.1', write = false, baseUrl } = {}) {
  if (!source) throw new Error('Pass --source with the existing dist-web folder.');
  source = path.resolve(source); gameRoot = path.resolve(gameRoot || path.join(source, '..')); output = path.resolve(output);
  validateVersion(version); await assertPlainPath(source); await assertPlainPath(gameRoot);
  if (output === source || within(source, output) || within(output, source)) throw new Error('Release output must be separate from the prepared game source.');
  const files = new Map();
  for (const root of ROOTS) for (const relative of await walk(path.join(source, root))) {
    const name = `${root}/${relative}`;
    if (EXCLUDED.some(prefix => name.startsWith(prefix))) continue;
    if (!STATIC.test(name)) throw new Error('Unexpected non-static file in web build: ' + name);
    files.set(name, { source: path.join(source, root, relative) });
  }
  for (const name of ['build-info.json', 'manifest.webmanifest', 'sw.js']) files.set(name, { source: path.join(source, name) });
  const integrationManifest = JSON.parse(await fsp.readFile(path.join(REPO, 'game-integrations/manifest.json'), 'utf8'));
  for (const name of [...ACHIEVEMENTS, 'achievement-runtime.js']) {
    const original = path.join(REPO, 'game-integrations/moratales', name);
    const expected = integrationManifest.hashes[`game-integrations/moratales/${name}`];
    if (!expected || !(await sha256(original)).startsWith(expected)) throw new Error('Reviewed achievement overlay hash mismatch: ' + name);
    files.set(name === 'achievement-runtime.js' ? 'launcher/achievement-runtime.js' : `interface/${name}`, { source: original });
  }
  for (const name of CHARACTERS) files.set(name, { source: path.join(gameRoot, ...name.split('/')) });
  for (const name of ['interface/town-explorer.js', 'coop/client.js', 'coop/worker.js']) files.set(name, { buffer: Buffer.from(nativeSaveHooks(name, await fsp.readFile(path.join(source, name), 'utf8'))) });
  files.set(ENTRY, { buffer: Buffer.from(transformHTML(await fsp.readFile(path.join(source, ENTRY), 'utf8'))) });
  const audit = await auditAssetClosure(files);
  const manifest = { schemaVersion: 1, gameId: 'moratales', version, entry: ENTRY, ...(baseUrl ? { baseUrl } : {}), files: [] };
  let copiedBytes = 0, hardlinkedBytes = 0;
  for (const [relative, file] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    validatePath(relative); if (file.source) await assertPlainPath(file.source);
    const size = file.buffer ? file.buffer.length : (await fsp.stat(file.source)).size;
    const digest = file.buffer ? crypto.createHash('sha256').update(file.buffer).digest('hex') : await sha256(file.source);
    manifest.files.push({ path: relative, size, sha256: digest });
    if (file.buffer || TEXT.test(relative)) copiedBytes += size; else hardlinkedBytes += size;
  }
  validateManifest(manifest, { id: 'moratales', entry: ENTRY, origin: ORIGIN, approvedOrigins: [RELEASE_ORIGIN] }, baseUrl ? { manifestURL: new URL('manifest.json', baseUrl).href } : { developmentRoot: path.join(output, 'payload') });
  const report = {
    gameId: 'moratales', version, entry: ENTRY, source, output, written: write,
    fileCount: files.size, bytes: copiedBytes + hardlinkedBytes, copiedBytes, hardlinkedBytes,
    developmentOnly: !baseUrl, audit,
    overlays: [...ACHIEVEMENTS.map(name => `interface/${name}`), 'launcher/achievement-runtime.js', ...CHARACTERS],
    nativeSaveHooks: ['interface/town-explorer.js', 'coop/client.js', 'coop/worker.js'],
    nativeIntegration: { achievementRuntime: 'Serve launcher/achievement-runtime.js at the Repo account origin and inject before interface/town-explorer.js.', networkPaths: ['/api/*', '/unlock', '/gate-logo.png', '/desktop-release.json', '/downloads/*'], multiplayer: 'Preserve same-origin /api/ WebSocket routing and local coop/worker.js.', storage: 'Browser saves remain in the account-scoped native profile, outside the installation.', morogueShortcut: 'Route interface/vampire-survivor/index.html to the separate Morogue game.', serviceWorker: 'Set the native MORATALES_DESKTOP bridge before coop/client.js to suppress web service worker registration.' },
    staging: 'Binary hardlinks save local staging disk space. Run --verify immediately before upload. Never alter or republish an uploaded version; use a fresh release version.'
  };
  if (write) await writeRelease(output, files, manifest, report);
  return report;
}

if (require.main === module) {
  const args = process.argv.slice(2), options = {}; let verify;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--write') options.write = true;
    else if (arg === '--verify' && args[i + 1]) verify = path.resolve(args[++i]);
    else if (['--source', '--game-root', '--output', '--version', '--base-url'].includes(arg) && args[i + 1]) options[arg === '--base-url' ? 'baseUrl' : arg === '--game-root' ? 'gameRoot' : arg.slice(2)] = args[++i];
    else throw new Error('Unknown or incomplete preparation option: ' + arg);
  }
  const task = verify ? fsp.readFile(path.join(verify, 'manifest.json'), 'utf8').then(text => verifyRelease(verify, JSON.parse(text))) : prepareMoratales(options);
  task.then(report => process.stdout.write(JSON.stringify(report, null, 2) + '\n')).catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}

module.exports = { prepareMoratales, auditAssetClosure, transformHTML, nativeSaveHooks, verifyRelease, writeRelease };
