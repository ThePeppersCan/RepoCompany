'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('messagePreview',Object.freeze({
  onMessage:callback=>{if(typeof callback==='function')ipcRenderer.on('launcher:message-preview',(_event,data)=>callback(data));},
  open:()=>ipcRenderer.send('launcher:notification-action','open'),
  dismiss:()=>ipcRenderer.send('launcher:notification-action','dismiss')
}));
