'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.style={};this.className='';this.textContent='';this.hidden=false;this.classList={add:(...names)=>{this.className=[...new Set([...this.className.split(' '),...names])].filter(Boolean).join(' ');},toggle:(name,on)=>{const set=new Set(this.className.split(' '));if(on)set.add(name);else set.delete(name);this.className=[...set].join(' ');}};}
 append(...nodes){for(const node of nodes){node.remove();node.parent=this;this.children.push(node);}}
 remove(){if(this.parent){this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}}
 replaceChildren(...nodes){for(const node of [...this.children])node.remove();this.append(...nodes);}
 setAttribute(key,value){this.attrs[key]=String(value);}
 getAttribute(key){return this.attrs[key];}
 addEventListener(){}
 querySelectorAll(selector){return this.children.flatMap(n=>[...(selector==='[data-voice-name]'?n.dataset.voiceName!==undefined:n.className.split(' ').includes(selector.slice(1)))?[n]:[],...n.querySelectorAll(selector)]);}
 play(){return Promise.resolve();} pause(){}
}
const node=tag=>new Element(tag),document={createElement:node,documentElement:{dataset:{}},body:node('body')};
const sandbox={document,console,WeakMap,setTimeout,clearTimeout,addEventListener(){}};sandbox.window=sandbox;
vm.runInNewContext(fs.readFileSync(require.resolve('../repo-call-stage.js'),'utf8'),sandbox);
let mounts=0,screenHost,expander,leaves=0;
const screens={mount(host,expand){mounts++;screenHost=host;expander=expand;},render(){}};
const stage=sandbox.createRepoCallStage({screens,actions:{toggleMute(){},toggleDeafen(){},leave(){leaves++;}},portrait:()=>node('span')});
const find=cls=>stage.element.querySelectorAll('.'+cls)[0];
const state={callActive:true,connected:true,title:'RE-COMP',room:{id:'one',members:[{id:'alice',name:'alice',display:'Alice',status:'active'}]},speaking:['alice'],canMute:true,canDeafen:true};
stage.update(state);assert(!stage.element.hidden);assert.equal(find('repo-call-stage-toggle').getAttribute('aria-expanded'),'true');
const media=node('video');screenHost.append(media);const mic=find('repo-call-stage-button'),toggle=find('repo-call-stage-toggle');
toggle.onclick();stage.update({...state,muted:true});assert(find('repo-call-stage-body').hidden);assert.equal(media.parent,screenHost);assert.equal(find('repo-call-stage-button'),mic,'polling preserves the focused control');assert.equal(leaves,0);assert.equal(mounts,1);
expander();assert(!find('repo-call-stage-body').hidden);toggle.onclick();stage.update({...state,room:{...state.room,id:'two'}});assert(!find('repo-call-stage-body').hidden,'a new call opens automatically');
stage.update({...state,callActive:false});assert(stage.element.hidden);assert.equal(find('repo-call-stage-roster').children.length,0);

(async()=>{
 let closed=0,fullscreen=0,remoteTrack={kind:'video'},calls=[];
 sandbox.MediaStream=class{constructor(tracks){this.tracks=tracks;}};
 sandbox.RTCRtpReceiver={getCapabilities:()=>({codecs:[{mimeType:'video/VP8'}]})};
 sandbox.RTCPeerConnection=class{constructor(){this.connectionState='connected';}async setRemoteDescription(){this.ontrack({track:remoteTrack});}getTransceivers(){return [{setCodecPreferences(){}}];}async createAnswer(){return {type:'answer',sdp:'fixture'};}async setLocalDescription(d){this.localDescription=d;}close(){closed++;}};
 sandbox.repoVoiceConnection={gather:async()=>{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../repo-screen-share.js'),'utf8'),sandbox);
 const room={id:'one',mine:{status:'active'},screen:{enabled:true,active:{id:'share',display:'Bob'},watching:true}};
 const context={user:'alice',connected:true,room},controller=sandbox.createRepoScreenShare({api:async op=>{calls.push(op);return {sessionDescription:{type:'offer',sdp:'fixture'}};},context:()=>context,changed(){},refresh(){}});
 const host=node('div'),controls=node('div'),noticeHost=node('div');controller.mount(host,()=>{});controller.render(controls,room,true,noticeHost);
 const action=controls.children[0].children[0];await action.onclick();
 assert.equal(document.body.children.length,0,'watching never creates a modal or separate window');assert.equal(host.children[0].tag,'section');
 const video=host.children[0].children.find(n=>n.tag==='video');assert(video.srcObject);video.requestFullscreen=()=>{fullscreen++;return Promise.resolve();};
 controller.render(controls,room,true);assert.equal(controls.children[0].children[0],action,'polling preserves screen controls');assert.equal(host.children[0].children.find(n=>n.tag==='video'),video,'polling preserves the playing video');assert.equal(fullscreen,0,'fullscreen is opt-in');
 await action.onclick();assert.equal(host.children.length,0);assert.equal(video.srcObject,null);assert.equal(closed,1);assert.equal(context.connected,true,'stop watching leaves voice connected');assert.deepEqual(calls,['screen-watch','screen-answer','screen-unwatch']);
 let expiry; sandbox.setTimeout=(callback,delay)=>{assert.equal(delay,5000);expiry=callback;return 1;};sandbox.clearTimeout=()=>{expiry=null;};
 await action.onclick();remoteTrack.onended();controller.render(controls,room,true,noticeHost);
 assert.equal(controls.children[0].children.length,2,'screen notices never enter the buttons row');
 assert.equal(noticeHost.children[0].textContent,'Screen sharing ended.');assert(!noticeHost.hidden);assert.equal(context.connected,true);
 const clearEnded=expiry;clearEnded();controller.render(controls,room,true,noticeHost);assert(noticeHost.hidden,'normal ended notice disappears after five seconds');
 await action.onclick();remoteTrack.onended();const staleExpiry=expiry;await action.onclick();staleExpiry();controller.render(controls,room,true,noticeHost);assert.equal(controller.state().mode,'watch','old notice expiry cannot stop the next screen share');assert(noticeHost.hidden);controller.reset();
 console.log('PASS: inline player, stable controls/video across updates, call collapse/expand, auto-open on a new call, opt-in fullscreen, stop-watching cleanup without ending voice.');
})().catch(error=>{console.error(error);process.exitCode=1;});
