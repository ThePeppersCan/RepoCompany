'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../dashboard-audio.js'),'utf8');
function fixture(visible){
 const events=new Map(),tracks=[],frames=new Map(),storage=new Map();let frame=0;
 const toggle={setAttribute(){},querySelector:()=>({style:{}}),dataset:{},addEventListener:(name,fn)=>events.set('toggle:'+name,fn)};
 const document={hidden:false,documentElement:{dataset:visible===undefined?{}:{repoPortalVisible:String(visible)}},querySelector:()=>toggle,addEventListener:(name,fn)=>events.set(name,fn)};
 const context=vm.createContext({document,Audio:class{constructor(){this.dataset={};this.paused=true;tracks.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>1000},requestAnimationFrame:fn=>{frames.set(++frame,fn);return frame;},cancelAnimationFrame:id=>frames.delete(id),addEventListener:(name,fn)=>events.set(name,fn)});
 context.window=context;vm.runInContext(source,context);
 return {audio:context.dashboardAudio,document,storage,tracks,context,emit:name=>events.get(name)?.({isTrusted:true,target:{}}),track:name=>tracks.find(t=>t.dataset.sound===name),visibility:value=>{document.documentElement.dataset.repoPortalVisible=String(value);events.get('repo-launcher-portal-visibility')();}};
}
test('native game cover stops music and disc immediately even while document stays visible and animation frames stop',()=>{
 const h=fixture(true);h.emit('pointerdown');h.audio.spin(true);assert.equal(h.track('music').paused,false);assert.equal(h.track('spin').paused,false);
 h.visibility(false);assert.equal(h.document.hidden,false);
 for(const name of ['music','spin']){assert.equal(h.track(name).paused,true);assert.equal(h.track(name).volume,0);}
 h.audio.reset();h.audio.setMix('music',.5);h.emit('repo-media-state');assert.equal(h.track('music').paused,true);
 h.visibility(true);assert.equal(h.track('music').paused,false);
});
test('initially hidden native portal cannot start audio; ordinary website still can',()=>{
 const hidden=fixture(false);hidden.emit('pointerdown');assert.equal(hidden.track('music').paused,true);hidden.visibility(true);assert.equal(hidden.track('music').paused,false);
 const web=fixture();web.emit('pointerdown');assert.equal(web.track('music').paused,false);
});
test('returning to collection preserves mute, embedded-game suspension and Reparty ownership',()=>{
 const h=fixture(true);h.emit('pointerdown');h.emit('toggle:click');h.visibility(false);h.visibility(true);assert.equal(h.track('music').paused,true);assert.equal(h.storage.get('repo-dashboard-muted'),'true');
 h.emit('toggle:click');h.audio.suspend(true);h.visibility(false);h.visibility(true);assert.equal(h.track('music').paused,true);
 h.audio.suspend(false);h.context.repoMedia={getState:()=>({reparty:{active:true}})};h.visibility(false);h.visibility(true);assert.equal(h.track('music').paused,true);
});
test('native portal visibility does not silence completion notifications',()=>{
 const h=fixture(true);h.emit('pointerdown');h.visibility(false);h.audio.effect('wibsworthComplete');assert.equal(h.track('wibsworthComplete').paused,false);assert(h.track('wibsworthComplete').volume>0);
 h.audio.effect('hover');assert.equal(h.track('hover').paused,true);
});
