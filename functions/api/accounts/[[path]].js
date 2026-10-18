import config from '../../../dashboard-config.json';
import {OWNER_ID,emailAddress,username,accountError,digest,rate,provider,sendAccountMail,accountLink} from '../../../lib/accounts.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hour=3600000,day=24*hour;
const generic={ok:true,message:'If the details match an eligible account, an email will arrive shortly.'};
export async function onRequest({request,env,params}){
 try{
  const url=new URL(request.url),origin=request.headers.get('Origin'),route=Array.isArray(params.path)?params.path.join('/'):params.path||'';
  if(origin&&origin!==url.origin)return json({error:'Use the Repo Company app for this action.'},403);
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405);
  const db=env.DASHBOARD_DB;if(!db||!env.RESEND_API_KEY)return json({error:'Account email is temporarily unavailable.'},503);
  let body={};if(request.method==='POST'){
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw accountError('Invalid request.',415);
   const reader=request.body?.getReader(),decoder=new TextDecoder();let raw='',size=0;if(!reader)throw accountError('Invalid request.');
   for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();throw accountError('Request too large.',413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();
   try{body=JSON.parse(raw);}catch{throw accountError('Invalid request.');}if(!body||Array.isArray(body)||typeof body!=='object')throw accountError('Invalid request.');
   await rate(db,'ip:'+await digest(request.headers.get('CF-Connecting-IP')||'unknown'),hour,30);
  }
  const now=Date.now();
  if(route==='request'&&request.method==='POST'){
   const name=username(body.username),email=emailAddress(body.email),note=typeof body.note==='string'?body.note.trim():'';
   if(!name||!email||email.endsWith('@'+config.authDomain)||note.length>300)throw accountError('Enter a valid username, email and a note of up to 300 characters.');
   if(body.website)return json({ok:true,message:'Your request has been received. You will receive an email if approved.'});
   await rate(db,'request-ip:'+await digest(request.headers.get('CF-Connecting-IP')||'unknown'),day,3);
   await rate(db,'requests-all',day,50);
   const existing=await db.prepare('SELECT 1 FROM dashboard_players WHERE username=? UNION SELECT 1 FROM account_contacts WHERE email=? UNION SELECT 1 FROM account_requests WHERE username=? OR email=?').bind(name,email,name,email).first();
   if(!existing)await db.prepare('INSERT INTO account_requests(id,username,email,note,created_at) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING').bind(crypto.randomUUID(),name,email,note,now).run();
   return json({ok:true,message:'Your request has been received. You will receive an email if approved.'});
  }
  if(route==='recover'&&request.method==='POST'){
   const email=emailAddress(body.email);if(!email)throw accountError('Enter your verified email address.');
   await rate(db,'recover:'+await digest(email),hour,2);
   const contact=await db.prepare('SELECT * FROM account_contacts WHERE email=?').bind(email).first();
   if(contact){
    const link=await provider(config,env,'admin/generate_link',{type:'recovery',email:contact.username+'@'+config.authDomain},{admin:true});
    if(link.id!==contact.user_id||!link.hashed_token)throw accountError('Recovery is temporarily unavailable.',503);
    await db.prepare("UPDATE account_email_tokens SET used=1 WHERE user_id=? AND purpose='recovery'").bind(contact.user_id).run();
    const hash=await digest(link.hashed_token);
    await db.prepare('INSERT INTO account_email_tokens(hash,user_id,username,email,purpose,expires_at) VALUES(?,?,?,?,?,?)').bind(hash,contact.user_id,contact.username,email,'recovery',now+30*60000).run();
    await sendAccountMail(env,{to:email,subject:'Reset your Repo Company password',text:'Use this link to choose a new password for '+contact.username+'. It expires in 30 minutes.\n\n'+accountLink('recovery',link.hashed_token)+'\n\nIf you did not request this, ignore this email.',id:'recovery-'+hash});
   }return json(generic);
  }
  if(route==='complete'&&request.method==='POST'){
   const token=typeof body.token==='string'?body.token:'',purpose=body.purpose;
   if(!/^[a-zA-Z0-9_-]{32,256}$/.test(token)||!['email','invite','recovery'].includes(purpose))throw accountError('This link is invalid or expired. Request a new one.');
   const hash=await digest(token),row=await db.prepare('SELECT * FROM account_email_tokens WHERE hash=? AND purpose=? AND used=0 AND expires_at>?').bind(hash,purpose,now).first();
   if(!row)throw accountError('This link is invalid or expired. Request a new one.');
   if(purpose==='email'){
    // Atomic guarded upsert: a concurrent replay cannot replace the verified address.
    await db.batch([
     db.prepare('INSERT INTO account_contacts(user_id,username,email,verified_at) SELECT user_id,username,email,? FROM account_email_tokens WHERE hash=? AND used=0 AND expires_at>? ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,verified_at=excluded.verified_at').bind(now,hash,now),
     db.prepare("UPDATE account_email_tokens SET used=1 WHERE user_id=? AND purpose='email'").bind(row.user_id)
    ]);return json({ok:true,username:row.username,message:'Your email is verified. You can return to Repo Company.'});
   }
   if(typeof body.password!=='string'||body.password.length<12||body.password.length>128)throw accountError('Use a password between 12 and 128 characters.');
   const claim=await db.prepare('UPDATE account_email_tokens SET used=1 WHERE hash=? AND used=0 AND expires_at>? RETURNING user_id').bind(hash,now).first();
   if(!claim)throw accountError('This link has already been used.');
   const session=await provider(config,env,'verify',{type:purpose,token_hash:token});
   if(session.user?.id!==row.user_id||!session.access_token)throw accountError('The account link could not be verified.');
   await provider(config,env,'user',{password:body.password},{token:session.access_token,method:'PUT'});
   if(purpose==='invite')await db.batch([
    db.prepare('INSERT INTO account_contacts(user_id,username,email,verified_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,verified_at=excluded.verified_at').bind(row.user_id,row.username,row.email,now),
    db.prepare("UPDATE account_requests SET status='active',error='' WHERE id=? AND user_id=?").bind(row.request_id,row.user_id)
   ]);
   // Revoke refresh sessions after a password change; sign in normally afterwards.
   await fetch(config.url+'/auth/v1/logout?scope=global',{method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+session.access_token},signal:AbortSignal.timeout(10000)});
   return json({ok:true,username:row.username,message:purpose==='invite'?'Your account is ready. Sign in with your username and new password.':'Password saved. Sign in with your username and new password.'});
  }
  const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return json({error:'Sign in to continue.'},401);
  const user=await provider(config,env,'user',undefined,{token});if(!user?.id)throw accountError('Sign in to continue.',401);
  const rows=await fetch(config.url+'/rest/v1/rpc/get_my_character',{method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)}).then(r=>r.ok?r.json():null);
  const name=username((Array.isArray(rows)?rows[0]:rows)?.username);if(!name)throw accountError('Your profile is unavailable.',409);
  if(route==='status'&&request.method==='GET'){
   const contact=await db.prepare('SELECT email,verified_at FROM account_contacts WHERE user_id=?').bind(user.id).first();
   return json({verified:!!contact,email:contact?.email||null,canApprove:user.id===OWNER_ID});
  }
  if(route==='email'&&request.method==='POST'){
   const email=emailAddress(body.email);if(!email||email.endsWith('@'+config.authDomain))throw accountError('Enter a valid email address.');
   await rate(db,'verify-user:'+user.id,hour,3);
   const credentials=await provider(config,env,'token?grant_type=password',{email:user.email,password:body.password});
   if(credentials.user?.id!==user.id)throw accountError('Check your current password.');
   const conflict=await db.prepare('SELECT 1 FROM account_contacts WHERE email=? AND user_id!=? UNION SELECT 1 FROM account_requests WHERE email=? AND (user_id IS NULL OR user_id!=?) AND status!=\'rejected\'').bind(email,user.id,email,user.id).first();
   if(conflict)throw accountError('That email cannot be added to this account.');
   const raw=[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join(''),hash=await digest(raw);
   await db.batch([db.prepare("UPDATE account_email_tokens SET used=1 WHERE user_id=? AND purpose='email'").bind(user.id),db.prepare('INSERT INTO account_email_tokens(hash,user_id,username,email,purpose,expires_at) VALUES(?,?,?,?,?,?)').bind(hash,user.id,name,email,'email',now+day)]);
   await sendAccountMail(env,{to:email,subject:'Verify your Repo Company email',text:'Confirm this email for your Repo Company account '+name+':\n\n'+accountLink('email',raw)+'\n\nThis link expires in 24 hours. Your username, password and game progress stay the same. If you did not request this, ignore this email.',id:'verify-'+hash});
   return json({ok:true,message:'Check your email and open the verification link. Then choose “I’ve verified my email”.'});
  }
  if(user.id!==OWNER_ID)return json({error:'Only the account owner can review signup requests.'},403);
  if(route==='requests'&&request.method==='GET'){
   const requests=await db.prepare('SELECT id,username,email,note,status,created_at,sent_at,error FROM account_requests ORDER BY created_at DESC LIMIT 200').all();
   const usage=await db.prepare('SELECT COUNT(*) count FROM account_mail_usage WHERE created_at>?').bind(now-day).first();
   return json({requests:requests.results,mailToday:usage.count,mailLimit:80});
  }
  if(route==='review'&&request.method==='POST'){
   if(!['approve','reject','resend'].includes(body.action)||typeof body.id!=='string')throw accountError('Choose a valid request.');
   const row=await db.prepare('SELECT * FROM account_requests WHERE id=?').bind(body.id).first();if(!row)throw accountError('Request not found.',404);
   if(body.action==='reject'){
    if(row.status!=='pending')throw accountError('Only pending requests can be declined.',409);
    await db.prepare("UPDATE account_requests SET status='rejected',reviewed_at=?,reviewed_by=? WHERE id=? AND status='pending'").bind(now,user.id,row.id).run();return json({ok:true});
   }
   if(!['pending','invited','send_failed'].includes(row.status)||row.created_at<now-30*day)throw accountError('This request cannot be approved or resent.',409);
   if(row.sent_at&&row.sent_at>now-60000)throw accountError('Wait a minute before resending.',429);
   const claimed=await db.prepare("UPDATE account_requests SET status='approving',reviewed_at=?,reviewed_by=?,error='' WHERE id=? AND status=? RETURNING id").bind(now,user.id,row.id,row.status).first();
   if(!claimed)throw accountError('This request is already being reviewed.',409);
   try{
    const contact=await db.prepare('SELECT 1 FROM account_contacts WHERE email=? OR username=?').bind(row.email,row.username).first();if(contact)throw accountError('An account already uses these details.',409);
    const link=await provider(config,env,'admin/generate_link',{type:'invite',email:row.username+'@'+config.authDomain,data:{username:row.username}},{admin:true});
    if(!link.id||!link.hashed_token||(row.user_id&&row.user_id!==link.id))throw accountError('The invitation could not be prepared.',503);
    const hash=await digest(link.hashed_token);
    await db.batch([
     db.prepare("UPDATE account_requests SET user_id=? WHERE id=?").bind(link.id,row.id),
     db.prepare("UPDATE account_email_tokens SET used=1 WHERE request_id=? AND purpose='invite'").bind(row.id),
     db.prepare('INSERT INTO account_email_tokens(hash,user_id,username,email,purpose,expires_at,request_id) VALUES(?,?,?,?,?,?,?)').bind(hash,link.id,row.username,row.email,'invite',now+hour,row.id)
    ]);
    await sendAccountMail(env,{to:row.email,subject:'You’re invited to Repo Company',text:'Your request to join Repo Company has been approved.\n\nYour username: '+row.username+'\n\nChoose your password and verify your email using this single-use link (valid for one hour):\n\n'+accountLink('invite',link.hashed_token)+'\n\nIf the link expires, contact Repo Company for a new invitation.',id:'invite-'+hash});
    await db.prepare("UPDATE account_requests SET status='invited',sent_at=?,error='' WHERE id=?").bind(now,row.id).run();return json({ok:true});
   }catch(error){await db.prepare("UPDATE account_requests SET status='send_failed',error=? WHERE id=?").bind(error.message.slice(0,200),row.id).run();throw error;}
  }
  return json({error:'Not found.'},404);
 }catch(error){return json({error:error.status?error.message:'The account action could not be completed. Please try again.'},error.status||503);}
}
