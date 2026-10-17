'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('screenPicker',Object.freeze({sources:()=>ipcRenderer.invoke('launcher:screen-sources'),choose:id=>ipcRenderer.invoke('launcher:screen-choose',typeof id==='string'?id:null)}));
