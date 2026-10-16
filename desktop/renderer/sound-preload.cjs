'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('notificationSound',Object.freeze({onSound:callback=>{if(typeof callback==='function')ipcRenderer.on('launcher:notification-sound',(_event,data)=>callback(data));}}));
