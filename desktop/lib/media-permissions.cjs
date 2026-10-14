'use strict';

// Device access belongs only to the signed-in, top-level company portal.
// Games, their frames, screen capture and arbitrary permissions remain denied.
function configureMediaPermissions(session, { getPortal, getAccount, getWindow, isPortalUrl, dialog }) {
  let generation = 0, grant = null, pending = false;
  const identity = () => { const account = getAccount(); return account?.state?.status === 'online' ? account.identity : null; };
  const trusted = (contents, details = {}, origin) => {
    try {
      const portal = getPortal();
      return !!(portal && contents === portal && !contents.isDestroyed() && details.isMainFrame === true &&
        isPortalUrl(contents.getURL()) && isPortalUrl(details.requestingUrl || origin || '') &&
        new URL(details.requestingUrl || origin).origin === new URL(contents.getURL()).origin && identity());
    } catch { return false; }
  };
  const allowed = (contents, types) => !!(grant && grant.contents === contents && grant.identity === identity() && types.every(type => grant.types.has(type)));
  session.setPermissionCheckHandler((contents, permission, origin, details = {}) => {
    const type = details.mediaType;
    return permission === 'media' && ['audio', 'video'].includes(type) && trusted(contents, details, origin) && allowed(contents, [type]);
  });
  session.setPermissionRequestHandler((contents, permission, callback, details = {}) => {
    const types = Array.isArray(details.mediaTypes) ? [...new Set(details.mediaTypes)] : [];
    if (permission !== 'media' || !types.length || types.some(type => !['audio', 'video'].includes(type)) || !trusted(contents, details)) { callback(false); return; }
    if (allowed(contents, types)) { callback(true); return; }
    if (pending) { callback(false); return; }
    const revision = generation, user = identity(), window = getWindow();
    if (!window || window.isDestroyed()) { callback(false); return; }
    pending = true;
    const devices = types.includes('audio') && types.includes('video') ? 'microphone and camera' : types.includes('video') ? 'camera' : 'microphone';
    Promise.resolve().then(() => dialog.showMessageBox(window, {
      type: 'question', title: 'Repo Company calls', message: 'Allow your ' + devices + ' for calls?',
      detail: 'Only your Repo Company call can use these devices. You can mute, turn off your camera, or end the call at any time.',
      buttons: ['Not now', 'Allow'], defaultId: 0, cancelId: 0, noLink: true
    })).then(result => {
      const accept = result.response === 1 && generation === revision && user === identity() && trusted(contents, details) && !window.isDestroyed();
      if (accept) grant = { contents, identity: user, types: new Set([...(grant?.identity === user && grant.contents === contents ? grant.types : []), ...types]) };
      callback(accept);
    }, () => callback(false)).finally(() => { pending = false; });
  });
  return { reset() { generation++; grant = null; }, dispose() { generation++; grant = null; session.setPermissionCheckHandler(() => false); session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false)); } };
}
module.exports = { configureMediaPermissions };
