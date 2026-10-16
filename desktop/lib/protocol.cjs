'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const { validatePath } = require('./manifest.cjs');
const { mediaRequest } = require('./reparty-media.cjs');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const fail = (status, message) => new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

function within(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return !!relative && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative);
}
function resolveAsset(root, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  const relative = decoded.replace(/^\//, '');
  try { validatePath(relative); } catch { return null; }
  const segments = relative.split('/');
  if (segments.some(segment => segment.startsWith('.'))) return null;
  const candidate = path.resolve(root, ...segments);
  return within(root, candidate) ? candidate : null;
}
function injectMorogue(html) {
  // The bundled hooks have the same account origin as the website. No auth rules are relaxed.
  const clean = html.replace(/<script\b[^>]*src=["'][^"']*(?:game-achievements-client|achievement-runtime)\.js[^"']*["'][^>]*>\s*<\/script>/gi, '');
  const hooks = '<script defer src="https://repocompany.uk/__repo-launcher/morogue-achievements.js" data-game="morogue" data-bundled="true"></script>\n<script defer src="/__repo-launcher/morogue.js"></script>\n';
  const marker = /<script\b[^>]*src=["'][^"']*interface\/vampire-survivor\/app\.js[^"']*["'][^>]*>/i;
  if (!marker.test(clean)) throw new Error('The installed Morogue entry page is not compatible with this launcher.');
  return clean.replace(/<head(?:\s[^>]*)?>/i, match => match + '\n<script src="/__repo-launcher/account-storage.js"></script>').replace(marker, match => hooks + match);
}
function injectGame(html, gameId) {
  if (gameId === 'morogue') return injectMorogue(html);
  if (!['moratales', 'manager'].includes(gameId) || !/<head(?:\s[^>]*)?>/i.test(html)) throw new Error('The installed entry page is not compatible with this launcher.');
  const clean = html.replace(/<script\b[^>]*src=["'][^"']*(?:game-achievements-client|achievement-runtime)\.js[^"']*["'][^>]*>\s*<\/script>/gi, '');
  return clean.replace(/<head(?:\s[^>]*)?>/i, match => match + '\n<script src="/__repo-launcher/account-storage.js"></script>\n<script src="/__repo-launcher/' + gameId + '.js"></script>\n<script defer src="https://repocompany.uk/__repo-launcher/' + gameId + '-achievements.js" data-game="' + gameId + '" data-bundled="true"></script>');
}
async function serveFile(request, root, pathname, transform) {
  if (!['GET', 'HEAD'].includes(request.method)) return fail(405, 'Method not allowed.');
  const file = resolveAsset(root, pathname);
  if (!file || !MIME[path.extname(file).toLowerCase()]) return fail(404, 'File not found.');
  try {
    const [resolvedRoot, resolvedFile, stat] = await Promise.all([fs.promises.realpath(root), fs.promises.realpath(file), fs.promises.stat(file)]);
    if (!within(resolvedRoot, resolvedFile) || !stat.isFile()) return fail(403, 'File unavailable.');
    const headers = { 'Content-Type': MIME[path.extname(file).toLowerCase()], 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' };
    if (transform) {
      if (stat.size > 16 * 1024 * 1024) return fail(413, 'Entry page is too large.');
      const body = transform(await fs.promises.readFile(file, 'utf8'));
      headers['Content-Length'] = String(Buffer.byteLength(body));
      return new Response(request.method === 'HEAD' ? null : body, { headers });
    }
    let start = 0, end = stat.size - 1, status = 200;
    const range = request.headers.get('Range');
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || !match[1] && !match[2]) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
      start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(end, Number(match[2])) : end;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= stat.size || end < start) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length'] = String(stat.size ? end - start + 1 : 0);
    return new Response(request.method === 'HEAD' || !stat.size ? null : Readable.toWeb(fs.createReadStream(file, { start, end })), { status, headers });
  } catch { return fail(404, 'Installed file unavailable. Repair the game from your library.'); }
}
function createHandler({ config, library, desktopRoot, fetchNetwork }) {
  const origins = new Set(config.approvedOrigins);
  return async request => {
    let url; try { url = new URL(request.url); } catch { return fail(400, 'Invalid address.'); }
    if (url.username || url.password || url.protocol !== 'https:') return fail(403, 'This address is not part of Repo Company.');
    if (!origins.has(url.origin)) {
      if (!mediaRequest(request, config.portalOrigin)) return fail(403, 'This address is not part of Repo Company.');
      // Let Chromium follow redirects through this handler, checking every hop.
      // Electron's protocol forwarding loses Chromium's referrer. Preserve the
      // actual embedding origin so providers can identify the client correctly.
      const headers = new Headers(request.headers);
      if (!headers.has('Referer')) headers.set('Referer', request.initiatorOrigin + '/');
      try { return await fetchNetwork(request, { redirect: 'manual', headers }); }
      catch { return fail(503, 'The media provider could not connect. Please try again.'); }
    }
    if (url.origin === config.portalOrigin && url.pathname === '/__repo-launcher/dragonbound-web.js') {
      return serveFile(request, path.join(desktopRoot, 'game'), '/dragonbound-web.js');
    }
    const achievementGame = /^\/__repo-launcher\/(morogue|moratales|manager)-achievements\.js$/.exec(url.pathname)?.[1];
    if (url.origin === config.portalOrigin && achievementGame) {
      const installed = library.getInstalled(achievementGame);
      return installed ? serveFile(request, installed.directory, '/launcher/achievement-runtime.js') : fail(404, 'Game not installed.');
    }
    const game = config.games.find(item => item.origin === url.origin);
    const installed = game?.installable && library.getInstalled(game.id);
    const onlineRoute = url.pathname.startsWith('/api/') || url.pathname === '/api' || game?.id === 'moratales' && (['/unlock', '/gate-logo.png', '/desktop-release.json'].includes(url.pathname) || url.pathname.startsWith('/downloads/'));
    if (installed && !onlineRoute) {
      if (game.id === 'morogue' && url.pathname === '/interface/vampire-survivor/site-bridge.js') return serveFile(request, path.join(desktopRoot, 'game'), '/morogue-site-bridge.js');
      if (url.pathname === '/__repo-launcher/morogue.js') return serveFile(request, path.join(desktopRoot, 'game'), '/morogue-launcher.js');
      if (url.pathname === '/__repo-launcher/' + game.id + '.js') return serveFile(request, path.join(desktopRoot, 'game'), '/' + game.id + '-launcher.js');
      if (url.pathname === '/__repo-launcher/account-storage.js') return serveFile(request, path.join(desktopRoot, 'game'), '/account-storage.js');
      const pathname = url.pathname === '/' || url.pathname === '/index.html' ? '/' + installed.entry : url.pathname;
      return serveFile(request, installed.directory, pathname, pathname === '/' + installed.entry ? html => injectGame(html, game.id) : null);
    }
    try { return await fetchNetwork(request); } catch { return fail(503, 'Connect to the internet to use Repo Company.'); }
  };
}
module.exports = { within, resolveAsset, serveFile, injectMorogue, injectGame, createHandler };
