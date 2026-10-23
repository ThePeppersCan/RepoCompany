const assert=require('node:assert/strict');
const {WebSocket}=require('ws');
const base='http://127.0.0.1:8799',origin='http://127.0.0.1:4193';
const sleep=t=>new Promise(r=>setTimeout(r,t));
async function client(code,name,key){const ws=new WebSocket(base.replace('http','ws')+'/races/'+code,{headers:{Origin:origin}}),messages=[];ws.on('message',r=>messages.push(JSON.parse(r)));await new Promise((ok,no)=>{ws.once('open',ok);ws.once('error',no)});ws.send(JSON.stringify({type:'hello',version:'2.6.0',name,runner:'runner-01',key}));async function wait(check){for(let i=0;i<100;i++){const m=messages.findLast(check);if(m)return m;await sleep(30);}throw Error('Timed out: '+JSON.stringify(messages));}const welcome=await wait(m=>m.type==='welcome');return {ws,messages,id:welcome.id,send:m=>ws.send(JSON.stringify(m)),wait};}
(async()=>{
 assert.equal((await fetch(base+'/races/new',{method:'POST',headers:{Origin:'https://evil.invalid'}})).status,403);
 const r=await fetch(base+'/races/new',{method:'POST',headers:{Origin:origin}});assert.equal(r.status,201);const room=await r.json();assert.match(room.code,/^[A-HJ-NP-Z2-9]{8}$/);
 const a=await client(room.code,'Host',room.key),b=await client(room.code,'Guest <script>');
 assert.equal((await a.wait(m=>m.type==='room'&&m.players.length===2)).host,a.id);
 b.send({type:'configure',course:'uncrowned',mode:'nightmare'});await sleep(80);assert.equal(a.messages.findLast(m=>m.type==='room').course,'playdate');
 a.send({type:'start'});await a.wait(m=>m.type==='error'&&m.message.includes('ready'));
 a.send({type:'configure',course:'uncrowned',mode:'nightmare'});await b.wait(m=>m.type==='room'&&m.course==='uncrowned');
 a.send({type:'ready',ready:true});b.send({type:'ready',ready:true});await a.wait(m=>m.type==='room'&&m.players.every(p=>p.ready));a.send({type:'start'});
 const start=await b.wait(m=>m.type==='room'&&m.state==='racing');assert.equal(start.round,1);assert(start.startAt>Date.now());assert.equal(start.mode,'nightmare');
 b.send({type:'finish',round:1,finished:true,time:10});await sleep(50);assert.equal(a.messages.findLast(m=>m.type==='room').results.length,0);
 await sleep(Math.max(0,start.startAt-Date.now()+50));a.send({type:'pose',round:1,pose:[1,380,3,0,14,12,1]});const pose=await b.wait(m=>m.type==='pose');assert.deepEqual(pose.pose,[1,380,3,0,14,12,1]);assert.equal(pose.id,a.id);
 b.send({type:'finish',round:1,finished:true,time:999});await a.wait(m=>m.type==='room'&&m.results.length===1);assert.equal(a.messages.findLast(m=>m.type==='room').results[0].finished,false);
 a.send({type:'finish',round:1,finished:false});await b.wait(m=>m.type==='room'&&m.state==='results');
 a.send({type:'rematch'});await b.wait(m=>m.type==='room'&&m.state==='lobby'&&m.round===1);assert.equal(b.messages.findLast(m=>m.type==='room').players.some(p=>p.ready),false);
 a.ws.close(1000);const migrated=await b.wait(m=>m.type==='room'&&m.host===b.id);assert.equal(migrated.players.length,1);b.ws.close(1000);
 console.log('PASS: origin, invitations, host authorization, ready gate, shared countdown, pose relay, premature/invalid finishes, results, rematch, host migration.');
})().catch(e=>{console.error(e);process.exit(1)});
