import { DurableObject } from 'cloudflare:workers';

const VERSION='2.12.1', CLIENT_VERSIONS=new Set(['2.9.0','2.9.1','2.9.2','2.10.0','2.11.0','2.12.0',VERSION]), MAX_PLAYERS=8, TTL=2*60*60*1000;
const COURSES=new Set(['sanctuary','hollow','undertow','playdate','small-hours','final-curtain','last-bloom','rupture','uncrowned','last-draft','rep-orca','on-the-menu']);
const supportsMap=(course,version)=>course==='on-the-menu'?version===VERSION:course==='rep-orca'?['2.10.0','2.11.0','2.12.0',VERSION].includes(version):CLIENT_VERSIONS.has(version);
const MODES=new Set(['normal','nightmare']);
const ORIGINS=new Set(['https://comp-run.fluffy-star-4855.chatgpt.site','https://repocompany.uk','https://www.repocompany.uk','http://127.0.0.1:4193']);
const json=(value,status=200,origin)=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...(ORIGINS.has(origin)?{'Access-Control-Allow-Origin':origin,Vary:'Origin'}:{})}});
const cleanName=value=>String(value||'Runner').normalize('NFKC').replace(/[^\p{L}\p{N} _.-]/gu,'').trim().slice(0,20)||'Runner';
const sockets=ctx=>ctx.getWebSockets().filter(ws=>ws.readyState===1);
const send=(ws,value)=>{try{ws.send(JSON.stringify(value));}catch{}};

export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin'),path=new URL(request.url).pathname.replace(/^.*\/races/,'');
  // Electron's installed-file protocol forwards this public, anonymous POST
  // without Origin. A custom header survives it. Never override an explicitly
  // supplied untrusted origin, and never use this marker for account identity.
  const launcherCreate=origin===null&&path==='/new'&&request.method==='POST'&&request.headers.get('X-Comp-Run-Client')==='1';
  if(!ORIGINS.has(origin)&&!launcherCreate)return json({error:'Open multiplayer from COMP-RUN.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Comp-Run-Client',Vary:'Origin','Access-Control-Max-Age':'600'}});
  if(env.ROOM_LIMIT&&!((await env.ROOM_LIMIT.limit({key:request.headers.get('CF-Connecting-IP')||'local'})).success))return json({error:'Please wait a minute before opening another room.'},429,origin);
  if(path==='/new'&&request.method==='POST'){
   const bytes=crypto.getRandomValues(new Uint8Array(8)),alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
   const code=Array.from(bytes,n=>alphabet[n%32]).join('');
   const stub=env.RACE_ROOMS.getByName(code),key=crypto.randomUUID();
   await stub.create(code,key);return json({code,key,version:VERSION},201,origin);
  }
  const match=path.match(/^\/([A-HJ-NP-Z2-9]{8})$/);
  if(match&&request.method==='GET'&&request.headers.get('Upgrade')?.toLowerCase()==='websocket')return env.RACE_ROOMS.getByName(match[1]).fetch(request);
  return json({error:'Race room not found.'},404,origin);
 }
};

/** One durable room per invitation code. Room controls/results survive sleep;
 * transient poses live only in bounded socket attachments. This service never
 * accepts leaderboard scores or account identity from another racer. */
