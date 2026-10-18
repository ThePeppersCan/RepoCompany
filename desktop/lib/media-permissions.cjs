'use strict';

// Device access belongs only to the signed-in, top-level company portal.
// Game device access and arbitrary permissions remain denied. The selected
// Repo Runners frame may capture mouse movement for its controls. Display capture
// requires a fresh, trusted user gesture and an explicit source selection.
function configureMediaPermissions(session, { getPortal, getAccount, getWindow, isPortalUrl, dialog, chooseScreen, cancelScreen, canUseGamePointer }) {
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
    if (permission === 'pointerLock') return canUseGamePointer?.(contents, details, origin) === true;
    const type = details.mediaType;
    if(permission==='display-capture')return !!chooseScreen&&trusted(contents,details,origin);
    if(permission === 'speaker-selection')return trusted(contents,details,origin)&&allowed(contents,['output']);
    return permission === 'media' && ['audio', 'video'].includes(type) && trusted(contents, details, origin) && allowed(contents, [type]);
  });
  session.setPermissionRequestHandler((contents, permission, callback, details = {}) => {
    if (permission === 'pointerLock') { callback(canUseGamePointer?.(contents, details) === true); return; }
    if(permission==='display-capture'){callback(!!chooseScreen&&trusted(contents,details));return;}
    // Electron 44 uses an empty media-type preflight for getDisplayMedia.
    // This only lets it reach the guarded source picker below; microphone and
    // camera requests still require their separate, explicit device grants.
    if(permission==='media'&&Array.isArray(details.mediaTypes)&&details.mediaTypes.length===0&&chooseScreen&&trusted(contents,details)){callback(true);return;}
    const output=permission==='speaker-selection';
    const types = output?['output']:Array.isArray(details.mediaTypes) ? [...new Set(details.mediaTypes)] : [];
    if ((!output&&permission !== 'media') || !types.length || types.some(type => !(output?['output']:['audio', 'video']).includes(type)) || !trusted(contents, details)) { callback(false); return; }
    if (allowed(contents, types)) { callback(true); return; }
    if (pending) { callback(false); return; }
    const revision = generation, user = identity(), window = getWindow();
    if (!window || window.isDestroyed()) { callback(false); return; }
    pending = true;
    const devices = types.includes('audio') && types.includes('video') ? 'microphone and camera' : types.includes('video') ? 'camera' : 'microphone';
    Promise.resolve().then(() => dialog.showMessageBox(window, {
      type: 'question', title: 'Repo Company calls', message: output?'Allow speaker selection for calls?':'Allow your ' + devices + ' for calls?',
      detail: output?'Choose which headphones or speakers play your calls. This does not grant microphone or camera access.':'Only your Repo Company call can use these devices. You can mute, turn off your camera, or end the call at any time.',
      buttons: ['Not now', 'Allow'], defaultId: 0, cancelId: 0, noLink: true
    })).then(result => {
      const accept = result.response === 1 && generation === revision && user === identity() && trusted(contents, details) && !window.isDestroyed();
      if (accept) grant = { contents, identity: user, types: new Set([...(grant?.identity === user && grant.contents === contents ? grant.types : []), ...types]) };
      callback(accept);
    }, () => callback(false)).finally(() => { pending = false; });
  });
  if(chooseScreen)session.setDisplayMediaRequestHandler(async(request,callback)=>{
    const revision=generation,user=identity(),portal=getPortal();
    const valid=()=>{try{return !!user&&revision===generation&&user===identity()&&portal===getPortal()&&!portal.isDestroyed()&&request.frame===portal.mainFrame&&request.userGesture===true&&request.videoRequested===true&&!request.audioRequested&&isPortalUrl(request.securityOrigin)&&isPortalUrl(portal.getURL())&&new URL(request.securityOrigin).origin===new URL(portal.getURL()).origin;}catch{return false;}};
    try{if(!valid()){callback(null);return;}const source=await chooseScreen(valid);callback(valid()&&source?{video:source}:null);}catch{try{callback(null);}catch{}}
  });
  function reset(){generation++;grant=null;cancelScreen?.();getPortal()?.executeJavaScript?.("dispatchEvent(new Event('repo-screen-share-revoke'))").catch(()=>{});}
  return { reset, dispose() {reset();session.setPermissionCheckHandler(() => false); session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));if(chooseScreen)session.setDisplayMediaRequestHandler((_request,callback)=>callback(null)); } };
}
module.exports = { configureMediaPermissions };
