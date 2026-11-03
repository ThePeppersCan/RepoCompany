'use strict';
// Pointer input only, inside the signed-in portal's COMP-9 game frame.
function canUseComp9Pointer({contents,portal,details={},origin,account,window,visible,blocked}) {
  try {
    if(blocked||!visible||!contents||contents!==portal||contents.isDestroyed()||account?.state.status!=='online'||!account.identity||!window||window.isDestroyed()||!window.isVisible()||window.isMinimized()||!window.isFocused())return false;
    const parent=new URL(contents.getURL()),frame=new URL(details.requestingUrl);
    const trusted=['https://repocompany.uk','https://www.repocompany.uk'];
    return trusted.includes(parent.origin)&&frame.origin===parent.origin&&!frame.username&&!frame.password&&details.isMainFrame===false&&['/comp9-playtest/','/comp9-playtest/index.html','/comp9-playtest/multiplayer.html'].includes(frame.pathname)&&(!origin||new URL(origin).origin===frame.origin);
  } catch{return false;}
}
module.exports={canUseComp9Pointer};
