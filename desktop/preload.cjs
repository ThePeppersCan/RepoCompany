'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const invoke = (action, value) => ipcRenderer.invoke('launcher:command', action, value);
contextBridge.exposeInMainWorld('repoLauncher', Object.freeze({
  getState: () => invoke('state'),
  navigate: view => invoke('navigate', view),
  install: id => invoke('install', id),
  update: id => invoke('update', id),
  uninstall: id => invoke('uninstall', id),
  cancel: id => invoke('cancel', id),
  play: id => invoke('play', id),
  refresh: () => invoke('refresh'),
  checkLauncherUpdates: () => invoke('launcher-update'),
  setAutomaticGameUpdates: enabled => invoke('automatic-game-updates', enabled),
  setDiscordPresence: enabled => invoke('discord-presence', enabled),
  openWebsite: () => invoke('website'),
  windowControl: action => invoke('window', action),
  onState: callback => {
    if (typeof callback !== 'function') throw new TypeError('A callback is required.');
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('launcher:state', listener);
    return () => ipcRenderer.removeListener('launcher:state', listener);
  }
}));
