'use strict';
// Prepare a narrowly guarded Worker update from a captured deployed version.
// This command never uploads or changes Worker routes.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function prepare({ capture, output, nativeRelease = path.resolve(__dirname, '../desktop/releases/manager'), fetchImpl = fetch }) {
  capture = path.resolve(capture); output = path.resolve(output);
  if (capture === output || output.startsWith(capture + path.sep)) throw Error('Use a separate fresh candidate directory.');
  const captured = JSON.parse(await fs.readFile(path.join(capture, 'modules.json'), 'utf8'));
  if (!captured['entry.mjs']) throw Error('Review the captured Manager entry module.');
  const originalModules = {};
  for (const [name, info] of Object.entries(captured)) {
    if (!/^[a-zA-Z0-9._-]+$/.test(name)) throw Error('Unexpected module name.');
    const bytes = await fs.readFile(path.join(capture, 'modules', name));
    if (hash(bytes) !== info.sha256) throw Error('Captured Worker module changed: ' + name);
    originalModules[name] = bytes;
  }
  const settings = JSON.parse(await fs.readFile(path.join(capture, 'settings'), 'utf8')).result;
  if (settings.bindings.length !== 1 || settings.bindings[0].name !== 'GAME' || settings.bindings[0].type !== 'service' || settings.bindings[0].service !== 'velmora-manager') throw Error('Review the current Manager Worker bindings.');
  const response = await fetchImpl('https://manager.repocompany.uk/player-career.css');
  if (response.status !== 200 || !response.headers.get('content-type')?.includes('text/css')) throw Error('The published Manager stylesheet is unavailable.');
  const oldCSS = await response.text(), absent = 'assets/ui-v2/main-menu-bg.webp', existing = 'assets/ui-v2/main-menu-clean-v2.png';
  if (oldCSS.split(absent).length !== 2) throw Error('The published stylesheet changed; review the background correction.');
  const corrected = oldCSS.replace(absent, existing);
  const nativeCSS = await fs.readFile(path.join(nativeRelease, 'payload/player-career.css'), 'utf8');
  if (corrected.replace(/\r\n/g, '\n') !== nativeCSS.replace(/\r\n/g, '\n')) throw Error('The proposed correction does not match the native stylesheet.');
  const art = await fetchImpl('https://manager.repocompany.uk/' + existing);
  if (art.status !== 200 || !art.headers.get('content-type')?.startsWith('image/')) throw Error('The existing published background is unavailable.');
  const image = Buffer.from(await art.arrayBuffer()), installedImage = await fs.readFile(path.join(nativeRelease, 'payload', existing));
  if (hash(image) !== hash(installedImage)) throw Error('Published and native background artwork differ.');
  const modules = { ...originalModules,
    'manager-player-background.mjs': await fs.readFile(path.join(__dirname, 'game-workers/manager-player-background.mjs')),
    'manager-player-background-data.mjs': Buffer.from('export default ' + JSON.stringify({ originalSha256: hash(oldCSS), css: corrected }) + ';\n'),
    'parity-entry.mjs': Buffer.from("import original from './entry.mjs';import {withManagerPlayerBackground} from './manager-player-background.mjs';import correction from './manager-player-background-data.mjs';export * from './entry.mjs';export default withManagerPlayerBackground(original,correction);\n")
  };
  const metadata = { ...settings, main_module: 'parity-entry.mjs', annotations: { ...settings.annotations, 'workers/message': 'Use the existing published Manager menu artwork for the player setup background; preserve the original game and routing Worker.' } };
  await fs.mkdir(output, { recursive: false }); await fs.mkdir(path.join(output, 'modules'));
  for (const [name, bytes] of Object.entries(modules)) await fs.writeFile(path.join(output, 'modules', name), bytes, { flag: 'wx' });
  await fs.writeFile(path.join(output, 'metadata.json'), JSON.stringify(metadata, null, 2), { flag: 'wx' });
  const report = { worker: 'repo-manager-achievements', capture, output, method: 'Wrap the captured entry; only GET/HEAD /player-career.css is eligible and only when the upstream body hash matches the captured stylesheet.', originalModules: captured, modules: Object.fromEntries(Object.entries(modules).map(([name, bytes]) => [name, { sha256: hash(bytes), bytes: bytes.length }])), metadataSha256: hash(JSON.stringify(metadata, null, 2)), capturedSettingsSha256: hash(await fs.readFile(path.join(capture, 'settings'))), capturedDeploymentsSha256: hash(await fs.readFile(path.join(capture, 'deployments'))), originalCSSSha256: hash(oldCSS), correctedCSSSha256: hash(corrected), background: { path: existing, sha256: hash(image), bytes: image.length }, validationBeforeDeployment: ['Re-read live deployments, settings and every Worker module and compare with capture.', 'Confirm the published stylesheet still has originalCSSSha256.', 'Preserve all modules/bindings/settings and the existing route; upload only to the captured Worker.'] };
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  return report;
}
if (require.main === module) {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i++) { const key = args[i]; if (!['--capture', '--output', '--native-release'].includes(key) || !args[i + 1]) throw Error('Unknown preparation option.'); options[key === '--native-release' ? 'nativeRelease' : key.slice(2)] = args[++i]; }
  prepare(options).then(report => console.log(JSON.stringify(report, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { prepare };
