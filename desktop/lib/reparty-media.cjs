'use strict';
// Resource access only. These origins never receive the launcher bridge,
// account tokens, native permissions, or top-level navigation privileges.
const exact = new Set([
  'suno.com', 'www.suno.com', 'cdn.suno.ai', 'cdn1.suno.ai', 'cdn2.suno.ai',
  'studio-api.prod.suno.com', 'studio-api-prod.suno.com', 'clerk.suno.com', 's.prod.suno.com', 'm-stratovibe.prod.suno.com',
  'd2lwuy8qc234o3.cloudfront.net', 'm-chromadrone.prod.suno.com',
  'www.youtube.com', 'www.youtube-nocookie.com', 'youtubei.googleapis.com',
  'jnn-pa.googleapis.com', 'www.gstatic.com', 'ssl.gstatic.com', 'www.google.com', 'yt3.ggpht.com',
  'googleads.g.doubleclick.net', 'static.doubleclick.net', 'www.googleadservices.com', 'pagead2.googlesyndication.com'
]);
const suffixes = ['ytimg.com', 'googlevideo.com'];
function mediaURL(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.port && !u.username && !u.password &&
      !u.pathname.startsWith('/__repo-launcher/') &&
      (exact.has(u.hostname) || suffixes.some(host => u.hostname === host || u.hostname.endsWith('.' + host)));
  } catch { return false; }
}
function mediaFrameURL(value) {
  try {
    const u = new URL(value);
    return mediaURL(value) && (
      ['suno.com', 'www.suno.com'].includes(u.hostname) && /^\/embed\/[a-f0-9-]{36}\/?$/.test(u.pathname) ||
      ['www.youtube.com', 'www.youtube-nocookie.com'].includes(u.hostname) && /^\/embed\/[\w-]{11}$/.test(u.pathname)
    );
  } catch { return false; }
}
function mediaRequest(request, portalOrigin) {
  return mediaURL(request.url) && ['GET', 'HEAD', 'POST', 'OPTIONS'].includes(request.method) &&
    (request.initiatorOrigin === portalOrigin || request.initiatorOrigin === 'https://www.repocompany.uk' || mediaURL(request.initiatorOrigin));
}
module.exports = { mediaURL, mediaFrameURL, mediaRequest };
