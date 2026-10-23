const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const source=fs.readFileSync(require('node:path').join(__dirname,'../functions/api/_middleware.js'),'utf8');
 const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const socket={},upgrade={status:101,webSocket:socket};
 assert.equal(await onRequest({next:async()=>upgrade}),upgrade,'Forward the actual upgraded response and its socket');
 const regular=await onRequest({next:async()=>Response.json({ok:true},{headers:{'Access-Control-Allow-Origin':'https://comp-run.fluffy-star-4855.chatgpt.site'}})});
 assert.equal(regular.status,200);assert.deepEqual(await regular.json(),{ok:true});
 assert.equal(regular.headers.get('X-Content-Type-Options'),'nosniff');
 assert.equal(regular.headers.get('Access-Control-Allow-Origin'),'https://comp-run.fluffy-star-4855.chatgpt.site');
 console.log('PASS: WebSocket upgrade/socket identity and ordinary API security/CORS headers.');
})().catch(e=>{console.error(e);process.exitCode=1;});
