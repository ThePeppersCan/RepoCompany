(() => {
  'use strict';
  const account=window.repoAccount;
  if(!account || window.repoVoice)return;
  const client=crypto.randomUUID(), pcs=new Set(), audios=new Map(), controllers=new Set();
  let user=account.state.user?.id||null, epoch=0, generation=0, enabled=false, rooms=[], budget=null, community={members:[]};
  let current=null, stream=null, sender=null, receiver=null, subscribed=new Set(), busy=false, polling=false, muted=false, deafened=false;
  let ui=null, timer=null, lastContact=0, token='', message='', suspended=false, collapsed=false;
  const own=()=>String(account.state.social?.username||account.state.character?.username||'').toLowerCase();
  const joinable=r=>!r.ended&&(r.mine.status==='invited'||(r.kind==='group'&&r.mine.status==='left'));
  const friends=()=>(account.state.social?.friends||[]).filter(f=>f.status==='accepted');
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const button=(text,fn,cls='')=>{const n=el('button','repo-voice-button '+cls,text);n.type='button';n.onclick=fn;return n;};
  const state=()=>({enabled,available:enabled&&budget?.available!==false,callActive:!!current||busy,callStatus:current?(sender?.connectionState==='connected'?'active':'connecting'):'',incomingCall:rooms.some(r=>!r.ended&&r.mine.status==='invited'),busy,community,currentKind:rooms.find(r=>r.id===current)?.kind||'',budget});
  function announce(){render();dispatchEvent(new CustomEvent('repo-voice-state',{detail:state()}));}
  async function api(op,payload={},valid=()=>true) {
    const e=epoch,id=user;
    if(!id)throw Error('Sign in to call.');
    const {data:{session}}=await account.db.auth.getSession();
    if(e!==epoch||id!==user||session?.user?.id!==id||!valid())throw Object.assign(Error('Call changed.'),{stale:true});
    token=session.access_token;
    const controller=new AbortController();controllers.add(controller);
    const timeout=setTimeout(()=>controller.abort(),22000);
    try{
      const response=await fetch('/api/voice/'+op,{method:'POST',cache:'no-store',credentials:'same-origin',signal:controller.signal,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({...payload,client})});
      const data=await response.json();
      if(e!==epoch||id!==user||!valid())throw Object.assign(Error('Call changed.'),{stale:true});
      if(!response.ok)throw Object.assign(Error(data.error||'Voice is temporarily unavailable.'),{status:response.status});
      if(data.enabled===false && op!=='state')throw Error(data.reason||'Voice is not ready yet.');
      return data;
    }finally{clearTimeout(timeout);controllers.delete(controller);}
  }
  function stopMedia(){
    generation++;stream?.getTracks().forEach(t=>t.stop());stream=null;
    for(const pc of pcs){pc.ontrack=pc.onconnectionstatechange=null;pc.close();}pcs.clear();sender=receiver=null;
    for(const audio of audios.values()){audio.pause();audio.srcObject=null;audio.remove();}audios.clear();subscribed.clear();
  }
  async function leave(reason='Call ended.') {
    const room=current;current=null;busy=false;muted=deafened=false;stopMedia();message=reason;announce();
    if(room)await api('leave',{room}).catch(()=>{});
    await poll();
  }
  function abandon(reason){
    const room=current,oldToken=token;current=null;busy=false;stopMedia();message=reason;announce();
    if(room&&oldToken)fetch('/api/voice/leave',{method:'POST',keepalive:true,headers:{Authorization:'Bearer '+oldToken,'Content-Type':'application/json'},body:JSON.stringify({room,client})}).catch(()=>{});
  }
  const description=pc=>({type:pc.localDescription.type,sdp:pc.localDescription.sdp});
  async function ice(pc,valid){
    if(pc.iceGatheringState==='complete')return;
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>finish(Error('Your network could not connect to voice.')),10000);function finish(error){clearTimeout(timeout);pc.removeEventListener('icegatheringstatechange',change);error?reject(error):resolve();}function change(){if(!valid())finish(Object.assign(Error('Call changed.'),{stale:true}));else if(pc.iceGatheringState==='complete')finish();}pc.addEventListener('icegatheringstatechange',change);change();});
  }
  function connection(valid){
    const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'}],bundlePolicy:'max-bundle'});pcs.add(pc);
    pc.onconnectionstatechange=()=>{if(!valid())return;if(pc.connectionState==='failed')leave('Voice lost its connection. Please call again.');else announce();};
    return pc;
  }
  async function microphone(valid){
    if(!navigator.mediaDevices?.getUserMedia)throw Error('This browser cannot use a microphone. Use HTTPS or the Repo Company client.');
    const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1},video:false});
    if(!valid()){media.getTracks().forEach(t=>t.stop());throw Object.assign(Error('Call changed.'),{stale:true});}
    stream=media;stream.getAudioTracks()[0].onended=()=>{if(valid())leave('Your microphone disconnected.');};
    sender=connection(valid);
    const transceiver=sender.addTransceiver(stream.getAudioTracks()[0],{direction:'sendonly'});
    const codecs=RTCRtpSender.getCapabilities?.('audio')?.codecs.filter(c=>c.mimeType.toLowerCase()==='audio/opus');
    if(codecs?.length)transceiver.setCodecPreferences(codecs);
    await sender.setLocalDescription(await sender.createOffer());await ice(sender,valid);
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
    await api('ready',{room:current},valid);lastContact=Date.now();message='';announce();
  }
  async function start(options){
    if(current||busy)return;
    if(!enabled){message='Voice is being set up.';announce();return;}
    busy=true;message='Connecting your microphone…';collapsed=false;
    const g=++generation,e=epoch,valid=()=>generation===g&&epoch===e;
    announce();
    try{
      const response=options.community?await api('community',{},valid):options.room?await api('join',{room:options.room},valid):await api('create',options,valid);
      current=response.room||options.room;lastContact=Date.now();announce();
      await microphone(valid);
    }catch(error){if(!error.stale&&valid())await leave(error.name==='NotAllowedError'?'Microphone permission was declined. Allow it to make a call.':error.message);}
    finally{if(valid()){busy=false;announce();await poll();}}
  }
  async function subscribe(room,valid){
    if([...subscribed].some(track=>!room.sources.some(s=>s.trackName===track))){
      await api('reset-receiver',{room:room.id},valid);
      if(receiver){receiver.ontrack=receiver.onconnectionstatechange=null;receiver.close();pcs.delete(receiver);receiver=null;}
      for(const audio of audios.values()){audio.pause();audio.srcObject=null;audio.remove();}audios.clear();subscribed.clear();
    }
    const needed=room.sources.filter(s=>!subscribed.has(s.trackName));
    if(!needed.length)return;
    const response=await api('subscribe',{room:room.id},valid);
    if(!response.sessionDescription)return;
    if(!receiver){
      receiver=connection(valid);receiver.ontrack=event=>{
        if(!valid())return;
        const audio=el('audio');audio.autoplay=true;audio.muted=deafened;audio.srcObject=new MediaStream([event.track]);document.body.append(audio);audios.set(event.track.id,audio);
        audio.play().catch(()=>{message='Tap “Enable sound” to hear the call.';announce();});
        event.track.onended=()=>{audio.pause();audio.srcObject=null;audio.remove();audios.delete(event.track.id);};
      };
    }
    await receiver.setRemoteDescription(response.sessionDescription);
    await receiver.setLocalDescription(await receiver.createAnswer());await ice(receiver,valid);
    await api('answer',{room:room.id,sessionDescription:description(receiver)},valid);
    needed.forEach(s=>subscribed.add(s.trackName));
  }
  async function poll(){
    if(polling||!user||suspended)return;polling=true;const e=epoch,g=generation,valid=()=>epoch===e&&generation===g;
    try{
      const result=await api(current?'heartbeat':'state',current?{room:current,muted:muted||deafened}:{},valid);
      enabled=!!result.enabled;rooms=result.rooms||[];budget=result.budget||null;community=result.community||{members:[]};
      if(current){
        lastContact=Date.now();const room=rooms.find(r=>r.id===current);
        if(!room||room.ended||room.mine.status==='left'){await leave(room?.reason||'Call ended.');return;}
        if(!busy&&sender?.connectionState==='connected')await subscribe(room,valid);
      }
      announce();
    }catch(error){
      if(error.stale)return;
      if(current&&(error.status===401||error.status===403||error.status===404||error.status===410||error.status===429||Date.now()-lastContact>30000))await leave(error.message||'Voice lost its connection.');
      else if(current){message='Reconnecting to voice…';announce();}
    }finally{polling=false;}
  }
  function render(){
    if(!ui)return;
    ui.group.hidden=!user;ui.group.disabled=!enabled||!!current||busy||budget?.available===false;
    ui.group.title=enabled?(budget?.available===false?'The voice allowance is currently used up':'Invite friends to a voice room'):'Voice is being set up';
    ui.panel.hidden=!user||(!current&&!message&&!rooms.some(joinable)&&budget?.available!==false);
    ui.panel.replaceChildren();
    const room=rooms.find(r=>r.id===current);
    if(current||busy){
      const top=el('div','repo-voice-top');top.append(el('strong','',room?.kind==='private'?'Call with '+(room.members.find(m=>m.id!==user)?.display||'your friend'):room?.title||'Voice call'));
      top.append(button(collapsed?'Expand':'Minimize',()=>{collapsed=!collapsed;render();},'repo-voice-small'));ui.panel.append(top);
      const line=el('p','repo-voice-status',message||(sender?.connectionState==='connected'?(room?.members.filter(m=>m.status==='active').length>1?'Connected':'Waiting for your friends…'):'Connecting…'));line.setAttribute('role','status');ui.panel.append(line);
      if(!collapsed&&room){const roster=el('div','repo-voice-roster');for(const m of room.members){const person=el('span','repo-voice-person',m.display+(m.id===user?' (you)':'')+(m.status==='invited'?' · invited':m.muted?' · muted':''));roster.append(person);}ui.panel.append(roster);}
      const controls=el('div','repo-voice-controls');
      const mic=button(muted||deafened?'Unmute':'Mute',()=>{muted=!muted;stream?.getAudioTracks().forEach(t=>t.enabled=!muted&&!deafened);announce();poll();});mic.setAttribute('aria-pressed',String(muted||deafened));mic.disabled=!stream||deafened;
      const sound=button(deafened?'Undeafen':'Deafen',()=>{deafened=!deafened;for(const audio of audios.values())audio.muted=deafened;stream?.getAudioTracks().forEach(t=>t.enabled=!muted&&!deafened);announce();poll();});sound.setAttribute('aria-pressed',String(deafened));
      controls.append(mic,sound,button(room?.kind==='group'&&room.host===user?'End room':'Leave',()=>leave(),'repo-voice-end'));ui.panel.append(controls);
      if(message.includes('Enable sound'))ui.panel.append(button('Enable sound',async()=>{try{await Promise.all([...audios.values()].map(a=>a.play()));message='';announce();}catch{}}));
    }else{
      if(budget?.available===false)ui.panel.append(el('p','repo-voice-status','Voice is paused because the shared allowance is used up. It will reopen automatically.'));
      for(const invite of rooms.filter(joinable)){
        const row=el('div','repo-voice-invite'),host=invite.members.find(m=>m.id===invite.host);
        row.append(el('strong','',invite.kind==='private'?`${host?.display||'A friend'} is calling`:`${host?.display||'A friend'} invited you to ${invite.title}`));
        const controls=el('div','repo-voice-controls');controls.append(button(invite.kind==='private'?'Answer':'Join room',()=>start({room:invite.id})),button('Decline',async()=>{await api('leave',{room:invite.id}).catch(()=>{});await poll();}));row.append(controls);ui.panel.append(row);
      }
      if(message){const status=el('p','repo-voice-status',message);status.setAttribute('role','status');ui.panel.append(status,button('Dismiss',()=>{message='';render();},'repo-voice-small'));}
    }
    ui.chip.hidden=!current&&!state().incomingCall;
    ui.chip.textContent=current?(muted?'Mic muted · Return to voice':sender?.connectionState==='connected'?'Voice connected · Return to call':'Connecting voice · Return to call'):'Incoming voice invitation';
    ui.budget.textContent=budget?`Estimated voice use: ${(budget.used/1e9).toFixed(1)} / 800 GB · renews ${new Date(budget.resetAt).toLocaleDateString([], {day:'numeric',month:'short',timeZone:'UTC'})}${budget.rollingGuard?' · carryover protection active':''}`:'';
    ui.budget.title='Conservative app estimate, shared by all Repo Company calls. It is not Cloudflare’s billing meter.';
    ui.budget.hidden=!budget;ui.panel.append(ui.budget);
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
    ui={drawer,group,panel,form,chip,budget:el('p','repo-voice-budget'),context};announce();poll();
  }
  function changed(){
    const next=account.state.user?.id||null;
    if(next!==user){abandon('');epoch++;controllers.forEach(c=>c.abort());user=next;token='';rooms=[];budget=null;community={members:[]};enabled=false;message='';polling=false;if(ui)ui.form.hidden=true;announce();poll();}
  }
  addEventListener('repo-account-state',changed);
  addEventListener('offline',()=>abandon('You are offline. Call again when connected.'));
  addEventListener('online',poll);
  addEventListener('pagehide',()=>{suspended=true;abandon('');clearInterval(timer);});
  addEventListener('pageshow',()=>{suspended=false;clearInterval(timer);timer=setInterval(poll,10000);poll();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
  window.repoVoice=Object.freeze({mount,getState:state,joinCommunity:()=>start({community:true}),startPrivate:username=>start({kind:'private',friends:[String(username).toLowerCase()]}),leave});
  timer=setInterval(poll,10000);
})();
