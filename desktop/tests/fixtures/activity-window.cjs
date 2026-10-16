'use strict';
const {app,BrowserWindow}=require('electron');
globalThis.ExternalActivity=require('../../lib/external-activity.cjs').ExternalActivity;
globalThis.activityExecutable=process.execPath;
app.whenReady().then(()=>{const window=new BrowserWindow({width:400,height:200,show:false});window.loadURL('data:text/html,<title>Activity test game</title><p>Activity test game</p>');});
app.on('window-all-closed',()=>app.quit());
