'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {NotificationAudio,cleanSound}=require('../lib/notification-audio.cjs');
test('notification sound accepts only bounded message identifiers and volume',()=>{
 assert.equal(cleanSound({key:'http://attacker/audio',volume:1}),null);assert.equal(cleanSound({key:'dm:1',volume:NaN}),null);
 assert.deepEqual(cleanSound({key:'community:1',volume:9}),{key:'community:1',volume:1});
});
test('background audio is independent of preview visibility, deduplicated, muted and account scoped',async()=>{
 const sends=[],options=[];let resolve;
 class View{constructor(o){options.push(o);this.webContents=Object.assign(new EventEmitter(),{setWindowOpenHandler(){},loadURL:()=>new Promise(r=>resolve=r),send:(...args)=>sends.push(args),isDestroyed:()=>false,close(){}});}setVisible(v){assert.equal(v,false);}setBounds(){} }
 const window={isDestroyed:()=>false,contentView:{addChildView(){}}},a=new NotificationAudio({window,View,root:__dirname});
 a.sync('alice');const pending=a.play({key:'dm:1',volume:1});a.sync('bob');resolve();assert.equal(await pending,false,'old account cannot play after the audio page loads');
 assert.equal(await a.play({key:'community:1',volume:1}),true);assert.equal(await a.play({key:'community:1',volume:1}),false);
 a.lastSound=0;assert.equal(await a.play({key:'dm:1',volume:1}),true,'group and DM identifiers cannot collide');
 a.lastSound=0;assert.equal(await a.play({key:'dm:2',volume:0}),false);assert.equal(await a.play({key:'dm:2',volume:1}),false,'muted messages are not replayed later');
 assert.equal(options[0].webPreferences.backgroundThrottling,false);assert.equal(options[0].webPreferences.autoplayPolicy,'no-user-gesture-required');
 a.sync(null);assert.equal(sends.at(-1)[1],null);assert.equal(await a.play({key:'dm:3',volume:1}),false);a.dispose();
});
