(() => {
 'use strict';
 if(document.documentElement.dataset.repoCompanion!=='true')return;
 const allowed=name=>/^(wibs|wibsworth|reparty)$/.test(name)||/^account(?:\/(?:profile|friends|inventory|achievements|settings|shop|binder|slabs)(?:\/[a-zA-Z0-9_-]+)?)?$/.test(name);
 const back=document.querySelector('#account-menu .account-return');if(back)back.textContent='Back to Wibs';document.querySelector('#account-menu .account-back')?.setAttribute('aria-label','Back to Wibs');const footer=document.querySelector('#account-menu .account-footer>span');if(footer)footer.textContent='Repo Company · Your account';
 const open=()=>{if(!window.repoAccount?.state.user)return;window.accountMenu?.close({route:false});window.repoMessaging?.open('',{intro:false});};
 window.repoCollection=Object.freeze({open});
 window.repoRoutes?.register(name=>{if(name.startsWith('account'))window.accountMenu?.open({tab:name.split('/')[1]||'profile',game:name.split('/')[2]||'',player:name.split('/')[2]||'',route:false});else open();});
 // Game artwork stays in profiles, but opens the game's achievements here.
 document.addEventListener('click',event=>{const game=event.target.closest('[data-game]');if(!game)return;event.preventDefault();event.stopImmediatePropagation();window.accountMenu?.open({tab:'achievements',game:game.dataset.game});},true);
 addEventListener('popstate',()=>{if(!allowed(window.repoRoutes.read()))open();});
 window.repoRoutes?.start();
 document.addEventListener('close',event=>{if(event.target.id==='account-menu'&&window.repoAccount?.state.user&&!document.querySelector('#repo-messages[open],#repo-reparty[open]'))queueMicrotask(open);},true);
 // Reflect the visual viewport when the keyboard opens; keep composer reachable.
 const viewport=()=>{document.documentElement.style.setProperty('--phone-height',(visualViewport?.height||innerHeight)+'px');};
 visualViewport?.addEventListener('resize',viewport);addEventListener('resize',viewport);viewport();
 let deferred;
 addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;});
 const installed=()=>matchMedia('(display-mode:standalone)').matches||navigator.standalone===true;
 const dialog=document.createElement('dialog');dialog.className='repo-phone-install';dialog.setAttribute('aria-labelledby','phone-install-title');dialog.innerHTML='<button type="button" aria-label="Close install instructions">×</button><img src="/assets/brand/repo-company-mark.png" alt=""><h2 id="phone-install-title">Repo Company on your phone</h2><p>Keep Wibs, Wibsworth and your account on your Home Screen.</p><ol><li>Open this page in Safari on iPhone, or Chrome on Android.</li><li>Open the Share or browser menu.</li><li>Choose <strong>Add to Home Screen</strong> or <strong>Install app</strong>. On iPhone, enable <strong>Open as Web App</strong> if shown.</li></ol><p class="repo-phone-install-note">Free to install. Calls need the app open and an internet connection.</p>';dialog.querySelector('button').onclick=()=>dialog.close();document.body.append(dialog);
 const button=document.createElement('button');button.type='button';button.className='repo-phone-install-button';button.textContent='Add to Home Screen';button.onclick=async()=>{if(deferred){const prompt=deferred;deferred=null;await prompt.prompt();}else dialog.showModal();};
 const login=document.querySelector('#repo-login>div');if(login)login.append(button);
 const drawer=document.querySelector('.rc-sidebar-bottom');if(drawer){const shortcut=button.cloneNode(true);shortcut.onclick=button.onclick;drawer.append(shortcut);}
 function visibility(){for(const b of document.querySelectorAll('.repo-phone-install-button'))b.hidden=installed();}visibility();addEventListener('appinstalled',visibility);
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/app/sw.js',{scope:'/app/'}).catch(()=>{});
})();
