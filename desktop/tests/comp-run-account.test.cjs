const {test}=require('node:test'),assert=require('node:assert/strict');
const {requestCompRunAccount}=require('../lib/comp-run-account.cjs');
test('COMP-RUN account capability bounds operations, fixes identity and keeps the token in the main process',async()=>{
 const requests=[],record={__gameId:'comp-run',__accountId:'alice'};
 const account={identity:'alice',token:'main-process-only',state:{status:'online'},requireOnline:async()=>account.identity,fetch:async(url,options)=>{requests.push({url,options});return Response.json({accepted:true});}};
 const call=value=>requestCompRunAccount({account,record,alive:()=>true,portalOrigin:'https://repocompany.uk',value});
 assert.deepEqual(await call({kind:'run-start',body:{courseId:'rupture',username:'bob',Authorization:'evil'}}),{accepted:true});
 assert.equal(requests[0].url,'https://repocompany.uk/api/comp-run/run-start');assert.equal(requests[0].options.headers.Authorization,'Bearer main-process-only');assert.deepEqual(JSON.parse(requests[0].options.body),{courseId:'rupture'});
 await call({kind:'progress',body:{game:'morogue',session:'run',facts:{runners_unlocked:8}}});assert.equal(JSON.parse(requests[1].options.body).game,'comp-run');
 await assert.rejects(call({kind:'session'}),/Unknown/);await assert.rejects(call({kind:'progress',body:{facts:{large:'x'.repeat(5000)}}}),/too large/);
 account.identity='bob';await assert.rejects(call({kind:'start'}),/account changed/);assert.equal(requests.length,2);
 account.identity='alice';account.fetch=async()=>{account.identity='bob';return Response.json({accepted:true});};await assert.rejects(call({kind:'start'}),/account changed/);
});
