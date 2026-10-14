'use strict';
// This isolated-world preload adds desktop controls to the existing website.
// The website never receives a native bridge or access to ipcRenderer.
const { ipcRenderer } = require('electron');

if (process.isMainFrame) {
  const allowed = ['https://repocompany.uk','https://www.repocompany.uk'];
  if (allowed.includes(location.origin)) initialize();
}

function initialize() {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const activeStatuses = new Set(['downloading','updating','verifying','installing','queued','extracting']);
  const pending = new Set();
  const actions = new WeakMap();
  let state = {catalog:{games:[]},library:{},running:[],account:{status:'checking'},connectivity:{online:true},launcherUpdate:{}};
  let libraryActive = false, libraryRequested = false, queued = false, mountedDialog = null;
  let lastLibrarySignature = '', refreshTimer = null, refreshPending = false, messageTimer = null;
  let embeddedDemo = null;
  const invoke = (action,value) => ipcRenderer.invoke('launcher:portal',action,value);
  const games = () => Array.isArray(state.catalog?.games) ? state.catalog.games : [];
  const demos = () => Array.isArray(state.catalog?.demos) ? state.catalog.demos : [];
  const selectedDemo = () => demos().find(demo => demo.id === document.getElementById('demo-library')?.dataset.selectedDemo);
  const entry = id => state.library?.[id] || {};
  const installed = id => Boolean(entry(id).version) || ['installed','ready','running'].includes(entry(id).status);
  const running = id => (state.running || []).some(item => (typeof item === 'string' ? item : item?.id) === id);
  const busy = id => activeStatuses.has(entry(id).status);
  const pendingGame = id => ['install','update','uninstall','play'].some(action => pending.has(`${action}:${id}`));
  const updateAvailable = id => installed(id) && entry(id).availableVersion && entry(id).availableVersion !== entry(id).version;
  const originGame = value => {try {const origin = new URL(value,location.href).origin;return games().find(game => game.origin === origin);}catch{return null;}};
  const imageFor = id => ({morogue:'/account-assets/morogue-activity-banner-v1.png',moratales:'/account-assets/moratales-activity-banner-v1.png',manager:'/account-assets/manager-activity-banner-v1.png',dragonbound:'/original-case-assets/dragonbound-menu.png'}[id]);
  function percent(item) {return Math.round(Math.min(100,Math.max(0,item.totalBytes > 0 ? item.bytes / item.totalBytes * 100 : Number(item.progress || 0) * 100)));}
  function size(value) {const amount=Number(value)||0;if(amount<1024)return `${amount} B`;if(amount<1048576)return `${(amount/1024).toFixed(1)} KB`;return `${(amount/1048576).toFixed(1)} MB`;}
  function statusFor(game) {
    const item=entry(game.id);
    if(running(game.id))return 'Now playing';
    if(busy(game.id))return `${item.status==='verifying'?'Verifying game files':item.status==='updating'?'Updating':'Installing'}${item.totalBytes?' · '+percent(item)+'%':''}`;
    if(!game.installable)return 'Windows edition coming later';
    if(item.error)return 'Installation needs attention';
    if(updateAvailable(game.id))return 'Update available';
    return installed(game.id)?'Installed · Version '+item.version:'Not installed on this computer';
  }
  function actionFor(game) {
    if(!game.installable)return {label:'Coming later',disabled:true};
    if(running(game.id))return {label:'Running',disabled:true};
    if(busy(game.id))return {label:entry(game.id).totalBytes?`Installing ${percent(entry(game.id))}%`:'Installing…',disabled:true};
    if(pendingGame(game.id))return {label:'Please wait…',disabled:true};
    if(!installed(game.id))return {label:entry(game.id).error?'Retry install':'Install game',action:'install'};
    if(updateAvailable(game.id))return {label:'Update',action:'update'};
    if(state.connectivity?.online===false)return {label:'Reconnect',action:'refresh'};
    if(state.account?.status==='checking')return {label:'Connecting…',disabled:true};
    if(state.account?.status!=='online')return {label:'Sign in',action:'signin'};
    return {label:'Play',action:'play'};
  }
  function demoAction(demo) {
    if(pending.has('play-web:'+demo.id))return {label:'Opening…',disabled:true};
    if(state.connectivity?.online===false)return {label:'Reconnect',action:'refresh'};
    if(state.account?.status==='checking')return {label:'Connecting…',disabled:true};
    if(state.account?.status!=='online')return {label:'Sign in to play',action:'signin'};
    return {label:'Play',action:'play-web'};
  }
  const css = `
    #download-client{display:none!important}
    /* The website centers its fixed-size scene. Fill its vertical gutters
       with the same backdrop without moving the cases or controls. */
    #dashboard.home-mode .home-backdrop{top:calc(0px - var(--scene-top,0px));bottom:calc(0px - var(--scene-top,0px))}
    #account-menu[data-launcher-library="true"]>#account-content{display:none!important}
    #launcher-library-panel[hidden]{display:none!important}
    #launcher-library-panel{min-height:0;flex:1;overflow:auto}
    #account-menu[data-launcher-library="true"] .account-tabs [data-tab][aria-selected="true"]{color:#a7afa9}
    #launcher-library-panel .launcher-library-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:30px}
    #launcher-library-panel .launcher-library-heading>.account-soft-button{margin-top:15px;white-space:nowrap;font-size:12px}
    #launcher-library-panel .launcher-library-list{border-top:1px solid #a8b5bf25;margin-top:24px}
    #launcher-library-panel .launcher-library-row{display:grid;grid-template-columns:135px minmax(180px,1fr) auto;align-items:center;gap:25px;padding:22px 0;border-bottom:1px solid #a8b5bf20}
    #launcher-library-panel .launcher-library-art{width:135px;height:76px;border-radius:4px;object-fit:cover;object-position:70% center;opacity:.88}
    #launcher-library-panel .launcher-library-copy h3{font-size:21px;font-weight:350;letter-spacing:-.02em;margin:0 0 8px}
    #launcher-library-panel .launcher-library-copy p{font-size:11px;color:#9badae;line-height:1.6;margin:0}
    #launcher-library-panel .launcher-library-actions{display:flex;align-items:center;justify-content:flex-end;gap:23px;min-width:250px}
    #launcher-library-panel .launcher-primary{display:inline-flex;align-items:center;justify-content:center;min-width:134px;border-radius:27px;background:#e9e0c9;color:#121c24;padding:13px 23px;font-size:14px;font-weight:600;white-space:nowrap}
    #launcher-library-panel .launcher-primary:hover:not(:disabled){background:#f5e8c9;box-shadow:0 0 0 2px #e9e0c924}
    #launcher-library-panel .launcher-primary:disabled{background:#b6c3b316;color:#a5b6ad;opacity:.75}
    #launcher-library-panel .launcher-secondary{font-size:11px;color:#abb9b8;white-space:nowrap}
    #launcher-library-panel .launcher-secondary:hover:not(:disabled){color:#f0e3bd}
    #launcher-library-panel .launcher-secondary:disabled{opacity:.4}
    #launcher-library-panel .launcher-management{display:flex;flex-direction:column;gap:13px;align-items:flex-end}
    #launcher-library-panel .launcher-error{color:#dfb0a0!important;max-width:530px;margin-top:6px!important}
    #launcher-library-panel .launcher-progress{display:flex;align-items:center;gap:14px;margin-top:12px}
    #launcher-library-panel progress{height:3px;display:block;flex:1;max-width:380px;border:0;background:#263b37;accent-color:#d5cfaf}
    #launcher-library-panel progress::-webkit-progress-bar{background:#263b37}
    #launcher-library-panel progress::-webkit-progress-value{background:#d5cfaf}
    #launcher-library-panel .launcher-progress span{font-size:10px;color:#8d9f9e;white-space:nowrap}
    #launcher-library-panel .launcher-library-note{display:flex;justify-content:space-between;align-items:center;gap:30px;margin-top:26px;color:#859998;font-size:11px;line-height:1.7}
    #launcher-library-panel .launcher-library-note p{margin:0;max-width:730px;font-size:11px;line-height:1.7;color:inherit}
    #launcher-library-panel .launcher-library-version{display:flex;gap:10px;align-items:center;white-space:nowrap;font-size:10px;color:#748b89}
    #launcher-library-feedback{font-size:12px;line-height:1.7;color:#d9cbaa;margin-top:18px;min-height:20px}
    #launcher-update-settings{margin-top:35px;max-width:760px}
    #launcher-update-settings .account-settings-row{align-items:center}
    #launcher-update-settings .account-switch:disabled{opacity:.6;cursor:wait}
    #launcher-update-settings .account-switch:focus-visible{outline:2px solid #e3dbbf;outline-offset:5px}
    #launcher-update-settings-note{font-size:11px;line-height:1.7;color:#84969e;margin:15px 0 25px}
    #launcher-discord-status{font-size:11px;line-height:1.7;color:#84969e;margin:15px 0 25px}
    [data-launcher-cta][data-launcher-long="true"]{font-size:20px!important}
    #launcher-native-message{position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:100000;max-width:min(640px,90vw);background:#18221eef;border:1px solid #cfc6a44d;border-radius:6px;padding:14px 22px;color:#eee5cf;font:13px/1.7 'Segoe UI',sans-serif;box-shadow:0 12px 36px #0007;pointer-events:none}
    #launcher-native-message[hidden]{display:none!important}
    @media(max-width:1100px){#launcher-library-panel .launcher-library-row{grid-template-columns:105px minmax(160px,1fr) auto;gap:20px}#launcher-library-panel .launcher-library-art{width:105px;height:66px}#launcher-library-panel .launcher-library-copy h3{font-size:18px}#launcher-library-panel .launcher-library-actions{gap:16px;min-width:210px}#launcher-library-panel .launcher-primary{min-width:115px;padding:12px 18px;font-size:13px}}
  `;
  function toast(message) {
    let node=document.getElementById('launcher-native-message');
    if(!node){node=document.createElement('div');node.id='launcher-native-message';node.setAttribute('role','status');node.setAttribute('aria-live','polite');document.body.append(node);}
    node.textContent=String(message||'Please try again.');node.hidden=false;
    const feedback=document.getElementById('launcher-library-feedback');if(feedback)feedback.textContent=node.textContent;
    clearTimeout(messageTimer);messageTimer=setTimeout(()=>{node.hidden=true;},8000);
  }
  function setLibrary(active,focus=false) {
    libraryActive=Boolean(active);
    const dialog=document.getElementById('account-menu'),tab=document.getElementById('launcher-library-tab'),panel=document.getElementById('launcher-library-panel');
    if(!dialog||!tab||!panel)return;
    if(active){dialog.dataset.launcherLibrary='true';panel.hidden=false;if(document.title!=='Repo Company — Account / Library')document.title='Repo Company — Account / Library';}
    else {delete dialog.dataset.launcherLibrary;panel.hidden=true;}
    if(tab.getAttribute('aria-selected')!==String(active))tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
    if(active)dialog.querySelectorAll('.account-tabs [data-tab][role="tab"]').forEach(button=>{if(button.getAttribute('aria-selected')!=='false')button.setAttribute('aria-selected','false');if(button.tabIndex!==-1)button.tabIndex=-1;});
    else {const current=dialog.dataset.accountTab||'profile';dialog.querySelectorAll('.account-tabs [data-tab][role="tab"]').forEach(button=>{const on=button.dataset.tab===current;if(button.getAttribute('aria-selected')!==String(on))button.setAttribute('aria-selected',String(on));button.tabIndex=on?0:-1;});}
    if(focus){tab.focus({preventScroll:true});tab.scrollIntoView({block:'nearest',inline:'nearest'});}
  }
  function attachActions(panel) {
    panel.querySelectorAll('[data-launcher-action]').forEach(button=>actions.set(button,{action:button.dataset.launcherAction,id:button.dataset.gameId||undefined}));
  }
  function renderLibrary() {
    const panel=document.getElementById('launcher-library-panel');if(!panel)return;
    const signature=JSON.stringify([state.library,state.running,state.account?.status,state.connectivity,state.catalog,state.launcherUpdate,state.version,[...pending]]);
    if(signature===lastLibrarySignature)return;lastLibrarySignature=signature;
    const focused=document.activeElement;const focusAction=actions.get(focused);
    const content=games().filter(game=>game.delivery!=='web').map(game=>{
      const item=entry(game.id),action=actionFor(game),disabled=busy(game.id)||running(game.id)||pendingGame(game.id);
      const secondary=busy(game.id)?`<button class="launcher-secondary" data-launcher-action="cancel" data-game-id="${escape(game.id)}" ${pending.has('cancel:'+game.id)?'disabled':''}>Cancel</button>`:installed(game.id)?`<div class="launcher-management"><button class="launcher-secondary" data-launcher-action="install" data-game-id="${escape(game.id)}" ${disabled?'disabled':''}>Repair</button><button class="launcher-secondary" data-launcher-action="uninstall" data-game-id="${escape(game.id)}" ${disabled?'disabled':''}>Uninstall</button></div>`:'';
      return `<article class="launcher-library-row">${imageFor(game.id)?`<img class="launcher-library-art" src="${imageFor(game.id)}" alt="">`:'<span></span>'}<div class="launcher-library-copy"><h3>${escape(game.name)}</h3><p>${escape(statusFor(game))}</p>${busy(game.id)?`<div class="launcher-progress"><progress max="100" ${item.totalBytes?'value="'+percent(item)+'"':''} aria-label="${escape(game.name)} installation progress"></progress><span>${item.totalBytes?size(item.bytes)+' / '+size(item.totalBytes):'Preparing…'}</span></div>`:''}${item.error?`<p class="launcher-error">${escape(item.error)}</p>`:''}</div><div class="launcher-library-actions">${secondary}<button class="launcher-primary" data-launcher-action="${action.action||''}" data-game-id="${escape(game.id)}" ${action.disabled?'disabled':''}>${escape(action.label)}</button></div></article>`;
    }).join('');
    const update=state.launcherUpdate||{};
    panel.innerHTML=`<div class="launcher-library-heading"><div class="account-section-heading"><p class="account-eyebrow">ON THIS COMPUTER</p><h2>Your library.</h2><p class="account-subtitle">Install, update and manage your games.</p></div><button class="account-soft-button" data-launcher-action="refresh">Check for updates →</button></div><div class="launcher-library-list">${content||'<p class="account-live-status">Loading your games…</p>'}</div><div class="launcher-library-note"><p>Sign in with your Repo Company account to play. Your achievements and leaderboard results stay connected to the website.</p><div class="launcher-library-version"><span>${state.version?'Launcher '+escape(state.version):'Windows launcher'}</span><button class="launcher-secondary" data-launcher-action="launcher-update">Check launcher update</button></div></div>${update.message?`<p class="account-section-note">${escape(update.message)}</p>`:''}<p id="launcher-library-feedback" role="status" aria-live="polite"></p>`;
    attachActions(panel);
    if(focusAction){const replacement=[...panel.querySelectorAll('button')].find(button=>{const action=actions.get(button);return action?.action===focusAction.action&&action?.id===focusAction.id;});if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});}
  }
  function renderSettings() {
    const dialog=document.getElementById('account-menu'),content=document.getElementById('account-content');
    if(!content||dialog?.dataset.accountTab!=='settings')return;
    let section=document.getElementById('launcher-update-settings');
    if(!section){
      section=document.createElement('section');section.id='launcher-update-settings';section.setAttribute('aria-labelledby','launcher-update-settings-heading');
      section.innerHTML='<h3 id="launcher-update-settings-heading" class="account-settings-label">Windows launcher</h3><div class="account-settings-row"><div><b>Automatically update installed games</b><p id="launcher-auto-update-description">Keep your library up to date while the launcher is open. Games you are playing update after you close them.</p></div><button id="launcher-auto-update-toggle" type="button" class="account-switch" role="switch" aria-label="Automatically update installed games" aria-describedby="launcher-auto-update-description launcher-update-settings-note"><span></span></button></div><p id="launcher-update-settings-note"></p>';
      const column=content.querySelector('.account-settings-layout>div');
      if(column)column.append(section);else content.prepend(section);
    }
    if(!section.querySelector('#launcher-discord-toggle')){
      const row=document.createElement('div');row.className='account-settings-row';
      row.innerHTML='<div><b>Show games on Discord</b><p id="launcher-discord-description">Let Discord show the game you launch and how long you have been playing. Your account details, saves and scores stay private.</p></div><button id="launcher-discord-toggle" type="button" class="account-switch" role="switch" aria-label="Show games on Discord" aria-describedby="launcher-discord-description launcher-discord-status"><span></span></button>';
      const status=document.createElement('p');status.id='launcher-discord-status';status.setAttribute('role','status');section.append(row,status);
    }
    const enabled=state.preferences?.automaticGameUpdates!==false,button=section.querySelector('#launcher-auto-update-toggle');
    if(button.getAttribute('aria-checked')!==String(enabled))button.setAttribute('aria-checked',String(enabled));
    button.disabled=[...pending].some(key=>key.startsWith('automatic-game-updates:'));
    actions.set(button,{action:'automatic-game-updates',id:!enabled});
    const note=section.querySelector('#launcher-update-settings-note'),text='Applies to this computer for every account. '+(enabled?'Switch off to choose when to update from Library.':'Automatic updates are off. Check for updates and choose Update in Library whenever you are ready.')+' Any update already in progress will finish.';
    if(note.textContent!==text)note.textContent=text;
    const discordEnabled=state.preferences?.discordPresence!==false,discordButton=section.querySelector('#launcher-discord-toggle');
    if(discordButton.getAttribute('aria-checked')!==String(discordEnabled))discordButton.setAttribute('aria-checked',String(discordEnabled));
    discordButton.disabled=[...pending].some(key=>key.startsWith('discord-presence:'));
    actions.set(discordButton,{action:'discord-presence',id:!discordEnabled});
    const discordStatus=section.querySelector('#launcher-discord-status');
    const statusText=!discordEnabled?'Discord game activity is off on this computer.':state.discordPresence?.status==='connected'?'Connected to Discord. Your current game activity is shared.':state.discordPresence?.status==='unconfigured'?'Discord activity is available for MoraTales, Morogue and Velmora Manager.':state.discordPresence?.status==='connecting'?'Connecting to the Discord desktop app…':state.discordPresence?.status==='unavailable'?'Open the Discord desktop app to show your game. Its Activity Privacy settings also control visibility.':'Requires the Discord desktop app. Its Activity Privacy settings also control visibility.';
    if(discordStatus.textContent!==statusText)discordStatus.textContent=statusText;
  }
  function updatePlayButtons() {
    const candidates=[...document.querySelectorAll('[data-note="Play"][data-game-url]')].map(button=>({button,game:originGame(button.dataset.gameUrl)}));
    const demoButton=document.getElementById('demo-launch'),demo=selectedDemo();if(demoButton&&demo)candidates.push({button:demoButton,game:demo,demo:true});
    for(const candidate of candidates){
      const {button,game}=candidate;if(!game)continue;
      const action=candidate.demo?demoAction(game):actionFor(game);
      if(candidate.demo&&button.dataset.launcherDemo!==game.id)button.dataset.launcherDemo=game.id;
      button.dataset.launcherCta=game.id;
      if(button.dataset.launcherLong!==String(action.label.length>8))button.dataset.launcherLong=String(action.label.length>8);
      let label=button.querySelector('[data-launcher-label]')||button.querySelector('#demo-launch-label');
      if(!label){label=document.createElement('span');label.dataset.launcherLabel='true';for(const child of [...button.childNodes])if(child.nodeType===Node.TEXT_NODE)child.remove();button.append(label);}
      if(label.textContent!==action.label)label.textContent=action.label;
      button.setAttribute('aria-label',`${game.name}: ${action.label}`);
      // Leave the original element interactive so capture can also block its old handler.
      if(button.getAttribute('aria-disabled')!==String(Boolean(action.disabled)))button.setAttribute('aria-disabled',String(Boolean(action.disabled)));
    }
  }
  function mount() {
    if(!document.body)return;
    if(!document.getElementById('launcher-account-style')){const style=document.createElement('style');style.id='launcher-account-style';style.textContent=css;document.head.append(style);}
    const dialog=document.getElementById('account-menu');
    if(dialog&&!document.getElementById('launcher-library-tab')){
      const nav=dialog.querySelector('.account-tabs'),profile=nav?.querySelector('[data-tab="profile"]');
      if(nav){const tab=document.createElement('button');tab.id='launcher-library-tab';tab.type='button';tab.setAttribute('role','tab');tab.setAttribute('aria-controls','launcher-library-panel');tab.setAttribute('aria-selected','false');tab.tabIndex=-1;tab.textContent='Library';if(profile)profile.after(tab);else nav.append(tab);
        const panel=document.createElement('section');panel.id='launcher-library-panel';panel.className='account-content';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','launcher-library-tab');panel.tabIndex=0;panel.hidden=true;dialog.insertBefore(panel,dialog.querySelector('.account-footer'));
        lastLibrarySignature='';
      }
    }
    if(dialog&&mountedDialog!==dialog){mountedDialog=dialog;dialog.addEventListener('close',()=>{libraryRequested=false;setLibrary(false);});}
    if(dialog?.open&&libraryRequested){libraryRequested=false;setLibrary(true,true);}
    if(libraryActive&&dialog?.open)setLibrary(true);
    renderLibrary();renderSettings();updatePlayButtons();
    if(embeddedDemo){
      let open=false;
      try{
        if(embeddedDemo.runtime==='dragonbound'){
          const overlay=document.getElementById('dragonboundStandaloneOverlay'),frame=overlay?.querySelector('iframe');
          const url=frame?.src?new URL(frame.src,location.href):null;
          open=Boolean(overlay&&!overlay.hidden&&overlay.classList.contains('is-visible')&&url?.origin===embeddedDemo.origin&&url.pathname==='/');
        }else{
          const dialog=document.getElementById('legacy-feature'),frame=dialog?.querySelector('iframe');
          open=Boolean(dialog?.open&&frame&&new URL(frame.src,location.href).searchParams.get('dashboard')===embeddedDemo.id);
        }
      }catch{/* A changing frame has not opened yet. */}
      if(open)embeddedDemo.seen=true;
      else if(embeddedDemo.seen){const id=embeddedDemo.id;embeddedDemo=null;void invoke('web-demo-closed',id).catch(()=>{});}
    }
  }
  function schedule() {if(queued)return;queued=true;setTimeout(()=>{queued=false;mount();},100);}
  async function request(action,id) {
    const token=action+':'+(id||'');if(pending.has(token))return;
    pending.add(token);schedule();
    try {
      if(action==='signin'){
        setLibrary(false);await invoke('navigate','account');
        const start=Date.now();const openLogin=()=>{const button=document.querySelector('#account-menu [data-login]');if(button&&button.getBoundingClientRect().width>0){button.click();return;}if(Date.now()-start<5000)setTimeout(openLogin,100);};openLogin();
      } else {
        const next=await invoke(action,id);if(next&&typeof next==='object'&&next.catalog)receive(next);
        const demo=action==='play-web'?demos().find(demo=>demo.id===id):null;
        if(demo?.embedded)embeddedDemo={id,seen:false,runtime:demo.runtime||'legacy',origin:demo.origin};
        if(action==='refresh')toast('Your games and account have been checked for updates.');
        if(action==='automatic-game-updates')toast(id?'Automatic game updates are on.':'Automatic game updates are off. You can still update games from Library.');
        if(action==='discord-presence')toast(id?'Discord game activity is on.':'Discord game activity is off.');
      }
    } catch(error){toast(error?.message||String(error));}
    finally{pending.delete(token);schedule();}
  }
  function receive(next){if(!next||typeof next!=='object')return;state={...state,...next};schedule();}

  // Capture precedes the site's launch animation and its private launching flag.
  addEventListener('click',event=>{
    const element=event.target instanceof Element?event.target.closest('button,a'):null;if(!element)return;
    if(element.id==='launcher-library-tab'){event.preventDefault();event.stopImmediatePropagation();setLibrary(true,true);return;}
    if(element.closest('#account-menu')&&(element.matches('[data-tab],.account-back,.account-return,[data-binder]'))){setLibrary(false);}
    const native=actions.get(element);
    if(native){event.preventDefault();event.stopImmediatePropagation();if(event.isTrusted&&!element.disabled&&native.action)void request(native.action,native.id);return;}
    if(element.id==='demo-launch'){
      event.preventDefault();event.stopImmediatePropagation();if(!event.isTrusted)return;
      const demo=selectedDemo();if(!demo){toast('Your demo collection is connecting. Please try again shortly.');return;}
      const action=demoAction(demo);if(!action.disabled&&action.action)void request(action.action,demo.id);return;
    }
    if(element.matches('[data-note="Play"][data-game-url]')){
      const game=originGame(element.dataset.gameUrl);if(!game)return;
      event.preventDefault();event.stopImmediatePropagation();
      if(!event.isTrusted)return;const action=actionFor(game);if(!action.disabled&&action.action)void request(action.action,game.id);
    }
  },true);
  addEventListener('keydown',event=>{
    const tab=event.target instanceof Element?event.target.closest('#account-menu .account-tabs [role="tab"]'):null;
    if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const tabs=[...tab.closest('.account-tabs').querySelectorAll('[role="tab"]')],index=tabs.indexOf(tab);
    const next=event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs[(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];
    event.preventDefault();event.stopImmediatePropagation();next.click();next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',inline:'nearest'});
  },true);
  addEventListener('hashchange',()=>{if(!location.hash.startsWith('#account')){libraryRequested=false;setLibrary(false);}schedule();});
  addEventListener('popstate',()=>{if(!location.hash.startsWith('#account')){libraryRequested=false;setLibrary(false);}schedule();});
  addEventListener('repo-account-state',()=>{
    clearTimeout(refreshTimer);refreshTimer=setTimeout(async()=>{if(refreshPending)return;refreshPending=true;try{const next=await invoke('refresh');if(next?.catalog)receive(next);}catch{/* Periodic main refresh also retries connection. */}finally{refreshPending=false;}},150);
    schedule();
  });
  ipcRenderer.on('launcher:state',(_event,next)=>receive(next));
  ipcRenderer.on('launcher:portal-library',()=>{libraryRequested=true;schedule();});
  const ready=()=>{document.documentElement.dataset.repoLauncher='true';mount();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden','aria-hidden','class','data-game-url','href','src','data-open-game','data-selected-game','data-selected-demo','aria-selected']});invoke('state').then(receive).catch(()=>{});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
}
