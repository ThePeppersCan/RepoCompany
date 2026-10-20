(() => {
 'use strict';
 const events=[];
 function record(stage,pc,extra={}){const candidates={host:0,srflx:0,relay:0};for(const m of (pc?.localDescription?.sdp||'').matchAll(/^a=candidate:.*\btyp (host|srflx|relay)\b/gm))candidates[m[1]]++;events.push({at:new Date().toISOString(),stage,gathering:pc?.iceGatheringState,connection:pc?.connectionState,candidates,...extra});if(events.length>30)events.shift();}
 const failure=()=>Object.assign(Error('No voice connection address was found. Try joining again, or download the connection report.'),{code:'ICE_NO_CANDIDATES'});
 function gather(pc,valid,{settleMs=4000,timeoutMs=10000,waitForRelay=false}={}){
  // SFU signalling is non-trickle: send the candidates gathered so far after a
  // bounded wait. One unresponsive STUN/interface must not discard good ones.
  return new Promise((resolve,reject)=>{
   const started=Date.now();let done=false;
   const timer=setInterval(check,100);
   function finish(error){if(done)return;done=true;clearInterval(timer);pc.removeEventListener('icegatheringstatechange',check);record(error?'gather-failed':'gather-ready',pc);error?reject(error):resolve();}
   function check(){if(!valid()||pc.signalingState==='closed')return finish(Object.assign(Error('Call changed.'),{stale:true}));const elapsed=Date.now()-started,sdp=pc.localDescription?.sdp||'',hasCandidate=/^a=candidate:/m.test(sdp),hasRelay=/^a=candidate:.*\btyp relay\b/m.test(sdp);if(pc.iceGatheringState==='complete')return finish(hasCandidate?null:failure());if(elapsed>=settleMs&&hasCandidate&&(!waitForRelay||hasRelay))return finish();if(elapsed>=timeoutMs)finish(hasCandidate?null:failure());}
   pc.addEventListener('icegatheringstatechange',check);check();
  });
 }
 function download(){const blob=new Blob([JSON.stringify({version:1,online:navigator.onLine,events},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='wibs-voice-connection.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 // Deliberately excludes SDP, IP addresses, account names and credentials.
 window.repoVoiceConnection=Object.freeze({gather,record,download,reset:()=>events.splice(0)});
})();
