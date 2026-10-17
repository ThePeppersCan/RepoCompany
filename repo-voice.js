(() => {
  'use strict';
  const account=window.repoAccount;
  if(!account || window.repoVoice)return;
  const client=crypto.randomUUID(), pcs=new Set(), audios=new Map(), controllers=new Set();
  let user=account.state.user?.id||null, epoch=0, generation=0, enabled=false, rooms=[], budget=null, community={members:[]};
  let current=null, stream=null, sender=null, receiver=null, subscribed=new Set(), busy=false, polling=false, muted=false, deafened=false;
  let serverMuted=false,serverDeafened=false;
  const micBlocked=()=>muted||deafened||serverMuted||serverDeafened;
  const soundBlocked=()=>deafened||serverDeafened;
  let ui=null, timer=null, lastContact=0, token='', message='', suspended=false, collapsed=false,pollAgain=false,openingKind='',pageOpen=false;
  let speaking=[],serviceError='';const remoteNames=new Map(),remoteActivity=new Set();
  const audioSettings=window.repoVoiceAudio;
  let inputCapture=null,pendingInput=null,rtpSender=null,changingAudio=false,connected=false,heardMembers=null;
  const screens=window.createRepoScreenShare?.({api,context:()=>({user,connected,room:rooms.find(r=>r.id===current)}),changed:announce,refresh:poll});
  const activity=window.createRepoVoiceActivity?.(names=>{speaking=names;paintSpeaking();dispatchEvent(new CustomEvent('repo-voice-speaking',{detail:{speaking:[...speaking]}}));});
  function paintSpeaking(){ui?.stage?.paintSpeaking(speaking);for(const node of ui?.panel.querySelectorAll('[data-voice-name]')||[]){const active=speaking.includes(node.dataset.voiceName);node.classList.toggle('is-speaking',active);node.title=active?'Speaking':'';}}
  const communityName=()=>window.repoCommunity?.voiceName?.()||'RE-COMP';
  const own=()=>String(account.state.social?.username||account.state.character?.username||'').toLowerCase();
  const joinable=r=>!r.ended&&(r.mine.status==='invited'||(r.kind==='group'&&r.mine.status==='left'));
  const friends=()=>(account.state.social?.friends||[]).filter(f=>f.status==='accepted');
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const button=(text,fn,cls='')=>{const n=el('button','repo-voice-button '+cls,text);n.type='button';n.onclick=fn;return n;};
  const icons={mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',sound:'<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v9H5a2 2 0 0 1-2-2v-7Zm18 0h-4v9h2a2 2 0 0 0 2-2v-7Z"/>',settings:'<path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-.5 2 2.5h3l1-3 3-1 2-3-2-2 1-3-2-3-3 .5L12 3H9Z"/><circle cx="11.5" cy="11.5" r="3"/>',leave:'<path d="M3 15c4-5 14-5 18 0l-2 4-4-2v-3M3 15l2 4 4-2v-3"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>'};
  function iconButton(b,type){const label=b.textContent;b.title=label;b.setAttribute('aria-label',label);b.classList.add('repo-voice-icon-button');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.innerHTML=icons[type];b.replaceChildren(svg);return b;}
  const state=()=>({enabled,serviceError,available:enabled&&budget?.available!==false,callActive:!!current||busy,callStatus:current||busy?(connected?'active':'connecting'):'',incomingCall:rooms.some(r=>!r.ended&&r.mine.status==='invited'),busy,community,currentKind:rooms.find(r=>r.id===current)?.kind||openingKind,budget,speaking:[...speaking],muted:micBlocked(),deafened:soundBlocked(),serverMuted,serverDeafened,canMute:!!stream&&!deafened&&!serverMuted&&!serverDeafened,canDeafen:!!current&&!serverDeafened,leaveLabel:rooms.some(r=>r.id===current&&r.kind==='group'&&r.host===user)?'End room':'Leave call'});
  function toggleMute(){if(!state().canMute)return;muted=!muted;activity?.silence('local');applyMute();announce();poll();}
  function toggleDeafen(){if(!state().canDeafen)return;deafened=!deafened;if(soundBlocked())audioSettings.stopCues();activity?.silence('local');for(const audio of audios.values())audio.muted=soundBlocked();applyMute();announce();poll();}
  function announce(){render();dispatchEvent(new CustomEvent('repo-voice-state',{detail:state()}));}
  async function api(op,payload={},valid=()=>true) {
    const e=epoch,id=user;
    if(!id)throw Error('Sign in to call.');
    const {data:{session}}=await account.db.auth.getSession();
    if(e!==epoch||id!==user||session?.user?.id!==id||!valid())throw Object.assign(Error('Call changed.'),{stale:true});
    token=session.access_token;
    const controller=new AbortController();controllers.add(controller);
    let timedOut=false;const timeout=setTimeout(()=>{timedOut=true;controller.abort();},22000);
    try{
      const response=await fetch('/api/voice/'+op,{method:'POST',cache:'no-store',credentials:'same-origin',signal:controller.signal,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({...payload,client})});
      const data=await response.json();
      if(e!==epoch||id!==user||!valid())throw Object.assign(Error('Call changed.'),{stale:true});
      if(!response.ok)throw Object.assign(Error(data.error||'Voice is temporarily unavailable.'),{status:response.status});
      if(data.enabled===false && op!=='state')throw Error(data.reason||'Voice is not ready yet.');
      return data;
    }catch(error){
      if(e!==epoch||id!==user||!valid())throw Object.assign(Error('Call changed.'),{stale:true});
      if(timedOut||error.name==='AbortError'||error.name==='TimeoutError')throw Error('Voice took too long to respond. Please try joining again.');
      throw error;
    }finally{clearTimeout(timeout);controllers.delete(controller);}
  }
  function stopMedia(){
    screens?.reset();
    serverMuted=serverDeafened=false;
    activity?.clear();remoteNames.clear();remoteActivity.clear();
    generation++;connected=false;heardMembers=null;inputCapture?.stop();pendingInput?.stop();inputCapture=pendingInput=null;rtpSender=null;stream?.getTracks().forEach(t=>t.stop());stream=null;
    for(const pc of pcs){pc.ontrack=pc.onconnectionstatechange=pc.onicecandidateerror=null;pc.close();}pcs.clear();sender=receiver=null;
    for(const audio of audios.values()){audio.pause();audio.srcObject=null;audio.remove();}audios.clear();subscribed.clear();
  }
  async function leave(reason='Call ended.') {
    if(connected&&!soundBlocked())audioSettings.cue('leave');
    const room=current;current=null;busy=false;openingKind='';community={...community,members:community.members.filter(m=>m.name!==own())};muted=deafened=false;stopMedia();message=reason;announce();
    if(room)await api('leave',{room}).catch(()=>{});
    await poll();
  }
  function abandon(reason){
    if(reason&&connected&&!soundBlocked())audioSettings.cue('leave');else audioSettings.stopCues();
    const room=current,oldToken=token;current=null;busy=false;openingKind='';community={...community,members:community.members.filter(m=>m.name!==own())};muted=deafened=false;stopMedia();message=reason;announce();
    if(room&&oldToken)fetch('/api/voice/leave',{method:'POST',keepalive:true,headers:{Authorization:'Bearer '+oldToken,'Content-Type':'application/json'},body:JSON.stringify({room,client})}).catch(()=>{});
  }
  const description=pc=>({type:pc.localDescription.type,sdp:pc.localDescription.sdp});
  const ice=(pc,valid)=>window.repoVoiceConnection.gather(pc,valid);
  function connection(valid,direct=false){
    const pc=new RTCPeerConnection({iceServers:direct?[]:[{urls:'stun:stun.cloudflare.com:3478'}],bundlePolicy:'max-bundle'});pcs.add(pc);
    pc.onicecandidateerror=e=>window.repoVoiceConnection.record('candidate-error',pc,{code:e.errorCode});
    pc.onconnectionstatechange=()=>{if(!valid())return;window.repoVoiceConnection.record('connection-state',pc);if(pc.connectionState==='failed')leave('Voice lost its connection. Please call again.');else announce();};
    return pc;
  }
  async function microphone(valid){
    message='Opening your microphone…';announce();
    window.repoVoiceSettings?.stopPreview();
    inputCapture=await audioSettings.capture(audioSettings.get(),valid);stream=inputCapture.stream;
    inputCapture.raw.getAudioTracks()[0].onended=()=>{if(valid())leave('Your microphone disconnected. Choose a microphone in Voice settings, then rejoin.');};
    applyMute();
    if(!serverMuted&&!serverDeafened)await publishMicrophone(valid);
    await api('ready',{room:current},valid);connected=true;heardMembers=null;if(!soundBlocked())audioSettings.cue('join');lastContact=Date.now();message='';announce();
  }
  async function publishMicrophone(valid){
    if(!connected){message='Connecting audio…';announce();}
    let transceiver;
    for(let attempt=0;attempt<2;attempt++){
      sender=connection(valid,attempt===1);
      transceiver=sender.addTransceiver(stream.getAudioTracks()[0],{direction:'sendonly'});
      rtpSender=transceiver.sender;watchLocal(valid);
      const codecs=RTCRtpSender.getCapabilities?.('audio')?.codecs.filter(c=>c.mimeType.toLowerCase()==='audio/opus');
      if(codecs?.length)transceiver.setCodecPreferences(codecs);
      try{await sender.setLocalDescription(await sender.createOffer());await ice(sender,valid);break;}
      catch(error){if(error.code!=='ICE_NO_CANDIDATES'||attempt||!valid())throw error;
        // Nothing has been published yet. Replace the failed transport without
        // opening a second server session or reserving additional voice usage.
        window.repoVoiceConnection.record('retry-direct',sender);sender.onconnectionstatechange=sender.onicecandidateerror=null;sender.close();pcs.delete(sender);sender=null;
        message='Retrying your voice connection…';announce();
      }
    }
    const reply=await api('publish',{room:current,mid:transceiver.mid,sessionDescription:description(sender)},valid);
    if(!valid())return;
    await sender.setRemoteDescription(reply.sessionDescription);
    const parameters=transceiver.sender.getParameters();if(parameters.encodings?.length){parameters.encodings.forEach(e=>{e.maxBitrate=64000;});await transceiver.sender.setParameters(parameters);}
    await new Promise((resolve,reject)=>{
      const pc=sender,timeout=setTimeout(()=>finish(Error('Could not connect voice on this network.')),18000);
      function finish(e){clearTimeout(timeout);pc.removeEventListener('connectionstatechange',check);e?reject(e):resolve();}
      function check(){if(!valid())finish(Object.assign(Error('Call changed.'),{stale:true}));else if(pc.connectionState==='connected')finish();else if(['failed','closed'].includes(pc.connectionState))finish(Error('Voice could not connect.'));}
      pc.addEventListener('connectionstatechange',check);check();
    });
  }
  function applyMute(){inputCapture?.setMuted(micBlocked());pendingInput?.setMuted(micBlocked());}
  function watchLocal(valid){const localTrack=stream.getAudioTracks()[0],localPeer=sender,transmitter=rtpSender;activity?.watch('local',{name:own(),type:'media-source',read:()=>transmitter.getStats(),enabled:()=>valid()&&localPeer.connectionState==='connected'&&localTrack.readyState==='live'&&localTrack.enabled&&!micBlocked()});}
  function closeReceiving(){
    for(const key of remoteActivity)activity?.remove(key);remoteActivity.clear();remoteNames.clear();
    if(receiver){receiver.ontrack=receiver.onconnectionstatechange=null;receiver.close();pcs.delete(receiver);receiver=null;}
    for(const audio of audios.values()){audio.pause();audio.srcObject=null;audio.remove();}audios.clear();subscribed.clear();
  }
  async function applyModeration(room,valid){
    serverMuted=!!room.mine.serverMuted;serverDeafened=!!room.mine.serverDeafened;applyMute();
    if(serverMuted||serverDeafened){
      activity?.silence('local');
      if(sender){sender.onconnectionstatechange=null;sender.close();pcs.delete(sender);sender=null;rtpSender=null;activity?.remove('local');}
    }
    if(serverDeafened){audioSettings.stopCues();closeReceiving();}
    for(const audio of audios.values())audio.muted=soundBlocked();
    if(!serverMuted&&!serverDeafened&&!sender&&inputCapture&&!room.mine.mediaClosing&&!changingAudio){await publishMicrophone(valid);await api('ready',{room:room.id},valid);}
  }
  async function changeAudio(next){
    if(changingAudio||busy)throw Error('Wait for voice to finish connecting, then change your settings.');
    const before=audioSettings.get(),p=audioSettings.clean(next),e=epoch,g=generation,id=user,valid=()=>epoch===e&&generation===g&&user===id;
    changingAudio=true;let replacement=null;
    try{
      const outputs=[...audios.values()],probe=new Audio();
      if(p.outputId!==before.outputId){
        const results=await Promise.allSettled([...outputs,probe].map(a=>audioSettings.output(a,p)));
        if(results.some(r=>r.status==='rejected')){await Promise.allSettled(outputs.map(a=>audioSettings.output(a,before)));throw results.find(r=>r.status==='rejected').reason;}
      }
      if(!valid())throw Object.assign(Error('Call changed.'),{stale:true});
      if(inputCapture&&p.inputId!==before.inputId){
        replacement=await audioSettings.capture(p,valid);pendingInput=replacement;applyMute();
        if(rtpSender)await rtpSender.replaceTrack(replacement.stream.getAudioTracks()[0]);
        if(!valid())throw Object.assign(Error('Call changed.'),{stale:true});
        const old=inputCapture;inputCapture=replacement;pendingInput=null;replacement=null;stream=inputCapture.stream;applyMute();old.stop();if(rtpSender)watchLocal(valid);
        inputCapture.raw.getAudioTracks()[0].onended=()=>{if(valid())leave('Your microphone disconnected. Choose a microphone in Voice settings, then rejoin.');};
      }else if(inputCapture&&['noiseSuppression','echoCancellation','autoGainControl'].some(k=>p[k]!==before[k]))await inputCapture.processing(p);
      if(!valid())throw Object.assign(Error('Call changed.'),{stale:true});
      inputCapture?.configure(p);for(const a of audios.values())a.volume=p.outputVolume/100;
      audioSettings.save(p);
    }catch(error){if(valid())await Promise.allSettled([...audios.values()].map(a=>audioSettings.output(a,before)));throw error;}
    finally{replacement?.stop();if(pendingInput===replacement)pendingInput=null;changingAudio=false;}
  }
  async function start(options){
    if(current||busy)return;
    if(!enabled){message='Voice is being set up.';announce();return;}
    window.repoVoiceConnection.reset();busy=true;openingKind=options.community?'community':rooms.find(r=>r.id===options.room)?.kind||options.kind;message='Joining voice…';collapsed=false;
    const g=++generation,e=epoch,valid=()=>generation===g&&epoch===e;
    announce();
    try{
      const response=options.community?await api('community',{},valid):options.room?await api('join',{room:options.room},valid):await api('create',options,valid);
      current=response.room||options.room;serverMuted=!!response.serverMuted;serverDeafened=!!response.serverDeafened;lastContact=Date.now();announce();
      await microphone(valid);
    }catch(error){if(!error.stale&&valid())await leave(error.name==='NotAllowedError'?'Microphone permission was declined. Allow it to make a call.':error.message);}
    finally{if(valid()){busy=false;announce();await poll();}}
  }
  async function subscribe(room,valid){
    if([...subscribed].some(track=>!room.sources.some(s=>s.trackName===track))){
      closeReceiving();
      await api('reset-receiver',{room:room.id},valid);subscribed.clear();
    }
    const needed=room.sources.filter(s=>!subscribed.has(s.trackName));
    if(!needed.length)return;
    const response=await api('subscribe',{room:room.id},valid);
    if(!response.sessionDescription)return;
    for(const track of response.tracks||[]){const source=room.sources.find(s=>s.trackName===track.trackName);if(source&&!track.errorCode&&track.mid!==undefined)remoteNames.set(String(track.mid),source.name);}
    if(!receiver){
      receiver=connection(valid);receiver.ontrack=event=>{
        if(!valid())return;
        const audio=el('audio');audio.muted=soundBlocked();audio.srcObject=new MediaStream([event.track]);document.body.append(audio);audios.set(event.track.id,audio);
        const name=remoteNames.get(String(event.transceiver.mid)),key='remote:'+event.track.id,remotePeer=receiver;
        if(name){remoteActivity.add(key);activity?.watch(key,{name,type:'inbound-rtp',read:()=>event.receiver.getStats(),enabled:()=>valid()&&receiver===remotePeer&&remotePeer.connectionState==='connected'&&event.track.readyState==='live'&&!event.track.muted});}
        audioSettings.output(audio).then(()=>{if(valid()&&audios.get(event.track.id)===audio)return audio.play();}).catch(()=>{if(valid()){message='Open Voice settings to check your speaker, or tap “Enable sound”.';announce();}});
        event.track.onended=()=>{activity?.remove(key);remoteActivity.delete(key);audio.pause();audio.srcObject=null;audio.remove();audios.delete(event.track.id);};
      };
    }
    await receiver.setRemoteDescription(response.sessionDescription);
    await receiver.setLocalDescription(await receiver.createAnswer());await ice(receiver,valid);
    await api('answer',{room:room.id,sessionDescription:description(receiver)},valid);
    needed.forEach(s=>subscribed.add(s.trackName));
  }
  function schedulePoll(){clearTimeout(timer);if(user&&!suspended)timer=setTimeout(poll,pollAgain?0:(current?3000:10000));pollAgain=false;}
  async function poll(){
    if(!user||suspended)return;if(polling){pollAgain=true;return;}clearTimeout(timer);polling=true;const e=epoch,g=generation,valid=()=>epoch===e&&generation===g;
    try{
      const result=await api(current?'heartbeat':'state',current?{room:current,muted:muted||deafened}:{},valid);
      if(serviceError&&message===serviceError)message='';serviceError='';
      enabled=!!result.enabled;rooms=result.rooms||[];budget=result.budget||null;community=result.community||{members:[]};
      if(current){
        lastContact=Date.now();const room=rooms.find(r=>r.id===current);
        if(!room||room.ended||room.mine.status==='left'){await leave(room?.mine.reason||room?.reason||'Call ended.');return;}
        screens?.sync(room);
        if(connected){const members=new Set(room.members.filter(m=>m.id!==user&&m.status==='active').map(m=>m.id));if(heardMembers&&!soundBlocked()&&!room.mine.serverDeafened){if([...heardMembers].some(id=>!members.has(id)))audioSettings.cue('leave');if([...members].some(id=>!heardMembers.has(id)))audioSettings.cue('join');}heardMembers=members;}
        // Show membership changes before waiting for SFU negotiation or cleanup.
        announce();
        if(!busy&&connected){await applyModeration(room,valid);if(!serverDeafened&&!room.mine.mediaClosing)await subscribe(room,valid);}
      }
      announce();
    }catch(error){
      if(error.stale)return;
      if(current&&(error.status===401||error.status===403||error.status===404||error.status===410||error.status===429||Date.now()-lastContact>30000))await leave(error.message||'Voice lost its connection.');
      else if(current){message='Reconnecting to voice…';announce();}
      else{serviceError=error.message||'Voice is temporarily unavailable.';message=serviceError;announce();}
    }finally{polling=false;schedulePoll();}
  }
  function render(){
    if(!ui)return;
    ui.group.hidden=!user;ui.group.disabled=!enabled||!!current||busy||budget?.available===false;
    ui.group.title=enabled?(budget?.available===false?'The voice allowance is currently used up':'Invite friends to a voice room'):'Voice is being set up';
    ui.panel.hidden=!user||(!current&&!message&&!rooms.some(joinable)&&!budget);
    ui.panel.replaceChildren();
    const room=rooms.find(r=>r.id===current);
    const callTitle=room?.kind==='private'?'Call with '+(room.members.find(m=>m.id!==user)?.display||'your friend'):room?.kind==='community'||openingKind==='community'?communityName():room?.title||'Voice call';
    ui.stage?.update({...state(),room,title:callTitle,connected});
    if(current||busy){
      const top=el('div','repo-voice-top');top.append(el('span','repo-voice-signal'+(connected?' is-connected':'')),el('strong','',room?.kind==='private'?'Call with '+(room.members.find(m=>m.id!==user)?.display||'your friend'):room?.kind==='community'||openingKind==='community'?communityName():room?.title||'Voice call'));
      if(!ui.drawer.classList.contains('rc-page'))top.append(button(collapsed?'Expand':'Minimize',()=>{collapsed=!collapsed;render();},'repo-voice-small'));ui.panel.append(top);
      if(ui.drawer.classList.contains('rc-page')){top.append(el('span','repo-voice-inline-status',connected?'Connected':'Connecting…'));if(message){const line=el('p','repo-voice-status',message);line.setAttribute('role','status');ui.panel.append(line);}}
      else{const line=el('p','repo-voice-status',message||(connected?'Connected':'Connecting…'));line.setAttribute('role','status');ui.panel.append(line);}
      if(!ui.drawer.classList.contains('rc-page')&&!collapsed&&room){const roster=el('div','repo-voice-roster');for(const m of room.members){const person=el('span','repo-voice-person');person.dataset.voiceName=m.name;const portrait=el('span','repo-voice-avatar',m.display.slice(0,2).toUpperCase()),profile=m.id===user?account.state.social?.profile:friends().find(f=>f.username.toLowerCase()===m.name);if(profile?.avatar&&window.repoAvatar){portrait.replaceChildren();portrait.insertAdjacentHTML('beforeend',window.repoAvatar.markup(profile.avatar,m.display));window.repoAvatar.hydrate(portrait);}window.repoProfilePhotos?.paint(portrait,m.name);person.append(portrait,el('span','',m.display+(m.id===user?' (you)':'')+(m.status==='invited'?' · invited':m.muted?' · muted':'')));roster.append(person);}ui.panel.append(roster);}
      const controls=el('div','repo-voice-controls');
      const mic=button(serverMuted||serverDeafened?'Server muted':muted||deafened?'Unmute':'Mute',toggleMute);mic.setAttribute('aria-pressed',String(micBlocked()));mic.disabled=!state().canMute;
      const sound=button(serverDeafened?'Server deafened':deafened?'Undeafen':'Deafen',toggleDeafen);sound.setAttribute('aria-pressed',String(soundBlocked()));sound.disabled=!state().canDeafen;
      if(serverMuted||serverDeafened)ui.panel.append(el('p','repo-voice-status',serverDeafened?'A Developer has disabled your microphone and incoming audio in '+communityName()+'.':'A Developer has muted your microphone in '+communityName()+'.'));
      const disconnect=iconButton(button(room?.kind==='group'&&room.host===user?'End room':'Leave',()=>leave(),'repo-voice-end'),'leave');
      if(!ui.drawer.classList.contains('rc-page')){controls.append(iconButton(mic,'mic'),iconButton(sound,'sound'),iconButton(button('Voice settings',()=>window.repoVoiceSettings?.open()),'settings'),disconnect);ui.panel.append(controls);}
      if(message.includes('Enable sound'))ui.panel.append(button('Enable sound',async()=>{try{await Promise.all([...audios.values()].map(async a=>{await audioSettings.output(a);await a.play();}));message='';announce();}catch{message='Your selected speaker is unavailable. Choose another in Voice settings.';announce();}}));
    }else{
      if(budget?.available===false)ui.panel.append(el('p','repo-voice-status','Voice is paused because the shared allowance is used up. It will reopen automatically.'));
      for(const invite of rooms.filter(joinable)){
        const row=el('div','repo-voice-invite'),host=invite.members.find(m=>m.id===invite.host);
        row.append(el('strong','',invite.kind==='private'?`${host?.display||'A friend'} is calling`:`${host?.display||'A friend'} invited you to ${invite.title}`));
        const controls=el('div','repo-voice-controls');controls.append(button(invite.kind==='private'?'Answer':'Join room',()=>start({room:invite.id})),button('Decline',async()=>{await api('leave',{room:invite.id}).catch(()=>{});await poll();}));row.append(controls);ui.panel.append(row);
      }
      if(message){const top=el('div','repo-voice-top');top.append(el('strong','','Voice'),iconButton(button('Dismiss',()=>{message='';render();},'repo-voice-small'),'close'));const status=el('p','repo-voice-status',message);status.setAttribute('role','status');ui.panel.append(top,status);if(/connect|network|address|respond/i.test(message))ui.panel.append(button('Download connection report',()=>window.repoVoiceConnection.download(),'repo-voice-small'));}
    }
    ui.chip.hidden=!current&&!state().incomingCall;
    ui.chip.textContent=current?(micBlocked()?'Mic muted · Return to voice':connected?'Voice connected · Return to call':'Connecting voice · Return to call'):'Incoming voice invitation';
    if(budget){
      const usage=el('section','repo-wibs-usage');usage.append(el('h3','repo-wibs-usage-heading','Monthly'));
      const percent=Math.min(100,Math.max(0,budget.used/budget.limit*100)),value=el('span','repo-wibs-usage-value',percent.toFixed(1)+'%'),track=el('div','repo-wibs-usage-track'),fill=el('span');track.setAttribute('role','progressbar');track.setAttribute('aria-label','Monthly Wibs usage');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',percent.toFixed(1));track.setAttribute('aria-valuetext',`${(budget.used/1e9).toFixed(1)} of ${budget.limit/1e9} GB used`);fill.style.width=percent+'%';track.append(fill);usage.classList.toggle('is-near-limit',percent>=80);usage.classList.toggle('is-at-limit',budget.available===false);
        const amount=el('span','repo-wibs-usage-amount',`${(budget.used/1e9).toFixed(1)} / ${budget.limit/1e9} GB`);amount.title='Conservative shared allowance for all Wibs voice and screen sharing, including a safety margin. Not the provider’s billing meter.';
        const resetAt=new Date(budget.resetAt),reset=el('time','repo-wibs-usage-reset','Resets '+resetAt.toLocaleDateString('en-GB',{day:'numeric',month:'short'}));reset.dateTime=resetAt.toISOString();reset.title='Resets '+resetAt.toLocaleString();
        const details=el('div','repo-wibs-usage-details'),used=el('span','repo-wibs-usage-used');used.append(value,amount);details.append(used,reset);usage.append(track,details);
        if(budget.rollingGuard)usage.append(el('small','repo-wibs-usage-reset','Recent usage is still protected; access returns as it clears.'));
      ui.panel.append(usage);
    }paintSpeaking();
  }
  function createRoom(){
    ui.form.replaceChildren();ui.form.hidden=false;
    const title=el('input');title.placeholder='Room name';title.maxLength=48;title.value='Voice room';title.setAttribute('aria-label','Voice room name');
    const legend=el('p','','Invite up to seven friends');const choices=el('div','repo-voice-choices');
    for(const f of friends()){const label=el('label'),box=el('input');box.type='checkbox';box.value=f.username.toLowerCase();label.append(box,document.createTextNode(f.display_name||f.username));choices.append(label);}
    const error=el('p','repo-voice-status');error.setAttribute('role','status');
    const actions=el('div','repo-voice-controls');actions.append(button('Start room',()=>{const selected=[...choices.querySelectorAll('input:checked')].map(i=>i.value);if(!selected.length||selected.length>7){error.textContent='Choose between one and seven friends.';return;}ui.form.hidden=true;start({kind:'group',title:title.value,friends:selected});}),button('Cancel',()=>{ui.form.hidden=true;}));
    ui.form.append(el('strong','','New voice room'),title,legend,choices,error,actions);title.focus();
  }
  function mount({drawer,head,context}){
    const panel=el('section','repo-voice-panel'),form=el('section','repo-voice-form');panel.setAttribute('aria-label','Voice call');form.setAttribute('aria-label','Create voice room');panel.hidden=form.hidden=true;
    const group=button('Voice room',createRoom,'repo-voice-create');head.insertBefore(group,head.lastChild);head.after(panel,form);
    const chip=button('Return to voice',()=>{window.repoMessaging?.open();collapsed=false;render();},'repo-voice-chip');chip.hidden=true;document.body.append(chip);
    const portrait=m=>{const node=el('span','repo-voice-avatar',m.display.slice(0,2).toUpperCase()),profile=m.id===user?account.state.social?.profile:friends().find(f=>f.username.toLowerCase()===m.name);if(profile?.avatar&&window.repoAvatar){node.replaceChildren();node.insertAdjacentHTML('beforeend',window.repoAvatar.markup(profile.avatar,m.display));window.repoAvatar.hydrate(node);}window.repoProfilePhotos?.paint(node,m.name);return node;};
    const stage=window.createRepoCallStage?.({screens,actions:{toggleMute,toggleDeafen,leave:()=>leave()},portrait});if(stage)head.after(stage.element);
    ui={drawer,group,panel,form,chip,stage,budget:el('p','repo-voice-budget'),context};announce();poll();
  }
  function changed(){
    const next=account.state.user?.id||null;
    if(next!==user){abandon('');epoch++;controllers.forEach(c=>c.abort());user=next;token='';rooms=[];budget=null;community={members:[]};enabled=false;message=serviceError='';if(ui)ui.form.hidden=true;announce();poll();}
  }
  addEventListener('repo-account-state',changed);
  addEventListener('offline',()=>abandon('You are offline. Call again when connected.'));
  addEventListener('online',poll);
  addEventListener('pagehide',()=>{suspended=true;abandon('');clearTimeout(timer);});
  addEventListener('pageshow',()=>{suspended=false;poll();});
  addEventListener('repo-messaging-state',()=>{const open=!!document.getElementById('repo-messages')?.open;if(open!==pageOpen){pageOpen=open;if(open)poll();else if(!polling)schedulePoll();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
  window.repoVoiceSettings?.configure({apply:changeAudio,capture:()=>inputCapture});
  addEventListener('repo-community-voice-name',()=>render());
  window.repoVoice=Object.freeze({mount,getState:state,toggleMute,toggleDeafen,openSettings:()=>window.repoVoiceSettings?.open(),joinCommunity:()=>start({community:true}),startPrivate:username=>start({kind:'private',friends:[String(username).toLowerCase()]}),moderate:async(username,action,options={})=>{const result=await api('moderate',{username,action,...options});community=result.community||community;announce();await poll();},leave});
  schedulePoll();
})();
