'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../functions/api/steam-artwork.js'),'utf8');
 const {validThumbnail,resolveArtwork,onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const id='1139980',image='https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/'+id+'/'+'a'.repeat(40)+'/capsule_184x69.jpg?t=1789987425';
 const payload=()=>Response.json({[id]:{success:true,data:{capsule_imagev5:image}}});
 assert(validThumbnail(image,id));
 for(const url of [image.replace('https:','http:'),image.replace('.com/','.com.evil.test/'),image.replace(id,'730'),image.replace('184x69','600x900'),image+'&redirect=evil',image+'#hash',image.replace('https://','https://user:pass@')])assert(!validThumbnail(url,id),url);
 let upstream=0;
 const result=await resolveArtwork(id,async(url,options)=>{upstream++;assert.equal(url,'https://store.steampowered.com/api/appdetails?appids='+id+'&filters=basic');assert.equal(options.redirect,'manual');assert.deepEqual(options.headers,{Accept:'application/json'});assert(options.signal);return payload();});
 assert.equal(result.resolved,true);assert.equal(result.images[0],image);assert.equal(new URL(result.images[1]).hostname,'shared.fastly.steamstatic.com');assert.equal(result.images.length,4);assert(result.images.every(url=>validThumbnail(url,id)));
 assert.equal((await resolveArtwork(id,async()=>Response.json({[id]:{success:false}}))).resolved,false);
 assert.equal((await resolveArtwork(id,async()=>Response.json({[id]:{success:true,data:{capsule_imagev5:'https://evil.test/image.jpg'}}}))).resolved,false);
 await assert.rejects(resolveArtwork(id,async()=>new Response('bad',{status:503})),/unavailable/);
 await assert.rejects(resolveArtwork(id,async()=>new Response('',{status:302,headers:{Location:'https://evil.test/'}})),/unavailable/);
 await assert.rejects(resolveArtwork(id,async()=>new Response('x'.repeat(256001))),/too large/);
 await assert.rejects(resolveArtwork(id,async()=>new Response('not json')));
 const originalFetch=global.fetch,originalCaches=global.caches,stored=new Map();let calls=0;
 try{
  global.caches={default:{async match(key){return stored.get(key.url)?.clone();},async put(key,response){stored.set(key.url,response);}}};
  global.fetch=async()=>{calls++;await new Promise(r=>setTimeout(r,20));return payload();};
  const request=(query,method='GET')=>onRequest({request:new Request('https://repo.test/api/steam-artwork?'+query,{method})});
  for(const query of ['','app=0','app=01','app=https://evil.test','app=1139980%2f..','app=99999999999'])assert.equal((await request(query)).status,400);
  assert.equal((await request('app='+id,'POST')).status,405);assert.equal(calls,0);
  const responses=await Promise.all([request('app='+id),request('app='+id+'&unused=1')]);assert.equal(calls,1,'concurrent lookups share one Steam request');
  for(const response of responses){assert.equal(response.headers.get('Cache-Control'),'public, max-age=86400');assert.deepEqual(await response.json(),{app:id,...result});}
  await request('unused=2&app='+id);assert.equal(calls,1,'canonical cache key ignores irrelevant query parameters');
  global.fetch=async()=>{calls++;throw Error('offline');};
  const failed=await request('app=730');assert.equal(failed.status,200);assert.equal(failed.headers.get('Cache-Control'),'public, max-age=300');const fallback=await failed.json();assert.equal(fallback.resolved,false);assert(fallback.images.every(url=>validThumbnail(url,'730')));
  await request('app=730');assert.equal(calls,2,'temporarily cache upstream failures');
 }finally{global.fetch=originalFetch;if(originalCaches===undefined)delete global.caches;else global.caches=originalCaches;}
 const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
 const options={modules:true,compatibilityDate:'2026-08-06',script:source+'\nexport default {fetch(request,env,ctx){return onRequest({request,waitUntil:ctx.waitUntil.bind(ctx)});}};',outboundService:async request=>{assert.equal(request.url,'https://store.steampowered.com/api/appdetails?appids='+id+'&filters=basic');return payload();}};
 const runtime=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);
 try{const r=await runtime.dispatchFetch('https://repo.test/api/steam-artwork?app='+id);assert.equal(r.status,200);assert.equal((await r.json()).resolved,true,'real Cloudflare runtime resolves metadata');}finally{await runtime.dispose();}
 assert.equal(upstream,1);console.log('PASS: small Steam artwork validation, fixed upstream, bounded responses, fallback, request deduplication, edge-cache lifetimes and Cloudflare runtime.');
})().catch(e=>{console.error(e);process.exitCode=1;});
