import {hasBudget} from './budget.mjs';
export const mediaKeys=['pub','recv','screenPub','screenRecv','cameraPub','cameraRecv'];
export const hasMedia=m=>mediaKeys.some(key=>m[key]);
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const members=room=>Object.values(room.members);
export function screenDescription(value,type){
 if(!value||value.type!==type||typeof value.sdp!=='string'||value.sdp.length>24000||!value.sdp.startsWith('v=0'))throw fail('Invalid screen connection.');
 const parts=value.sdp.split(/\r?\nm=/),media=parts[1];
 if(parts.length!==2||!media.startsWith('video ')||!/a=rtpmap:\d+ VP8\/90000/i.test(media)||/a=rtpmap:\d+ (?!VP8\/|rtx\/)/i.test(media)||/a=simulcast:|a=rid:/i.test(media)||!media.includes(type==='offer'?'a=sendonly':'a=recvonly'))throw fail('Only one VP8 screen stream is supported.');
 // SDP bandwidth signalling complements the browser's capture/encoder limits.
 const lines=media.split(/\r?\n/).filter(line=>!/^b=(AS|TIAS):/.test(line));const at=lines.findIndex(line=>line.startsWith('c='));lines.splice(at<0?1:at+1,0,'b=AS:2000','b=TIAS:2000000');
 return {type,sdp:parts[0]+'\r\nm='+lines.join('\r\n')};
}
export class ScreenSharing{
 constructor(hub){this.hub=hub;}
 publisher(room){return members(room).find(m=>m.status==='active'&&m.screenPub&&!m.screenPub.revoked);}
 maintain(room,now){
  for(const m of members(room)){
   if(this.hub.env.SCREEN_ENABLED!=='true'){if(m.screenPub)m.screenPub.revoked=true;if(m.screenRecv)m.screenRecv.revoked=true;}
   if(m.screenPub&&(room.ended||m.status!=='active'||m.screenPub.expires<=now||(!m.screenPub.ready&&m.screenPub.started+60000<=now)))m.screenPub.revoked=true;
   if(m.screenRecv&&(room.ended||m.status!=='active'||(m.screenRecv.pending&&m.screenRecv.started+60000<=now)))m.screenRecv.revoked=true;
  }
  const pub=this.publisher(room);
  for(const m of members(room))if(m.screenRecv&&(!pub||m.screenRecv.source!==pub.screenPub.trackName||this.hub.voiceFlags(room,m).serverDeafened))m.screenRecv.revoked=true;
 }
 view(room,me){const pub=this.publisher(room);return {enabled:this.hub.env.SCREEN_ENABLED==='true',active:pub?.screenPub.ready?{id:pub.screenPub.trackName,owner:pub.id,display:pub.display,expires:pub.screenPub.expires,viewers:members(room).filter(m=>m.screenRecv&&!m.screenRecv.revoked).length,watchers:pub.id===me.id?members(room).filter(m=>m.status==='active'&&m.screenRecv&&!m.screenRecv.pending&&!m.screenRecv.revoked&&m.screenRecv.source===pub.screenPub.trackName).map(m=>({id:m.id,display:m.display})):[]}:null,publishing:!!me.screenPub&&!me.screenPub.revoked,watching:!!me.screenRecv&&!me.screenRecv.revoked,closing:!!me.screenPub?.revoked||!!me.screenRecv?.revoked};}
 async action(room,m,op,b,now){
  const h=this.hub;
  if(op==='screen-stop'||op==='screen-unwatch'){
   if(op==='screen-stop'&&m.screenPub)m.screenPub.revoked=true;
   if(m.screenRecv)m.screenRecv.revoked=true;
   this.maintain(room,now);await h.save();h.clean(room);return {ok:true};
  }
  if(h.env.SCREEN_ENABLED!=='true')throw fail('Screen sharing is being set up.',503);
  if(m.status!=='active')throw fail('Connect to voice before sharing a screen.',409);
  if(op==='screen-publish'){
   if(m.screenPub||members(room).some(p=>p.screenPub))throw fail('A screen is already sharing or finishing. Try again shortly.',409);
   if(this.publisher(room))throw fail('Only one person can share at a time.',409);
   if(this.hub.voiceFlags(room,m).serverDeafened)throw fail('Screen sharing is unavailable while server deafened.',403);
   const sdp=screenDescription(b.sessionDescription,'offer');
   if(typeof b.mid!=='string'||!/^\d{1,3}$/.test(b.mid)||!sdp.sdp.includes('a=mid:'+b.mid+'\r\n'))throw fail('Invalid screen track.');
   const session=await h.sfu('/sessions/new');if(!session.sessionId)throw fail('Screen sharing could not start.',502);
   m.screenPub={id:session.sessionId,trackName:crypto.randomUUID(),mid:b.mid,started:now,expires:now+3600000,ready:false,pendingUntil:Date.now()+60000};await h.save();
   try{const reply=await h.sfu(`/sessions/${session.sessionId}/tracks/new`,{sessionDescription:sdp,tracks:[{location:'local',mid:b.mid,trackName:m.screenPub.trackName}]});if(reply.sessionDescription?.type!=='answer')throw fail('Screen sharing could not connect.',502);m.screenPub.pendingUntil=0;return {sessionDescription:reply.sessionDescription};}
   catch(error){m.screenPub.revoked=true;await h.save();h.clean(room);throw error;}
  }
  if(op==='screen-ready'){if(!m.screenPub||m.screenPub.revoked)throw fail('Start sharing first.',409);m.screenPub.ready=true;return {ok:true};}
  if(op==='screen-watch'){
   const pub=this.publisher(room);if(!pub?.screenPub.ready||pub.id===m.id||pub.screenPub.trackName!==b.share)throw fail('This screen share has ended.',409);
   if(h.voiceFlags(room,m).serverDeafened)throw fail('Screen viewing is unavailable while server deafened.',403);
   if(m.screenRecv)throw fail('Your previous screen connection is finishing. Try again shortly.',409);
   if(!hasBudget(h.state,now,0,1))throw fail('Monthly Wibs usage is too close to its limit to watch a screen.',429);
   const session=await h.sfu('/sessions/new');if(!session.sessionId)throw fail('The shared screen could not connect.',502);
   m.screenRecv={id:session.sessionId,source:pub.screenPub.trackName,pending:true,started:now,pendingUntil:Date.now()+60000};await h.save();
   try{const reply=await h.sfu(`/sessions/${session.sessionId}/tracks/new`,{tracks:[{location:'remote',sessionId:pub.screenPub.id,trackName:pub.screenPub.trackName}]});if(reply.sessionDescription?.type!=='offer')throw fail('The shared screen could not connect.',502);m.screenRecv.pendingUntil=0;return {sessionDescription:reply.sessionDescription};}
   catch(error){m.screenRecv.revoked=true;await h.save();h.clean(room);throw error;}
  }
  if(op==='screen-answer'){
   if(!m.screenRecv?.pending||m.screenRecv.revoked)throw fail('No screen connection is waiting.',409);
   const sdp=screenDescription(b.sessionDescription,'answer');await h.sfu(`/sessions/${m.screenRecv.id}/renegotiate`,{sessionDescription:sdp},'PUT');m.screenRecv.pending=false;return {ok:true};
  }
  throw fail('Unknown screen action.',404);
 }
}
