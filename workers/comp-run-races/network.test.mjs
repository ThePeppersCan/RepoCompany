import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {build} from 'esbuild';
import fs from 'node:fs';
const root=new URL('.',import.meta.url),bundle=await build({entryPoints:[new URL('worker.mjs',root).pathname.replace(/^\/([A-Z]:)/,'$1')],bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
const mf=new Miniflare(convertV4MiniflareOptions({workers:[
 {name:'driver',modules:true,compatibilityDate:'2026-10-13',serviceBindings:{RACE:'race'},script:`export default {async fetch(r,env){const b=await r.json();return Response.json(await env.RACE.airportTicket(b));}}`},
 {name:'race',modules:true,compatibilityDate:'2026-10-13',script:bundle.outputFiles[0].text,durableObjects:{RACE_ROOMS:{className:'RaceRoom',useSQLite:true},AIRPORT_DIRECTORY:{className:'AirportDirectory',useSQLite:true},AIRPORT_ROOMS:{className:'AirportRoom',useSQLite:true},VERIFIED_RACES:{className:'VerifiedRaceRoom',useSQLite:true}},serviceBindings:{RACE_VERIFIER:'verifier'}},
 {name:'verifier',modules:true,compatibilityDate:'2026-10-13',script:fs.readFileSync(new URL('../comp-run-verifier/bundle.mjs',root),'utf8')}
]}));
const all=[],pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 const race=await mf.getWorker('race');
 async function ticket(userId,kind='public',code){const r=await mf.dispatchFetch('https://driver',{method:'POST',body:JSON.stringify({userId,name:'QA '+userId,kind,code,version:'2.15.2',runner:'runner-01',knife:{}})});return r.json();}
 async function connect(path,ticket){const r=await race.fetch('https://repocompany.uk/api/comp-run/races/'+path,{headers:{Upgrade:'websocket',Origin:'http://127.0.0.1:4193'}});assert.equal(r.status,101);const ws=r.webSocket,queue=[];ws.accept();all.push(ws);ws.addEventListener('message',e=>queue.push(JSON.parse(e.data)));const api={ws,queue,send:m=>ws.send(JSON.stringify(m)),async wait(type,predicate=()=>true){for(let i=0;i<200;i++){const at=queue.findIndex(m=>m.type===type&&predicate(m));if(at>=0)return queue.splice(at,1)[0];await pause(20);}throw Error('Missing '+type+': '+JSON.stringify(queue));}};api.send({type:'hello',ticket});return api;}
 const a=await ticket('a'),b=await ticket('b');assert.equal(a.code,b.code);const one=await connect('airport/'+a.code,a.ticket),two=await connect('airport/'+b.code,b.ticket),aw=await one.wait('airport-welcome'),bw=await two.wait('airport-welcome');
 one.send({type:'invite',target:bw.id});const invitation=(await two.wait('airport-state',s=>s.invites.length)).invites[0];assert.equal(invitation.from,aw.id);two.send({type:'accept',invite:invitation.id});await one.wait('airport-state',s=>s.party?.members.length===2);
 two.send({type:'party-configure',course:'hollow',mode:'normal',rules:'race'});assert.match((await two.wait('error')).message,/leader/);
 one.send({type:'party-configure',course:'sanctuary',mode:'normal',rules:'race'});one.send({type:'party-ready',ready:true});one.send({type:'party-depart'});assert.match((await one.wait('error')).message,/Everyone/);two.send({type:'party-ready',ready:true});await one.wait('airport-state',s=>s.party?.ready.length===2);one.send({type:'party-depart'});
 const f1=await one.wait('airport-flight'),f2=await two.wait('airport-flight');assert.equal(f1.code,f2.code);
 const r1=await connect('flight/'+f1.code,f1.ticket),r2=await connect('flight/'+f2.code,f2.ticket);await r1.wait('welcome');await r2.wait('welcome');r1.send({type:'loaded',version:'2.15.2',protocol:3});await pause(80);assert(!r1.queue.some(m=>m.state==='racing'),'Countdown cannot start before everyone loads');r2.send({type:'loaded',version:'2.15.2',protocol:3});const s1=await r1.wait('room',s=>s.state==='racing'),s2=await r2.wait('room',s=>s.state==='racing');assert.equal(s1.startAt,s2.startAt);assert(s1.startAt>Date.now()+4000);
 r1.send({type:'inputs',round:1,from:0,data:Buffer.alloc(120*11).toString('base64')});const rejected=await r1.wait('room',s=>s.results.length);assert.equal(rejected.results[0].verified,undefined);assert.match(rejected.results[0].reason,/timing/,'Inputs cannot run ahead of the server clock');
 for(let n=2;n<12;n++){const t=await ticket('cap'+n);assert.equal(t.code,a.code);}const overflow=await ticket('overflow');assert.notEqual(overflow.code,a.code,'Airports hold at most 12 reservations and players');
 const privateTicket=await ticket('private','private'),join=await ticket('private2','join',privateTicket.code);assert.equal(join.code,privateTicket.code);assert.notEqual(privateTicket.code,a.code);
 console.log('PASS: public allocation, private join, capacity 12, accepted invites, leader-only destination, all-ready departure, all-loaded barrier, identical start time, speed-clock rejection.');
}finally{for(const s of all)try{s.close();}catch{}await mf.dispose();}
