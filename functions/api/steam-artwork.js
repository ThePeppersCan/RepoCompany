// Resolve public artwork metadata only. Image bytes go directly from Steam to
// the browser; this endpoint accepts neither arbitrary URLs nor account tokens.
const hosts=new Set(['shared.akamai.steamstatic.com','shared.fastly.steamstatic.com','shared.cloudflare.steamstatic.com','shared.steamstatic.com','cdn.akamai.steamstatic.com','cdn.cloudflare.steamstatic.com']);
const inFlight=new Map();
export function validThumbnail(value,id){
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&hosts.has(url.hostname)&&!url.port&&!url.username&&!url.password&&!url.hash
   &&new RegExp('^/(?:store_item_assets/steam|steam)/apps/'+id+'/(?:[a-f0-9]{40}/)?capsule_184x69\\.(?:jpg|png|webp)$').test(url.pathname)
   &&(!url.search||/^\?t=[0-9]{1,16}$/.test(url.search));
 }catch{return false;}
}
export function fallbacks(id){return [
 'https://shared.steamstatic.com/store_item_assets/steam/apps/'+id+'/capsule_184x69.jpg',
 'https://cdn.cloudflare.steamstatic.com/steam/apps/'+id+'/capsule_184x69.jpg'
];}
export async function resolveArtwork(id,fetcher=fetch){
 const response=await fetcher('https://store.steampowered.com/api/appdetails?appids='+id+'&filters=basic',{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('Steam unavailable.');
 const reader=response.body.getReader();let size=0,text='';const decoder=new TextDecoder();
 try{for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>256000){await reader.cancel();throw Error('Metadata too large.');}text+=decoder.decode(chunk.value,{stream:true});}text+=decoder.decode();}finally{reader.releaseLock();}
 const data=JSON.parse(text)[id],thumbnail=data?.success&&data.data?.capsule_imagev5;
 if(!validThumbnail(thumbnail,id))return {images:fallbacks(id),resolved:false};
 const alternate=new URL(thumbnail);alternate.hostname=alternate.hostname==='shared.fastly.steamstatic.com'?'shared.akamai.steamstatic.com':'shared.fastly.steamstatic.com';
 return {images:[...new Set([thumbnail,alternate.href,...fallbacks(id)])],resolved:true};
}
export async function onRequest({request,waitUntil}){
 const url=new URL(request.url),id=url.searchParams.get('app');
 const json=(body,status,ttl)=>Response.json(body,{status,headers:{'Cache-Control':ttl?'public, max-age='+ttl:'no-store','X-Content-Type-Options':'nosniff'}});
 if(request.method!=='GET')return json({error:'Method not allowed.'},405,0);
 if(!/^[1-9][0-9]{0,9}$/.test(id||''))return json({error:'Invalid Steam game.'},400,0);
 const key=new Request(url.origin+'/api/steam-artwork?app='+id),cache=globalThis.caches?.default;
 const cached=cache?await cache.match(key).catch(()=>null):null;if(cached)return cached;
 let pending=inFlight.get(id);
 if(!pending){pending=resolveArtwork(id).catch(()=>({images:fallbacks(id),resolved:false})).finally(()=>inFlight.delete(id));inFlight.set(id,pending);}
 const artwork=await pending,result=json({app:id,...artwork},200,artwork.resolved?86400:300);
 if(cache){const task=cache.put(key,result.clone()).catch(()=>{});if(waitUntil)waitUntil(task);else await task;}
 return result;
}
