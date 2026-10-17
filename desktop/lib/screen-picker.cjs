'use strict';
const path=require('node:path');
function createScreenPicker({BrowserWindow,desktopCapturer,ipcMain,getWindow,hidden=false}){
 let picker=null,cancel=null,choosing=false;
 return {
  cancel(){cancel?.();},
  async choose(valid){
   if(choosing||!valid())return null;
   choosing=true;
   try{
   const sources=await desktopCapturer.getSources({types:['screen','window'],thumbnailSize:{width:320,height:180},fetchWindowIcons:false});
   if(!valid()||!sources.length)return null;
   return await new Promise(resolve=>{
    const parent=getWindow();if(!parent||parent.isDestroyed()){resolve(null);return;}
    const window=new BrowserWindow({parent,modal:true,show:false,width:720,height:570,minWidth:480,minHeight:400,title:'Share a screen or window',autoHideMenuBar:true,backgroundColor:'#171c19',webPreferences:{preload:path.join(__dirname,'../renderer/screen-picker-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});picker=window;
    let settled=false;const done=source=>{if(settled)return;settled=true;clearTimeout(timer);ipcMain.removeHandler('launcher:screen-sources');ipcMain.removeHandler('launcher:screen-choose');cancel=null;picker=null;if(!window.isDestroyed())window.destroy();resolve(valid()?source:null);};
    cancel=()=>done(null);const timer=setTimeout(cancel,60000);
    const trusted=event=>!window.isDestroyed()&&event.sender===window.webContents&&event.senderFrame===window.webContents.mainFrame&&valid();
    ipcMain.handle('launcher:screen-sources',event=>trusted(event)?sources.map(s=>({id:s.id,name:s.name,thumbnail:s.thumbnail.toDataURL()})):[]);
    ipcMain.handle('launcher:screen-choose',(event,id)=>{if(!trusted(event))return false;done(id===null?null:sources.find(s=>s.id===id)||null);return true;});
    window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',event=>event.preventDefault());window.on('closed',()=>done(null));
    window.loadFile(path.join(__dirname,'../renderer/screen-picker.html')).then(()=>{if(!hidden&&!window.isDestroyed())window.show();}).catch(()=>done(null));
   });
   }finally{choosing=false;}
  }
 };
}
module.exports={createScreenPicker};
