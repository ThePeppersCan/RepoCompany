const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const launcherSource = fs.readFileSync(path.join(__dirname, '..', 'repo-company-dragonbound-launcher.js'), 'utf8');
const originSource = launcherSource.slice(
  launcherSource.indexOf('const localPreview'),
  launcherSource.indexOf('const SUPABASE_URL')
);

function resolveOrigin(href) {
  const url = new URL(href);
  const context = {
    location: { hostname: url.hostname, protocol: url.protocol, search: url.search },
    URLSearchParams
  };
  vm.createContext(context);
  vm.runInContext(`${originSource}\nthis.result = { localPreview, localDragonbound, origin: DRAGONBOUND_ORIGIN };`, context);
  return context.result;
}

test('local Repo Company uses hosted Dragonbound by default', () => {
  const result = resolveOrigin('http://127.0.0.1:4173/');
  assert.equal(result.localPreview, true);
  assert.equal(result.localDragonbound, false);
  assert.equal(result.origin, 'https://dragonbound.repocompany.uk');
});

test('two-server development remains an explicit option', () => {
  const result = resolveOrigin('http://localhost:4173/?dragonboundLocal=1');
  assert.equal(result.localPreview, true);
  assert.equal(result.localDragonbound, true);
  assert.equal(result.origin, 'http://127.0.0.1:4180');
});

test('production can never be redirected to a local Dragonbound server', () => {
  assert.equal(resolveOrigin('https://repocompany.uk/?dragonboundLocal=1').origin, 'https://dragonbound.repocompany.uk');
});

test('a directly opened file still uses hosted Dragonbound', () => {
  const result = resolveOrigin('file:///C:/Users/Isaac/Desktop/web2/index.html');
  assert.equal(result.localPreview, false);
  assert.equal(result.localDragonbound, false);
  assert.equal(result.origin, 'https://dragonbound.repocompany.uk');
  assert.match(launcherSource, /if \(filePreview\) url\.searchParams\.set\('repoOrigin', 'null'\)/);
});

test('launcher has bounded failure recovery and strict message checks', () => {
  assert.match(launcherSource, /setTimeout\(showLaunchError, 12000\)/);
  assert.match(launcherSource, /data-dragonbound-retry/);
  assert.match(launcherSource, /data-dragonbound-close/);
  assert.match(launcherSource, /event\.origin !== DRAGONBOUND_ORIGIN \|\| event\.source !== frame\?\.contentWindow/);
  assert.match(launcherSource, /data\.bridge !== bridge/);
});
