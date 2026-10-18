'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..'),originalFetch=global.fetch;
 try{for(const [area,route]of [['dashboard','state'],['achievements','mine']]){
  const file=path.join(root,'functions/api',area,'[[path]].js'),source=fs.readFileSync(file,'utf8').replace(/import (\w+) from '([^']+\.json)';/g,(_,name,relative)=>'const '+name+'='+fs.readFileSync(path.resolve(path.dirname(file),relative),'utf8')+';');
  const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  for(const status of [400,401,403,500]){
   let calls=0;global.fetch=async url=>{calls++;assert(String(url).endsWith('/auth/v1/user'));return Response.json({error_code:'fixture_bad_token'},{status});};
   const response=await onRequest({request:new Request('https://fixture.test/api/'+area+'/'+route,{headers:{Authorization:'Bearer invalid-fixture'}}),params:{path:route},env:{DASHBOARD_DB:{prepare(){throw Error('Rejected identity must never access private data');}}}});
   assert.equal(response.status,status===500?503:401,area+' provider '+status);assert.equal(calls,1);assert.deepEqual(Object.keys(await response.json()),['error']);assert.equal(response.headers.get('Cache-Control'),'no-store');
  }
 }}finally{global.fetch=originalFetch;}
 console.log('PASS: malformed, expired and rejected auth tokens return sign-in errors without private database access; provider outages remain service errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
