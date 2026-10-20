import {hasBudget} from './budget.mjs';
const fail=(message,status=400)=>Object.assign(Error(message),{status});
export function controlDescription(value,type){
 if(value?.type!==type||typeof value.sdp!=='string'||value.sdp.length>24000||!value.sdp.startsWith('v=0'))throw fail('Invalid mouse-control connection.');
 const media=value.sdp.split(/\r?\nm=/).slice(1);
 if(media.length!==1||!/^application \d+ UDP\/DTLS\/SCTP webrtc-datachannel\r?\n/.test(media[0])||!/^a=sctp-port:\d+$/m.test(value.sdp.replace(/\r/g,'')))throw fail('Mouse control accepts a data channel only.');
 return {type,sdp:value.sdp};
}
export class MouseControl{
 constructor(hub){this.hub=hub;}
 maintain(room,now){
  const c=room.control;if(!c)return;
  const host=room.members[c.host],viewer=room.members[c.viewer];
  if(room.ended||now>=c.expires||(!c.answer&&now-c.started>30000)||host?.status!=='active'||viewer?.status!=='active'||
   host.client!==c.hostClient||viewer.client!==c.viewerClient||!host.screenPub?.ready||host.screenPub.revoked||
   host.screenPub.trackName!==c.share||!viewer.screenRecv||viewer.screenRecv.pending||viewer.screenRecv.revoked||
   viewer.screenRecv.source!==c.share||this.hub.voiceFlags(room,host).serverDeafened||this.hub.voiceFlags(room,viewer).serverDeafened)room.control=null;
 }
 view(room,me,client){
  const c=room.control;
  if(!c||me.client!==client||![c.host,c.viewer].includes(me.id))return null;
  return {id:c.id,host:c.host,viewer:c.viewer,share:c.share,expires:c.expires,
   ...(me.id===c.viewer?{offer:c.offer}:{answer:c.answer||null})};
 }
 async action(room,m,op,b,now){
  this.maintain(room,now);
  const c=room.control;
  if(op==='control-stop'){
   if(c&&c.id===b.control&&[c.host,c.viewer].includes(m.id))room.control=null;
   return {ok:true};
  }
  if(op==='control-grant'){
   if(c)throw fail('Stop the current mouse control first.',409);
   const pub=m.screenPub,v=room.members[b.viewer];
   if(m.status!=='active'||!pub?.ready||pub.revoked||pub.trackName!==b.share)throw fail('Share your screen before giving control.',409);
   if(!v||v===m||v.status!=='active'||!v.screenRecv||v.screenRecv.pending||v.screenRecv.revoked||v.screenRecv.source!==b.share)throw fail('Choose someone watching your screen.',409);
   // The direct channel has no SFU/TURN egress. Still reserve 1 Mbit/s inside
   // the existing allowance for control overhead, without increasing its cap.
   if(!hasBudget(this.hub.state,now,1))throw fail('Monthly Wibs usage is too close to its limit to give control.',429);
   room.control={id:crypto.randomUUID(),host:m.id,viewer:v.id,hostClient:m.client,viewerClient:v.client,share:b.share,
    started:now,expires:pub.expires,offer:controlDescription(b.sessionDescription,'offer')};
   return {control:room.control.id};
  }
  if(op==='control-answer'){
   if(!c||c.id!==b.control||c.viewer!==m.id||c.answer)throw fail('This control invitation has ended.',409);
   c.answer=controlDescription(b.sessionDescription,'answer');return {ok:true};
  }
  throw fail('Unknown mouse-control action.',404);
 }
}
