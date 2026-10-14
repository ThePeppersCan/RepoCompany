(function(root){
 'use strict';
 if(location.origin!=='https://moratales.repocompany.uk'||parent!==root)return;
 let notice=null,message=null,retry=null;
 root.addEventListener('moratales-character-sync',event=>{
  const status=event.detail?.status,visible=['account','conflict','offline'].includes(status);
  if(!visible){if(notice)notice.hidden=true;return;}
  if(!notice){
   const style=document.createElement('style');style.textContent='#moratales-character-notice{position:fixed;right:18px;bottom:18px;z-index:2147483000;max-width:min(340px,calc(100vw - 36px));box-sizing:border-box;padding:14px 18px;border:1px solid #baa571;border-radius:8px;background:#142019;color:#efe6cd;box-shadow:0 8px 30px #0008;font:14px/1.5 system-ui,sans-serif}#moratales-character-notice[hidden]{display:none}#moratales-character-notice p{margin:0 0 8px}#moratales-character-notice button{border:0;background:none;padding:0;color:#f4d992;font:600 13px system-ui,sans-serif;cursor:pointer}#moratales-character-notice button:focus-visible{outline:2px solid #f4d992;outline-offset:4px}';document.head.append(style);
   notice=document.createElement('aside');notice.id='moratales-character-notice';notice.setAttribute('role','status');
   message=document.createElement('p');retry=document.createElement('button');retry.type='button';retry.textContent='Retry sync';retry.onclick=async()=>{retry.disabled=true;try{await root.MORATALES_ACCOUNT_CHARACTERS?.sync();}finally{retry.disabled=false;}};
   notice.append(message,retry);document.body.append(notice);
  }
  notice.hidden=false;
  message.textContent=status==='conflict'?'This character changed in two places. Your account appearance and this browser’s character have both been kept. Sync is paused to avoid replacing either one.':status==='account'?'These browser characters belong to another Repo Company account. Sign in with their original account to sync them.':'Your character appearance could not sync. We’ll retry when the connection returns.';
 });
})(globalThis);
