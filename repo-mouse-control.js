(() => {
 'use strict';
 const emit=(name,detail)=>dispatchEvent(new CustomEvent(name,{detail}));
 const keyCodes={Backspace:8,Tab:9,Enter:13,NumpadEnter:13,CapsLock:20,Escape:27,Space:32,PageUp:33,PageDown:34,End:35,Home:36,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40,Insert:45,Delete:46,MetaLeft:91,MetaRight:92,ContextMenu:93,NumpadMultiply:106,NumpadAdd:107,NumpadSubtract:109,NumpadDecimal:110,NumpadDivide:111,NumLock:144,ScrollLock:145,ShiftLeft:160,ShiftRight:161,ControlLeft:162,ControlRight:163,AltLeft:164,AltRight:165,Semicolon:186,Equal:187,Comma:188,Minus:189,Period:190,Slash:191,Backquote:192,BracketLeft:219,Backslash:220,BracketRight:221,Quote:222};
 for(let i=0;i<26;i++)keyCodes['Key'+String.fromCharCode(65+i)]=65+i;
 for(let i=0;i<10;i++){keyCodes['Digit'+i]=48+i;keyCodes['Numpad'+i]=96+i;}
 for(let i=1;i<=12;i++)keyCodes['F'+i]=111+i;
 window.createRepoMouseControl=({api,context,refresh,screenState})=>{
  let current=null,ui=null,video=null,latest=null,verifiedAt=0,notice='',revision=0,declined=new Set();
  const text=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;return n;};
  const valid=c=>current===c&&context().connected&&context().room?.id===c.room;
  function render(){
   if(!ui)return;
   const s=screenState(),room=context().room,watchers=room?.screen?.active?.watchers||[];
   const signature=JSON.stringify(watchers);
   if(ui.signature!==signature){const selected=ui.select.value;ui.select.replaceChildren(...watchers.map(w=>{const o=text('option',w.display);o.value=w.id;return o;}));if(watchers.some(w=>w.id===selected))ui.select.value=selected;ui.signature=signature;}
   const person=watchers.find(w=>w.id===ui.select.value);
   const host=s.mode==='publish',capable=document.documentElement.dataset.repoMouseControl==='true';
   ui.select.hidden=!host||!capable||!!current;ui.give.hidden=!host||!capable||!!current;
   ui.give.disabled=!person||s.busy;ui.give.dataset.mouseViewer=person?.id||'';ui.give.dataset.mouseName=person?.display||'';
   ui.stop.hidden=!current;ui.status.textContent=current?(current.open?(current.host?'Mouse and keyboard control given · Ctrl+Alt+Shift+F12 to stop':'You have control · click the screen to type, drag or scroll'):'Connecting mouse and keyboard control…'):notice||(host?(capable?(watchers.length?'Share an entire screen to give mouse and keyboard control.':'A viewer must watch your screen before you can give control.'):'Use the updated Windows app to give mouse and keyboard control.'):'');
  }
  async function stop(reason='',remote=true){
   const c=current;current=null;revision++;notice=reason;
   if(c){declined.add(c.id);clearInterval(c.timer);clearTimeout(c.timeout);c.channel?.close();c.pc?.close();if(c.host)emit('repo-mouse-stop');if(remote&&c.id)await api('control-stop',{room:c.room,control:c.id}).catch(()=>{});}
   render();if(remote)refresh();
  }
  function channel(c,dc){
   c.channel=dc;dc.binaryType='arraybuffer';c.lastSeq=-1;c.lastPong=Date.now();c.challenges=new Map();c.seq=0;c.pointer={x:32768,y:32768,buttons:0,wheel:0};
   const send=value=>{if(dc.readyState==='open'&&dc.bufferedAmount<2048)dc.send(JSON.stringify(value));};
   c.sendKey=value=>{if(c.challenge)send({seq:++c.seq,challenge:c.challenge,...value});};
   c.transmit=()=>{if(c.challenge){send({seq:++c.seq,challenge:c.challenge,...c.pointer});c.pointer.wheel=0;}};
   dc.onopen=()=>{
    if(!valid(c)){dc.close();return;}c.open=c.host;c.lastPong=Date.now();clearTimeout(c.timeout);render();
    c.timer=setInterval(()=>{
     if(!valid(c)||Date.now()-verifiedAt>6500){void stop('Control stopped: call verification was lost.');return;}
     if(c.host){
      if(Date.now()-c.lastPong>2500){void stop('Control stopped: connection lost.');return;}
      const id=crypto.randomUUID(),now=Date.now();c.challenges.set(id,now);
      for(const [key,at] of c.challenges)if(now-at>1800)c.challenges.delete(key);
      send({ping:id});if(now-c.lastPong<1800)emit('repo-mouse-lease',c.native);
     }else c.transmit();
    },c.host?400:50);
   };
   dc.onmessage=e=>{
    if(!valid(c)||typeof e.data!=='string'||e.data.length>256)return;
    let m;try{m=JSON.parse(e.data);}catch{return;}
    if(!m||typeof m!=='object')return;
    if(!c.host){if(typeof m.ping==='string'&&m.ping.length===36){c.challenge=m.ping;if(!c.open){c.open=true;render();}send({pong:m.ping});}return;}
    const now=Date.now(),challenge=m.pong||m.challenge;
    if(!c.challenges.has(challenge)||now-c.challenges.get(challenge)>1800)return;
    c.lastPong=now;
    if(m.pong)return;
    if(!Number.isSafeInteger(m.seq)||m.seq<=c.lastSeq)return;
    if(m.kind){
     c.lastSeq=m.seq;
     if(Date.now()-verifiedAt>6500)return;
     if(m.kind==='release'||(m.kind==='key'&&Number.isInteger(m.key)&&m.key>=8&&m.key<=222&&typeof m.down==='boolean')||
      (m.kind==='text'&&typeof m.text==='string'&&m.text.length>0&&m.text.length<=32&&!/[\u0000-\u001f\u007f]/.test(m.text)))
      emit('repo-mouse-input',{id:c.native,kind:m.kind,key:m.key,down:m.down,text:m.text});
     return;
    }
    if(![m.x,m.y,m.buttons,m.wheel].every(Number.isInteger)||m.x<0||m.x>65535||m.y<0||m.y>65535||m.buttons<0||m.buttons>7||Math.abs(m.wheel)>1200)return;
    if(now-c.lastInput<25&&m.buttons===c.lastButtons&&!m.wheel)return;
    c.lastSeq=m.seq;c.lastInput=now;c.lastButtons=m.buttons;
    if(now-verifiedAt<=6500)emit('repo-mouse-input',{id:c.native,x:m.x,y:m.y,buttons:m.buttons,wheel:m.wheel});
   };
   dc.onclose=()=>{if(valid(c))void stop('Control stopped.');};dc.onerror=()=>{if(valid(c))void stop('Control disconnected.');};
  }
  function make(host,native=null){
   const room=context().room,c={host,native,room:room.id,share:room.screen.active.id,id:null,lastInput:0,open:false};
   c.pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'}],iceTransportPolicy:'all'});
   c.pc.onconnectionstatechange=()=>{if(valid(c)&&['failed','disconnected','closed'].includes(c.pc.connectionState))void stop('Control disconnected.');};
   c.timeout=setTimeout(()=>{if(valid(c))void stop('Control could not connect on this network. Screen sharing is still available.');},25000);
   current=c;notice='';render();return c;
  }
  async function give(detail){
   const room=context().room;
   if(current||screenState().mode!=='publish'||!room?.screen?.publishing||!room.screen.active?.watchers?.some(w=>w.id===detail?.viewer)){emit('repo-mouse-stop');return;}
   const c=make(true,detail.id),version=revision;
   try{
    channel(c,c.pc.createDataChannel('wibs-mouse',{ordered:true}));
    await c.pc.setLocalDescription(await c.pc.createOffer());await window.repoVoiceConnection.gather(c.pc,()=>valid(c));
    if(!valid(c))return;
    const result=await api('control-grant',{room:c.room,share:c.share,viewer:detail.viewer,sessionDescription:{type:'offer',sdp:c.pc.localDescription.sdp}},()=>valid(c));
    c.id=result.control;
    if(version!==revision||!valid(c)){await api('control-stop',{room:c.room,control:c.id}).catch(()=>{});return;}
    refresh();
   }catch(error){if(valid(c))void stop(error.message);}
  }
  async function accept(record){
   const c=make(false);c.id=record.id;
   try{
    c.pc.ondatachannel=e=>{if(valid(c)&&!c.channel&&e.channel.label==='wibs-mouse')channel(c,e.channel);else e.channel.close();};
    await c.pc.setRemoteDescription(record.offer);await c.pc.setLocalDescription(await c.pc.createAnswer());await window.repoVoiceConnection.gather(c.pc,()=>valid(c));
    if(!valid(c))return;
    await api('control-answer',{room:c.room,control:c.id,sessionDescription:{type:'answer',sdp:c.pc.localDescription.sdp}},()=>valid(c));refresh();
   }catch(error){if(valid(c))void stop(error.message);}
  }
  function release(){if(current&&!current.host&&current.pointer){current.pointer.buttons=0;current.transmit?.();}}
  function releaseAll(){release();if(current&&!current.host)current.sendKey?.({kind:'release'});}
  function keyboard(e){
   const c=current;if(!c?.open||c.host||!e.isTrusted)return;
   if(e.ctrlKey&&e.altKey&&e.shiftKey&&e.code==='F12'){e.preventDefault();e.stopPropagation();void stop('Control stopped by emergency shortcut.');return;}
   e.preventDefault();e.stopPropagation();
   if(e.code==='Delete'&&e.ctrlKey&&e.altKey)return;
   if(e.isComposing)return;
   if(e.type==='keydown'&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key.length<=2&&[...e.key].length===1){
    c.sendKey?.({kind:'text',text:e.key});return;
   }
   const key=keyCodes[e.code];if(key)c.sendKey?.({kind:'key',key,down:e.type==='keydown'});
  }
  function pointer(e){
   const c=current;if(!c?.open||c.host||!video||!e.isTrusted)return;
   const r=video.getBoundingClientRect(),ratio=video.videoWidth/video.videoHeight;
   if(!Number.isFinite(ratio)||ratio<=0)return;
   const w=Math.min(r.width,r.height*ratio),h=w/ratio,left=r.left+(r.width-w)/2,top=r.top+(r.height-h)/2;
   const x=(e.clientX-left)/w,y=(e.clientY-top)/h;
   if(e.type==='pointerup')c.pointer.buttons=e.buttons&7;
   if(x<0||x>1||y<0||y>1)return;
   e.preventDefault();c.pointer.x=Math.round(x*65535);c.pointer.y=Math.round(y*65535);
   if(e.type==='wheel'){c.pointer.wheel=Math.max(-1200,Math.min(1200,c.pointer.wheel-Math.sign(e.deltaY)*120));}
   else {c.pointer.buttons=e.buttons&7;if(e.type==='pointerdown'){video.focus({preventScroll:true});video.setPointerCapture(e.pointerId);}}
   if(e.type!=='pointermove')c.transmit?.();
  }
  addEventListener('blur',releaseAll);addEventListener('pointerup',release);addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
  addEventListener('keydown',e=>{if(e.isTrusted&&e.ctrlKey&&e.altKey&&e.shiftKey&&e.code==='F12'){e.preventDefault();void stop('Control stopped by emergency shortcut.');}});
  addEventListener('repo-mouse-granted',e=>void give(e.detail));
  addEventListener('repo-mouse-error',e=>{notice=String(e.detail||'Control could not start.').replace(/^Error invoking remote method '[^']+': Error: /,'');render();});
  addEventListener('repo-mouse-state',e=>{if(e.detail?.active===false&&current?.host)void stop(e.detail.reason||'Control stopped.');});
  return {
   mount(host,player){
    video=player;const area=text('div','');area.className='repo-mouse-controls';
    const select=text('select','');select.setAttribute('aria-label','Give control to');
    const give=text('button','Give control');give.type='button';give.dataset.mouseGive='';
    const end=text('button','Stop control');end.type='button';end.onclick=()=>void stop('Control stopped.');
    const status=text('p','');status.setAttribute('role','status');area.append(select,give,end,status);host.append(area);
    ui={select,give,stop:end,status};select.onchange=render;
    for(const type of ['pointermove','pointerdown','pointerup','wheel'])video.addEventListener(type,pointer,{passive:false});
    video.tabIndex=0;
    video.addEventListener('keydown',keyboard);video.addEventListener('keyup',keyboard);video.addEventListener('blur',releaseAll);
    video.addEventListener('contextmenu',e=>{if(current?.open&&!current.host)e.preventDefault();});
    video.addEventListener('lostpointercapture',release);render();
   },
   reset(){void stop('',true);ui=null;video=null;latest=null;verifiedAt=0;},
   sync(room){
    latest=room?.control;verifiedAt=Date.now();
    if(current){
     if(!context().connected||!room||room.id!==current.room||room.ended||!room.mine.owned||
      (current.id&&latest?.id!==current.id)){void stop('Control stopped.');return;}
     if(current.host&&latest?.answer&&!current.answering&&!current.pc.remoteDescription){current.answering=true;const c=current;c.pc.setRemoteDescription(latest.answer).catch(()=>{if(valid(c))void stop('Control could not connect.');});}
    }else if(latest?.offer&&screenState().mode==='watch'&&!declined.has(latest.id)){void accept(latest);}
    render();
   }
  };
 };
})();
