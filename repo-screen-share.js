(() => {
 'use strict';
 window.createRepoScreenShare=({api,context,changed,refresh})=>{
  let revision=0,mode='',busy=false,capture=null,pc=null,roomId=null,shareId=null,notice='',viewerNode=null,video=null,serverStarted=false,mediaHost=null,expand=null;
  const controls=new WeakMap();
  const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  const button=(text,fn)=>{const n=node('button',text);n.type='button';n.className='repo-voice-button';n.onclick=fn;return n;};
  const local=()=>{
   revision++;busy=false;mode='';serverStarted=false;roomId=shareId=null;
   if(capture){capture.getTracks().forEach(t=>{t.onended=null;t.stop();});capture=null;}
   if(pc){pc.ontrack=pc.onconnectionstatechange=null;pc.close();pc=null;}
   if(video){video.pause();video.srcObject=null;video=null;}if(viewerNode){viewerNode.remove();viewerNode=null;}if(mediaHost)mediaHost.hidden=true;
  };
  async function stop(reason=''){
   const room=roomId,op=mode==='publish'?'screen-stop':'screen-unwatch',send=serverStarted;
   local();notice=reason;changed();if(room&&send)await api(op,{room}).catch(()=>{});refresh();
  }
  function connection(valid){
   const peer=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'}],bundlePolicy:'max-bundle'});
   peer.onconnectionstatechange=()=>{if(valid()&&peer.connectionState==='failed')stop('Screen sharing lost its connection. Voice is still connected.');};return peer;
  }
  const description=peer=>({type:peer.localDescription.type,sdp:peer.localDescription.sdp});
  async function connected(peer,valid){
   const until=Date.now()+15000;
   while(valid()&&peer.connectionState!=='connected'){if(peer.connectionState==='failed'||Date.now()>until)throw Error('The screen connection did not respond. Try again.');await new Promise(r=>setTimeout(r,100));}
   if(!valid())throw Object.assign(Error('Call changed.'),{stale:true});
  }
  function viewer(title){
   if(!mediaHost)throw Error('Open Wibs to view the screen.');
   viewerNode=node('section');viewerNode.className='repo-screen-viewer';viewerNode.setAttribute('aria-label','Shared screen');
   const head=node('div');head.className='repo-screen-viewer-head';
   const full=button('Full screen',()=>{const action=document.fullscreenElement?document.exitFullscreen?.():video?.requestFullscreen?.();action?.catch(()=>{loading.hidden=false;loading.textContent='Full screen is unavailable in this window.';});});
   full.title='Full screen';head.append(node('strong',title),full);
   video=node('video');video.autoplay=true;video.muted=true;video.playsInline=true;video.setAttribute('aria-label',title);
   const loading=node('p','Connecting to the screen…');loading.className='repo-screen-loading';loading.setAttribute('role','status');video.addEventListener('playing',()=>{loading.hidden=true;});
   viewerNode.append(head,video,loading);mediaHost.append(viewerNode);mediaHost.hidden=false;expand?.();return video;
  }
  async function begin(watch=false){
   const c=context();if(busy||mode||!c.connected||!c.room||!c.room.screen?.enabled)return;
   notice='';busy=true;mode=watch?'watch':'publish';roomId=c.room.id;shareId=watch?c.room.screen.active?.id:null;
   const version=++revision,identity=c.user,room=roomId,valid=()=>revision===version&&context().user===identity&&context().room?.id===room&&context().connected;
   changed();
   try{
    if(watch){
     if(!shareId)throw Error('This screen share has ended.');
     const peer=connection(valid);pc=peer;const player=viewer(c.room.screen.active.display+'’s screen');
     peer.ontrack=e=>{if(!valid())return;player.srcObject=new MediaStream([e.track]);player.play().catch(()=>{});e.track.onended=()=>{if(valid())stop('Screen sharing ended.');};};
     serverStarted=true;const result=await api('screen-watch',{room,share:shareId},valid);
     await peer.setRemoteDescription(result.sessionDescription);if(!valid())return;for(const transceiver of peer.getTransceivers())transceiver.setCodecPreferences(RTCRtpReceiver.getCapabilities('video').codecs.filter(c=>c.mimeType.toLowerCase()==='video/vp8'));await peer.setLocalDescription(await peer.createAnswer());await window.repoVoiceConnection.gather(peer,valid);
     await api('screen-answer',{room,sessionDescription:description(peer)},valid);await connected(peer,valid);
    }else{
     if(document.documentElement.dataset.repoLauncher==='true'&&document.documentElement.dataset.repoScreenSharing!=='true')throw Error('Update and restart the Windows app to share your screen. Watching already works.');
     if(!navigator.mediaDevices?.getDisplayMedia)throw Error('Screen sharing is unavailable in this browser. Use the Windows app or a desktop browser.');
     const selected=await navigator.mediaDevices.getDisplayMedia({video:{width:{ideal:1280,max:1280},height:{ideal:720,max:720},frameRate:{ideal:15,max:15}},audio:false});
     if(!valid()){selected.getTracks().forEach(t=>t.stop());return;}
     capture=selected;const track=capture.getVideoTracks()[0];if(!track)throw Error('No screen was selected.');
     await track.applyConstraints({width:{max:1280},height:{max:720},frameRate:{max:15}});if(!valid())return;track.contentHint='detail';
     const settings=track.getSettings();if(settings.width>1280||settings.height>720||settings.frameRate>15.1)throw Error('This device could not limit sharing to 720p. Try another window.');
     track.onended=()=>{if(valid())stop();};
     const player=viewer('Your screen · 720p');player.srcObject=capture;player.play().catch(()=>{});
     let transceiver,peer;
     for(let attempt=0;attempt<2;attempt++){
      peer=connection(valid);pc=peer;if(attempt)peer.setConfiguration({iceServers:[],bundlePolicy:'max-bundle'});
      transceiver=peer.addTransceiver(track,{direction:'sendonly',sendEncodings:[{maxBitrate:2000000,maxFramerate:15}]});
      const codecs=RTCRtpSender.getCapabilities('video').codecs.filter(c=>c.mimeType.toLowerCase()==='video/vp8');if(!codecs.length)throw Error('This browser does not support Wibs screen sharing.');transceiver.setCodecPreferences(codecs);
      try{await peer.setLocalDescription(await peer.createOffer());await window.repoVoiceConnection.gather(peer,valid);break;}
      catch(error){if(error.code!=='ICE_NO_CANDIDATES'||attempt||!valid())throw error;peer.onconnectionstatechange=null;peer.close();pc=null;}
     }
     if(!valid())return;serverStarted=true;const result=await api('screen-publish',{room,mid:transceiver.mid,sessionDescription:description(peer)},valid);
     await peer.setRemoteDescription(result.sessionDescription);await connected(peer,valid);await api('screen-ready',{room},valid);
    }
    if(valid()){busy=false;changed();refresh();}
   }catch(error){if(valid())await stop(error.name==='NotAllowedError'||error.name==='AbortError'?'':error.message);}
  }
  addEventListener('repo-screen-share-revoke',()=>stop());
  return {
   mount(host,onExpand){mediaHost=host;expand=onExpand;if(viewerNode){host.append(viewerNode);host.hidden=false;}else host.hidden=true;},
   reset(){local();notice='';},
   sync(room){if(!mode||busy)return;if(!room||room.ended||room.mine.status==='left'||(mode==='publish'&&!room.screen?.publishing)||(mode==='watch'&&(!room.screen?.watching||room.screen.active?.id!==shareId)))stop('Screen sharing ended.');},
   state:()=>({mode,busy}),
   render(container,room,canShare){
    let ui=controls.get(container);
    if(!ui){const area=node('div');area.className='repo-screen-controls';const action=button('Share screen',()=>mode?stop():begin(!!context().room?.screen?.active)),label=node('span'),status=node('p');status.setAttribute('role','status');area.append(action,label,status);container.append(area);ui={area,action,label,status};controls.set(container,ui);}
    ui.area.hidden=!room?.screen?.enabled;if(ui.area.hidden)return;
    const label=mode?(busy?(mode==='publish'?'Preparing your screen…':'Connecting to the screen…'):mode==='publish'?'Sharing your screen · 720p':'Watching shared screen'):room.screen.active?room.screen.active.display+' is sharing':room.screen.closing?'Finishing the previous screen connection…':'';
    ui.label.textContent=label;ui.label.hidden=!label;
    ui.action.textContent=mode?(mode==='publish'?'Stop sharing':'Stop watching'):room.screen.active?'Watch screen':'Share screen';
    ui.action.classList.toggle('is-sharing',!!mode);ui.action.disabled=!mode&&(!canShare||room.screen.closing);
    ui.status.textContent=notice;ui.status.hidden=!notice;
   }
  };
 };
})();
