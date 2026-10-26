import {DurableObject} from 'cloudflare:workers';
import {createAirportState,airportCommand,airportPublicState,removeAirportPlayer} from './airport-state.mjs';
import {createAirportActivities,airportSportAction,stepAirportActivities} from './shared/airport-activities.js';
const send=(s,m)=>{try{s.send(JSON.stringify(m));}catch{}},code=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');
const open=ctx=>ctx.getWebSockets().filter(s=>s.readyState===1),clean=v=>String(v||'Runner').replace(/[^\p{L}\p{N} _.-]/gu,'').slice(0,20);
export class AirportDirectory extends DurableObject{
 async allocate(identity){return this.ctx.blockConcurrencyWhile(async()=>{
  if(identity.version!=='2.18.0')return{error:'Update COMP-RUN to enter the airport.'};
  const now=Date.now(),key='account:'+identity.userId,previous=await this.ctx.storage.get(key);
  if(previous&&now-previous<2000)return{error:'Please wait a moment before joining again.'};await this.ctx.storage.put(key,now);await this.ctx.storage.setAlarm(now+7200000);
  let rooms=await this.ctx.storage.get('rooms')||[];
  if(identity.kind==='join')return this.env.AIRPORT_ROOMS.getByName(identity.code).reserve(identity);
  if(identity.kind==='public')for(const id of rooms){const result=await this.env.AIRPORT_ROOMS.getByName(id).reserve(identity);if(!result.error)return result;}
  const id=code(),room=this.env.AIRPORT_ROOMS.getByName(id);await room.create(id,identity.kind==='private');const result=await room.reserve(identity);
  if(identity.kind==='public'){rooms=[...rooms,id].slice(-100);await this.ctx.storage.put('rooms',rooms);}return result;
 });}
 async alarm(){await this.ctx.storage.deleteAll();}
}
export class AirportRoom extends DurableObject{
 constructor(ctx,env){super(ctx,env);this.state=null;this.tickets={};this.activities=createAirportActivities();this.lastTick=Date.now();this.lastBroadcast=0;ctx.blockConcurrencyWhile(async()=>{this.state=await ctx.storage.get('airport')||null;this.tickets=await ctx.storage.get('tickets')||{};this.activities=await ctx.storage.get('activities')||createAirportActivities();});}
 async create(id,privateRoom){if(this.state)throw Error('Airport exists');this.state=createAirportState(id,privateRoom);await this.save();}
 members(){return open(this.ctx).map(ws=>({ws,d:ws.deserializeAttachment()})).filter(p=>p.d?.joined);}
 sync(){if(this.state)this.state.players=this.members().map(({d})=>d);}
 async save(){if(!this.state)return;this.sync();await this.ctx.storage.put({airport:{...this.state,players:[]},tickets:this.tickets,activities:this.activities});await this.ctx.storage.setAlarm(Date.now()+60000);}
 async reserve(identity){return this.ctx.blockConcurrencyWhile(async()=>{
  if(!this.state)return{error:'This airport is no longer available.'};const now=Date.now();this.tickets=Object.fromEntries(Object.entries(this.tickets).filter(([,v])=>v.expires>now));
  if(this.members().some(p=>p.d.userId===identity.userId))return{error:'Your account is already in this airport.'};
  for(const[k,v]of Object.entries(this.tickets))if(v.userId===identity.userId)delete this.tickets[k];
  if(this.members().length+Object.keys(this.tickets).length>=12)return{error:'This airport is full.'};
  const ticket=crypto.randomUUID();this.tickets[ticket]={...identity,name:clean(identity.name),expires:now+60000};await this.save();return{code:this.state.code,ticket,expires:now+60000};
 });}
 async fetch(){if(!this.state||open(this.ctx).length>=24)return new Response('Airport unavailable',{status:409});const pair=new WebSocketPair();this.ctx.acceptWebSocket(pair[1]);pair[1].serializeAttachment({created:Date.now(),window:Date.now(),count:0,joined:false});await this.ctx.storage.setAlarm(Date.now()+15000);return new Response(null,{status:101,webSocket:pair[0]});}
 broadcast(m){for(const{ws}of this.members())send(ws,m);}
 stateToAll(){this.sync();for(const{ws,d}of this.members())send(ws,airportPublicState(this.state,d.id));}
 advance(now){this.sync();let dt=Math.min(.25,Math.max(0,(now-this.lastTick)/1000));this.lastTick=now;while(dt>0){const step=Math.min(1/120,dt);stepAirportActivities(this.activities,step,this.state.players.map(p=>({id:p.id,x:p.pose[0],y:p.pose[1],z:p.pose[2],yaw:p.pose[3],pitch:p.pitch||0})));dt-=step;}}
 async webSocketMessage(ws,raw){
  let d=ws.deserializeAttachment(),m;const now=Date.now();if(!d||!this.state)return ws.close(1008,'Airport expired');if(typeof raw!=='string'||raw.length>2048)return ws.close(1009,'Message too large');try{m=JSON.parse(raw);}catch{return ws.close(1007,'Invalid message');}
  if(now-d.window>=1000){d.window=now;d.count=0;}if(++d.count>45)return ws.close(1008,'Too many updates');ws.serializeAttachment(d);
  if(m.type==='hello'&&!d.joined){const ticket=this.tickets[m.ticket];if(!ticket||ticket.expires<=now||this.members().length>=12)return ws.close(1008,'Join again from COMP-RUN');delete this.tickets[m.ticket];
   Object.assign(d,{joined:true,id:crypto.randomUUID(),userId:ticket.userId,name:ticket.name,runner:ticket.runner,knife:ticket.knife,pose:[0,.05,28,0,0,0,1],pitch:0});ws.serializeAttachment(d);await this.save();send(ws,{type:'airport-welcome',id:d.id,serverTime:now});this.stateToAll();return;
  }
  if(!d.joined)return ws.close(1008,'Join first');
  if(m.type==='ping'){send(ws,{type:'pong',sent:m.sent,serverTime:now});return;}
  if(m.type==='pose'){
   if(now-(d.poseAt||0)<45||!Array.isArray(m.pose)||m.pose.length!==7||m.pose.some(v=>!Number.isFinite(v)||Math.abs(v)>5000))return;
   d.pose=m.pose;d.pitch=Math.max(-1.45,Math.min(1.45,Number(m.pitch)||0));d.poseAt=now;ws.serializeAttachment(d);this.advance(now);
   this.broadcast({type:'airport-pose',id:d.id,pose:d.pose,at:now});if(now-this.lastBroadcast>100){this.lastBroadcast=now;this.broadcast({type:'airport-activities',state:this.activities,at:now});}return;
  }
  this.advance(now);
  if(m.type==='sport'){airportSportAction(this.activities,m.action,{x:d.pose[0],y:d.pose[1],z:d.pose[2],yaw:d.pose[3],pitch:d.pitch},d.id);this.broadcast({type:'airport-activities',state:this.activities,at:now});await this.save();return;}
  if(m.type==='lift'){if(Math.hypot(d.pose[0]+14,d.pose[2]+27)>9)return;if(now-(this.state.liftAt||0)<17000)return;this.state.liftAt=now;this.broadcast({type:'airport-lift',at:now});await this.save();return;}
  const result=airportCommand(this.state,d.id,m,now);const updated=this.state.players.find(p=>p.id===d.id);if(updated?.lastInvite){d.lastInvite=updated.lastInvite;ws.serializeAttachment(d);}if(!result.ok){send(ws,{type:'error',message:result.error});return;}
  if(result.depart){
   const flight=code(),party=result.depart,roster=this.members().filter(p=>party.members.includes(p.d.id)).map(p=>({...p.d}));
   try{const admissions=await this.env.VERIFIED_RACES.getByName(flight).create({code:flight,course:party.course,mode:party.mode,rules:party.rules,players:roster,leader:party.leader});
    for(const{ws:s,d:a}of this.members())if(admissions[a.id])send(s,{type:'airport-flight',code:flight,ticket:admissions[a.id],course:party.course,mode:party.mode,rules:party.rules});
   }catch{const current=this.state.parties.find(p=>p.id===party.id);if(current)current.preparing=false;send(ws,{type:'error',message:'The flight could not start. Please try again.'});}
  }
  await this.save();this.stateToAll();
 }
 async webSocketClose(ws){const d=ws.deserializeAttachment();try{ws.close(1000);}catch{}if(d?.joined&&this.state){this.sync();removeAirportPlayer(this.state,d.id);for(const b of this.activities.balls)if(b.owner===d.id)b.owner=null;await this.save();this.stateToAll();}}
 async webSocketError(ws){await this.webSocketClose(ws);}
 async alarm(){const now=Date.now();for(const ws of open(this.ctx)){const d=ws.deserializeAttachment();if(!d?.joined&&now-d.created>10000)ws.close(1008,'Join timed out');}this.tickets=Object.fromEntries(Object.entries(this.tickets).filter(([,v])=>v.expires>now));if(!this.members().length&&!Object.keys(this.tickets).length){await this.ctx.storage.deleteAll();this.state=null;}else await this.save();}
}
