export const OWNER_ID='651be2a9-355a-47c7-9c27-fcc3093ed8e5';
export const emailAddress=value=>typeof value==='string'&&value.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value.trim())?value.trim().toLowerCase():null;
export const username=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{3,16}$/.test(value.trim())?value.trim().toLowerCase():null;
export const accountError=(message,status=400)=>Object.assign(Error(message),{status});
export async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function rate(db,key,period,limit,now=Date.now()){
 const row=await db.prepare('INSERT INTO account_limits(key,window,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count').bind(key,Math.floor(now/period)).first();
 if(row.count>limit)throw accountError('Please wait before trying again.',429);
}
export async function provider(config,env,path,body,{admin=false,token,method}={}){
 const key=admin?(env.ACCOUNT_ADMIN_KEY||env.WIBS_STORAGE_KEY):config.key;
 if(!key)throw accountError('Account service is temporarily unavailable.',503);
 const r=await fetch(config.url+'/auth/v1/'+path,{method:method||(body===undefined?'GET':'POST'),headers:{apikey:key,Authorization:'Bearer '+(token||key),'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw accountError(r.status===429?'Please wait before trying again.':r.status===401||r.status===400?'The account details or link could not be verified.':'Account service is temporarily unavailable.',r.status===429?429:400);
 return data;
}
export async function sendAccountMail(env,{to,subject,text,id}){
 if(!env.RESEND_API_KEY)throw accountError('Account email is temporarily unavailable.',503);
 // Reserve before sending. Failed/uncertain sends retain their reservation.
 // A rolling 24-hour cap is stricter than the provider's calendar-day allowance.
 const db=env.DASHBOARD_DB,now=Date.now();
 const quota=await db.prepare('INSERT INTO account_mail_usage(id,created_at) SELECT ?,? WHERE (SELECT COUNT(*) FROM account_mail_usage WHERE created_at>?)<80 AND (SELECT COUNT(*) FROM account_mail_usage WHERE created_at>?)<2500 RETURNING id').bind(crypto.randomUUID(),now,now-86400000,now-32*86400000).first();
 if(!quota)throw accountError('The email allowance has been reached. Please try later.',429);
 await rate(db,'mail-to:'+await digest(to),86400000,5,now);
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from:'Repo Company <Wibs@accounts.repocompany.uk>',to:[to],subject,text}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw accountError('The email could not be confirmed as sent. Please try again later.',503);
 return r.json();
}
export function accountLink(purpose,token){return 'https://repocompany.uk/account-access/#'+new URLSearchParams({purpose,token});}
