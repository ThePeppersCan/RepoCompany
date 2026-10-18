'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const invoke = (action, value) => ipcRenderer.invoke('launcher:command', action, value);
contextBridge.exposeInMainWorld('repoLauncher', Object.freeze({
  getState: () => invoke('state'),
  signIn: (username, password, create = false) => invoke('sign-in', { username, password, create }),
  navigate: view => invoke('navigate', view),
  install: id => invoke('install', id),
  update: id => invoke('update', id),
  uninstall: id => invoke('uninstall', id),
  cancel: id => invoke('cancel', id),
  play: id => invoke('play', id),
  completeGameIntro: id => invoke('game-intro-complete', id),
  exitGame: () => invoke('exit-game'),
  openMessages: () => invoke('messages'),
  openReparty: () => invoke('reparty'),
  openWibsworth: () => invoke('wibsworth'),
  mediaControl: (action,value) => invoke('media-control',{action,value}),
  messageAnchor: right => invoke('message-anchor',right),
  resumeGame: () => invoke('resume-game'),
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
