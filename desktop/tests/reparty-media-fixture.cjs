'use strict';
const {app,BrowserWindow,session}=require('electron');
const {createHandler}=require('../lib/protocol.cjs');
const configuration=require('../config.cjs');
app.setPath('userData',process.env.REPARTY_TEST_PROFILE);
app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
app.whenReady().then(async()=>{
 const config=configuration(__dirname),s=session.fromPartition('reparty-media-test'),blocked=[];
 const handler=createHandler({config,library:{getInstalled:()=>null},desktopRoot:require('node:path').resolve(__dirname,'..'),fetchNetwork:(request,options={})=>s.fetch(request,{...options,bypassCustomProtocolHandlers:true})});
 await s.protocol.handle('https',async request=>{
  if(request.url==='https://repocompany.uk/reparty-media-test')return new Response(`<!doctype html><title>Media test</title><iframe id="suno" src="https://suno.com/embed/c72dcf81-5611-4c75-9a62-07a9c9e51fa8?autoplay=1" allow="autoplay; encrypted-media" width="650" height="350"></iframe><div id="youtube"></div><script>window.__states=[];window.onYouTubeIframeAPIReady=()=>{window.player=new YT.Player('youtube',{width:650,height:350,videoId:'dQw4w9WgXcQ',playerVars:{autoplay:1,origin:location.origin},events:{onReady:e=>{__states.push('ready');e.target.mute();e.target.playVideo()},onStateChange:e=>__states.push(e.data),onError:e=>__states.push('error:'+e.data)}})}</script><script src="https://www.youtube.com/iframe_api"></script>`,{headers:{'Content-Type':'text/html'}});
  const response=await handler(request);
  if(response.status===403){const u=new URL(request.url);blocked.push({host:u.host,path:u.pathname.slice(0,100),initiator:request.initiatorOrigin});}
  return response;
 });
 const win=new BrowserWindow({show:false,width:1400,height:900,webPreferences:{session:s,contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false}});
 global.mediaTest={blocked};
 await win.loadURL('https://repocompany.uk/reparty-media-test');
});
app.on('window-all-closed',()=>app.quit());
