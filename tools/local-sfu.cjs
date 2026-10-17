// Real WebRTC media relay in an isolated browser. No production account or SFU
// credentials, microphone, camera, desktop pixels or paid traffic are used.
exports.localSFU=async browser=>{
 const page=await browser.newPage();await page.evaluate(()=>{window.relaySessions=new Map();});
 return {async close(){await page.close();},request:(path,body,method)=>page.evaluate(async({path,body,method,newId})=>{
  const sessions=window.relaySessions;
  const gather=pc=>new Promise(resolve=>{if(pc.iceGatheringState==='complete')return resolve();const change=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',change);resolve();}};pc.addEventListener('icegatheringstatechange',change);});
  if(path==='/sessions/new'){const sessionId=newId;sessions.set(sessionId,{tracks:[],pc:new RTCPeerConnection({iceServers:[]})});return {sessionId};}
  const s=sessions.get(path.split('/')[2]);if(!s)throw Error('Unknown fixture session');
  if(method==='GET')return {tracks:s.tracks.map(({track,...rest})=>rest)};
  if(path.endsWith('/tracks/close')){s.pc.close();s.tracks.forEach(t=>t.status='closed');return {};}
  if(path.endsWith('/renegotiate')){await s.pc.setRemoteDescription(body.sessionDescription);return {};}
  if(body.sessionDescription){
   s.pc.ontrack=event=>{const row=body.tracks.find(t=>t.mid===event.transceiver.mid);s.tracks.push({...row,status:'active',track:event.track});};
   await s.pc.setRemoteDescription(body.sessionDescription);await s.pc.setLocalDescription(await s.pc.createAnswer());
  }else{
   for(const item of body.tracks){const source=sessions.get(item.sessionId)?.tracks.find(t=>t.trackName===item.trackName);if(!source?.track)throw Error('Source track missing');const transceiver=s.pc.addTransceiver(source.track,{direction:'sendonly'});if(source.track.kind==='video')transceiver.setCodecPreferences(RTCRtpSender.getCapabilities('video').codecs.filter(c=>c.mimeType.toLowerCase()==='video/vp8'));else transceiver.setCodecPreferences(RTCRtpSender.getCapabilities('audio').codecs.filter(c=>c.mimeType.toLowerCase()==='audio/opus'));s.tracks.push({...item,transceiver,status:'active'});}
   await s.pc.setLocalDescription(await s.pc.createOffer());s.tracks.forEach(t=>t.mid=t.transceiver.mid);
  }
  await gather(s.pc);return {sessionDescription:{type:s.pc.localDescription.type,sdp:s.pc.localDescription.sdp},tracks:s.tracks.map(({track,transceiver,...rest})=>rest)};
 },{path,body,method,newId:crypto.randomUUID()}).catch(error=>{console.error('Relay fixture:',error.message);throw error;})};
};
