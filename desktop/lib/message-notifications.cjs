'use strict';
const path = require('node:path');
const PAGE = 'repo-launcher://app/message-notification.html';
function clean(data) {
  if (!data || typeof data !== 'object' || !Number.isSafeInteger(data.id) || data.id <= 0 || typeof data.username !== 'string' || !/^[a-zA-Z0-9_-]{3,16}$/.test(data.username) || typeof data.name !== 'string' || typeof data.text !== 'string' || !Number.isFinite(data.volume)) return null;
  const channel=data.channel||'';if(typeof channel!=='string'||(channel&&!/^[a-z0-9-]{1,64}$/i.test(channel)))return null;
  return {id:data.id,channel,key:(channel?'community:':'dm:')+data.id,username:data.username,name:data.name.slice(0,32).replace(/[\x00-\x1f]/g,''),text:data.text.slice(0,160).replace(/[\x00-\x1f]/g,' '),volume:Math.max(0,Math.min(1,data.volume))};
}
class MessageNotifications {
  constructor({window, View, root, eligible, open}) { Object.assign(this,{window,View,root,eligible,open});this.seen=new Set();this.serial=0;this.identity=null;this.anchor=0;this.lastSound=0; }
  sync(identity) { if(identity!==this.identity){this.hide();this.seen.clear();this.identity=identity;}if(!this.eligible())this.hide(); }
  setAnchor(value) { if(!Number.isFinite(value)||value<0||value>20000)return;this.anchor=Math.round(value);this.layout(); }
  layout(){if(!this.view||this.window.isDestroyed())return;const [width]=this.window.getContentSize();this.view.setBounds({x:Math.max(0,Math.min(width-336,(this.anchor||width-230)-328)),y:48,width:336,height:96});}
  async show(data) {
    const message=clean(data);if(!message||!this.identity||!this.eligible()||this.seen.has(message.key))return false;
    this.seen.add(message.key);if(this.seen.size>100)this.seen.delete(this.seen.values().next().value);
    const serial=++this.serial;clearTimeout(this.timer);
    if(!this.view){
      this.view=new this.View({webPreferences:{preload:path.join(this.root,'renderer/notification-preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,autoplayPolicy:'no-user-gesture-required'}});
      this.view.setBackgroundColor('#00000000');this.view.setVisible(false);
      this.view.webContents.setWindowOpenHandler(()=>({action:'deny'}));
      this.view.webContents.on('will-navigate',event=>event.preventDefault());
      this.ready=this.view.webContents.loadURL(PAGE);
    }
    await this.ready;
    if(serial!==this.serial||!this.eligible())return false;
    this.current=message;this.layout();this.window.contentView.addChildView(this.view);this.view.setVisible(true);
    if(Date.now()-this.lastSound<2000)message.volume=0;else if(message.volume)this.lastSound=Date.now();
    this.view.webContents.send('launcher:message-preview',message);
    this.timer=setTimeout(()=>this.hide(),6000);this.timer.unref?.();return true;
  }
  action(event,action){if(!this.view||event.sender!==this.view.webContents||event.senderFrame!==this.view.webContents.mainFrame||event.senderFrame.url!==PAGE)return;
    const username=this.current?.username,channel=this.current?.channel, allowed=this.eligible();this.hide();if(action==='open'&&username&&allowed)void this.open(username,channel).catch(()=>{});
  }
  hide(){this.serial++;clearTimeout(this.timer);this.current=null;if(this.view&&!this.view.webContents.isDestroyed())this.view.setVisible(false);}
  dispose(){this.hide();if(this.view&&!this.view.webContents.isDestroyed())this.view.webContents.close();this.view=null;}
}
module.exports={MessageNotifications,clean};
