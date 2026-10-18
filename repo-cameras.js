(() => {
 'use strict';
 window.createRepoCameras=({api,context,changed,refresh})=>{
  let host,expand,notice='',pub=null,recv=null,pubVersion=0,recvVersion=0,wantWatch=true,watchUntil=0,closing=0,watchRequests=0,menu=null;
  const hiddenOwners=new Set();
  const controls=new WeakMap();
  const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  const hidden=owner=>!wantWatch||hiddenOwners.has(owner);
  const sources=room=>(room?.cameras?.active||[]).filter(t=>t.owner!==context().user&&!hidden(t.owner));
  const announce=()=>{if(host)host.hidden=!host.children.length;changed();};
  function closeMenu(){menu?.remove();menu=null;}
  async function togglePerson(owner){
   if(hidden(owner)){hiddenOwners.delete(owner);if(!wantWatch){wantWatch=true;watchUntil=0;}}
   else hiddenOwners.add(owner);
   closeMenu();await stopWatching('',true);
  }
  function options(target,owner,display){
   const open=event=>{
    if(owner===context().user||!context().room?.cameras?.active.some(t=>t.owner===owner))return;
    event.preventDefault();event.stopPropagation();closeMenu();
    menu=el('div');menu.className='repo-camera-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label',display+' webcam');menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeMenu();target.focus();}});
    const action=el('button',hidden(owner)?'Show webcam':'Hide webcam');action.type='button';action.setAttribute('role','menuitem');action.onclick=()=>{togglePerson(owner);target.focus();};menu.append(action);
    (host.closest('dialog')||host.parentElement).append(menu);
    const rect=target.getBoundingClientRect(),x=event.type==='contextmenu'?event.clientX:rect.left,y=event.type==='contextmenu'?event.clientY:rect.bottom;
    menu.style.left=Math.max(8,Math.min(x,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-menu.offsetHeight-8))+'px';action.focus();
   };
   target.addEventListener('contextmenu',open);
   target.addEventListener('keydown',event=>{if(event.key==='ContextMenu'||(event.shiftKey&&event.key==='F10'))open(event);});
   return open;
  }
  document.addEventListener('pointerdown',event=>{if(menu&&!menu.contains(event.target))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  function tile(title,local=false,owner){
   const box=el('section');box.className='repo-camera-tile';box.setAttribute('aria-label',title);
   const video=el('video');video.autoplay=true;video.muted=true;video.playsInline=true;if(local)video.className='is-local';video.setAttribute('aria-label',title);
   const name=el('span',title),loading=el('span','Connecting…');loading.className='repo-camera-loading';video.addEventListener('playing',()=>loading.remove());
   box.append(video,name,loading);
   if(owner){box.dataset.cameraOwner=owner;const more=el('button','⋯');more.type='button';more.className='repo-camera-options';more.setAttribute('aria-label',title+' options');more.setAttribute('aria-haspopup','menu');more.onclick=options(box,owner,title);box.append(more);}
   host?.append(box);if(host)host.hidden=false;expand?.();return {box,video};
  }
  function dispose(s){if(!s)return;s.stream?.getTracks().forEach(t=>{t.onended=null;t.stop();});if(s.peer){s.peer.ontrack=s.peer.onconnectionstatechange=null;s.peer.close();}for(const t of s.tiles){t.video.pause();t.video.srcObject=null;t.box.remove();}}
  async function stopPublish(reason=''){
   const old=pub;pub=null;pubVersion++;dispose(old);notice=reason;announce();
   if(old?.started)await api('camera-stop',{room:old.room}).catch(()=>{});refresh();
  }
  async function stopWatching(reason='',keep=false){
   const old=recv;recv=null;recvVersion++;if(!keep){wantWatch=false;watchUntil=0;}dispose(old);notice=reason;announce();
   if(old?.started){closing++;try{await api('camera-unwatch',{room:old.room}).catch(()=>{});}finally{closing--;}}refresh();
  }
  function peer(valid,onFailure){
   const p=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'}],bundlePolicy:'max-bundle'});
   p.onconnectionstatechange=()=>{if(valid()&&p.connectionState==='failed')onFailure('Camera connection lost. Your voice call is still connected.');};return p;
  }
  const description=p=>({type:p.localDescription.type,sdp:p.localDescription.sdp});
  const codecs=()=>RTCRtpSender.getCapabilities('video').codecs.filter(c=>c.mimeType.toLowerCase()==='video/vp8');
  async function connected(p,valid){const until=Date.now()+15000;while(valid()&&p.connectionState!=='connected'){if(p.connectionState==='failed'||Date.now()>until)throw Error('The camera connection did not respond. Try again.');await new Promise(r=>setTimeout(r,100));}if(!valid())throw Error('Call changed.');}
  async function publish(){
   const c=context();if(pub||!c.connected||!c.room?.cameras?.enabled)return;
   const version=++pubVersion,s={room:c.room.id,user:c.user,tiles:[],busy:true,started:false};pub=s;notice='';announce();
   const valid=()=>pubVersion===version&&context().connected&&context().user===s.user&&context().room?.id===s.room;
   try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access is unavailable on this device.');
    const capture=await navigator.mediaDevices.getUserMedia({audio:false,video:{width:{ideal:640,max:640},height:{ideal:360,max:360},frameRate:{ideal:15,max:15},facingMode:'user'}});
    if(!valid()){capture.getTracks().forEach(t=>t.stop());return;}s.stream=capture;
    const track=capture.getVideoTracks()[0];if(!track)throw Error('No camera was found.');
    await track.applyConstraints({width:{max:640},height:{max:360},frameRate:{max:15}});if(!valid())return;
    const settings=track.getSettings();if(settings.width>640||settings.height>360||settings.frameRate>15.1)throw Error('This camera could not use the low-data setting.');
    track.contentHint='motion';track.onended=()=>{if(valid())stopPublish('Camera turned off.');};
    const player=tile('You · camera',true);s.tiles.push(player);player.video.srcObject=capture;player.video.play().catch(()=>{});
    let transceiver;
    for(let attempt=0;attempt<2;attempt++){
     s.peer=peer(valid,stopPublish);if(attempt)s.peer.setConfiguration({iceServers:[],bundlePolicy:'max-bundle'});
     transceiver=s.peer.addTransceiver(track,{direction:'sendonly',sendEncodings:[{maxBitrate:1000000,maxFramerate:15}]});
     const preferred=codecs();if(!preferred.length)throw Error('This device does not support Wibs cameras.');transceiver.setCodecPreferences(preferred);
     try{await s.peer.setLocalDescription(await s.peer.createOffer());await window.repoVoiceConnection.gather(s.peer,valid);break;}
     catch(error){if(error.code!=='ICE_NO_CANDIDATES'||attempt||!valid())throw error;s.peer.onconnectionstatechange=null;s.peer.close();}
    }
    if(!valid())return;s.started=true;
    const reply=await api('camera-publish',{room:s.room,mid:transceiver.mid,sessionDescription:description(s.peer)},valid);
    if(!valid()){await api('camera-stop',{room:s.room}).catch(()=>{});return;}
    await s.peer.setRemoteDescription(reply.sessionDescription);await connected(s.peer,valid);await api('camera-ready',{room:s.room},valid);
    if(valid()){s.busy=false;s.readyAt=Date.now();announce();refresh();}
   }catch(error){if(valid())await stopPublish(error.name==='NotAllowedError'?'Camera permission was declined. You can still use voice.':error.name==='NotFoundError'?'No camera was found.':error.message);}
  }
  async function watch(){
   const c=context();if(recv||closing||watchRequests||!wantWatch||!c.connected||!c.room?.cameras?.enabled||c.room.cameras.watchClosing||!sources(c.room).length)return;
   if(!watchUntil)watchUntil=Date.now()+3600000;
   watchRequests++;
   const version=++recvVersion,s={room:c.room.id,user:c.user,tiles:[],busy:true,started:false,sources:[]};recv=s;notice='';announce();
   const valid=()=>recvVersion===version&&wantWatch&&context().connected&&context().user===s.user&&context().room?.id===s.room;
   try{
    s.peer=peer(valid,reason=>stopWatching(reason));s.started=true;
    const reply=await api('camera-watch',{room:s.room,owners:sources(c.room).map(t=>t.owner)},valid);
    if(!valid()){await api('camera-unwatch',{room:s.room}).catch(()=>{});return;}
    s.sources=reply.tracks.map(t=>t.id).sort();
    s.peer.ontrack=e=>{if(!valid())return;const source=reply.tracks.find(t=>t.mid===e.transceiver.mid);if(!source||hidden(source.owner))return;const player=tile(source.display+' · camera',false,source.owner);s.tiles.push(player);player.video.srcObject=new MediaStream([e.track]);player.video.play().catch(()=>{});};
    await s.peer.setRemoteDescription(reply.sessionDescription);if(!valid())return;
    for(const t of s.peer.getTransceivers())t.setCodecPreferences(codecs());
    await s.peer.setLocalDescription(await s.peer.createAnswer());await window.repoVoiceConnection.gather(s.peer,valid);await api('camera-answer',{room:s.room,sessionDescription:description(s.peer)},valid);await connected(s.peer,valid);
    if(valid()){s.busy=false;s.readyAt=Date.now();announce();refresh();}
   }catch(error){if(valid())await stopWatching(error.message);}finally{watchRequests--;if(!valid())refresh();}
  }
  function reset(){pubVersion++;recvVersion++;dispose(pub);dispose(recv);pub=recv=null;wantWatch=true;watchUntil=0;hiddenOwners.clear();closeMenu();notice='';if(host)host.hidden=true;}
  addEventListener('repo-camera-revoke',()=>{stopPublish('Camera permission was removed.');});
  // Existing installed clients emit this when all call-device grants reset.
  addEventListener('repo-screen-share-revoke',()=>{if(pub)stopPublish('Camera permission was removed.');});
  return {
   mount(node,onExpand){host=node;expand=onExpand;host.classList.add('repo-camera-grid');for(const s of [pub,recv])for(const t of s?.tiles||[])host.append(t.box);host.hidden=!host.children.length;},
   reset,
   hidden,
   person(row,owner,display){
    if(owner===context().user||!context().room?.cameras?.active.some(t=>t.owner===owner))return;
    row.tabIndex=0;const open=options(row,owner,display),more=el('button','⋯');more.type='button';more.className='repo-camera-person-options';more.setAttribute('aria-label',display+' webcam options');more.setAttribute('aria-haspopup','menu');more.onclick=open;row.append(more);
   },
   sync(room){
    if(!room||room.ended||room.mine.status==='left'){reset();return;}
    const c=room.cameras;
    if(!c?.enabled||room.mine.serverDeafened){if(pub)stopPublish('Cameras are unavailable for this call.');if(recv)stopWatching('',true);return;}
    if(pub&&!pub.busy&&!c.publishing&&Date.now()-pub.readyAt>4000)stopPublish('Your camera session ended. You can turn it on again.');
    if(wantWatch&&watchUntil&&Date.now()>=watchUntil){stopWatching('Camera viewing reached one hour. Open a person’s webcam options and choose Show webcam to continue.');return;}
    if(recv&&!recv.busy){
     const next=sources(room).map(t=>t.id).sort();
     if(JSON.stringify(next)!==JSON.stringify(recv.sources)||(!c.watching.length&&Date.now()-recv.readyAt>4000)){stopWatching('',true);return;}
    }
    if(wantWatch&&!recv&&!c.watchClosing)watch();
   },
   render(container,room,allowed,noticeHost){
    let ui=controls.get(container);
    if(!ui){const area=el('div');area.className='repo-camera-controls';const camera=el('button'),status=el('p');status.setAttribute('role','status');camera.type='button';camera.className='repo-call-stage-button repo-call-media-button';camera.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 6-4v12l-6-4"/></svg>';camera.onclick=()=>pub?stopPublish():publish();area.append(camera);container.append(area);noticeHost.append(status);ui={area,camera,status};controls.set(container,ui);}
    const label=pub?(pub.busy?'Cancel camera':'Turn camera off'):'Turn camera on';
    ui.area.hidden=!room?.cameras?.enabled;ui.camera.setAttribute('aria-label',label);ui.camera.title=label+' · 360p · counts toward Wibs usage';ui.camera.setAttribute('aria-pressed',String(!!pub));ui.camera.disabled=!pub&&(!allowed||room?.cameras?.publishClosing||room?.cameras?.active.length>=room?.cameras?.maximum);
    ui.status.textContent=notice;ui.status.hidden=!notice;noticeHost.hidden=!notice;
   }
  };
 };
})();
