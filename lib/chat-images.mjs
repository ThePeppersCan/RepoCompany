export const BUCKET='wibs-images',MAX_BYTES=1048576,RETENTION=7*86400000,TRANSFER_LIMIT=20*1000**3;
export const imageError=(message,status=400)=>Object.assign(new Error(message),{status});
export const imageToken=id=>'[[wibs-image:'+id+']]';
const tokenPattern=/\[\[wibs-image:([a-f0-9-]{36})\]\]/g;
export function imageIds(text){return [...String(text).matchAll(tokenPattern)].map(m=>m[1]);}
export async function validateMessageImage(db,me,scope,target,clientId,text){
 const ids=imageIds(text);if(!ids.length)return null;
 if(ids.length!==1)throw imageError('Send one image per message.');
 const row=await db.prepare('SELECT * FROM wibs_images WHERE id=? AND owner_id=? AND client_id=? AND scope=? AND target=? AND state=\'ready\' AND deleted_at IS NULL AND expires_at>?').bind(ids[0],me.id,clientId,scope,target,Date.now()).first();
 if(!row)throw imageError('This image is unavailable. Attach it again.',409);return row.id;
}
export async function attachMessageImage(db,id,messageId){if(id)await db.prepare('UPDATE wibs_images SET message_id=? WHERE id=? AND message_id IS NULL').bind(messageId,id).run();}
export function storageHeaders(env){if(!env.WIBS_STORAGE_KEY)throw imageError('Image sharing is temporarily unavailable.',503);return {apikey:env.WIBS_STORAGE_KEY,Authorization:'Bearer '+env.WIBS_STORAGE_KEY};}
export async function storageFetch(config,env,path,options={}){
 return fetch(config.url+'/storage/v1/'+path,{...options,headers:{...storageHeaders(env),...options.headers},signal:AbortSignal.timeout(15000)});
}
// Only bounded, raster JPEGs are accepted. The browser re-encodes the original,
// stripping metadata; the server independently checks size and frame dimensions.
export function jpegDimensions(bytes){
 if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)throw imageError('Use a valid image.');
 let i=2;
 while(i+4<bytes.length){
  if(bytes[i++]!==255)throw imageError('Use a valid image.');while(bytes[i]===255)i++;
  const marker=bytes[i++];if(marker===218||marker===217)break;if(marker===1||(marker>=208&&marker<=215))continue;
  const size=(bytes[i]<<8)|bytes[i+1];if(size<2||i+size>bytes.length)break;
  if([192,193,194].includes(marker)){
   const height=(bytes[i+3]<<8)|bytes[i+4],width=(bytes[i+5]<<8)|bytes[i+6];
   if(size<8||width<1||height<1||width>1600||height>1600)throw imageError('Images must be at most 1,600 pixels wide and tall.');
   return {width,height};
  }i+=size;
 }throw imageError('Use a valid JPEG image.');
}
export async function readImageBody(request){
 if(request.headers.get('Content-Type')!=='image/jpeg')throw imageError('Send a compressed JPEG image.',415);
 if(Number(request.headers.get('Content-Length'))>MAX_BYTES)throw imageError('The compressed image must be 1 MB or smaller.',413);
 const reader=request.body?.getReader();if(!reader)throw imageError('Choose an image.');const chunks=[];let size=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES){await reader.cancel();throw imageError('The compressed image must be 1 MB or smaller.',413);}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return {bytes,...jpegDimensions(bytes)};
}
export async function cleanupImages(db,env,config,now=Date.now()){
 // Never release storage reservations until Storage confirms removal. Failure
 // leaves the upload ceiling in place and is retried at the next scheduled run.
 const rows=await db.prepare(`SELECT id FROM wibs_images WHERE deleted_at IS NULL AND (expires_at<=? OR (message_id IS NULL AND created_at<?)) ORDER BY created_at LIMIT 100`).bind(now,now-3600000).all();
 if(rows.results.length){
  const response=await storageFetch(config,env,'object/'+BUCKET,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:rows.results.map(r=>r.id+'.jpg')})});
  if(!response.ok)throw Error('Wibs image cleanup failed; reservations retained.');
  await db.batch(rows.results.map(r=>db.prepare('UPDATE wibs_images SET deleted_at=? WHERE id=? AND deleted_at IS NULL').bind(now,r.id)));
 }
 // Keep a month of quota history; message placeholders work without metadata.
 await db.prepare('DELETE FROM wibs_images WHERE deleted_at IS NOT NULL AND created_at<?').bind(now-32*86400000).run();
 return rows.results.length;
}
