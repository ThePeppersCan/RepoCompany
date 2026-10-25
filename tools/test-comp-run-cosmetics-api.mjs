import assert from 'node:assert/strict';
import {createCosmeticsAccess,verifyCosmeticsAccess,cosmeticsRequest} from '../lib/comp-run-cosmetics.mjs';
const user='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
let dbOwner=user,dbArgs,requestBody,called=0,status=200,result=[{new_gp:6400,owned:['jester'],runners:['archfiend'],already_owned:false}];
const env={ACCOUNT_ADMIN_KEY:'test-only-service-key',DASHBOARD_DB:{prepare(sql){assert.match(sql,/s\.expires_at>\?/);return{bind(...args){dbArgs=args;return{async first(){return dbOwner?{user_id:dbOwner}:null;}};}};}}};
const now=Date.now(),access=await createCosmeticsAccess(env,user,session,now);
assert.equal((await verifyCosmeticsAccess(env,access.ticket,now)).userId,user);
for(const [ticket,at] of [[access.ticket+'x',now],[access.ticket,now+900000],[access.ticket,now-900001],['malformed',now]])await assert.rejects(verifyCosmeticsAccess(env,ticket,at),/AUTH/);
await assert.rejects(verifyCosmeticsAccess({...env,ACCOUNT_ADMIN_KEY:'different'},access.ticket,now),/AUTH/);
assert.equal(await createCosmeticsAccess({},user,session),null);
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{called++;assert.match(url,/^https:\/\/test\.invalid\/rest\/v1\/rpc\/(buy_comp_run_cosmetic_for_user|comp_run_cosmetics_for_user)$/);requestBody=JSON.parse(options.body);return Response.json(result,{status});};
const send=body=>cosmeticsRequest({request:new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)}),env,config:{url:'https://test.invalid'},reply:(body,status=200)=>({body,status}),readBody:r=>r.json()});
try{
 let r=await send({action:'buy',ticket:access.ticket,finishId:'jester',price:0,userId:'somebody-else'});
 assert.equal(r.status,200);assert.deepEqual(requestBody,{p_user_id:user,p_kind:'knife',p_id:'jester'});assert.equal(dbArgs[0],session);assert.equal(dbArgs[1],'comp-run');assert.equal(dbArgs[3],user);assert.deepEqual(r.body,{owned:['jester'],runners:['archfiend'],balance:6400,alreadyOwned:false});
 r=await send({action:'state',ticket:access.ticket});assert.equal(r.status,200);assert.deepEqual(requestBody,{p_user_id:user});
 r=await send({action:'buy-runner',ticket:access.ticket,runnerId:'archfiend',price:0});assert.equal(r.status,200);assert.deepEqual(requestBody,{p_user_id:user,p_kind:'runner',p_id:'archfiend'});
 let before=called;dbOwner=null;r=await send({action:'buy',ticket:access.ticket,finishId:'jester'});assert.equal(r.status,401);assert.equal(called,before,'An expired or deleted game session must not reach a purchase');
 dbOwner='33333333-3333-4333-8333-333333333333';r=await send({action:'buy',ticket:access.ticket,finishId:'jester'});assert.equal(r.status,401);assert.equal(called,before,'A different account must not use the ticket');
 dbOwner=user;r=await send({action:'buy',ticket:access.ticket,finishId:'../malicious'});assert.equal(r.status,400);assert.equal(called,before);
 status=400;result={message:'You need 3600 Repoints to buy this finish.'};r=await send({action:'buy',ticket:access.ticket,finishId:'jester'});assert.equal(r.status,400);assert.match(r.body.error,/3600/);
 status=500;result={message:'private server internals'};r=await send({action:'buy',ticket:access.ticket,finishId:'jester'});assert.equal(r.status,503);assert(!r.body.error.includes('private'));
 status=200;result=[{new_gp:-1,owned:['jester']}];r=await send({action:'state',ticket:access.ticket});assert.equal(r.status,503);
}finally{globalThis.fetch=originalFetch;}
console.log('PASS: signed ticket expiry/tampering, account/session isolation, server-only price and user, bounded errors, invalid balances. No real account data or purchases.');
