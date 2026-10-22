'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = name => fs.readFileSync(path.join(root, name), 'utf8');
class Element {
  constructor() { this.dataset = {}; this.attributes = {}; this.children = []; this.selectors = {}; this.style = { setProperty() {} }; this.textContent = ''; this.innerHTML = ''; this.outerHTML = ''; }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name === 'src') this.src = String(value); }
  getAttribute(name) { return name === 'src' ? this.src ?? null : this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; if (name === 'src') delete this.src; }
  append(node) { this.children.push(node); }
  replaceChildren(...nodes) { this.children = nodes; }
  querySelector(selector) { return this.selectors[selector] ?? this.children.find(child => selector === '.' + child.className) ?? null; }
  dispatchEvent() {}
}
const ids = new Map(), get = id => { if (!ids.has(id)) ids.set(id, new Element()); return ids.get(id); };
const details = new Element(), play = new Element(), galleryName = new Element(), html = new Element(), observers = [];
play.innerHTML = 'Play'; play.dataset.gameUrl = 'https://moratales.repocompany.uk/';
for (const selector of ['.game-logo', '.meta', '.description', '[data-open-achievements]']) details.selectors[selector] = new Element();
details.selectors['.game-logo'].outerHTML = '<img class="game-logo" src="original-case-assets/moratales-logo.png">';
details.selectors['.meta'].textContent = 'Story & life sim';
details.selectors['.description'].textContent = 'Original Moratales description';
const shots = Array.from({ length: 3 }, (_, index) => {
  const shot = new Element(), image = new Element(), frame = new Element(), caption = new Element();
  image.src = 'original-case-assets/moratales-' + index + '.png'; image.alt = 'Original screenshot ' + index; caption.textContent = 'Original caption ' + index;
  shot.selectors = { img: image, '.frame': frame, '.caption': caption };
  const query = shot.querySelector.bind(shot);
  shot.querySelector = selector => selector === '.shot-coming-soon' ? frame.children.find(child => child.className === 'shot-coming-soon') ?? null : query(selector);
  return shot;
});
const thumbs = shots.map(() => { const thumb = new Element(); thumb.selectors.img = new Element(); return thumb; });
const document = { documentElement: html, getElementById: get,
  querySelector: selector => ({ '.game-details': details, '[data-note="Play"]': play, '.gallery-game': galleryName, '.game-logo': details.selectors['.game-logo'] }[selector]),
  querySelectorAll: selector => selector === '[data-shot]' ? shots : thumbs, createElement: () => new Element(), createTextNode: text => ({ textContent: text }) };
const context = { window: {}, document, Event, MutationObserver: class { constructor(fn) { observers.push(fn); } observe() {} } };
vm.runInNewContext(read('game-scenes.js'), context, { filename: 'game-scenes.js' });
const scenes = context.window.dashboardScenes, origin = 'https://comp-run.fluffy-star-4855.chatgpt.site/';
scenes.activate('comp-run');
assert.equal(document.title, 'Repo Company — COMP-RUN'); assert.equal(get('dashboard').dataset.comingSoon, 'false');
assert.equal(play.disabled, false); assert.equal(play.dataset.gameUrl, origin);
assert(shots.every(shot => shot.disabled)); assert.equal(details.selectors['[data-open-achievements]'].hidden, true);
const images = ['playdate.png', 'small-hours.png', 'final-curtain.png'].map(name => 'original-case-assets/comp-run/screenshots/' + name);
assert.deepEqual(shots.map(shot => shot.selectors.img.src), images);
assert.equal(get('gallery-image').src, undefined);
shots[0].selectors.img.onerror();
assert.equal(shots[0].selectors.img.hidden, true); assert.equal(shots[0].disabled, true);
assert.equal(shots[0].selectors['.caption'].textContent, 'Screenshot pending');
const loadShots = () => shots.forEach(shot => { shot.selectors.img.naturalWidth = 1920; shot.selectors.img.onload(); });
loadShots(); assert(shots.every(shot => !shot.disabled)); assert(thumbs.every(thumb => !thumb.disabled));
const previousImageLoad = shots[0].selectors.img.onload;
html.dataset.repoLauncher = 'true'; observers.forEach(fn => fn());
assert.equal(play.disabled, true); assert.equal(play.textContent, 'Update launcher'); assert.equal(play.dataset.gameUrl, undefined);
assert.equal(get('dashboard').dataset.launcherUpdateRequired, 'true');
assert.match(details.children[0].textContent, /Account → Settings/);
html.dataset.repoCompRunNative = 'true'; observers.forEach(fn => fn());
assert.equal(play.disabled, false); assert.equal(play.dataset.gameUrl, origin); assert.equal(get('dashboard').dataset.launcherUpdateRequired, undefined);
scenes.activate('moratales');
previousImageLoad();
assert.equal(play.dataset.gameUrl, 'https://moratales.repocompany.uk/'); assert.equal(details.selectors['[data-open-achievements]'].hidden, false);
assert(shots.every(shot => !shot.disabled), 'A stale COMP-RUN image result cannot disable another game gallery');
scenes.activate('velmora-tales');
assert.equal(play.disabled, true); assert(shots.every(shot => shot.disabled)); assert.equal(play.dataset.gameUrl, undefined);
assert.equal(details.children[0].textContent, 'Download · Coming soon');
scenes.activate('comp-run'); assert.equal(play.dataset.gameUrl, origin); assert(shots.every(shot => shot.disabled));
loadShots(); assert(shots.every(shot => !shot.disabled));
const gamesSource = /const games = (\[[\s\S]*?\]);/.exec(read('homepage.js'))[1];
assert.equal(vm.runInNewContext(gamesSource).map(game => game.id).join(','), 'morogue,velmora-tales,manager,moratales,comp-run,demos');
const routeDocument = { documentElement: { dataset: {} }, querySelector: () => null };
const location = { pathname: '/CompRun', hash: '', href: 'https://repocompany.uk/CompRun' };
const routeContext = { window: {}, document: routeDocument, location, URL, history: { replaceState() {} }, addEventListener() {}, queueMicrotask };
vm.runInNewContext(read('repo-routes.js'), routeContext);
assert.equal(routeContext.window.repoRoutes.read(), 'comp-run'); assert.equal(routeContext.window.repoRoutes.href('comp-run'), '/CompRun');
location.pathname = '/'; location.hash = '#comp-run'; routeDocument.documentElement.dataset.repoLauncher = 'true';
assert.equal(routeContext.window.repoRoutes.read(), 'comp-run'); assert.equal(routeContext.window.repoRoutes.href('comp-run'), '#comp-run');
const missing = images.filter(file => !fs.existsSync(path.join(root, file)));
if (process.argv.includes('--require-screenshots')) assert.deepEqual(missing, [], 'Three genuine captured screenshots must exist before release.');
console.log('PASS: COMP-RUN placement, web/native routes, image-error placeholders and load recovery, honest achievement availability, legacy launcher update gate, and existing-game control restoration.');
console.log(missing.length ? 'PENDING: ' + missing.length + ' real screenshots; use --require-screenshots as the release gate after capture.' : 'PASS: all three referenced screenshot files exist.');
console.log('This executes the actual source scripts in an isolated DOM fixture; it does not claim a rendered browser or Windows playtest.');
