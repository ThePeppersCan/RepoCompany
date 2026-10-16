'use strict';
// Public thumbnail resources only; these hosts do not become launcher pages.
const hosts=new Set(['shared.akamai.steamstatic.com','shared.fastly.steamstatic.com','shared.cloudflare.steamstatic.com','shared.steamstatic.com','cdn.akamai.steamstatic.com','cdn.cloudflare.steamstatic.com']);
function steamArtworkURL(value){
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&hosts.has(url.hostname)&&!url.port&&!url.username&&!url.password&&!url.hash&&
   /^\/(?:store_item_assets\/steam|steam)\/apps\/[1-9][0-9]{0,9}\/(?:[a-f0-9]{40}\/)?capsule_184x69\.(?:jpg|png|webp)$/.test(url.pathname)&&
   (!url.search||/^\?t=[0-9]{1,16}$/.test(url.search));
 }catch{return false;}
}
function artworkRequest(request,portalOrigin){
 return typeof request.initiatorOrigin==='string'&&['GET','HEAD'].includes(request.method)&&steamArtworkURL(request.url)&&
  (request.initiatorOrigin===portalOrigin||request.initiatorOrigin==='https://www.repocompany.uk');
}
module.exports={steamArtworkURL,artworkRequest};
