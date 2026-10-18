(() => {
 'use strict';
 const pendingKey='repo-spotify-connect',tokenKey=id=>'repo-spotify-session:'+id,versions=new Map();
 const encoded=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
 const random=()=>encoded(crypto.getRandomValues(new Uint8Array(32)));
 const read=key=>{try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}};
 const redirect=()=>location.origin+'/spotify-connect.html';
 async function tokenRequest(body){
  const r=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body),signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error('Spotify could not connect. Please connect again.');return r.json();
 }
 function save(owner,clientId,data,previous){
  if(typeof data.access_token!=='string'||!Number.isFinite(data.expires_in))throw Error('Spotify returned an incomplete connection.');
  const value={owner,clientId,accessToken:data.access_token,refreshToken:data.refresh_token||previous?.refreshToken,expiresAt:Date.now()+data.expires_in*1000};sessionStorage.setItem(tokenKey(owner),JSON.stringify(value));return value;
 }
 async function connect(owner,clientId){
  if(!owner||!/^[a-f0-9]{32}$/i.test(clientId||''))throw Error('Spotify has not been enabled for this site yet.');
  if(document.documentElement?.dataset.repoLauncher==='true')throw Error('Open the Repo Company website in your browser to connect Spotify.');
  const verifier=random(),state=random(),challenge=encoded(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
  sessionStorage.setItem(pendingKey,JSON.stringify({owner,clientId,verifier,state,at:Date.now()}));
  const query=new URLSearchParams({client_id:clientId,response_type:'code',redirect_uri:redirect(),code_challenge_method:'S256',code_challenge:challenge,state,scope:'user-read-currently-playing'});
  location.assign('https://accounts.spotify.com/authorize?'+query);
 }
 async function finish(){
  const params=new URLSearchParams(location.search),pending=read(pendingKey);history.replaceState(null,'',location.pathname);sessionStorage.removeItem(pendingKey);
  if(!pending||Date.now()-pending.at>600000||params.get('state')!==pending.state)throw Error('This Spotify connection expired. Return to Wibs and try again.');
  if(params.has('error'))throw Error('Spotify connection was cancelled. You can return to Wibs.');
  const code=params.get('code');if(!code||code.length>2048)throw Error('Spotify did not return a connection code.');
  const data=await tokenRequest({client_id:pending.clientId,grant_type:'authorization_code',code,redirect_uri:redirect(),code_verifier:pending.verifier});
  save(pending.owner,pending.clientId,data);location.replace('/Wibs');
 }
 let blockedUntil=0;
 async function current(owner){
  const version=versions.get(owner);let value=read(tokenKey(owner));if(!value||value.owner!==owner)return null;
  if(Date.now()<blockedUntil)return null;
  if(value.expiresAt<Date.now()+60000){
   if(!value.refreshToken){disconnect(owner);return null;}
   try{const fresh=await tokenRequest({grant_type:'refresh_token',refresh_token:value.refreshToken,client_id:value.clientId});if(version!==versions.get(owner))return null;value=save(owner,value.clientId,fresh,value);}catch(error){disconnect(owner);throw error;}
  }
  const r=await fetch('https://api.spotify.com/v1/me/player/currently-playing',{headers:{Authorization:'Bearer '+value.accessToken},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(r.status===204)return null;
  if(r.status===429){blockedUntil=Date.now()+Math.max(60,Math.min(86400,Number(r.headers.get('Retry-After'))||60))*1000;return null;}
  if(r.status===401){disconnect(owner);throw Error('Your Spotify connection expired. Connect again in Listening activity.');}
  if(r.status===403){blockedUntil=Date.now()+300000;throw Error('Spotify has not granted this account access to the site’s integration.');}
  if(!r.ok)throw Error('Spotify is temporarily unavailable.');
  const data=await r.json(),item=data.item;if(version!==versions.get(owner))return null;
  if(!data.is_playing||data.currently_playing_type!=='track'||item?.type!=='track'||item.is_local)return null;
  const images=(item.album?.images||[]).filter(i=>typeof i.url==='string').sort((a,b)=>(a.width||0)-(b.width||0));
  return {provider:'spotify',id:item.id,title:item.name,artist:(item.artists||[]).map(a=>a.name).join(', ').slice(0,160),artwork:(images.find(i=>i.width>=150)||images.at(-1))?.url||'',duration:item.duration_ms/1000,position:(data.progress_ms||0)/1000};
 }
 function disconnect(owner){versions.set(owner,(versions.get(owner)||0)+1);sessionStorage.removeItem(tokenKey(owner));blockedUntil=0;}
 window.repoSpotify=Object.freeze({connect,current,finish,disconnect,connected:owner=>!!read(tokenKey(owner))});
 if(document.body.dataset.spotifyCallback==='true')finish().catch(error=>document.getElementById('spotify-status').textContent=error.message);
})();
