(() => {
  'use strict';
  const MANAGER_ORIGIN='https://manager.repocompany.uk';
  const SUPABASE_URL='https://hvdrwmjieguurxvrgzfu.supabase.co';
  const SUPABASE_KEY='sb_publishable_bln84LaJ8iYmnkYK9mh0Pg_XxP7O1OZ';
  const OVERLAY_ID='velmoraManagerOverlay';
  let client=null,frame=null,bridge='',pausedAudio=[];

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
      #${OVERLAY_ID}{position:fixed;inset:0;display:none;background:#03101a;z-index:2147483646}
      #${OVERLAY_ID}.is-visible{display:block}
      #${OVERLAY_ID} iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#eef4f8}
      #${OVERLAY_ID} .repo-vm-close{position:absolute;top:14px;right:16px;z-index:4;width:42px;height:42px;border:1px solid rgba(137,211,222,.55);border-radius:3px;background:rgba(4,25,38,.92);color:#fff;font:300 27px/1 Arial,sans-serif;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.25)}
      #${OVERLAY_ID} .repo-vm-close:hover,#${OVERLAY_ID} .repo-vm-close:focus-visible{background:#0a4253;border-color:#78e6ec;outline:none}
      #${OVERLAY_ID} .repo-vm-loading{position:absolute;inset:0;display:grid;place-content:center;gap:14px;color:#dffaff;text-align:center;font:700 12px/1.4 Arial,sans-serif;letter-spacing:.16em;background:radial-gradient(circle at 50% 42%,#123b50,#03101a 65%);z-index:3;transition:opacity .3s ease}
      #${OVERLAY_ID} .repo-vm-loading::before{content:"";width:42px;height:42px;margin:auto;border:3px solid rgba(99,222,231,.18);border-top-color:#63dee7;border-radius:50%;animation:repoVmSpin .8s linear infinite}
      #${OVERLAY_ID}.is-loaded .repo-vm-loading{opacity:0;pointer-events:none}
      body.velmora-manager-active{overflow:hidden!important}
      @keyframes repoVmSpin{to{transform:rotate(360deg)}}
    `;document.head.appendChild(style);
  }
  function ensureOverlay(){
    let overlay=document.getElementById(OVERLAY_ID);if(overlay)return overlay;
    overlay=document.createElement('section');overlay.id=OVERLAY_ID;overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<div class="repo-vm-loading" role="status">ENTERING VELMORA MANAGER</div><iframe title="Velmora Manager" allow="autoplay; fullscreen" referrerpolicy="strict-origin"></iframe><button type="button" class="repo-vm-close" aria-label="Close Velmora Manager">×</button>';
    overlay.querySelector('.repo-vm-close').addEventListener('click',close);overlay.querySelector('iframe').addEventListener('load',()=>overlay.classList.add('is-loaded'));
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
  function open(event){
    if(event&&(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button===1))return;
    event?.preventDefault();installStyles();const overlay=ensureOverlay();bridge=nonce();frame=overlay.querySelector('iframe');
    overlay.classList.remove('is-loaded');overlay.classList.add('is-visible');overlay.setAttribute('aria-hidden','false');document.body.classList.add('velmora-manager-active');pausePageAudio();
    const url=new URL(MANAGER_ORIGIN+'/');url.searchParams.set('source','repocompany');url.searchParams.set('repoBridge',bridge);frame.src=url.href;overlay.querySelector('.repo-vm-close').focus();
  }
  function close(){
    const overlay=document.getElementById(OVERLAY_ID);if(!overlay)return;overlay.classList.remove('is-visible','is-loaded');overlay.setAttribute('aria-hidden','true');document.body.classList.remove('velmora-manager-active');if(frame)frame.src='about:blank';frame=null;bridge='';resumePageAudio();document.getElementById('openVelmoraManagerHome')?.focus();
  }
  window.addEventListener('message',event=>{const data=event.data||{};if(event.origin!==MANAGER_ORIGIN||event.source!==frame?.contentWindow||data.type!=='velmora-manager-ready'||data.bridge!==bridge)return;sendSession();});
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.getElementById(OVERLAY_ID)?.classList.contains('is-visible'))close();});
  function bind(){const button=document.getElementById('openVelmoraManagerHome');if(!button||button.dataset.velmoraLauncherBound)return;button.dataset.velmoraLauncherBound='true';button.addEventListener('click',open);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.VelmoraManagerLauncher={open,close};
})();