export class RaceRoom extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.room=null;ctx.blockConcurrencyWhile(async()=>{this.room=await ctx.storage.get('room')||null;});}
 async create(code,key){
  if(this.room)throw Error('Invitation collision. Try again.');
  this.room={code,key,host:null,course:'playdate',mode:'normal',rules:'one-life',state:'lobby',round:0,startAt:0,createdAt:Date.now(),expiresAt:Date.now()+TTL,results:[]};
  await this.persist();await this.ctx.storage.setAlarm(this.room.expiresAt);
 }
 async persist(){await this.ctx.storage.put('room',this.room);}
 async fetch(){
  if(!this.room||Date.now()>this.room.expiresAt)return json({error:'This room has expired.'},404);
  if(sockets(this.ctx).length>=MAX_PLAYERS)return json({error:'This room is full.'},409);
  const pair=new WebSocketPair();this.ctx.acceptWebSocket(pair[1]);
  pair[1].serializeAttachment({id:crypto.randomUUID(),joined:false,createdAt:Date.now(),lastAt:0,count:0,window:Date.now(),poseAt:0});
  return new Response(null,{status:101,webSocket:pair[0]});
 }
 members(){return sockets(this.ctx).map(ws=>({ws,data:ws.deserializeAttachment()})).filter(m=>m.data?.joined);}
 publicState(){const r=this.room;return {type:'room',code:r.code,host:r.host,course:r.course,mode:r.mode,rules:r.rules||'one-life',state:r.state,round:r.round,startAt:r.startAt,serverTime:Date.now(),version:VERSION,results:r.results,players:this.members().map(({data:d})=>({id:d.id,name:d.name,runner:d.runner,ready:d.ready,finished:d.finished,deaths:d.deaths||0}))};}
 broadcast(value,except){for(const ws of sockets(this.ctx))if(ws!==except)send(ws,value);}
 async webSocketMessage(ws,raw){
  const d=ws.deserializeAttachment(),now=Date.now();if(!d||!this.room)return ws.close(1008,'Room expired.');
  if(typeof raw!=='string'||raw.length>1024)return ws.close(1009,'Message too large.');
  if(now-d.window>=1000){d.window=now;d.count=0;}
  if(++d.count>35)return ws.close(1008,'Too many updates.');
  ws.serializeAttachment(d);
  let m;try{m=JSON.parse(raw);}catch{return ws.close(1007,'Invalid message.');}
  if(!m||typeof m!=='object')return;
  const error=message=>send(ws,{type:'error',message});
  if(m.type==='hello'&&!d.joined){
   if(!CLIENT_VERSIONS.has(m.version)){error('Update COMP-RUN before joining this room.');return ws.close(1008,'Version mismatch.');}
   if(this.room.state!=='lobby'){error('This race has started. Join after the next round.');return ws.close(1008,'Race started.');}
   if(!supportsMap(this.room.course,m.version)){error('Update COMP-RUN to race this map.');return ws.close(1008,'Map version mismatch.');}
   d.version=m.version;d.joined=true;d.name=cleanName(m.name);d.runner=/^[a-z0-9-]{1,40}$/.test(m.runner)?m.runner:'runner-01';d.ready=false;d.finished=false;
   if(!this.room.host&&m.key===this.room.key)this.room.host=d.id;
   ws.serializeAttachment(d);await this.persist();send(ws,{type:'welcome',id:d.id});this.broadcast(this.publicState());return;
  }
  if(!d.joined)return ws.close(1008,'Join the room first.');
  if(m.type==='ping'){send(ws,{type:'pong',sent:m.sent,serverTime:now});return;}
  const host=this.room.host===d.id;
  if(m.type==='configure'&&host&&this.room.state==='lobby'){
   if(!COURSES.has(m.course)||!MODES.has(m.mode)||!['one-life','race'].includes(m.rules||'one-life'))return error('Choose a map and difficulty.');
   if(this.members().some(p=>!supportsMap(m.course,p.data.version)))return error('Every runner needs the update for this map.');
   this.room.course=m.course;this.room.mode=m.mode;this.room.rules=m.rules||'one-life';for(const {ws:s,data:a}of this.members()){a.ready=false;s.serializeAttachment(a);}await this.persist();this.broadcast(this.publicState());return;
  }
  if(m.type==='ready'&&this.room.state==='lobby'){d.ready=m.ready===true;ws.serializeAttachment(d);this.broadcast(this.publicState());return;}
  if(m.type==='start'&&host&&this.room.state==='lobby'){
   const members=this.members();if(members.length<2||members.some(p=>!p.data.ready))return error('At least two runners must be ready.');
   this.room.state='racing';this.room.round++;this.room.startAt=now+5000;this.room.results=[];
   for(const {ws:s,data:a}of members){a.finished=false;a.deaths=0;a.poseAt=0;s.serializeAttachment(a);}
   await this.persist();this.broadcast(this.publicState());return;
  }
  if(m.type==='pose'&&this.room.state==='racing'&&!d.finished&&m.round===this.room.round){
   if(now<this.room.startAt||now-d.poseAt<55)return;
   if(!Array.isArray(m.pose)||m.pose.length!==7||m.pose.some(v=>!Number.isFinite(v)||Math.abs(v)>1e6))return;
   d.poseAt=now;ws.serializeAttachment(d);this.broadcast({type:'pose',id:d.id,round:this.room.round,at:now,pose:m.pose},ws);return;
  }
  if(m.type==='respawn'&&this.room.rules==='race'&&this.room.state==='racing'&&!d.finished&&m.round===this.room.round){
   if(now<this.room.startAt||now-(d.respawnAt||0)<300)return;
   d.respawnAt=now;d.deaths=(d.deaths||0)+1;d.poseAt=0;ws.serializeAttachment(d);this.broadcast({type:'respawn',id:d.id,round:this.room.round,deaths:d.deaths});return;
  }
  if(m.type==='finish'&&this.room.state==='racing'&&!d.finished&&m.round===this.room.round){
   const elapsed=now-this.room.startAt;if(elapsed<0)return;
   const finished=m.finished===true&&Number.isFinite(m.time)&&m.time>=10&&m.time*1000<=elapsed+1200;
   d.finished=true;ws.serializeAttachment(d);this.room.results.push({id:d.id,name:d.name,finished,time:finished?(this.room.rules==='race'?elapsed/1000:m.time):null,deaths:d.deaths||0});
   if(this.members().every(p=>p.data.finished))this.room.state='results';
   await this.persist();this.broadcast(this.publicState());return;
  }
  if(m.type==='rematch'&&host&&this.room.state==='results'){
   this.room.state='lobby';this.room.startAt=0;this.room.results=[];
   for(const {ws:s,data:a}of this.members()){a.ready=false;a.finished=false;s.serializeAttachment(a);}
   await this.persist();this.broadcast(this.publicState());return;
  }
  ws.serializeAttachment(d);
 }
 async webSocketClose(ws,code,reason,wasClean){
  try{ws.close(code===1006?1001:code,reason);}catch{}
  if(!this.room)return;const d=ws.deserializeAttachment(),others=this.members().filter(p=>p.ws!==ws);
  if(d?.joined&&!others.length){await this.ctx.storage.deleteAll();await this.ctx.storage.deleteAlarm();this.room=null;return;}
  if(d?.joined&&this.room.state==='racing'&&!d.finished)this.room.results.push({id:d.id,name:d.name,finished:false,time:null});
  if(this.room.host===d?.id)this.room.host=others[0]?.data.id||null;
  if(this.room.state==='racing'&&others.every(p=>p.data.finished))this.room.state='results';
  await this.persist();this.broadcast(this.publicState(),ws);
 }
 async webSocketError(ws){try{ws.close(1011,'Connection lost.');}catch{}}
 async alarm(){for(const ws of sockets(this.ctx))ws.close(1000,'Room expired.');await this.ctx.storage.deleteAll();this.room=null;}
}
