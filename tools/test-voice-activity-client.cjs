'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture(),browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  fixture.sql.prepare('INSERT INTO community_members VALUES(?,?,?)').run(fixture.sessions.bob.user.id,Date.now(),Date.now());
  const context=await fixture.browserContext(browser,'alice'),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{
   window.__cues=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(this.dataset.voiceCue){__cues.push({url:this.src,volume:this.volume});setTimeout(()=>this.dispatchEvent(new Event('ended')),100);return Promise.resolve();}return play.call(this);};
   const Peer=RTCPeerConnection;window.RTCPeerConnection=class extends Peer{constructor(config){super({...config,iceServers:[]});}};
   window.__testAudio=()=>{const ctx=new AudioContext(),gain=ctx.createGain(),tone=ctx.createOscillator(),dest=ctx.createMediaStreamDestination();gain.gain.value=0;tone.connect(gain).connect(dest);tone.start();ctx.resume();return{ctx,gain,stream:dest.stream};};
   navigator.mediaDevices.enumerateDevices=async()=>[{kind:'audioinput',deviceId:'mic-b',label:'Headset microphone'},{kind:'audioinput',deviceId:'broken',label:'Unplugged microphone'}];
   navigator.mediaDevices.getUserMedia=async options=>{if(options?.audio?.deviceId?.exact==='broken')throw new DOMException('Device missing','NotFoundError');window.__previousAudio=window.__localAudio;window.__localAudio=window.__testAudio();return window.__localAudio.stream;};
   window.__ice=pc=>pc.iceGatheringState==='complete'?Promise.resolve():new Promise(resolve=>pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete')resolve();}));
  });
  let joined=false;
  const member=(who)=>({id:fixture.sessions[who].user.id,name:who,display:who==='alice'?'Alice':'Bob',status:'active',muted:false});
  const room={id:'local-test-room',title:'RE-COMP',kind:'community',host:fixture.sessions.bob.user.id,mine:{status:'active'},members:[member('alice'),member('bob')],sources:[{id:fixture.sessions.bob.user.id,name:'bob',trackName:'bob-audio'}]};
  await page.route(fixture.base+'/api/voice/**',async route=>{
   const op=new URL(route.request().url()).pathname.split('/').pop(),body=route.request().postDataJSON();let result={ok:true};
   if(op==='state'||op==='heartbeat')result={enabled:true,budget:{available:true,used:0,resetAt:Date.now()+86400000},community:{members:[member('bob'),...(joined?[member('alice')]:[])]},rooms:joined?[room]:[]};
   else if(op==='community'){joined=true;result={room:room.id};}
   else if(op==='publish')result={sessionDescription:await page.evaluate(async sdp=>{const pc=window.__publishPeer=new RTCPeerConnection();await pc.setRemoteDescription(sdp);await pc.setLocalDescription(await pc.createAnswer());await __ice(pc);return pc.localDescription.toJSON();},body.sessionDescription)};
   else if(op==='subscribe')result=await page.evaluate(async()=>{const pc=window.__subscribePeer=new RTCPeerConnection();window.__remoteAudio=__testAudio();pc.addTrack(__remoteAudio.stream.getAudioTracks()[0],__remoteAudio.stream);await pc.setLocalDescription(await pc.createOffer());await __ice(pc);return{sessionDescription:pc.localDescription.toJSON(),tracks:[{trackName:'bob-audio',mid:pc.getTransceivers()[0].mid}]};});
   else if(op==='answer')await page.evaluate(sdp=>__subscribePeer.setRemoteDescription(sdp),body.sessionDescription);
   else if(op==='leave')joined=false;
   await route.fulfill({json:result});
  });
  await page.goto(fixture.base);await page.waitForFunction(()=>repoVoice?.getState().enabled&&window.repoCommunity);await page.evaluate(()=>repoMessaging.open());
  await page.getByRole('button',{name:'Join RE-COMP voice',exact:true}).click();
  await page.waitForFunction(()=>window.__remoteAudio&&repoVoice.getState().callStatus==='active');
  await page.waitForTimeout(500);assert.deepEqual(await page.evaluate(()=>repoVoice.getState().speaking),[]);
  assert.deepEqual(await page.evaluate(()=>__cues.map(c=>c.url.split('/').pop())),['voice-join.mp3']);assert.equal(await page.evaluate(()=>__cues[0].volume),.25);
  await page.evaluate(()=>dispatchEvent(new Event('online')));await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__cues.length),1);
  room.members.push(member('mallory'));await page.waitForFunction(()=>__cues.length===2,null,{timeout:3500});assert.equal(await page.evaluate(()=>__cues[1].url.endsWith('voice-join.mp3')),true);
  room.members.pop();await page.waitForFunction(()=>__cues.length===3,null,{timeout:3500});assert.equal(await page.evaluate(()=>__cues[2].url.endsWith('voice-leave.mp3')),true);
  await page.evaluate(()=>__localAudio.gain.gain.value=.15);
  await page.waitForFunction(()=>repoVoice.getState().speaking.includes('alice'));
  assert.equal(await page.locator('.rc-voice-person[data-voice-name="alice"]').evaluate(n=>n.classList.contains('is-speaking')),true);
  assert.equal(await page.locator('.rc-member[data-voice-name="alice"]').evaluate(n=>n.classList.contains('is-speaking')),true);
  assert.equal(await page.locator('.repo-voice-person[data-voice-name="alice"]').evaluate(n=>n.classList.contains('is-speaking')),true);
  assert(!await page.evaluate(()=>repoVoice.getState().speaking.includes('bob')));
  await page.locator('.repo-voice-panel').getByRole('button',{name:'Mute',exact:true}).click();await page.waitForFunction(()=>!repoVoice.getState().speaking.includes('alice'));
  await page.evaluate(()=>repoVoice.openSettings());
  const settings=page.getByRole('dialog',{name:'Voice & audio'});
  await settings.getByLabel('Microphone',{exact:true}).selectOption('broken');await settings.getByText('That device is unavailable. Choose a connected device or System default.').waitFor();
  assert.equal(await page.evaluate(()=>__localAudio.stream.getTracks()[0].readyState),'live');assert.equal(await page.evaluate(()=>repoVoiceAudio.get().inputId),'');
  await settings.getByLabel('Microphone',{exact:true}).selectOption('mic-b');await page.waitForFunction(()=>repoVoiceAudio.get().inputId==='mic-b');
  assert.equal(await page.evaluate(()=>__previousAudio.stream.getTracks()[0].readyState),'ended');assert.equal(await page.evaluate(()=>__localAudio.stream.getTracks()[0].enabled),false);assert.equal(await page.evaluate(()=>repoVoice.getState().callStatus),'active');
  await settings.getByLabel('Voice volume',{exact:true}).fill('25');await page.waitForFunction(()=>repoVoiceAudio.get().outputVolume===25);assert.equal(await page.locator('audio').evaluateAll(nodes=>nodes.filter(n=>n.srcObject).every(n=>n.volume===.25)),true);
  await settings.getByRole('button',{name:'Close voice settings'}).click();await page.evaluate(()=>__localAudio.gain.gain.value=.15);
  await page.evaluate(()=>__remoteAudio.gain.gain.value=.15);await page.waitForFunction(()=>repoVoice.getState().speaking.includes('bob'));
  assert.equal(await page.locator('.rc-member[data-voice-name="bob"]').evaluate(n=>n.classList.contains('is-speaking')),true);
  assert(!await page.evaluate(()=>repoVoice.getState().speaking.includes('alice')));
  await page.evaluate(()=>__remoteAudio.gain.gain.value=0);await page.waitForFunction(()=>!repoVoice.getState().speaking.includes('bob'),null,{timeout:3000});
  await page.locator('.repo-voice-panel').getByRole('button',{name:'Unmute',exact:true}).click();await page.waitForFunction(()=>repoVoice.getState().speaking.includes('alice'));
  await page.locator('.repo-voice-panel').getByRole('button',{name:'Deafen',exact:true}).click();await page.waitForFunction(()=>!repoVoice.getState().speaking.includes('alice'));
  room.members.push(member('mallory'));await page.waitForTimeout(200);await page.evaluate(()=>dispatchEvent(new Event('online')));await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>__cues.length),3);
  await page.locator('.repo-voice-panel').getByRole('button',{name:'Undeafen',exact:true}).click();
  await page.locator('.repo-voice-panel').getByRole('button',{name:'Leave',exact:true}).click();await page.waitForFunction(()=>!repoVoice.getState().callActive);
  await page.waitForFunction(()=>__cues.length===4);assert.equal(await page.evaluate(()=>__cues[3].url.endsWith('voice-leave.mp3')&&__cues[3].volume===.0625),true);
  assert.deepEqual(await page.evaluate(()=>repoVoice.getState().speaking),[]);assert.equal(await page.locator('.is-speaking').count(),0);
  assert.equal(await page.evaluate(()=>__localAudio.stream.getTracks().every(t=>t.readyState==='ended')),true);assert.deepEqual(errors,[]);
  console.log('PASS: real WebRTC speaker rings, silence/mute/deafen; microphone replacement preserves call and mute; failed replacement preserves old input; output volume; correct self/peer join/leave sounds without poll duplicates, quiet volume and deafen suppression; leaving clears capture.');
 }finally{await browser.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
