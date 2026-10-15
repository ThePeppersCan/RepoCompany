'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {MessageNotifications,clean}=require('../lib/message-notifications.cjs');
test('bounded plain notification data rejects invalid peers, IDs and volumes',()=>{assert.equal(clean({}),null);assert.equal(clean({id:1,username:'<script>',name:'x',text:'x',volume:1}),null);const item=clean({id:2,username:'alice',name:'a'.repeat(100),text:'x'.repeat(300),volume:5});assert.equal(item.name.length,32);assert.equal(item.text.length,160);assert.equal(item.volume,1);});
test('native preview stays above the game without focus, deduplicates, and clears on account switch',async()=>{
  let allowed=true,opened='',adds=0;const sends=[];
  class View{constructor(){this.webContents=Object.assign(new EventEmitter(),{mainFrame:{url:'repo-launcher://app/message-notification.html'},setWindowOpenHandler(){},loadURL:async()=>{},send:(channel,data)=>sends.push(data),isDestroyed:()=>false,close(){}});}setBackgroundColor(){}setVisible(v){this.visible=v;}setBounds(b){this.bounds=b;}}
  const window={isDestroyed:()=>false,getContentSize:()=>[1200,800],contentView:{addChildView(){adds++;}}};
  const n=new MessageNotifications({window,View,root:__dirname,eligible:()=>allowed,open:async name=>{opened=name;}});n.sync('first');n.setAnchor(950);
  const message={id:1,username:'alice',name:'Alice',text:'Hello',volume:.5};assert.equal(await n.show(message),true);assert.equal(adds,1);assert.equal(n.view.bounds.x,622);assert.equal(await n.show(message),false);
  n.action({sender:{},senderFrame:{}},'open');assert.equal(opened,'');assert.equal(n.view.visible,true);
  n.action({sender:n.view.webContents,senderFrame:n.view.webContents.mainFrame},'open');assert.equal(opened,'alice');assert.equal(n.view.visible,false);
  await n.show({...message,id:2});n.sync('second');assert.equal(n.current,null);assert.equal(n.view.visible,false);
  allowed=false;assert.equal(await n.show({...message,id:3}),false);n.dispose();
});
