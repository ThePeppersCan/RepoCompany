'use strict';
const {app,BrowserWindow,session}=require('electron'),fs=require('node:fs'),path=require('node:path');
const {createHandler}=require('../lib/protocol.cjs'),configuration=require('../config.cjs');
app.setPath('userData',process.env.STEAM_ARTWORK_TEST_PROFILE);
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'../..'),config=configuration(__dirname),s=session.fromPartition('steam-artwork-test');
 global.artworkTest={requests:[]};
 const handler=createHandler({config,library:{getInstalled:()=>null},desktopRoot:path.join(root,'desktop'),fetchNetwork:(request,options={})=>s.fetch(request,{...options,bypassCustomProtocolHandlers:true})});
 await s.protocol.handle('https',async request=>{
  const url=new URL(request.url);
  if(url.origin===config.portalOrigin){
   if(url.pathname==='/__steam-artwork-test')return new Response('<!doctype html><html><head><link rel="stylesheet" href="/repo-community.css"><style>body{margin:0;padding:30px;background:#141e2c;color:#eee;font:14px Arial}.rc-members{width:270px}h1{font-size:18px}.rc-activity-card{width:100%}</style></head><body><h1>Wibs activity artwork</h1><div class="rc-members"><div id="cards"></div></div><script src="/repo-game-artwork.js"></script><script>for(const [id,title] of [["1139980","Travellers Rest"],["3070070","TCG Card Shop Simulator"]]){const card=document.createElement("div");card.className="rc-activity-card";const copy=document.createElement("span");copy.textContent=title;const img=document.createElement("img");img.id="game-"+id;img.className="rc-activity-art";repoGameArtwork.attach(img,"steam:"+id);card.append(copy,img);document.getElementById("cards").append(card);}</script></body></html>',{headers:{'Content-Type':'text/html'}});
   if(['/repo-game-artwork.js','/repo-community.css','/assets/game-activity.svg'].includes(url.pathname))return new Response(fs.readFileSync(path.join(root,url.pathname)),{headers:{'Content-Type':url.pathname.endsWith('.js')?'application/javascript':url.pathname.endsWith('.css')?'text/css':'image/svg+xml'}});
  }
  const response=await handler(request);
  if(url.hostname.endsWith('.steamstatic.com'))global.artworkTest.requests.push({url:request.url,status:response.status,initiator:request.initiatorOrigin,destination:request.destination});
  return response;
 });
 const window=new BrowserWindow({show:false,width:1200,height:750,webPreferences:{session:s,contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false}});
 await window.loadURL(config.portalOrigin+'/__steam-artwork-test');
});
app.on('window-all-closed',()=>app.quit());
