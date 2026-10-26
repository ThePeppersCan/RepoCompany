import {DurableObject} from 'cloudflare:workers';
import {base64ToBytes,FRAME_BYTES,MAX_RACE_TICKS,decodeRaceFrame} from './shared/race-protocol.js';
const send=(ws,m)=>{try{ws.send(JSON.stringify(m));}catch{}};
export class VerifiedRaceRoom extends DurableObject{
 constructor(ctx,env){super(ctx,env);this.room=null;ctx.blockConcurrencyWhile(async()=>{this.room=await ctx.storage.get('verified')||null;});}
 async create(config){if(this.room)throw Error('Flight exists');const tickets={};this.room={...config,players:config.players.map(p=>{const ticket=tickets[p.id]=crypto.randomUUID();return{id:p.id,userId:p.userId,name:p.name,runner:p.runner,knife:p.knife,ticket,joined:false,loaded:false,ticks:0,finished:false};}),round:1,state:'loading',startAt:0,created:Date.now(),results:[]};await this.save();await this.ctx.storage.setAlarm(Date.now()+60000);return tickets;}
 async save(){await this.ctx.storage.put('verified',this.room);}
 members(){return this.ctx.getWebSockets().filter(s=>s.readyState===1).map(ws=>({ws,d:ws.deserializeAttachment()})).filter(p=>p.d?.id);}
 broadcast(m){for(const{ws}of this.members())send(ws,m);}
 state(){const r=this.room;return{type:'room',code:r.code,host:r.leader,course:r.course,mode:r.mode,rules:r.rules,round:r.round,state:r.state,startAt:r.startAt,serverTime:Date.now(),results:r.results,players:r.players.map(({id,name,runner,knife,loaded,finished})=>({id,name,runner,knife,ready:loaded,finished}))};}
 async fetch(){if(!this.room||this.room.state!=='loading'||this.ctx.getWebSockets().length>=16)return new Response('Flight unavailable',{status:409});const pair=new WebSocketPair();this.ctx.acceptWebSocket(pair[1]);pair[1].serializeAttachment({created:Date.now(),window:Date.now(),count:0});return new Response(null,{status:101,webSocket:pair[0]});}
 async webSocketMessage(ws,raw){
  const now=Date.now(),d=ws.deserializeAttachment();if(!this.room||typeof raw!=='string'||raw.length>6000)return ws.close(1009,'Invalid message');let m;try{m=JSON.parse(raw);}catch{return ws.close(1007,'Invalid message');}
  if(now-d.window>=1000){d.window=now;d.count=0;}if(++d.count>65)return ws.close(1008,'Too many updates');ws.serializeAttachment(d);
  if(m.type==='hello'&&!d.id){const p=this.room.players.find(p=>p.ticket===m.ticket&&!p.joined);if(!p||now-this.room.created>60000)return ws.close(1008,'Invalid boarding pass');p.joined=true;delete p.ticket;d.id=p.id;ws.serializeAttachment(d);await this.save();send(ws,{type:'welcome',id:p.id});send(ws,this.state());return;}
  const p=this.room.players.find(p=>p.id===d.id);if(!p)return ws.close(1008,'Board first');
  if(m.type==='ping'){send(ws,{type:'pong',sent:m.sent,serverTime:now});return;}
  if(m.type==='loaded'&&this.room.state==='loading'){
   if(m.protocol!==3||m.version!=='2.17.1')return this.fail('Players have different game versions. Reopen COMP-RUN.');p.loaded=true;await this.save();
   if(this.room.players.every(p=>p.joined&&p.loaded)){this.room.state='racing';this.room.startAt=now+5000;await this.save();await this.ctx.storage.setAlarm(this.room.startAt+1800000);}
   this.broadcast(this.state());return;
  }
  if(this.room.state!=='racing'||p.finished||m.round!==this.room.round)return;
  if(m.type==='inputs'){
   let bytes;try{bytes=base64ToBytes(m.data);}catch{return this.reject(p,'Invalid movement data');}
   const count=bytes.length/FRAME_BYTES,end=p.ticks+count;
   if(!Number.isSafeInteger(count)||count<1||count>120||m.from!==p.ticks||end>MAX_RACE_TICKS||end>Math.max(0,Math.floor((now-this.room.startAt+300)*.12)))return this.reject(p,'Movement timing did not match the race clock');
   if(now-this.room.startAt-end/120*1000>5000)return this.reject(p,'Connection was too far behind to verify this race');
   try{for(let i=0;i<count;i++)decodeRaceFrame(bytes,i*FRAME_BYTES,{});}catch{return this.reject(p,'Invalid controls');}
   await this.ctx.storage.put('input:'+p.id+':'+String(p.ticks).padStart(7,'0'),bytes);p.ticks=end;await this.save();return;
  }
  if(m.type==='pose'){if(now<this.room.startAt||now-(d.poseAt||0)<50||!Array.isArray(m.pose)||m.pose.length!==7||m.pose.some(v=>!Number.isFinite(v)||Math.abs(v)>1e6))return;d.poseAt=now;ws.serializeAttachment(d);this.broadcast({type:'pose',id:p.id,round:1,at:now,pose:m.pose,equipment:m.equipment===2?2:0});return;}
  if(m.type==='respawn'){this.broadcast({type:'respawn',id:p.id,round:1});return;}
  if(m.type==='finish'){
   if(!m.finished)return this.reject(p,'Run ended');if(m.ticks!==p.ticks||p.ticks<1)return this.reject(p,'Incomplete movement history');
   p.finished=true;p.verifying=true;await this.save();this.broadcast(this.state());
   // Keep the durable event alive until the isolated verifier completes. Its work
   // cannot stall pose delivery or allocate a whole game world in this room.
   this.ctx.waitUntil(this.verify(p.id));return;
  }
 }
 async verify(id){const p=this.room.players.find(p=>p.id===id);let result;
  try{const chunks=await this.ctx.storage.list({prefix:'input:'+id+':'}),bytes=new Uint8Array(p.ticks*FRAME_BYTES);let offset=0;for(const chunk of chunks.values()){bytes.set(chunk,offset);offset+=chunk.length;}if(offset!==bytes.length)throw Error('Incomplete replay');
   const response=await this.env.RACE_VERIFIER.fetch('https://verifier/verify',{method:'POST',headers:{'X-Course':this.room.course,'X-Mode':this.room.mode,'X-Rules':this.room.rules,'X-Ticks':String(p.ticks)},body:bytes});if(!response.ok)throw Error('Verification unavailable');result=await response.json();
  }catch{result={verified:false,reason:'Verification could not complete. This result was not ranked.'};}
  p.verifying=false;const row={id:p.id,name:p.name,finished:result.verified===true,verified:result.verified===true,time:result.verified?result.time:null,deaths:result.deaths||0,reason:result.reason||null};
  if(result.verified){row.proof=crypto.randomUUID();await this.ctx.storage.put('proof:'+row.proof,{...result,userId:p.userId,course:this.room.course,mode:this.room.mode,rules:this.room.rules,created:Date.now()});}
  this.room.results.push(row);if(this.room.players.every(p=>p.finished&&!p.verifying))this.room.state='results';await this.save();this.broadcast(this.state());
 }
 async verifiedResult(proof,userId){const result=await this.ctx.storage.get('proof:'+proof);return result?.userId===userId?result:null;}
 async reject(p,reason){p.finished=true;p.verifying=false;this.room.results.push({id:p.id,name:p.name,finished:false,time:null,reason});if(this.room.players.every(p=>p.finished&&!p.verifying))this.room.state='results';await this.save();this.broadcast(this.state());}
 async fail(reason){this.room.state='results';for(const p of this.room.players)if(!p.finished){p.finished=true;this.room.results.push({id:p.id,name:p.name,finished:false,time:null,reason});}await this.save();this.broadcast(this.state());}
 async webSocketClose(ws){const d=ws.deserializeAttachment();try{ws.close(1000);}catch{}const p=this.room?.players.find(p=>p.id===d?.id);if(p&&!p.finished){if(this.room.state==='loading')await this.fail('A player disconnected before boarding completed.');else await this.reject(p,'Disconnected');}}
 async webSocketError(ws){await this.webSocketClose(ws);}
 async alarm(){if(!this.room)return;if(this.room.state==='loading'){await this.fail('Boarding timed out. Everyone must load the map.');await this.ctx.storage.setAlarm(Date.now()+86400000);}else if(this.room.state==='racing'){await this.fail('Race time limit reached');await this.ctx.storage.setAlarm(Date.now()+86400000);}else{for(const{ws}of this.members())ws.close(1000,'Flight ended');await this.ctx.storage.deleteAll();this.room=null;}}
}
