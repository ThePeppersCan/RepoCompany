import {hasBudget} from './budget.mjs';
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const members=room=>Object.values(room.members);
export const MAX_CAMERAS=4;
export function cameraDescription(value,type,maximum=1){
 if(!value||value.type!==type||typeof value.sdp!=='string'||value.sdp.length>48000||!value.sdp.startsWith('v=0'))throw fail('Invalid camera connection.');
 const [head,...parts]=value.sdp.split(/\r?\nm=/);
 if(!parts.length||parts.length>maximum||parts.some(media=>!media.startsWith('video ')||!/a=rtpmap:\d+ VP8\/90000/i.test(media)||/a=rtpmap:\d+ (?!VP8\/|rtx\/)/i.test(media)||/a=simulcast:|a=rid:/i.test(media)||!media.includes(type==='offer'?'a=sendonly':'a=recvonly')))throw fail('Only VP8 camera video is supported.');
 return {type,sdp:head+parts.map(media=>{const lines=media.split(/\r?\n/).filter(line=>!/^b=(AS|TIAS):/.test(line)),at=lines.findIndex(line=>line.startsWith('c='));lines.splice(at<0?1:at+1,0,'b=AS:1000','b=TIAS:1000000');return '\r\nm='+lines.join('\r\n');}).join('')};
}
export class Cameras{
 constructor(hub){this.hub=hub;}
 publishers(room){return members(room).filter(m=>m.status==='active'&&m.cameraPub&&!m.cameraPub.revoked);}
 maintain(room,now){
  for(const m of members(room))for(const key of ['cameraPub','cameraRecv']){
   const s=m[key];if(!s)continue;
   if(this.hub.env.CAMERA_ENABLED!=='true'||room.ended||m.status!=='active'||this.hub.voiceFlags(room,m).serverDeafened||s.expires<=now||((key==='cameraPub'?!s.ready:s.pending)&&s.started+60000<=now))s.revoked=true;
  }
  const sources=new Set(this.publishers(room).filter(m=>m.cameraPub.ready).map(m=>m.cameraPub.trackName));
  for(const m of members(room))if(m.cameraRecv?.sources.some(id=>!sources.has(id)))m.cameraRecv.revoked=true;
 }
 view(room,me){return {enabled:this.hub.env.CAMERA_ENABLED==='true',maximum:MAX_CAMERAS,active:this.publishers(room).filter(m=>m.cameraPub.ready).map(m=>({id:m.cameraPub.trackName,owner:m.id,display:m.display,expires:m.cameraPub.expires})),publishing:!!me.cameraPub&&!me.cameraPub.revoked,watching:me.cameraRecv&&!me.cameraRecv.revoked?me.cameraRecv.sources:[],publishClosing:!!me.cameraPub?.revoked,watchClosing:!!me.cameraRecv?.revoked};}
 async action(room,m,op,b,now){
  const h=this.hub;
  if(op==='camera-stop'||op==='camera-unwatch'){
   const key=op==='camera-stop'?'cameraPub':'cameraRecv';if(m[key])m[key].revoked=true;
   this.maintain(room,now);await h.save();h.clean(room);return {ok:true};
  }
  if(h.env.CAMERA_ENABLED!=='true')throw fail('Cameras are temporarily unavailable.',503);
  if(m.status!=='active')throw fail('Connect to the call before using cameras.',409);
  if(h.voiceFlags(room,m).serverDeafened)throw fail('Cameras are unavailable while server deafened.',403);
  if(op==='camera-publish'){
   if(m.cameraPub)throw fail('Your previous camera connection is finishing. Try again shortly.',409);
   if(members(room).filter(p=>p.cameraPub).length>=MAX_CAMERAS)throw fail('Four cameras are already in use. Turn one off before starting another.',429);
   const sdp=cameraDescription(b.sessionDescription,'offer');
   if(typeof b.mid!=='string'||!/^\d{1,3}$/.test(b.mid)||!sdp.sdp.includes('a=mid:'+b.mid+'\r\n'))throw fail('Invalid camera track.');
   const session=await h.sfu('/sessions/new');if(!session.sessionId)throw fail('Your camera could not start.',502);
   m.cameraPub={id:session.sessionId,trackName:crypto.randomUUID(),mid:b.mid,started:now,expires:now+3600000,ready:false,pendingUntil:Date.now()+60000};await h.save();
   try{const reply=await h.sfu(`/sessions/${session.sessionId}/tracks/new`,{sessionDescription:sdp,tracks:[{location:'local',mid:b.mid,trackName:m.cameraPub.trackName}]});if(reply.sessionDescription?.type!=='answer')throw fail('Your camera could not connect.',502);m.cameraPub.pendingUntil=0;return {sessionDescription:reply.sessionDescription};}
   catch(error){m.cameraPub.revoked=true;await h.save();h.clean(room);throw error;}
  }
  if(op==='camera-ready'){if(!m.cameraPub||m.cameraPub.revoked)throw fail('Start your camera first.',409);m.cameraPub.ready=true;return {ok:true};}
  if(op==='camera-watch'){
   if(m.cameraRecv)throw fail('Your previous camera view is finishing. Try again shortly.',409);
   const sources=this.publishers(room).filter(p=>p.id!==m.id&&p.cameraPub.ready);
   if(!sources.length)throw fail('Nobody else has a camera on yet.',409);
   if(!hasBudget(h.state,now,0,0,sources.length))throw fail('Monthly Wibs usage is too close to its limit to watch cameras.',429);
   const session=await h.sfu('/sessions/new');if(!session.sessionId)throw fail('Cameras could not connect.',502);
   m.cameraRecv={id:session.sessionId,sources:sources.map(p=>p.cameraPub.trackName),pending:true,started:now,expires:now+3600000,pendingUntil:Date.now()+60000};await h.save();
   try{
    const reply=await h.sfu(`/sessions/${session.sessionId}/tracks/new`,{tracks:sources.map(p=>({location:'remote',sessionId:p.cameraPub.id,trackName:p.cameraPub.trackName}))});
    if(reply.sessionDescription?.type!=='offer')throw fail('Cameras could not connect.',502);
    const tracks=sources.map(p=>{const track=reply.tracks?.find(t=>t.trackName===p.cameraPub.trackName);if(typeof track?.mid!=='string')throw fail('A camera could not connect.',502);return {mid:track.mid,id:p.cameraPub.trackName,display:p.display};});
    m.cameraRecv.pendingUntil=0;return {sessionDescription:reply.sessionDescription,tracks};
   }catch(error){m.cameraRecv.revoked=true;await h.save();h.clean(room);throw error;}
  }
  if(op==='camera-answer'){
   if(!m.cameraRecv?.pending||m.cameraRecv.revoked)throw fail('No camera connection is waiting.',409);
   const sdp=cameraDescription(b.sessionDescription,'answer',m.cameraRecv.sources.length);
   await h.sfu(`/sessions/${m.cameraRecv.id}/renegotiate`,{sessionDescription:sdp},'PUT');m.cameraRecv.pending=false;return {ok:true};
  }
  throw fail('Unknown camera action.',404);
 }
}
