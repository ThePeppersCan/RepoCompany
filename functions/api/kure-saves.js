import config from '../../dashboard-config.json';

const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const maximum=1024*1024;
export async function onRequest({request,env}){
  if(!['GET','PUT'].includes(request.method))return reply({error:'Method not allowed'},405);
  const auth=request.headers.get('Authorization');
  if(!auth||!/^Bearer [^\s]{1,16384}$/.test(auth))return reply({},401);
  const verified=await fetch(config.url+'/auth/v1/user',{headers:{apikey:config.key,Authorization:auth},signal:AbortSignal.timeout(10000)});
  if(!verified.ok)return reply({},verified.status===401||verified.status===403?401:503);
  const user=await verified.json();
  if(typeof user.id!=='string'||user.is_anonymous||user.id!==request.headers.get('X-Kure-Owner'))return reply({},403);
  const db=env.DASHBOARD_DB;
  const read=async()=>{const row=await db.prepare('SELECT revision,payload FROM kure_account_saves WHERE owner=?').bind(user.id).first();return row?{revision:row.revision,values:JSON.parse(row.payload)}:{revision:0,values:{}};};
  if(request.method==='GET')return reply(await read());
  const input=request.body?.getReader();if(!input)return reply({},400);
  const chunks=[];let size=0;
  for(;;){const {value,done}=await input.read();if(done)break;size+=value.length;if(size>maximum){await input.cancel();return reply({error:'Save exceeds 1 MiB'},413);}chunks.push(value);}
  let doc;try{doc=JSON.parse(await new Blob(chunks).text());}catch{return reply({},400);}
  if(!Number.isSafeInteger(doc?.revision)||doc.revision<0||!doc.values||Array.isArray(doc.values)||typeof doc.values!=='object')return reply({},400);
  for(const [key,value] of Object.entries(doc.values)){
    if(!/^(?:kure\.saves\.1\.(?:legacyImported|slot\.[123]|courier\.[\w.-]{1,160})|kure\.crew-campaign\.1\.online\.[A-Z2-9]{6})$/.test(key)||typeof value!=='string')return reply({error:'Invalid save record'},400);
  }
  const payload=JSON.stringify(doc.values);
  const row=doc.revision===0?await db.prepare('INSERT INTO kure_account_saves(owner,revision,payload) VALUES(?,1,?) ON CONFLICT(owner) DO NOTHING RETURNING revision').bind(user.id,payload).first():
    await db.prepare('UPDATE kure_account_saves SET revision=revision+1,payload=? WHERE owner=? AND revision=? RETURNING revision').bind(payload,user.id,doc.revision).first();
  return row?reply(row):reply(await read(),409);
}
