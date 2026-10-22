'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const value = process.argv.find(argument => argument.startsWith('--repo-account-id='))?.slice(18);
const accountId = typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value) ? value : '';
const gameId = process.argv.find(argument => argument.startsWith('--repo-game-id='))?.slice(15) || '';
contextBridge.exposeInMainWorld('REPO_LAUNCHER_CONTEXT', Object.freeze({ accountId, gameId }));
contextBridge.exposeInMainWorld('REPO_LAUNCHER', Object.freeze({
  requestExit: () => ipcRenderer.invoke('launcher:game', 'exit'),
  requestSignIn: () => ipcRenderer.invoke('launcher:game', 'account'),
  requestGame: id => ipcRenderer.invoke('launcher:game', 'game', id),
  ...(gameId === 'comp-run' ? {} : { requestSession: () => ipcRenderer.invoke('launcher:game', 'session') }),
  checkConnection: () => ipcRenderer.invoke('launcher:game', 'connection'),
  onConnectionChanged: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('launcher:game-connection', listener);
    return () => ipcRenderer.removeListener('launcher:game-connection', listener);
  }
}));
