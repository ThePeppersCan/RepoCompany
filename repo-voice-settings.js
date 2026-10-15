(() => {
  'use strict';
  const audio=window.repoVoiceAudio;if(!audio)return;
  let dialog=null,adapter=null,preview=null,revision=0,meterTimer=null,testTimer=null,tone=null,toneURL='',returnFocus=null,loading=false;
  const controls={},el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function stopPreview(){revision++;preview?.stop();preview=null;clearTimeout(testTimer);if(controls.test)controls.test.textContent='Test microphone';}
  function stopTone(){if(tone){tone.pause();tone.removeAttribute('src');tone.load();tone.remove();tone=null;}if(toneURL)URL.revokeObjectURL(toneURL);toneURL='';}
  function close(){if(!dialog)return;stopPreview();stopTone();clearInterval(meterTimer);dialog.close();dialog.remove();dialog=null;returnFocus?.focus();}
  function notice(text){if(controls.notice&&dialog)controls.notice.textContent=text;}
  function sync(){const p=audio.get();for(const [key,node] of Object.entries(controls)){if(!(key in p))continue;if(node.type==='checkbox')node.checked=p[key];else node.value=p[key];}for(const key of ['inputVolume','outputVolume'])controls[key+'Value'].value=p[key]+'%';controls.sensitivityValue.value=p.sensitivity+' dB';controls.sensitivity.disabled=!p.voiceActivation;}
  async function devices(){
    const target=dialog;if(!target)return;
    try{
      const list=await navigator.mediaDevices?.enumerateDevices()||[];if(dialog!==target)return;
      const p=audio.get();
      for(const [key,kind] of [['inputId','audioinput'],['outputId','audiooutput']]){
        const select=controls[key];select.replaceChildren(new Option('System default',''));
        let i=0;for(const d of list.filter(d=>d.kind===kind&&d.deviceId&&d.deviceId!=='default'))select.add(new Option(d.label||`${kind==='audioinput'?'Microphone':'Speaker'} ${++i}`,d.deviceId));
        if(p[key]&&![...select.options].some(o=>o.value===p[key]))select.add(new Option('Previously selected device',p[key]));select.value=p[key];
      }
    }catch{notice('Device names are unavailable. Test your microphone to allow access.');}
  }
  async function change(patch){
    if(loading||!dialog)return;loading=true;const target=dialog;
    controls.fields.disabled=true;const next={...audio.get(),...patch},before=audio.get();
    if('inputId' in patch)stopPreview();
    try{if(preview){if(['noiseSuppression','echoCancellation','autoGainControl'].some(k=>next[k]!==before[k]))await preview.processing(next);preview.configure(next);}await adapter.apply(next);if(dialog===target)notice('Saved on this device.');}
    catch(error){if(!error.stale&&dialog===target)notice(error.name==='NotAllowedError'?'Device access was declined. Allow access in your browser or client settings.':error.name==='NotFoundError'||error.name==='OverconstrainedError'?'That device is unavailable. Choose a connected device or System default.':error.message);}
    finally{loading=false;preview?.configure(audio.get());if(dialog){controls.fields.disabled=false;sync();await devices();}}
  }
  function select(key,label){const row=el('label','rv-setting');row.append(el('span','',label));const node=el('select');node.setAttribute('aria-label',label);node.add(new Option('System default',''));node.onchange=()=>change({[key]:node.value});controls[key]=node;row.append(node);return row;}
  function slider(key,label,min,max,hint){const row=el('label','rv-setting'),head=el('span','rv-setting-label');head.append(el('span','',label));const value=el('output');controls[key+'Value']=value;head.append(value);const node=el('input');node.type='range';node.min=min;node.max=max;node.step=1;node.setAttribute('aria-label',label);node.oninput=()=>{value.value=node.value+(key==='sensitivity'?' dB':'%');};node.onchange=()=>change({[key]:Number(node.value)});controls[key]=node;row.append(head,node);if(hint)row.append(el('small','',hint));return row;}
  function toggle(key,label,hint){const row=el('label','rv-toggle'),node=el('input');node.type='checkbox';node.onchange=()=>change({[key]:node.checked});controls[key]=node;const copy=el('span');copy.append(el('span','',label));if(hint)copy.append(el('small','',hint));row.append(node,copy);return row;}
  function button(label,fn){const node=el('button','rv-button',label);node.type='button';node.onclick=fn;return node;}
  async function testMic(){
    if(preview){stopPreview();notice('Microphone test stopped.');return;}
    if(adapter.capture()){notice('The meter shows your microphone in this call.');return;}
    if(window.repoVoice?.getState().callActive){notice('Wait for your call to connect to check the microphone level.');return;}
    stopPreview();const r=revision,target=dialog,id=window.repoAccount?.state.user?.id;
    const valid=()=>r===revision&&dialog===target&&id===window.repoAccount?.state.user?.id&&!window.repoVoice?.getState().callActive;
    controls.test.disabled=true;notice('Allow your microphone to see its level. The test does not play it back.');
    try{const next=await audio.capture(audio.get(),valid);if(!valid()){next.stop();return;}preview=next;controls.test.textContent='Stop microphone test';notice('Speak normally and adjust sensitivity. The test stops after 30 seconds.');await devices();testTimer=setTimeout(()=>{stopPreview();notice('Microphone test finished.');},30000);}
    catch(error){if(!error.stale&&valid())notice(error.name==='NotAllowedError'?'Microphone permission was declined.':error.message);}
    finally{if(dialog===target)controls.test.disabled=false;}
  }
  async function testSpeaker(){
    stopTone();const target=dialog;
    // A short, quiet chime uses the same sink and volume as received voice.
    const rate=24000,length=rate*.45,bytes=new ArrayBuffer(44+length*2),view=new DataView(bytes);
    function word(offset,value){for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));}
    word(0,'RIFF');view.setUint32(4,bytes.byteLength-8,true);word(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);word(36,'data');view.setUint32(40,length*2,true);
    for(let i=0;i<length;i++){const envelope=Math.min(1,i/240,(length-i)/1200);view.setInt16(44+i*2,Math.sin(i/rate*Math.PI*2*660)*envelope*4000,true);}
    const element=tone=new Audio();toneURL=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));element.src=toneURL;document.body.append(element);element.onended=()=>{if(tone===element)stopTone();};
    try{await audio.output(element);if(dialog!==target||tone!==element)return;await element.play();notice('Playing a short sound on your selected speaker.');}catch(error){if(dialog===target)notice(error.message);if(tone===element)stopTone();}
  }
  function open(){
    if(!adapter||!window.repoAccount?.state.user)return;if(dialog){dialog.focus();return;}returnFocus=document.activeElement;
    dialog=el('dialog','repo-voice-settings');dialog.setAttribute('aria-labelledby','rv-settings-title');
    const top=el('div','rv-settings-top'),title=el('h2','','Voice & audio');title.id='rv-settings-title';const exit=button('×',close);exit.setAttribute('aria-label','Close voice settings');top.append(title,exit);dialog.append(top,el('p','rv-intro','Make yourself heard, comfortably. Settings stay on this device.'));
    const fields=controls.fields=el('fieldset');fields.disabled=loading;dialog.append(fields);
    fields.append(select('inputId','Microphone'),slider('inputVolume','Microphone volume',0,200),slider('outputVolume','Voice volume',0,100),select('outputId','Speaker'));
    controls.outputId.disabled=!audio.canChooseOutput();
    if(!audio.canChooseOutput())fields.append(el('p','rv-hint','This browser uses your system’s default speaker. You can change it in your system sound settings.'));
    const tests=el('div','rv-tests');controls.test=button('Test microphone',testMic);tests.append(controls.test,button('Test speaker',testSpeaker));fields.append(tests);
    if(navigator.mediaDevices?.selectAudioOutput){const choose=button('Choose another speaker',async()=>{try{const d=await navigator.mediaDevices.selectAudioOutput();if(dialog)await change({outputId:d.deviceId});}catch(error){if(error.name!=='NotAllowedError')notice(error.message);}});fields.append(choose);}
    const meter=el('div','rv-meter');meter.setAttribute('role','meter');meter.setAttribute('aria-label','Microphone level');meter.setAttribute('aria-valuemin','-90');meter.setAttribute('aria-valuemax','0');meter.append(el('span','rv-meter-fill'),el('span','rv-meter-threshold'));fields.append(meter);
    controls.meterLabel=el('p','rv-meter-label','Test your microphone to check its level.');fields.append(controls.meterLabel,toggle('voiceActivation','Input sensitivity','Only send sound above your chosen level.'),slider('sensitivity','Sensitivity',-75,-10,'More sensitive ← → Less sensitive'));
    const processing=el('div','rv-processing');processing.append(toggle('noiseSuppression','Noise suppression','Free processing built into your browser or client.'),toggle('echoCancellation','Echo cancellation','Reduces sound from your speakers reaching your microphone.'),toggle('autoGainControl','Automatic microphone level','Helps keep quiet and loud speech at a consistent level.'));fields.append(processing);
    fields.append(toggle('callSounds','Call sounds','Quiet sounds when you or someone else joins or leaves.'));
    const supported=audio.supported();for(const name of ['noiseSuppression','echoCancellation','autoGainControl'])if(!supported[name]){controls[name].disabled=true;controls[name].closest('label').append(el('small','','Unavailable in this browser'));}
    controls.notice=el('p','rv-notice');controls.notice.setAttribute('role','status');dialog.append(controls.notice);
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});document.body.append(dialog);sync();dialog.showModal();devices();
    meterTimer=setInterval(()=>{const capture=adapter.capture()||preview,level=capture?.level||{db:-90,open:false},p=audio.get();meter.firstChild.style.width=(Math.max(0,Math.min(90,level.db+90))/90*100)+'%';meter.classList.toggle('is-open',!!level.open);meter.lastChild.style.left=((p.sensitivity+90)/90*100)+'%';meter.lastChild.hidden=!p.voiceActivation;meter.setAttribute('aria-valuenow',String(Math.round(level.db)));controls.meterLabel.textContent=capture?(level.open?'Sound is passing through':'Microphone is quiet or muted'):'Test your microphone to check its level.';},100);
  }
  navigator.mediaDevices?.addEventListener('devicechange',devices);
  addEventListener('repo-voice-state',()=>{if(window.repoVoice?.getState().callActive&&preview)stopPreview();});
  let user=window.repoAccount?.state.user?.id;addEventListener('repo-account-state',()=>{const next=window.repoAccount?.state.user?.id;if(next!==user){close();user=next;}});
  addEventListener('pagehide',close);
  window.repoVoiceSettings=Object.freeze({open,close,stopPreview,configure(value){adapter=value;}});
})();
