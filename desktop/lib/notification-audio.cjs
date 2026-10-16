'use strict';
const path=require('node:path');
function cleanSound(data){
  if(!data||typeof data.key!=='string'||!/^(?:(?:dm|community):[1-9]\d{0,15}|call:[a-f0-9-]{36})$/i.test(data.key)||!Number.isFinite(data.volume))return null;
  return {key:data.key,volume:Math.max(0,Math.min(1,data.volume))};
}
class NotificationAudio {
  constructor({window,View,root}){Object.assign(this,{window,View,root});this.identity=null;this.revision=0;this.seen=new Set();this.lastSound=0;}
  sync(identity){if(identity!==this.identity){this.identity=identity;this.revision++;this.seen.clear();this.lastSound=0;if(this.view&&!this.view.webContents.isDestroyed())this.view.webContents.send('launcher:notification-sound',null);}}
  async ensure(){
    if(!this.view){
      this.view=new this.View({webPreferences:{preload:path.join(this.root,'renderer/sound-preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,backgroundThrottling:false,autoplayPolicy:'no-user-gesture-required'}});
      this.view.setBounds({x:0,y:0,width:1,height:1});this.view.setVisible(false);this.window.contentView.addChildView(this.view);
      this.view.webContents.setWindowOpenHandler(()=>({action:'deny'}));this.view.webContents.on('will-navigate',e=>e.preventDefault());
      this.ready=this.view.webContents.loadURL('repo-launcher://app/notification-sound.html');
    }
    await this.ready;
  }
  async play(data){
    const sound=cleanSound(data);if(!sound||!this.identity||this.window.isDestroyed()||this.seen.has(sound.key))return false;
    this.seen.add(sound.key);if(this.seen.size>300)this.seen.delete(this.seen.values().next().value);
    if(!sound.volume)return false;const revision=this.revision;
    await this.ensure();if(revision!==this.revision||this.window.isDestroyed()||Date.now()-this.lastSound<2000)return false;
    this.lastSound=Date.now();this.view.webContents.send('launcher:notification-sound',sound);return true;
  }
  dispose(){this.sync(null);if(this.view&&!this.view.webContents.isDestroyed())this.view.webContents.close();this.view=null;}
}
module.exports={NotificationAudio,cleanSound};
