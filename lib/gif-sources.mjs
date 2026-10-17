import {MAX_BYTES,TRANSFER_LIMIT,imageError,readImageBody} from './chat-images.mjs';
export function gifSourceURL(value){
 let url;try{url=new URL(value);}catch{throw imageError('Paste a direct Tenor or Giphy GIF link.');}
 if(String(value).length>2048||url.protocol!=='https:'||url.username||url.password||url.port||! /^(media\.tenor\.com|(?:media[0-4]?|i)\.giphy\.com)$/.test(url.hostname)||!url.pathname.toLowerCase().endsWith('.gif'))throw imageError('Paste a direct Tenor or Giphy GIF link.');
 return url.href;
}
export async function sourceGif(db,me,value,now=Date.now()){
 let url=gifSourceURL(value);
 for(const [user,scope,window,limit]of [[me.id,'gif-source-minute',Math.floor(now/60000),10],[me.id,'gif-source-day',Math.floor(now/86400000),30],['wibs-images-global','gif-source-day',Math.floor(now/86400000),100]]){
  const result=await db.prepare('INSERT INTO social_rate_limits(user_id,scope,window_start,count) VALUES(?,?,?,1) ON CONFLICT(user_id,scope) DO UPDATE SET count=CASE WHEN window_start=excluded.window_start THEN count+1 ELSE 1 END,window_start=excluded.window_start WHERE window_start<>excluded.window_start OR count<? RETURNING count').bind(user,scope,window,limit).first();
  if(!result)throw imageError('GIF previews have reached their allowance. Try later, or attach a saved GIF.',429);
 }
 const budget=await db.prepare('INSERT INTO wibs_image_transfer(month,bytes) VALUES(?,?) ON CONFLICT(month) DO UPDATE SET bytes=bytes+excluded.bytes WHERE bytes+excluded.bytes<=? RETURNING bytes').bind(new Date(now).toISOString().slice(0,7),MAX_BYTES,TRANSFER_LIMIT).first();
 if(!budget)throw imageError('Images have reached their monthly allowance. Text chat is still available.',429);
 const signal=AbortSignal.timeout(10000);
 for(let hop=0;hop<3;hop++){
  const response=await fetch(url,{redirect:'manual',headers:{Accept:'image/gif'},signal});
  if([301,302,303,307,308].includes(response.status)){await response.body?.cancel();url=gifSourceURL(new URL(response.headers.get('Location'),url).href);continue;}
  if(!response.ok||!/^image\/gif(?:;|$)/i.test(response.headers.get('Content-Type')||'')){await response.body?.cancel();throw imageError('This link does not provide an animated GIF. Copy the original GIF link from Tenor or Giphy.');}
  if(Number(response.headers.get('Content-Length'))>MAX_BYTES){await response.body?.cancel();throw imageError('Choose a GIF up to 1 MB. This one is too large.',413);}
  const {bytes}=await readImageBody(new Response(response.body,{headers:{'Content-Type':'image/gif'}}));
  return new Response(bytes,{headers:{'Content-Type':'image/gif','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',Vary:'Authorization'}});
 }
 throw imageError('This GIF link redirects too many times. Try its direct image link.');
}
