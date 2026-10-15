'use strict';
const fs = require('node:fs'), path = require('node:path');

// The website uses the exact client SVG and animation sources. Shadow DOM keeps
// the loading mark isolated from the login screen and the game-case artwork.
module.exports = function buildGameLoader(root, dist) {
  const source = path.join(root, 'desktop/renderer');
  const html = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
  const logo = html.match(/<div class="brand-loader"[\s\S]*?<\/svg>\s*<\/div>/)?.[0];
  if (!logo) throw Error('The shared game loader SVG is missing.');
  const style = '<style>:host{position:absolute;inset:0;display:grid;place-items:center;background:#000}.brand-loader{width:164px;height:164px;animation:reveal .22s ease-out both}.brand-motion{display:block;width:100%;height:100%;overflow:visible}@keyframes reveal{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion:reduce){.brand-loader{animation:none}}</style>';
  const markup = style + logo.replaceAll('assets/repo-company-mark.png', '/assets/launcher-login-mark.png');
  const variants = ['brand-morogue.js', 'brand-moratales.js', 'brand-manager.js'].map(file => fs.readFileSync(path.join(source, file), 'utf8').replaceAll('assets/repo-company-mark.png', '/assets/launcher-login-mark.png')).join('\n');
  const motion = fs.readFileSync(path.join(source, 'brand-motion.js'), 'utf8')
    .replace("document.querySelector('.brand-motion')", "host.shadowRoot.querySelector('.brand-motion')")
    .replace('window.repoBrandMotion =', 'host.repoBrandMotion =');
  fs.writeFileSync(path.join(dist, 'repo-game-loader.js'), variants + '\nwindow.mountRepoGameLoader = function(host) { host.attachShadow({mode:"open"}).innerHTML=' + JSON.stringify(markup) + ';\n' + motion + '\nreturn host.repoBrandMotion;\n};\n');
};
