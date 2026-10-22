'use strict';
// Local checkouts supply filenames only. Every packaged byte originates from a
// reviewed public GET; no source build or local overlay is an authority here.
const fs = require('node:fs'), fsp = fs.promises, path = require('node:path'), crypto = require('node:crypto');
const { assertPlainPath, safeRemove } = require('../lib/library.cjs');
const { validatePath, validateVersion, validateManifest, within } = require('../lib/manifest.cjs');
const GAME = 'https://morogue.repocompany.uk', PORTAL = 'https://repocompany.uk';
const PREFIX = '/game-integrations/morogue/', ENTRY = 'interface/vampire-survivor/index.html';
const ROOTS = ['interface/vampire-survivor', 'assets/morogue', 'assets/vampire-survivor'];
const SINGLE_FILES = ['interface/arrival-character.js', 'interface/town-ui-font.js'];
const TEXT = /\.(?:js|css|html|json|webmanifest|svg)$/i, EXECUTABLE = /\.(?:js|css)$/i;
const ASSET = /\.(?:js|css|html|json|webmanifest|png|jpe?g|webp|gif|svg|ico|mp3|wav|ogg|mp4|woff2?|ttf|otf|wasm)$/i;
const MAX_FILE_BYTES = 25 * 1024 * 1024, MAX_CAPTURE_BYTES = 2 * 1024 ** 3;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function check(condition, message) { if (!condition) throw Error(message); }
function overlaps(a, b) { return path.relative(a, b) === '' || within(a, b) || within(b, a); }
async function present(file) { try { await fsp.lstat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
async function inventory(directory, prefix = '') {
  await assertPlainPath(directory); const result = [];
  for (const item of await fsp.readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? prefix + '/' + item.name : item.name; validatePath(relative);
    check(!item.isSymbolicLink(), 'Inventory includes a linked path: ' + relative);
    if (item.isDirectory()) result.push(...await inventory(path.join(directory, item.name), relative));
    else { check(item.isFile(), 'Inventory includes an unsupported file: ' + relative); result.push(relative); }
  }
  return result.sort();
}
function approved(value) {
  const url = new URL(value);
  check(url.protocol === 'https:' && !url.username && !url.password && !url.hash, 'Unsafe published resource URL: ' + value);
  check(url.origin === GAME || url.origin === PORTAL && (url.pathname.startsWith(PREFIX) || url.pathname === '/game-playtime-client.js'), 'Unexpected external game resource: ' + value);
  if (url.pathname !== '/') validatePath(decodeURIComponent(url.pathname.slice(1)));
  return url;
}
function onlineOnly(url) { return url.origin === PORTAL && url.pathname === '/game-playtime-client.js'; }
function keyOf(url) { return url.origin + url.pathname; }
function attrs(tag) { return Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)].map(match => [match[1].toLowerCase(), match[3]])); }
function htmlResources(html, base) {
  const output = [];
  for (const match of html.matchAll(/<(script|link|img|source|audio|video)\b[^>]*>/gi)) {
    const tag = match[1].toLowerCase(), attributes = attrs(match[0]);
    if (tag === 'link' && !/(?:^|\s)(?:stylesheet|icon|apple-touch-icon|manifest|preload|modulepreload)(?:\s|$)/i.test(attributes.rel || '')) continue;
    for (const name of tag === 'link' ? ['href'] : ['src', 'poster']) {
      const value = attributes[name]; if (!value || /^(?:data:|blob:|#)/i.test(value)) continue;
      output.push({ url: new URL(value, base).href, tag, attribute: name, executable: tag === 'script' || tag === 'link' && /stylesheet/i.test(attributes.rel || '') });
    }
  }
  return output;
}
function references(text, url, known) {
  const required = new Set();
  function add(value, relativeToFile = false) {
    if (!value || /[{}<>\s]/.test(value) || /^(?:data:|blob:|#)/i.test(value)) return;
    const clean = value.split(/[?#]/)[0]; if (!ASSET.test(clean)) return;
    let target;
    if (/^https?:\/\//i.test(value)) {
      if (!value.startsWith(GAME + '/') && !value.startsWith(PORTAL + PREFIX)) return; // Account/services, documentation links remain online.
      target = new URL(value);
    } else if (/^\/?(?:assets|interface|game-integrations)\//.test(value)) target = new URL(value.replace(/^\//, ''), GAME + '/');
    else if (relativeToFile || /^(?:\.\.\/)+assets\//.test(value)) target = new URL(value, url);
    else if (!value.includes('/') && /\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg|mp4|woff2?|ttf|otf)$/i.test(clean)) {
      // Media names are often joined to dynamic family roots. Every published
      // member of those reviewed families is captured by the inventory.
      const candidates = [...known.values()].filter(item => path.posix.basename(new URL(item.url).pathname) === clean);
      for (const item of candidates) if (!item.missing) required.add(item.url);
      // Concatenated extensions/suffixes (id+'.png', id+'-v4.png') are not
      // standalone filenames; their complete family is in the inventory.
      if (!candidates.length && /^[A-Za-z0-9]/.test(clean)) target = new URL(value, url);
    }
    if (target) required.add(target.href);
  }
  for (const match of text.matchAll(/(["'`])([^"'`\r\n]+)\1/g)) add(match[2]);
  // CSS URL resolution is relative to the stylesheet. JS require('./x.js') is
  // intentionally excluded: those CommonJS branches do not run in a browser.
  for (const match of text.matchAll(/\burl\(\s*["']?([^\s"')]+)["']?\s*\)/gi)) add(match[1], true);
  return required;
}
function transformText(text, { html = false, entryURL = GAME + '/' } = {}) {
  let result = text.replaceAll(PORTAL + PREFIX, PREFIX);
  if (html) {
    result = result.replace(/<script\b[^>]*\bsrc=["'][^"']*(?:achievement-runtime|game-achievements-client|achievement-adapter-morogue)\.js[^"']*["'][^>]*>\s*<\/script>/gi, '');
    result = result.replace(/(\bsrc=["'])\/game-integrations\/morogue\/app\.js(?=[?"'])/gi, '$1interface/vampire-survivor/app.js');
    // Preserve the published page's base and script order. Absolute URLs for
    // game-origin assets become explicit local paths under the same origin.
    result = result.replaceAll(GAME + '/', '/');
    check(/<script\b[^>]*src=["'](?:\/?interface\/vampire-survivor\/app\.js|\/game-integrations\/morogue\/relics-20261015\/app\.js)(?:[?"'])/i.test(result), 'Published Morogue app script is missing or changed structure.');
  }
  return result;
}
async function pool(items, operation) {
  let next = 0, failure;
  await Promise.all(Array.from({ length: Math.min(6, items.length) }, async () => {
    while (!failure && next < items.length) { const item = items[next++]; try { await operation(item); } catch (error) { failure ||= error; } }
  }));
  if (failure) throw failure;
}

async function prepareMorogue({ source, repoSource = path.resolve(__dirname, '../..'), output = path.resolve(__dirname, '../releases/morogue'), version, write = false, cacheBlobs, audit, fetchImpl = global.fetch } = {}) {
  check(source, 'Pass --source with the CURRENT Moratales source folder for filename inventory only.');
  check(version, 'Pass an explicit --version for this immutable game release.'); validateVersion(version);
  source = path.resolve(source); repoSource = path.resolve(repoSource); output = path.resolve(output); cacheBlobs = cacheBlobs && path.resolve(cacheBlobs);
  check(path.basename(source).toLowerCase() !== 'dist-web', 'Use the current source inventory, not the older dist-web build.');
  for (const input of [source, path.join(repoSource, 'game-integrations/morogue'), cacheBlobs].filter(Boolean)) check(!overlaps(output, input), 'Release output must be separate from source inventories and cache.');
  await assertPlainPath(output, true); check(!await present(output), 'Release output already exists; use a fresh directory.');
  const reviewed = audit ? JSON.parse(await fsp.readFile(audit, 'utf8')) : null;
  if (reviewed) check(reviewed.url === GAME + '/' && typeof reviewed.htmlSha256 === 'string' && Array.isArray(reviewed.rows), 'Invalid reviewed capture audit.');
  const auditHashes = new Map((reviewed?.rows || []).map(item => [item.url, item.sha256]));
  let capturedBytes = 0;
  async function get(value, optional = false) {
    const url = approved(value), response = await fetchImpl(url.href, { redirect: 'error', credentials: 'omit', cache: 'no-store', headers: { 'Accept-Encoding': 'identity' }, signal: AbortSignal.timeout(60000) });
    check(!response.url || response.url === url.href, 'Published resource redirected: ' + url.href);
    if (response.status === 404 && optional) { await response.body?.cancel(); return null; }
    check(response.status === 200 && response.body, `Published dependency returned HTTP ${response.status}: ${url.href}`);
    const chunks = []; let size = 0;
    for await (const chunk of response.body) { size += chunk.length; check(size <= MAX_FILE_BYTES, 'Published asset exceeds the static host limit: ' + url.href); chunks.push(Buffer.from(chunk)); }
    const bytes = Buffer.concat(chunks), type = response.headers.get('content-type') || '';
    if (/\.js$/i.test(url.pathname)) check(/(?:javascript|ecmascript)/i.test(type), 'Published JavaScript has an unexpected response type: ' + url.href);
    if (/\.css$/i.test(url.pathname)) check(/text\/css/i.test(type), 'Published stylesheet has an unexpected response type: ' + url.href);
    if (!/\.(?:html)$/.test(url.pathname) && url.pathname !== '/') check(!/^\s*<(?:!doctype\s+html|html)\b/i.test(bytes.subarray(0, 128).toString('utf8')), 'Published asset returned an HTML fallback: ' + url.href);
    return { bytes, sha256: hash(bytes), contentType: type };
  }
  const page = await get(GAME + '/'), html = page.bytes.toString('utf8');
  check(/<!doctype\s+html/i.test(html) && /<head\b/i.test(html), 'Published Morogue entry is not the game document.');
  if (reviewed) check(page.sha256 === reviewed.htmlSha256, 'Published HTML differs from the reviewed audit; review a new capture.');
  const base = new URL(/<base\b[^>]*href=["']([^"']+)/i.exec(html)?.[1] || './', GAME + '/');
  check(base.href === GAME + '/', 'Published Morogue base URL changed; review path resolution.');
  const ordered = htmlResources(html, base), records = new Map();
  function register(value, required, reason) {
    const url = approved(value), key = keyOf(url);
    if (url.href === GAME + '/' || url.pathname === '/' + ENTRY && url.origin === GAME) return null;
    let record = records.get(key);
    if (!record) { record = { url: url.href, variants: new Set([url.href]), required: !!required, reasons: new Set([reason]), online: onlineOnly(url), captured: false }; records.set(key, record); }
    else { record.variants.add(url.href); record.required ||= !!required; record.reasons.add(reason); }
    return record;
  }
  for (const item of ordered) register(item.url, true, 'published-html');
  if (reviewed) {
    const actual = ordered.filter(item => item.executable).map(item => item.url);
    check(JSON.stringify(actual) === JSON.stringify(reviewed.rows.map(item => item.url)), 'Published script/style order differs from the reviewed audit.');
  }
  const sourcePaths = [];
  for (const prefix of ROOTS) for (const relative of await inventory(path.join(source, prefix))) sourcePaths.push(prefix + '/' + relative);
  sourcePaths.push(...SINGLE_FILES);
  await assertPlainPath(path.join(source, 'assets/branding'));
  for (const name of await fsp.readdir(path.join(source, 'assets/branding'))) if (/^morogue-[a-z0-9-]+\.png$/.test(name)) sourcePaths.push('assets/branding/' + name);
  for (const name of sourcePaths) register(GAME + '/' + name, false, 'source-filename-inventory');
  const integrationPaths = await inventory(path.join(repoSource, 'game-integrations/morogue'));
  for (const name of integrationPaths) register(PORTAL + PREFIX + name, true, 'integration-filename-inventory');
  // Native protocol loads this at the account origin, even when an older page
  // does not contain its tag. Its bytes still come from the published endpoint.
  register(PORTAL + PREFIX + 'achievement-runtime.js', true, 'native-achievement-runtime');
  for (let round = 0; ; round++) {
    check(round < 12, 'Published dependency closure did not settle.');
    const pending = [...records.values()].filter(item => !item.captured);
    if (!pending.length) break;
    await pool(pending, async record => {
      const captured = await get(record.url, !record.required); record.captured = true;
      if (!captured) { record.missing = true; return; }
      Object.assign(record, captured); capturedBytes += captured.bytes.length;
      check(capturedBytes <= MAX_CAPTURE_BYTES, 'Published capture exceeds the bounded package budget.');
      const expected = auditHashes.get(record.url); if (expected) check(captured.sha256 === expected, 'Published resource differs from the reviewed audit: ' + record.url);
    });
    for (const record of pending) {
      // This bundle is deliberately served at the Repo account origin by the
      // native protocol. Its catalogue, bridge and notices remain online there.
      const pathname = new URL(record.url).pathname;
      if (record.missing || record.online || pathname === PREFIX + 'achievement-runtime.js' || !TEXT.test(pathname)) continue;
      // Unreferenced JSON inventory includes artist attribution/export receipts
      // naming pre-edit source files. Only linked runtime JSON declares assets.
      if (/\.json$/i.test(pathname) && !record.required) continue;
      const found = references(record.bytes.toString('utf8'), record.url, records);
      for (const url of found) {
        const dependency = register(url, true, 'literal-dependency');
        if (dependency?.missing) throw Error('Required published dependency is missing: ' + dependency.url);
      }
    }
  }
  // HTTP query labels are cache keys, not trustworthy hashes. Compare actual
  // GET bytes, including differently queried references to the same resource.
  await pool([...records.values()].filter(item => !item.missing && (EXECUTABLE.test(new URL(item.url).pathname) || item.variants.size > 1)), async record => {
    for (const url of record.variants) {
      const repeated = await get(url);
      check(repeated.sha256 === record.sha256, 'Published content changed during capture: ' + url);
      const expected = auditHashes.get(url); if (expected) check(repeated.sha256 === expected, 'Published resource differs from the reviewed audit: ' + url);
    }
  });
  check((await get(GAME + '/')).sha256 === page.sha256, 'Published HTML changed during capture.');
  const files = new Map(), receiptMap = new Map(), aliases = [], transformations = [];
  function put(name, record, transformed, alias = false) {
    validatePath(name); const bytes = transformed || record.bytes, bundledHash = hash(bytes);
    if (files.has(name)) aliases.push({ path: name, replacedOriginalURL: files.get(name).url, authoritativeURL: record.url });
    files.set(name, { bytes, sha256: bundledHash, url: record.url });
    receiptMap.set(name, { path: name, originalURL: record.url, originalSha256: record.sha256, bundledSha256: bundledHash, bytes: bytes.length, alias });
    if (bundledHash !== record.sha256) transformations.push({ path: name, kind: name === ENTRY ? 'local-paths-preserved-script-order-and-native-runtime-injection' : 'integration-URLs-to-same-origin', originalSha256: record.sha256, bundledSha256: bundledHash });
  }
  for (const record of records.values()) {
    if (record.missing || record.online) continue;
    const url = new URL(record.url), name = decodeURIComponent(url.pathname.slice(1));
    const transformed = TEXT.test(name) ? Buffer.from(transformText(record.bytes.toString('utf8'))) : null;
    put(name, record, transformed);
  }
  // Compatibility paths use the live integration bytes too. The HTML keeps
  // integration scripts in their own folder for currentScript-relative audio.
  for (const record of records.values()) {
    const url = new URL(record.url); if (record.missing || url.origin !== PORTAL || !url.pathname.startsWith(PREFIX)) continue;
    const relative = url.pathname.slice(PREFIX.length);
    if (!relative.includes('/') && relative !== 'achievement-runtime.js') put('interface/vampire-survivor/' + relative, record, TEXT.test(relative) ? Buffer.from(transformText(record.bytes.toString('utf8'))) : record.bytes, true);
    if (relative === 'achievement-runtime.js') put('launcher/achievement-runtime.js', record, record.bytes, true);
  }
  put(ENTRY, { ...page, url: GAME + '/' }, Buffer.from(transformText(html, { html: true })));
  const manifest = { schemaVersion: 1, gameId: 'morogue', version, entry: ENTRY, files: [...files].sort(([a], [b]) => a.localeCompare(b)).map(([name, file]) => ({ path: name, size: file.bytes.length, sha256: file.sha256 })) };
  validateManifest(manifest, { id: 'morogue', entry: ENTRY }, { developmentRoot: path.join(output, 'payload') });
  const report = { gameId: 'morogue', version, source, repoSource, authority: GAME + '/', capturedAt: new Date().toISOString(), htmlSha256: page.sha256, repeatedExecutableAndStyleChecks: true, entry: ENTRY, output, written: write, fileCount: files.size, bytes: manifest.files.reduce((sum, item) => sum + item.size, 0), sourceInventoryFiles: sourcePaths.length, integrationInventoryFiles: integrationPaths.length, skippedUnpublishedInventory: [...records.values()].filter(item => item.missing).map(item => item.url), onlineResources: [...records.values()].filter(item => item.online).map(item => item.url), publishedScriptOrder: ordered.filter(item => item.executable).map(item => item.url), transformations, aliases, receipts: [...receiptMap.values()], hardlinkedFiles: 0 };
  if (write) {
    const parent = path.dirname(output), stage = path.join(parent, '.morogue-capture-' + crypto.randomUUID());
    await assertPlainPath(parent, true); await fsp.mkdir(parent, { recursive: true }); let committed = false;
    try {
      await fsp.mkdir(stage); await fsp.mkdir(path.join(stage, 'payload'));
      for (const [name, file] of files) {
        const destination = path.join(stage, 'payload', ...name.split('/')); await fsp.mkdir(path.dirname(destination), { recursive: true });
        const cached = cacheBlobs && path.join(cacheBlobs, file.sha256 + '.bin');
        if (cached && await present(cached)) {
          await assertPlainPath(cached); const bytes = await fsp.readFile(cached);
          check(bytes.length === file.bytes.length && hash(bytes) === file.sha256, 'Cached content-addressed blob is corrupt: ' + cached);
          await fsp.link(cached, destination); report.hardlinkedFiles++;
        } else await fsp.writeFile(destination, file.bytes, { flag: 'wx' });
      }
      for (const file of manifest.files) check(hash(await fsp.readFile(path.join(stage, 'payload', file.path))) === file.sha256, 'Staged content changed before manifest activation: ' + file.path);
      await fsp.writeFile(path.join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
      await fsp.writeFile(path.join(stage, 'package-report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
      check(!await present(output), 'Release output appeared during capture; refusing to replace it.');
      await fsp.rename(stage, output); committed = true;
    } finally { if (!committed) await safeRemove(parent, stage); }
  }
  return report;
}
module.exports = { prepareMorogue, htmlResources, references, transformText };
