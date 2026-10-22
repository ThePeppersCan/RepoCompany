'use strict';

// Pointer capture and fullscreen belong only to the visible, signed-in game
// document. This does not grant games device, screen or subframe permissions.
function canUseCompRunInput({ contents, details = {}, origin, record, account, gameOrigin, window, blocked = false }) {
  try {
    if (blocked || !record || record.__gameId !== 'comp-run' || record.closed || record.loading ||
      record.webContents !== contents || !contents || contents.isDestroyed() ||
      account?.state.status !== 'online' || account.identity !== record.__accountId ||
      details.isMainFrame !== true || !window || window.isDestroyed() || !window.isVisible() ||
      window.isMinimized() || !window.isFocused()) return false;
    const current = new URL(contents.getURL()), requesting = new URL(details.requestingUrl || origin || '');
    return current.origin === gameOrigin && requesting.origin === gameOrigin &&
      !current.username && !current.password && !requesting.username && !requesting.password &&
      (!origin || new URL(origin).origin === gameOrigin);
  } catch { return false; }
}

module.exports = { canUseCompRunInput };
