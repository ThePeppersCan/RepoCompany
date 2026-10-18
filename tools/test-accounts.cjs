const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),f=await createFixture(),fallback=global.fetch;
 const {OWNER_ID,digest,sendAccountMail}=await import(pathToFileURL(path.join(root,'lib/accounts.mjs')));
 const config=f.config,env={...f.env,RESEND_API_KEY:'fixture-only'},users={owner:{id:OWNER_ID,email:'catasthma@'+config.authDomain,user_metadata:{username:'CatAsthma'}},alice:f.sessions.alice.user,bob:f.sessions.bob.user};
 const issued=new Map(),emails=[],created=[];let failEmail=false;
 f.sql.exec(fs.readFileSync(path.join(root,'dashboard-accounts-schema.sql'),'utf8'));
 global.fetch=async(input,options={})=>{
  const url=String(input),body=JSON.parse(options.body||'{}'),token=new Headers(options.headers).get('Authorization')?.replace('Bearer ',''),user=users[token];
  if(url==='https://api.resend.com/emails'){assert.equal(new Headers(options.headers).get('Authorization'),'Bearer fixture-only');if(failEmail)return Response.json({error:'fixture outage'},{status:503});emails.push(body);return Response.json({id:crypto.randomUUID()});}
  if(url===config.url+'/auth/v1/user'&&options.method!=='PUT')return Response.json(user||{error:'Invalid'}, {status:user?200:401});
  if(url.endsWith('/rest/v1/rpc/get_my_character'))return Response.json([{username:user?.user_metadata.username}]);
  if(url.endsWith('/auth/v1/token?grant_type=password')){const u=Object.values(users).find(u=>u.email===body.email);return Response.json(body.password==='correct-password'&&u?{user:u}:{error:'Wrong password'},{status:body.password==='correct-password'&&u?200:400});}
  if(url.endsWith('/auth/v1/admin/generate_link')){
   assert.equal(token,env.WIBS_STORAGE_KEY);let u=Object.values(users).find(u=>u.email===body.email);
   if(body.type==='invite'&&!u){u={id:crypto.randomUUID(),email:body.email,user_metadata:body.data};users[u.id]=u;created.push(u);}
   if(!u)return Response.json({error:'missing'},{status:400});const hashed_token='token_'+crypto.randomUUID().replaceAll('-','');issued.set(hashed_token,{u,purpose:body.type});return Response.json({...u,hashed_token});
  }
  if(url.endsWith('/auth/v1/verify')){const link=issued.get(body.token_hash);if(!link||body.type!==link.purpose)return Response.json({error:'invalid'},{status:400});issued.delete(body.token_hash);users['session-'+link.u.id]=link.u;return Response.json({user:link.u,access_token:'session-'+link.u.id});}
  if(url.endsWith('/auth/v1/user')&&options.method==='PUT'){assert(user);assert(body.password.length>=12);return Response.json(user);}
  if(url.endsWith('/auth/v1/logout?scope=global'))return new Response(null,{status:204});
  return fallback(input,options);
 };
 const source=fs.readFileSync(path.join(root,'functions/api/accounts/[[path]].js'),'utf8').replace("import config from '../../../dashboard-config.json';",'const config='+JSON.stringify(config)+';').replace("'../../../lib/accounts.mjs'",JSON.stringify(pathToFileURL(path.join(root,'lib/accounts.mjs')).href));
 const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 let ip=1;async function call(route,body,who,status=200,headers={}){const request=new Request('https://fixture.test/api/accounts/'+route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.'+(ip++),...(who?{Authorization:'Bearer '+who}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});const r=await onRequest({request,env,params:{path:route}}),data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;}
 const mailToken=mail=>new URLSearchParams(mail.text.match(/https:\/\/repocompany.uk\/account-access\/#[^\s]+/)[0].split('#')[1]).get('token');
 try{
  await call('request',{username:'newfriend',email:'friend@example.com',note:'A friend'},null,200);assert.equal(created.length,0);assert.equal(emails.length,0);
  await call('requests',undefined,null,401);await call('requests',undefined,'alice',403);
  const pending=(await call('requests',undefined,'owner')).requests[0];assert.equal(pending.status,'pending');
  await call('review',{id:pending.id,action:'approve'},'alice',403);assert.equal(created.length,0);
  await call('review',{id:pending.id,action:'approve'},'owner');assert.equal(created.length,1);assert.equal(emails.length,1);assert.equal(emails[0].to[0],'friend@example.com');
  const invite=mailToken(emails[0]);await call('complete',{purpose:'invite',token:invite,password:'long-enough-password'});const contact=f.sql.prepare('SELECT * FROM account_contacts WHERE email=?').get('friend@example.com');assert.equal(contact.user_id,created[0].id);
  await call('complete',{purpose:'invite',token:invite,password:'long-enough-password'},null,400);assert.equal((await call('requests',undefined,'owner')).requests[0].status,'active');
  await call('review',{id:pending.id,action:'resend'},'owner',409);
  await call('email',{email:'alice@example.com',password:'wrong'},'alice',400);assert.equal(emails.length,1);
  await call('email',{email:'alice@example.com',password:'correct-password'},'alice');assert.equal((await call('status',undefined,'alice')).verified,false);
  await call('complete',{purpose:'email',token:mailToken(emails[1])});const verified=await call('status',undefined,'alice');assert.equal(verified.email,'alice@example.com');assert.equal(verified.canApprove,false);assert.equal(users.alice.id,f.sessions.alice.user.id);assert.equal(users.alice.email,'alice@'+config.authDomain);
  await call('complete',{purpose:'email',token:mailToken(emails[1])},null,400);
  await call('email',{email:'alice@example.com',password:'correct-password'},'bob',400);
  const count=emails.length;await call('recover',{email:'unknown@example.com'});assert.equal(emails.length,count);await call('recover',{email:'alice@example.com'});assert.equal(emails.length,count+1);await call('complete',{purpose:'recovery',token:mailToken(emails.at(-1)),password:'new-long-password'});
  await call('request',{username:'second',email:'second@example.com'});const second=(await call('requests',undefined,'owner')).requests.find(r=>r.username==='second');failEmail=true;await call('review',{id:second.id,action:'approve'},'owner',503);assert.equal(f.sql.prepare('SELECT status FROM account_requests WHERE id=?').get(second.id).status,'send_failed');failEmail=false;await call('review',{id:second.id,action:'resend'},'owner');assert.equal(created.length,2,'Resending does not create another account');
  await call('request',{username:'evil',email:'evil@example.com'},null,403,{Origin:'https://evil.test'});await call('request',{username:'x',email:'nope'},null,400);
  for(let i=0;i<90;i++)f.sql.prepare('INSERT INTO account_mail_usage VALUES(?,?)').run(crypto.randomUUID(),Date.now());await assert.rejects(sendAccountMail(env,{to:'nobody@example.com',subject:'fixture',text:'fixture',id:'quota'}),/allowance/);
  const old=await digest('x'.repeat(64));f.sql.prepare('INSERT INTO account_email_tokens(hash,user_id,username,email,purpose,expires_at) VALUES(?,?,?,?,?,?)').run(old,users.alice.id,'alice','alice@example.com','email',Date.now()-1);await call('complete',{purpose:'email',token:'x'.repeat(64)},null,400);
  assert(!fs.readFileSync(path.join(root,'dashboard-service.js'),'utf8').includes('db.auth.signUp('));
  console.log('PASS: pending requests create no account/send no email; exact owner permissions; approval/invite activation; preserved existing identity; verified email recovery; wrong passwords; reused/expired links; resend after delivery failure; shared mail cutoff; origin and input validation.');
 }finally{await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
