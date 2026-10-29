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
  for(const course of COURSES){
   const ta=await ticket('host-'+course.id),tb=await ticket('guest-'+course.id,'join',ta.code),a=await connect('airport/'+ta.code,ta.ticket),b=await connect('airport/'+tb.code,tb.ticket);
   const aw=await a.wait('airport-welcome'),bw=await b.wait('airport-welcome');a.send({type:'pose',pose:[0,3,110,0,0,0,1]});b.send({type:'pose',pose:[1,3,110,0,0,0,1]});await a.wait('airport-pose',m=>m.id===bw.id);
   a.send({type:'invite',target:bw.id});const invitation=(await b.wait('airport-state',m=>m.invites.length)).invites[0];b.send({type:'accept',invite:invitation.id});const joined=await a.wait('airport-state',m=>m.party?.members.length===2);
   a.send({type:'party-configure',course:course.id,mode:'normal',rules:'race'});await b.wait('airport-state',m=>m.revision>joined.revision&&m.party?.course===course.id);
   a.send({type:'party-ready',ready:true});b.send({type:'party-ready',ready:true});await a.wait('airport-state',m=>m.party?.ready.length===2);a.send({type:'party-depart'});
   const f1=await a.wait('airport-flight'),f2=await b.wait('airport-flight');assert.equal(f1.code,f2.code);
   const r1=await connect('flight/'+f1.code,f1.ticket),r2=await connect('flight/'+f2.code,f2.ticket);await r1.wait('welcome');await r2.wait('welcome');
   r1.send({type:'loaded',version:'2.27.1',protocol:3});await pause(30);assert(!r1.queue.some(m=>m.state==='racing'));
   r2.send({type:'loaded',version:'2.27.1',protocol:3});const start=await r1.wait('room',m=>m.state==='racing'),other=await r2.wait('room',m=>m.state==='racing');assert.equal(start.startAt,other.startAt);
   if(['the-reverse','crossing-abyss'].includes(course.id)){
    await pause(Math.max(0,start.startAt-Date.now()+50));
    r1.send({type:'pose',round:1,pose:[0,4,0,0,0,0,1]});await r2.wait('pose',m=>m.id===aw.id);
    const bytes=encodeRaceFrame({yaw:0,pitch:0,moveX:0,moveZ:0,interactSeq:1});for(const r of[r1,r2]){r.send({type:'inputs',round:1,from:0,data:Buffer.from(bytes).toString('base64')});r.send({type:'finish',round:1,finished:true,ticks:1});}
    const result=await r1.wait('room',m=>m.state==='results');assert.equal(result.results.length,2);assert(result.results.every(r=>!r.verified));assert(result.results.every(r=>r.reason&&!r.reason.includes('unavailable')&&!r.reason.includes('could not complete')));
   }else{r1.send({type:'finish',round:1,finished:false,ticks:0});r2.send({type:'finish',round:1,finished:false,ticks:0});await r1.wait('room',m=>m.state==='results');}
   for(const r of[a,b,r1,r2])r.ws.close();console.log('PASS: two clients join, choose, board, synchronise, and reach results: '+course.id);
  }
  const v=await mf.getWorker('verifier');for(const id of['crossing-abyss','the-reverse']){const r=await v.fetch('https://verifier/verify',{method:'POST',headers:{'X-Course':id,'X-Mode':'normal','X-Rules':'race','X-Ticks':'999999999'},body:new Uint8Array(11)});assert.equal(r.status,400);}
  console.log('PASS: actual verifier rejects incomplete runs and excessive replay claims. These checks do not constitute full map playthroughs.');
 }finally{for(const ws of open)try{ws.close()}catch{}await mf.dispose();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
