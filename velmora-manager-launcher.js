(() => {
  'use strict';
  const MANAGER_ORIGIN='https://manager.repocompany.uk';
  const SUPABASE_URL='https://hvdrwmjieguurxvrgzfu.supabase.co';
  const SUPABASE_KEY='sb_publishable_bln84LaJ8iYmnkYK9mh0Pg_XxP7O1OZ';
  const INTRO_URL='assets/velmora-manager/velmora-manager-intro.mp4?v=20260907b';
  const OVERLAY_ID='velmoraManagerOverlay';
  let client=null,frame=null,intro=null,bridge='',pausedAudio=[];

  function accountClient(){
    if(window.repoSupabaseClient?.auth?.getSession)return window.repoSupabaseClient;
    if(client)return client;
    if(!window.supabase?.createClient)return null;
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    return client;
  }
  function nonce(){
    if(window.crypto?.randomUUID)return window.crypto.randomUUID();
    const bytes=new Uint32Array(4);window.crypto?.getRandomValues?.(bytes);return Array.from(bytes,n=>n.toString(16)).join('-')||String(Date.now());
  }
  function installStyles(){
    if(document.getElementById('velmoraManagerLauncherStyles'))return;
    const style=document.createElement('style');style.id='velmoraManagerLauncherStyles';style.textContent=`
      #${OVERLAY_ID}{position:fixed;inset:0;display:none!important;background:#03101a;z-index:2147483646}
      #${OVERLAY_ID}.is-visible{display:block!important}
      #${OVERLAY_ID} iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#eef4f8;opacity:1;transition:opacity .3s ease}
      #${OVERLAY_ID} .repo-vm-intro{position:absolute;inset:0;z-index:2;width:100%;height:100%;object-fit:contain;background:#000;opacity:0;pointer-events:none;transition:opacity .32s ease}
      #${OVERLAY_ID}.is-intro iframe{opacity:0;pointer-events:none}
      #${OVERLAY_ID}.is-intro .repo-vm-intro{opacity:1;pointer-events:auto}
      #${OVERLAY_ID} .repo-vm-close{position:absolute!important;top:14px!important;right:16px!important;z-index:5!important;display:block!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;margin:0!important;padding:7px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:rgba(255,255,255,.72)!important;font:300 26px/1 Arial,sans-serif!important;cursor:pointer!important;text-shadow:0 2px 10px rgba(0,0,0,.75)!important;opacity:.82!important}
      #${OVERLAY_ID} .repo-vm-close:hover,#${OVERLAY_ID} .repo-vm-close:focus-visible{border:0!important;background:transparent!important;box-shadow:none!important;color:#fff!important;opacity:1!important;outline:none!important}
      #${OVERLAY_ID} .repo-vm-loading{position:absolute;inset:0;display:grid;place-content:center;gap:14px;color:#dffaff;text-align:center;font:700 12px/1.4 Arial,sans-serif;letter-spacing:.16em;background:radial-gradient(circle at 50% 42%,#123b50,#03101a 65%);z-index:3;transition:opacity .3s ease}
      #${OVERLAY_ID} .repo-vm-loading::before{content:"";width:42px;height:42px;margin:auto;border:3px solid rgba(99,222,231,.18);border-top-color:#63dee7;border-radius:50%;animation:repoVmSpin .8s linear infinite}
      #${OVERLAY_ID}.is-loaded .repo-vm-loading,#${OVERLAY_ID}.is-intro .repo-vm-loading{opacity:0;pointer-events:none}
      #${OVERLAY_ID} .repo-vm-skip{position:absolute!important;z-index:4!important;display:none!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;margin:0!important;padding:8px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:rgba(255,255,255,.7)!important;font:600 10px/1 Arial,sans-serif!important;letter-spacing:.14em!important;text-shadow:0 2px 10px rgba(0,0,0,.78)!important;cursor:pointer!important;opacity:.8!important}
      #${OVERLAY_ID}.is-intro .repo-vm-skip{display:block!important;right:18px!important;bottom:17px!important}
      #${OVERLAY_ID} .repo-vm-skip:hover,#${OVERLAY_ID} .repo-vm-skip:focus-visible{border:0!important;background:transparent!important;box-shadow:none!important;color:#fff!important;opacity:1!important;outline:none!important}
      body.velmora-manager-active{overflow:hidden!important}
      @keyframes repoVmSpin{to{transform:rotate(360deg)}}
    `;document.head.appendChild(style);
  }
  function ensureOverlay(){
    let overlay=document.getElementById(OVERLAY_ID);if(overlay)return overlay;
    overlay=document.createElement('section');overlay.id=OVERLAY_ID;overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`<div class="repo-vm-loading" role="status">ENTERING VELMORA MANAGER</div><video class="repo-vm-intro" playsinline preload="auto" fetchpriority="high" aria-label="Velmora Manager introduction"><source src="${INTRO_URL}" type="video/mp4"></video><button type="button" class="repo-vm-skip">SKIP INTRO</button><iframe title="Velmora Manager" allow="autoplay; fullscreen" referrerpolicy="strict-origin"></iframe><button type="button" class="repo-vm-close" aria-label="Close Velmora Manager">×</button>`;
    overlay.querySelector('.repo-vm-close').addEventListener('click',close);
    overlay.querySelector('.repo-vm-skip').addEventListener('click',enterGame);
    overlay.querySelector('.repo-vm-intro').addEventListener('ended',enterGame);
    overlay.querySelector('.repo-vm-intro').addEventListener('error',enterGame);
    overlay.querySelector('iframe').addEventListener('load',()=>{if(overlay.classList.contains('is-visible')&&!overlay.classList.contains('is-intro')&&frame?.src!=='about:blank')overlay.classList.add('is-loaded');});
    document.body.appendChild(overlay);return overlay;
  }
  function pausePageAudio(){pausedAudio=[...document.querySelectorAll('audio')].filter(audio=>!audio.paused);pausedAudio.forEach(audio=>audio.pause());}
  function resumePageAudio(){pausedAudio.forEach(audio=>audio.play().catch(()=>{}));pausedAudio=[];}
  async function sendSession(){
    if(!frame?.contentWindow||!bridge)return;
    let message={type:'velmora-manager-auth',bridge,guest:true};
    try{
      const auth=accountClient();if(auth){const result=await auth.auth.getSession();if(result.error)throw result.error;const session=result.data?.session;if(session?.access_token&&session?.refresh_token)message={type:'velmora-manager-auth',bridge,accessToken:session.access_token,refreshToken:session.refresh_token};}
    }catch(error){message={type:'velmora-manager-auth',bridge,guest:true,error:error?.message||'Account session unavailable'};}
    frame.contentWindow.postMessage(message,MANAGER_ORIGIN);
  }
  function enterGame(){
    const overlay=document.getElementById(OVERLAY_ID);if(!overlay||!overlay.classList.contains('is-visible')||!bridge)return;
    if(intro){intro.pause();intro.currentTime=0;}
    overlay.classList.remove('is-intro','is-loaded');
    const url=new URL(MANAGER_ORIGIN+'/');url.searchParams.set('source','repocompany');url.searchParams.set('repoBridge',bridge);frame.src=url.href;
  }
  function open(event){
    if(event&&(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button===1))return;
    event?.preventDefault();installStyles();const overlay=ensureOverlay();bridge=nonce();frame=overlay.querySelector('iframe');intro=overlay.querySelector('.repo-vm-intro');
    frame.src='about:blank';overlay.classList.remove('is-loaded');overlay.classList.add('is-visible','is-intro');overlay.setAttribute('aria-hidden','false');document.body.classList.add('velmora-manager-active');pausePageAudio();
    if(intro){intro.muted=false;intro.currentTime=0;const playback=intro.play();if(playback?.catch)playback.catch(()=>{intro.muted=true;return intro.play();}).catch(enterGame);}
    else enterGame();
    overlay.querySelector('.repo-vm-close').focus();
  }
  function close(){
    const overlay=document.getElementById(OVERLAY_ID);if(!overlay)return;if(intro){intro.pause();intro.currentTime=0;}overlay.classList.remove('is-visible','is-loaded','is-intro');overlay.setAttribute('aria-hidden','true');document.body.classList.remove('velmora-manager-active');if(frame)frame.src='about:blank';frame=null;intro=null;bridge='';resumePageAudio();document.getElementById('openVelmoraManagerHome')?.focus();
  }
  window.addEventListener('message',event=>{const data=event.data||{};if(event.origin!==MANAGER_ORIGIN||event.source!==frame?.contentWindow||data.type!=='velmora-manager-ready'||data.bridge!==bridge)return;sendSession();});
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.getElementById(OVERLAY_ID)?.classList.contains('is-visible'))close();});
  function bind(){const button=document.getElementById('openVelmoraManagerHome');if(!button||button.dataset.velmoraLauncherBound)return;button.dataset.velmoraLauncherBound='true';button.addEventListener('click',open);installStyles();ensureOverlay().querySelector('.repo-vm-intro')?.load();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.VelmoraManagerLauncher={open,close};
})();
