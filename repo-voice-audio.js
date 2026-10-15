(() => {
  'use strict';
  const key='repo-voice-audio-v1',defaults={inputId:'',outputId:'',inputVolume:100,outputVolume:100,sensitivity:-55,voiceActivation:true,noiseSuppression:true,echoCancellation:true,autoGainControl:true,callSounds:true};
  function clean(value){const p={...defaults};for(const name of ['inputId','outputId'])if(typeof value?.[name]==='string'&&value[name].length<512)p[name]=value[name];for(const [name,min,max] of [['inputVolume',0,200],['outputVolume',0,100],['sensitivity',-75,-10]])if(Number.isFinite(value?.[name]))p[name]=Math.min(max,Math.max(min,value[name]));for(const name of ['voiceActivation','noiseSuppression','echoCancellation','autoGainControl','callSounds'])if(typeof value?.[name]==='boolean')p[name]=value[name];return p;}
  let prefs={...defaults};try{prefs=clean(JSON.parse(localStorage.getItem(key)));}catch{}
  const stale=()=>Object.assign(Error('Audio settings changed.'),{stale:true});
  const constraints=p=>({...(p.inputId?{deviceId:{exact:p.inputId}}:{}),channelCount:1,noiseSuppression:p.noiseSuppression,echoCancellation:p.echoCancellation,autoGainControl:p.autoGainControl});
  async function capture(p,valid=()=>true){
    if(!valid())throw stale();
    if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphones require a supported browser and a secure connection.');
    let raw,ctx,dest,source,gain,gate,stopped=false,muted=false,level={db:-90,open:false};
    const stop=()=>{if(stopped)return;stopped=true;raw?.getTracks().forEach(t=>{t.onended=null;t.stop();});dest?.stream.getTracks().forEach(t=>t.stop());if(gate){gate.port.onmessage=null;gate.port.close();gate.disconnect();}source?.disconnect();gain?.disconnect();ctx?.close().catch(()=>{});};
    try{
      raw=await navigator.mediaDevices.getUserMedia({audio:constraints(p),video:false});
      if(!valid()){stop();throw stale();}
      ctx=new AudioContext({latencyHint:'interactive',sampleRate:48000});
      if(!ctx.audioWorklet)throw Error('Update your browser or Repo Company client to use voice sensitivity controls.');
      await ctx.audioWorklet.addModule('/repo-voice-gate.js?v=20261016-1');
      if(!valid()){stop();throw stale();}
      source=ctx.createMediaStreamSource(raw);gain=ctx.createGain();dest=ctx.createMediaStreamDestination();dest.channelCount=1;
      gate=new AudioWorkletNode(ctx,'repo-voice-gate',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});
      source.connect(gain).connect(gate).connect(dest);
      gate.port.onmessage=e=>{level=e.data;};
      function configure(next){gain.gain.setTargetAtTime(next.inputVolume/100,ctx.currentTime,.01);gate.parameters.get('threshold').value=next.sensitivity;gate.parameters.get('enabled').value=next.voiceActivation?1:0;}
      configure(p);await ctx.resume();
      if(!valid()){stop();throw stale();}
      return {raw,stream:dest.stream,stop,get level(){return muted?{db:-90,open:false}:level;},configure,
        async processing(next){await raw.getAudioTracks()[0].applyConstraints(constraints(next));},
        setMuted(value){muted=value;gate.parameters.get('muted').value=value?1:0;for(const track of [...raw.getTracks(),...dest.stream.getTracks()])track.enabled=!value;},
        get settings(){return raw.getAudioTracks()[0].getSettings();}
      };
    }catch(error){stop();throw error;}
  }
  async function output(audio,p=prefs){
    audio.volume=p.outputVolume/100;
    if(typeof audio.setSinkId==='function')await audio.setSinkId(p.outputId);
    else if(p.outputId)throw Error('This browser uses your system’s default speaker. Change it in your system sound settings.');
  }
  let cueAudio=null,cueTimer=null;const cueQueue=[];
  function stopCues(){cueQueue.length=0;clearTimeout(cueTimer);if(cueAudio){cueAudio.onended=cueAudio.onerror=null;cueAudio.pause();cueAudio.removeAttribute('src');cueAudio.load();cueAudio.remove();cueAudio=null;}}
  function nextCue(){
    if(cueAudio||!cueQueue.length)return;
    if(!prefs.callSounds){stopCues();return;}
    const element=cueAudio=new Audio('/assets/voice-'+cueQueue.shift()+'.mp3');element.dataset.voiceCue='true';document.body.append(element);
    const finish=()=>{if(cueAudio!==element)return;clearTimeout(cueTimer);element.onended=element.onerror=null;element.pause();element.remove();cueAudio=null;nextCue();};
    element.onended=element.onerror=finish;cueTimer=setTimeout(finish,8000);
    output(element,{...prefs,outputVolume:prefs.outputVolume*.25}).then(()=>{if(cueAudio!==element)return;return element.play();}).catch(finish);
  }
  function cue(kind){if(!prefs.callSounds||!['join','leave'].includes(kind)||cueQueue.length>=3)return;cueQueue.push(kind);nextCue();}
  window.repoVoiceAudio=Object.freeze({capture,output,cue,stopCues,get:()=>({...prefs}),clean,
    save(value){prefs=clean(value);try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}if(!prefs.callSounds)stopCues();else if(cueAudio){const current=cueAudio;output(current,{...prefs,outputVolume:prefs.outputVolume*.25}).catch(()=>{if(cueAudio===current)stopCues();});}dispatchEvent(new Event('repo-voice-preferences'));},
    supported:()=>navigator.mediaDevices?.getSupportedConstraints?.()||{},
    canChooseOutput:()=>typeof HTMLMediaElement.prototype.setSinkId==='function'
  });
  addEventListener('pagehide',stopCues);
})();
