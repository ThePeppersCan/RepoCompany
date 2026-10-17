const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
(async()=>{const context={window:{},setInterval,clearInterval,Date,Error};vm.runInNewContext(fs.readFileSync('repo-voice-connection.js','utf8'),context);const {gather}=context.window.repoVoiceConnection;
 function peer(sdp='',state='gathering'){const pc=new EventTarget();return Object.assign(pc,{localDescription:{sdp},iceGatheringState:state,signalingState:'have-local-offer',connectionState:'new'});}
 const sdp='a=candidate:1 1 udp 123 192.0.2.1 1234 typ host\r\n';
 await gather(peer(sdp,'complete'),()=>true);
 const stalled=peer(sdp),start=Date.now();await gather(stalled,()=>true,{settleMs:50,timeoutMs:200});assert(Date.now()-start<200,'usable candidates survive a stalled interface');
 await assert.rejects(gather(peer(),()=>true,{timeoutMs:50}),e=>e.code==='ICE_NO_CANDIDATES');
 await assert.rejects(gather(peer('','complete'),()=>true),e=>e.code==='ICE_NO_CANDIDATES');
 let valid=true;const pending=gather(peer(sdp),()=>valid,{settleMs:500,timeoutMs:800});valid=false;await assert.rejects(pending,e=>e.stale);
 const closed=peer();closed.signalingState='closed';await assert.rejects(gather(closed,()=>true),e=>e.stale);
 console.log('PASS: normal gathering, stalled STUN with usable candidates, no-candidate failure, cancellation and closed-connection cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1;});
