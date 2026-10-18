(() => {
 'use strict';
 const account=window.repoAccount;if(!account)return;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 let owner=null,epoch=0,prefs=null,loading=null,busy=false,again=false,timer=null,lastError='',cooldown=0,lastSpotifyAt=0,mediaSignal='',settingsRetryAt=0;
 const sessions={reparty:crypto.randomUUID(),spotify:crypto.randomUUID()},sequences={reparty:0,spotify:0},sent={reparty:null,spotify:null},metadata=new Map();
 async function request(route,body){
  const id=owner,e=epoch,{data:{session}}=await account.db.auth.getSession();if(!id||session?.user?.id!==id||e!==epoch)throw Error('Account changed.');
  const r=await fetch('/api/community/'+route,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+session.access_token,...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:'no-store',signal:AbortSignal.timeout(12000)});
  const data=await r.json();if(e!==epoch)throw Error('Account changed.');if(!r.ok)throw Error(data.error||'Listening status is unavailable.');return data;
 }
 async function settings(){if(!owner)throw Error('Sign in first.');const result=await request('listening-settings');prefs=result;return {...result,connected:window.repoSpotify?.connected(owner)||false,error:lastError};}
 async function save(value){prefs=await request('listening-settings',value);sent.reparty=sent.spotify=null;lastError='';schedule();return prefs;}
 async function connect(){const p=await settings();await window.repoSpotify.connect(owner,p.spotifyClientId);}
 async function disconnect(){window.repoSpotify.disconnect(owner);await stop('spotify');lastError='';}
 async function details(state){
  const id=state.mediaId;if(!id)return null;
  if(!metadata.has(id)){
   const url=id.startsWith('suno:')?'/api/reparty-suno?url='+encodeURIComponent('https://suno.com/song/'+id.slice(5)):'/api/reparty-video?id='+encodeURIComponent(id);
   const promise=fetch(url,{signal:AbortSignal.timeout(12000)}).then(r=>r.ok?r.json():{}).catch(()=>({}));metadata.set(id,promise);if(metadata.size>24)metadata.delete(metadata.keys().next().value);
  }
  const meta=await metadata.get(id),suno=id.startsWith('suno:');
  return {provider:suno?'suno':'youtube',id:suno?id.slice(5):id,title:state.title||meta.title||'Reparty',artist:meta.artist||'',artwork:meta.artwork||'',duration:state.duration||meta.duration||0,position:Math.max(0,(state.position||0)+(Date.now()-(state.sampledAt||Date.now()))/1000)};
 }
 async function stop(source){if(!sent[source])return;await request('listening',{source,session:sessions[source],sequence:++sequences[source],action:'stop'});sent[source]=null;}
 async function send(source,track){
  const previous=sent[source],key=track.provider+':'+track.id,now=Date.now();
  if(previous&&previous.key===key&&now-previous.at<30000&&Math.abs(track.position-(previous.position+(now-previous.at)/1000))<4)return;
  const response=await request('listening',{source,session:sessions[source],sequence:++sequences[source],action:!previous||previous.key!==key?'start':'tick',track});
  sent[source]=response.sharing===false?null:{key,at:now,position:track.position};
 }
 function playing(state){return state?.active&&state.connected&&state.listening===true&&state.playing&&!state.paused&&!state.muted&&state.volume>0;}
 async function sync(){
  if(!owner||!prefs||Date.now()<cooldown)return;
  if(busy){again=true;return;}busy=true;const e=epoch;
  try{
   const state=window.repoReparty?.getState();
   if(prefs.reparty&&playing(state)){
    const track=await details(state);const current=window.repoReparty?.getState();
    if(e!==epoch)return;
    if(track&&prefs.reparty&&playing(current)&&current.mediaId===state.mediaId)await send('reparty',track);else await stop('reparty');
    await stop('spotify');
   }else{
    await stop('reparty');
    if(prefs.spotify&&window.repoSpotify?.connected(owner)){
     if(Date.now()-lastSpotifyAt<30000)return;lastSpotifyAt=Date.now();
     const track=await window.repoSpotify.current(owner);if(e!==epoch)return;
     if(track&&prefs.spotify&&!(prefs.reparty&&playing(window.repoReparty?.getState())))await send('spotify',track);else await stop('spotify');
    }else await stop('spotify');
   }
  }catch(error){if(e===epoch){lastError=error.message;cooldown=Date.now()+30000;await Promise.allSettled([stop('reparty'),stop('spotify')]);}}
  finally{busy=false;if(again){again=false;schedule();}}
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(sync,400);}
 async function changed(){
  const next=account.state.user?.id||null;if(next===owner)return;
  const previous=owner;owner=next;epoch++;prefs=null;cooldown=lastSpotifyAt=0;sent.reparty=sent.spotify=null;metadata.clear();lastError='';
  if(previous)window.repoSpotify?.disconnect(previous);
  if(owner){const e=epoch;loading=settings().then(()=>{if(e===epoch)schedule();}).catch(()=>{});await loading;}
 }
 const time=value=>Math.floor(value/60)+':'+String(Math.floor(value%60)).padStart(2,'0');
 function tick(root=document){for(const box of root.querySelectorAll('[data-listening-expires]')){
  const now=Date.now();if(now>=Number(box.dataset.listeningExpires)){box.remove();continue;}
  const progress=box.querySelector('progress');if(!progress)continue;
  const position=Math.min(progress.max,Number(box.dataset.position)+(now-Number(box.dataset.sampledAt))/1000);progress.value=position;box.querySelector('.rc-listening-elapsed').textContent=time(position);
 }}
 function view(track,compact=false){
  if(!track||!['reparty','spotify'].includes(track.source)||!Number.isFinite(track.expiresAt)||track.expiresAt<=Date.now())return null;
  const box=el(compact?'span':'section',compact?'rc-listening-inline':'rc-listening-card');box.dataset.listeningExpires=track.expiresAt;
  if(compact){box.textContent='♫ '+track.title;box.title='Listening on '+(track.source==='spotify'?'Spotify':'Reparty')+' · '+track.title+(track.artist?' · '+track.artist:'');return box;}
  const heading=el('div','rc-listening-heading');heading.append(el('span','','Listening on '+(track.source==='spotify'?'Spotify':'Reparty')));
  if(track.source==='spotify'){const logo=el('img','rc-spotify-logo');logo.src='/assets/spotify-icon.svg';logo.alt='Spotify';heading.append(logo);}
  const body=el('div','rc-listening-body'),art=el('img','rc-listening-art');art.alt='Cover artwork for '+track.title;art.loading='lazy';art.referrerPolicy='no-referrer';
  const allowed=/^https:\/\/(?:i\.ytimg\.com\/vi\/[\w-]{11}\/hqdefault\.jpg|i\.scdn\.co\/image\/[a-f0-9]+|cdn[0-9]*\.suno\.(?:ai|com)\/[a-zA-Z0-9_./-]+\.(?:jpe?g|png|webp))$/i;
  art.src=allowed.test(track.artwork)?track.artwork:'/assets/reparty/reparty-tv.svg';art.onerror=()=>{art.onerror=null;art.src='/assets/reparty/reparty-tv.svg';};
  const copy=el('div','rc-listening-copy'),title=el('strong','',track.title);title.title=track.title;copy.append(title);
  if(track.artist){const artist=el('span','rc-listening-artist',track.artist);artist.title=track.artist;copy.append(artist);}
  if(Number.isFinite(track.duration)&&track.duration>0){
   box.dataset.position=track.position;box.dataset.sampledAt=track.sampledAt;
   const timing=el('div','rc-listening-timing'),bar=el('progress');bar.max=track.duration;bar.value=track.position;bar.setAttribute('aria-label',track.approximate?'Approximate room progress':'Song progress');
   timing.append(el('span','rc-listening-elapsed',time(track.position)),bar,el('span','',time(track.duration)));copy.append(timing);if(track.approximate)copy.append(el('small','rc-listening-note','Approximate room progress'));
  }
  body.append(art,copy);box.append(heading,body);
  if(/^https:\/\/(?:open\.spotify\.com\/track\/[a-zA-Z0-9]{22}|www\.youtube\.com\/watch\?v=[\w-]{11}|suno\.com\/song\/[a-f0-9-]{36})$/.test(track.url||'')){
   const link=el('a','rc-listening-link',track.source==='spotify'?'Open Spotify':'Open song');link.href=document.documentElement.dataset.repoLauncher==='true'?location.origin+'/listen.html?'+new URLSearchParams({provider:track.provider,id:track.id}):track.url;link.target='_blank';link.rel='noopener noreferrer';box.append(link);
  }
  return box;
 }
 window.repoListening=Object.freeze({view,tick,settings,save,connect,disconnect,refresh:()=>{settings().then(schedule).catch(()=>{});}});
 addEventListener('repo-account-state',changed);addEventListener('repo-media-state',()=>{const s=window.repoReparty?.getState(),signature=JSON.stringify([s?.mediaId,playing(s)]);if(signature!==mediaSignal){mediaSignal=signature;schedule();}});
 addEventListener('online',()=>{cooldown=0;schedule();});
 setInterval(()=>{if(owner&&!prefs&&Date.now()>=settingsRetryAt){settingsRetryAt=Date.now()+60000;settings().then(schedule).catch(()=>{});}else if(owner&&prefs&&(prefs.reparty||prefs.spotify))sync();},30000);
 setInterval(()=>{if(!document.hidden)tick();},1000);changed();
})();
