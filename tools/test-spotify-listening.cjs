'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{webcrypto}=require('node:crypto');
function fixture(){
 const data=new Map(),requests=[],location={origin:'https://repocompany.uk',pathname:'/spotify-connect.html',search:'',assign(value){this.assigned=value;},replace(value){this.replaced=value;}};
 const context={window:{},document:{body:{dataset:{}}},location,history:{replaceState(){}},crypto:webcrypto,TextEncoder,URLSearchParams,AbortSignal,Date,Map,btoa:s=>Buffer.from(s,'binary').toString('base64'),sessionStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},fetch:async(url,init)=>{requests.push({url,init});return context.respond(url,init);},respond:()=>{throw Error('Unexpected network call');}};
 vm.runInNewContext(fs.readFileSync(require('node:path').resolve(__dirname,'../repo-spotify.js'),'utf8'),context);return {...context,context,data,requests,api:context.window.repoSpotify};
}
(async()=>{
 const f=fixture(),id='a'.repeat(32),owner='account-a';await f.api.connect(owner,id);
 const authorize=new URL(f.location.assigned),pending=JSON.parse(f.data.get('repo-spotify-connect'));
 assert.equal(authorize.origin,'https://accounts.spotify.com');assert.equal(authorize.searchParams.get('scope'),'user-read-currently-playing');assert.equal(authorize.searchParams.get('code_challenge_method'),'S256');
 assert.equal(authorize.searchParams.get('code_challenge'),Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(pending.verifier))).toString('base64url'));
 f.location.search='?code=bad&state=wrong';await assert.rejects(f.api.finish(),/expired/);assert.equal(f.requests.length,0);
 await f.api.connect(owner,id);const fresh=JSON.parse(f.data.get('repo-spotify-connect'));f.location.search='?code=one-use&state='+fresh.state;
 f.context.respond=()=>Response.json({access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:3600});await f.api.finish();assert.equal(f.location.replaced,'/Wibs');assert.equal(f.api.connected(owner),true);assert.equal(f.api.connected('account-b'),false);
 const tokenBody=new URLSearchParams(f.requests[0].init.body);assert.equal(tokenBody.get('code_verifier'),fresh.verifier);assert.equal(tokenBody.has('client_secret'),false);
 const item={type:'track',id:'1234567890123456789012',name:'Example song',artists:[{name:'Example artist'}],duration_ms:180000,album:{images:[{url:'https://i.scdn.co/image/abcdef',width:300}]}};
 f.context.respond=()=>Response.json({is_playing:true,currently_playing_type:'track',progress_ms:12000,item});assert.equal((await f.api.current(owner)).position,12);
 f.context.respond=()=>Response.json({is_playing:false,item});assert.equal(await f.api.current(owner),null);
 f.context.respond=()=>Response.json({is_playing:true,currently_playing_type:'episode',item});assert.equal(await f.api.current(owner),null);
 f.context.respond=()=>new Response(null,{status:429,headers:{'Retry-After':'120'}});assert.equal(await f.api.current(owner),null);const count=f.requests.length;await f.api.current(owner);assert.equal(f.requests.length,count,'Retry-After suppresses further API calls');
 f.api.disconnect(owner);assert.equal(f.api.connected(owner),false);
 // An in-flight refresh cannot restore credentials after disconnect.
 f.data.set('repo-spotify-session:'+owner,JSON.stringify({owner,clientId:id,accessToken:'old',refreshToken:'refresh',expiresAt:0}));let finish;
 f.context.respond=()=>new Promise(resolve=>finish=resolve);const pendingRefresh=f.api.current(owner);await Promise.resolve();f.api.disconnect(owner);finish(Response.json({access_token:'new',expires_in:3600}));assert.equal(await pendingRefresh,null);assert.equal(f.api.connected(owner),false);
 console.log('PASS: PKCE/state validation, minimal read scope, no secret, account-scoped session tokens, playing/paused/unsupported media, rate-limit backoff and disconnect/refresh race.');
})().catch(e=>{console.error(e);process.exitCode=1;});
