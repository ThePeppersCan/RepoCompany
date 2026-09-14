const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptSource = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const moduleStart = scriptSource.indexOf('(function installRepoTcgFavouriteCardFeature(){');
const moduleEnd = scriptSource.indexOf('// REPO COMPANY V20.9', moduleStart);
const moduleSource = scriptSource.slice(moduleStart, moduleEnd);

test('favourite-card module owns the normaliser used by its cache', () => {
  assert.ok(moduleStart >= 0 && moduleEnd > moduleStart, 'favourite-card module was not found');

  const normaliser = moduleSource.match(/const normal=value=>String\(value\?\?''\)\.trim\(\);/);
  assert.ok(normaliser, 'favourite-card module is missing its local normaliser');
  assert.ok(
    moduleSource.indexOf(normaliser[0]) < moduleSource.indexOf('function setCachedFavourite'),
    'normaliser must be initialised before favourite-card cache updates'
  );

  const context = {};
  vm.createContext(context);
  vm.runInContext(`${normaliser[0]} this.values=[normal(null),normal('  slab-id  ')];`, context);
  assert.deepEqual(Array.from(context.values), ['', 'slab-id']);
});

test('changing a raw favourite is persisted and refreshes the local cache', () => {
  const saveStart = moduleSource.indexOf('async function saveFavourite');
  const saveEnd = moduleSource.indexOf('function decorateBinderFavouriteButtons', saveStart);
  const saveSource = moduleSource.slice(saveStart, saveEnd);

  assert.match(saveSource, /setCachedFavourite\(username,next\)/);
  assert.match(saveSource, /db\.rpc\('set_favourite_quidditch_tcg_card',\{p_card_id:next\}\)/);
  assert.match(saveSource, /setCachedFavourite\(username,saved\)/);
  assert.match(saveSource, /setCachedFavourite\(username,current\)/);
});
