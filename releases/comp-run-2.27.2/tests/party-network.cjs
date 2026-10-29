const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const repo=process.env.COMP_RUN_TEST_DEPS||process.cwd();
const {Miniflare,convertV4MiniflareOptions,Log,LogLevel}=require(require.resolve('miniflare',{paths:[repo]}));
const {build}=require(require.resolve('esbuild',{paths:[repo]}));
const root=path.resolve(__dirname,'..'),pause=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const {COURSES}=await import(require('node:url').pathToFileURL(path.join(root,'game/journeys.js')).href),{encodeRaceFrame}=await import(require('node:url').pathToFileURL(path.join(root,'game/race-protocol.js')).href);
 const [raceBundle,verifyBundle]=await Promise.all([
  build({entryPoints:[path.join(root,'workers/races/worker.mjs')],bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']}),
  build({entryPoints:[path.join(root,'workers/verifier/entry.mjs')],bundle:true,write:false,minify:true,format:'esm',platform:'browser'})
 ]);
 await fs.writeFile(path.join(root,'workers/verifier/bundle.mjs'),verifyBundle.outputFiles[0].text);
 const mf=new Miniflare({...convertV4MiniflareOptions({workers:[
  {name:'driver',modules:true,compatibilityDate:'2026-10-13',serviceBindings:{RACE:'race'},script:`export default {async fetch(r,env){if(new URL(r.url).pathname==='/ticket')return Response.json(await env.RACE.airportTicket(await r.json()));return env.RACE.fetch(r);}}`},
  {name:'race',modules:true,compatibilityDate:'2026-10-13',script:raceBundle.outputFiles[0].text,durableObjects:{RACE_ROOMS:{className:'RaceRoom',useSQLite:true},AIRPORT_DIRECTORY:{className:'AirportDirectory',useSQLite:true},AIRPORT_ROOMS:{className:'AirportRoom',useSQLite:true},VERIFIED_RACES:{className:'VerifiedRaceRoom',useSQLite:true}},serviceBindings:{RACE_VERIFIER:'verifier'}},
  {name:'verifier',modules:true,compatibilityDate:'2026-10-13',script:verifyBundle.outputFiles[0].text}
 ]}),log:new Log(LogLevel.ERROR)});
 const open=[];
 try{
  const service={fetch:mf.dispatchFetch.bind(mf)};
  async function ticket(userId,kind='private',code){const r=await mf.dispatchFetch('https://driver/ticket',{method:'POST',body:JSON.stringify({userId,name:userId,kind,code,version:'2.27.1-crossing1',runner:'runner-01',knife:{}})});const result=await r.json();assert(!result.error,result.error);return result;}
  async function connect(p,ticket){const r=await service.fetch('https://repocompany.uk/api/comp-run/races/'+p,{headers:{Upgrade:'websocket',Origin:'https://repocompany.uk'}});assert.equal(r.status,101,r.status===101?'':await r.text());const ws=r.webSocket,queue=[];ws.accept();open.push(ws);ws.addEventListener('message',e=>queue.push(JSON.parse(e.data)));const c={ws,queue,send:m=>ws.send(JSON.stringify(m)),async wait(type,p=()=>true){for(let i=0;i<500;i++){const at=queue.findIndex(m=>m.type===type&&p(m));if(at>=0)return queue.splice(at,1)[0];await pause(20);}throw Error('Missing '+type+' '+JSON.stringify(queue));}};c.send({type:'hello',ticket});return c;}

  const ta=await ticket('party-host'),tb=await ticket('party-guest','join',ta.code),tc=await ticket('party-outsider','join',ta.code);
  const a=await connect('airport/'+ta.code,ta.ticket);let b=await connect('airport/'+tb.code,tb.ticket);const c=await connect('airport/'+tc.code,tc.ticket);
  const aw=await a.wait('airport-welcome'),bw=await b.wait('airport-welcome');await c.wait('airport-welcome');
  a.send({type:'pose',pose:[-20,3,110,0,0,0,1]});b.send({type:'pose',pose:[20,3,110,0,0,0,1]});await a.wait('airport-pose',m=>m.id===bw.id);
  a.send({type:'invite',target:bw.id});const invite=(await b.wait('airport-state',m=>m.invites.length)).invites[0];b.send({type:'accept',invite:invite.id});const initial=await a.wait('airport-state',m=>m.party?.members.length===2),partyId=initial.party.id;
  assert.equal(initial.code,ta.code);console.log('PASS: invite across lobby and accept once');
  for(const course of ['higher-ground','the-reverse','crossing-abyss']){
   a.queue.length=b.queue.length=0;
   a.send({type:'party-configure',course,mode:'normal',rules:'race'});await b.wait('airport-state',m=>m.party?.course===course&&!m.party.preparing);
   a.send({type:'party-ready',ready:true});b.send({type:'party-ready',ready:true});await a.wait('airport-state',m=>m.party?.ready.length===2);a.send({type:'party-depart'});
   let f1=await a.wait('airport-flight'),f2=await b.wait('airport-flight');assert.equal(f1.code,f2.code);
   let r1=await connect('flight/'+f1.code,f1.ticket);await r1.wait('welcome');const joining=await r1.wait('room');assert.equal(joining.players.find(p=>p.id===bw.id).joined,false);
   let r2=await connect('flight/'+f2.code,f2.ticket);await r2.wait('welcome');await r1.wait('room',m=>m.players.every(p=>p.joined));
   r1.send({type:'loaded',version:'2.27.1',protocol:3});await r2.wait('room',m=>m.players.some(p=>p.ready));assert(!r1.queue.some(m=>m.state==='racing'));
   r2.send({type:'loaded',version:'2.27.1',protocol:3});await r1.wait('room',m=>m.state==='racing');
   b.send({type:'party-return'});assert.match((await b.wait('error')).message,/leader/);c.send({type:'party-restart'});assert.match((await c.wait('error')).message,/party/);
   a.send({type:'party-presence',flight:f1.code,phase:'racing'});await b.wait('airport-state',m=>m.players.find(p=>p.id===aw.id).phase==='racing');
   a.send({type:'party-restart'});const next1=await a.wait('airport-flight'),next2=await b.wait('airport-flight');assert.equal(next1.code,next2.code);assert.notEqual(next1.code,f1.code);
   r1.ws.close();r2.ws.close();r1=await connect('flight/'+next1.code,next1.ticket);r2=await connect('flight/'+next2.code,next2.ticket);await r1.wait('welcome');await r2.wait('welcome');
   r1.send({type:'loaded',version:'2.27.1',protocol:3});r2.send({type:'loaded',version:'2.27.1',protocol:3});await r1.wait('room',m=>m.state==='racing');r1.send({type:'finish',round:1,finished:false,ticks:0});r2.send({type:'finish',round:1,finished:false,ticks:0});await r1.wait('room',m=>m.state==='results');
   a.queue.length=b.queue.length=0;a.send({type:'party-return'});await a.wait('airport-return');await b.wait('airport-return');const back=await a.wait('airport-state',m=>!m.party?.preparing);
   assert.equal(back.party.id,partyId);assert.equal(back.code,ta.code);assert.deepEqual(back.party.members,[aw.id,bw.id]);assert.deepEqual(back.party.ready,[]);assert(back.players.filter(p=>[aw.id,bw.id].includes(p.id)).every(p=>p.phase==='lobby'));
   a.send({type:'pose',pose:[-3,3,110,0,0,0,1]});b.send({type:'pose',pose:[3,3,110,0,0,0,1]});await a.wait('airport-pose',m=>m.id===bw.id);await b.wait('airport-pose',m=>m.id===aw.id);r1.ws.close();r2.ws.close();console.log('PASS: same party and lobby through '+course+', group restart, results, return, shared poses, leader authority');
  }
  a.queue.length=0;b.ws.close();await a.wait('airport-state',m=>m.players.find(p=>p.id===bw.id)?.connected===false);await pause(2100);
  const again=await ticket('party-guest','join',ta.code);b=await connect('airport/'+ta.code,again.ticket);const resumed=await b.wait('airport-welcome');assert.equal(resumed.id,bw.id);assert(resumed.resumed);const restored=await b.wait('airport-state');assert.equal(restored.party.id,partyId);assert(restored.players.every(p=>p.connected));
  a.send({type:'airport-leave'});const migrated=await b.wait('airport-state',m=>m.party?.leader===bw.id);assert.deepEqual(migrated.party.members,[bw.id]);console.log('PASS: reconnect restores the same identity and party; leaving transfers leadership');
  b.send({type:'airport-leave'});c.send({type:'airport-leave'});
  const v=await mf.getWorker('verifier');for(const id of['crossing-abyss','the-reverse']){const r=await v.fetch('https://verifier/verify',{method:'POST',headers:{'X-Course':id,'X-Mode':'normal','X-Rules':'race','X-Ticks':'999999999'},body:new Uint8Array(11)});assert.equal(r.status,400);}
  console.log('PASS: actual verifier rejects incomplete runs and excessive replay claims. These checks do not constitute full map playthroughs.');
 }finally{for(const ws of open)try{ws.close()}catch{}await mf.dispose();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
