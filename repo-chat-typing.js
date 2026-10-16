(() => {
 'use strict';
 if(window.repoChatTyping)return;
 const controllers=new Set();
 function mount({form,input,context,send}){
  const line=document.createElement('div');line.className='repo-typing';line.setAttribute('role','status');line.setAttribute('aria-live','polite');line.setAttribute('aria-atomic','true');
  const dots=document.createElement('span');dots.className='repo-typing-dots';dots.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)dots.append(document.createElement('i'));
  const copy=document.createElement('span');copy.className='repo-typing-copy';line.append(dots,copy);form.before(line);
  let local=null,lastSent=0,idleTimer,expiryTimer,people=[],signature='',queue=Promise.resolve(),generation=0;
  const visible=()=>{const c=context();return !!(c.user&&c.target&&c.visible&&!document.hidden);};
  function post(c,active){const gen=generation;queue=queue.catch(()=>{}).then(()=>{if(gen!==generation||context().user!==c.user)return;return send(c.target,active);}).catch(()=>{});}
  function stop(){clearTimeout(idleTimer);if(local){const c=local;local=null;post(c,false);}}
  function clear(){clearTimeout(expiryTimer);people=[];paint();}
  function reset(){stop();clear();}
  function paint(){
   clearTimeout(expiryTimer);people=people.filter(p=>p.until>Date.now());
   const names=visible()?people.map(p=>p.display):[],next=JSON.stringify(names);
   if(next!==signature){signature=next;copy.replaceChildren();if(names.length){const strong=document.createElement('strong');strong.textContent=names.length<=2?names.join(' and '):names.slice(0,2).join(', ');copy.append(strong,document.createTextNode(names.length>2?' and others are typing…':names.length===1?' is typing…':' are typing…'));}line.classList.toggle('is-active',!!names.length);}
   if(people.length)expiryTimer=setTimeout(paint,Math.max(1,Math.min(...people.map(p=>p.until))-Date.now()));
  }
  function update(result){
   if(!visible()){clear();return;}
   const now=Date.now(),own=String(window.repoAccount?.state.social?.username||window.repoAccount?.state.character?.username||'').toLowerCase();
   people=(Array.isArray(result?.typing)?result.typing:[]).filter(p=>p&&p.username!==own&&typeof p.display==='string'&&p.remainingMs>0).slice(0,5).map(p=>({display:p.display.slice(0,64),until:now+Math.min(10000,p.remainingMs)}));paint();
  }
  input.addEventListener('input',()=>{
   if(!visible()||!input.value.trim()){stop();return;}
   const c=context(),now=Date.now();
   if(local&&(local.user!==c.user||local.target!==c.target))stop();
   if(!local||now-lastSent>=5000){local={user:c.user,target:c.target};lastSent=now;post(local,true);}
   clearTimeout(idleTimer);idleTimer=setTimeout(stop,5000);
  });
  input.addEventListener('blur',stop);form.addEventListener('submit',stop);
  const controller={update,reset,stop,clear,sync(){if(!visible())reset();},accountChanged(){generation++;local=null;lastSent=0;clearTimeout(idleTimer);clear();}};
  controllers.add(controller);return Object.freeze(controller);
 }
 for(const event of ['repo-messaging-state','repo-community-view'])addEventListener(event,()=>controllers.forEach(c=>c.sync()));
 addEventListener('repo-launcher-portal-visibility',event=>{if(event.detail?.visible===false)controllers.forEach(c=>c.reset());});
 addEventListener('pagehide',()=>controllers.forEach(c=>c.reset()));
 document.addEventListener('visibilitychange',()=>controllers.forEach(c=>c.sync()));
 addEventListener('repo-account-state',()=>controllers.forEach(c=>c.sync()));
 window.repoChatTyping=Object.freeze({mount});
})();
