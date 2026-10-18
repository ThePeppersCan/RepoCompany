// The three workspaces retain their DOM, drafts, call streams and player iframe.
(() => {
  'use strict';
  const wibs=document.getElementById('repo-messages'),reparty=document.getElementById('repo-reparty');
  if(!wibs||!reparty)return;
  const sidebar=wibs.querySelector('.rc-sidebar'),scroll=sidebar.querySelector('.rc-sidebar-scroll'),bottom=sidebar.querySelector('.rc-sidebar-bottom');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text)n.textContent=text;return n;};
  const button=(label,action,cls='')=>{const n=el('button',cls,label);n.type='button';n.onclick=action;return n;};
  let view='wibs',transitioning=false,activeTransition=null;
  const aiSide=el('div','ws-ai-sidebar');
  const identity=el('div','ws-identity'),sideMascot=el('span','ws-ai-mascot');sideMascot.tabIndex=0;sideMascot.setAttribute('aria-label','Wibsworth');identity.append(sideMascot,el('span','ws-identity-label','Wibsworth'));
  const newChat=button('+  New conversation',()=>{input.value='';saveDraft();input.focus();},'ws-new-chat');
  aiSide.append(identity,newChat,el('p','ws-section-label','CONVERSATIONS'),el('p','ws-empty-history','Your conversations will appear here.'));
  const sidePages=el('div','ws-side-pages');sidebar.insertBefore(sidePages,bottom);sidePages.append(scroll,aiSide);
  const ai=el('section','ws-ai');ai.setAttribute('aria-label','Wibsworth');
  const head=el('header','ws-pane-head');const menu=button('☰',()=>wibs.classList.toggle('rc-nav-open'),'ws-mobile-menu');menu.setAttribute('aria-label','Open sidebar');
  head.append(menu,el('h1','','Wibsworth'),el('span','ws-status','AI not connected yet'));
  const body=el('div','ws-ai-body'),welcome=el('div','ws-welcome'),welcomeMascot=el('span','ws-welcome-mascot');welcomeMascot.tabIndex=0;welcomeMascot.setAttribute('aria-label','Wibsworth');
  welcome.append(welcomeMascot,el('h2','','Let’s Wibs something up.'));
  const form=el('form','ws-compose'),input=el('textarea');input.rows=2;input.maxLength=12000;input.placeholder='Ask Wibsworth…';input.setAttribute('aria-label','Draft a question for Wibsworth');
  const tools=el('div','ws-compose-tools'),send=button('↑',()=>{});send.disabled=true;send.setAttribute('aria-label','Send — AI is not connected yet');send.title='AI is not connected yet';
  tools.append(el('span','','Wibsworth'),send);form.append(input,tools);form.onsubmit=e=>e.preventDefault();
  body.append(welcome,form,el('p','ws-compose-note','AI chat is coming soon. Your draft stays on this device.'));ai.append(head,body);wibs.querySelector('.rc-center').append(ai);
  for(const host of [sideMascot,welcomeMascot])host.wibsworthRig=window.repoWibsworthMascot?.mount(host);
  function draftKey(){return 'repo-wibsworth-draft:'+ (window.repoAccount?.state.user?.id||'signed-out');}
  function saveDraft(){try{localStorage.setItem(draftKey(),input.value);}catch{}}
  function restoreDraft(){try{input.value=localStorage.getItem(draftKey())||'';}catch{input.value='';}}
  input.addEventListener('input',saveDraft);restoreDraft();
  // This is the same account dock, not a copy with stale account/usage values.
  reparty.classList.add('rc-page');
  const rpBody=el('div','repo-reparty-body'),rpSide=el('aside','ws-rp-sidebar');rpSide.setAttribute('aria-label','Reparty rooms');
  const rpScroll=el('div','ws-rp-scroll'),rpIdentity=el('div','ws-identity'),tv=el('span','ws-rp-mascot');tv.tabIndex=0;tv.setAttribute('aria-label','Reparty');tv.dataset.repartyMascot='';window.repoRepartyHover?.mount(tv);
  rpIdentity.append(tv,el('span','ws-identity-label','Reparty'));
  const control=(action,value)=>window.repoRepartyUI?.send(action,value);
  rpScroll.append(rpIdentity,button('+  Create a room',()=>control('create'),'ws-new-chat'),button('↗  Join with a link',()=>control('join-link'),'ws-room-link'));
  const roomsHeading=el('div','ws-rooms-heading');roomsHeading.append(el('span','ws-section-label','YOUR ROOMS'),button('↻',()=>control('rooms-refresh'),'ws-room-refresh'));roomsHeading.lastChild.setAttribute('aria-label','Refresh rooms');
  const roomList=el('nav','ws-room-list');roomList.setAttribute('aria-label','Open rooms');roomList.append(button('Browse rooms',()=>control('rooms')));
  rpScroll.append(roomsHeading,roomList);rpSide.append(rpScroll);rpBody.append(rpSide);reparty.append(rpBody);
  window.repoPaneResize?.mount({host:rpBody,edge:'left',key:'repo-reparty-left-v1',label:'Resize rooms sidebar',initial:()=>innerWidth>=1600?300:innerWidth<=1100?226:260,min:210,max:480,available:()=>rpBody.clientWidth-520,apply:n=>rpBody.style.setProperty('--rp-left',n+'px')});
  function media(){const state=window.repoMedia?.getState();wibs.dataset.callActive=String(!!state?.voice?.active);reparty.dataset.callActive=wibs.dataset.callActive;}
  function syncTheme(){const style=getComputedStyle(document.documentElement),vars={};for(const name of ['bg','surface','raised','ink','muted','accent','line','selected','hover','on-accent'])vars[name]=style.getPropertyValue('--wibs-'+name).trim();reparty.dataset.lightTheme=wibs.dataset.lightTheme||'false';reparty.style.colorScheme=wibs.style.colorScheme;reparty.querySelector('iframe')?.contentWindow?.postMessage({type:'repo-workspace-theme',vars,light:wibs.dataset.lightTheme==='true'},location.origin);}
  function select(nextView){
    const changed=view!==nextView;view=nextView;wibs.dataset.workspaceView=view;reparty.dataset.workspaceView=view;
    const isAI=view==='wibsworth';
    for(const [node,active] of [[scroll,!isAI],[aiSide,isAI],[ai,isAI],[wibs.querySelector('.rc-members'),!isAI],...[...wibs.querySelector('.rc-center').children].filter(n=>n!==ai).map(n=>[n,!isAI])]){node.inert=!active;node.setAttribute('aria-hidden',String(!active));}
    sidebar.setAttribute('aria-label',isAI?'Wibsworth conversations':'Channels and direct messages');
    wibs.querySelector('.repo-section-nav').dataset.section=isAI?'wibsworth':'wibs';
    const target=view==='reparty'?rpSide:sidebar;if(bottom.parentNode!==target)target.append(bottom);
    for(const b of wibs.querySelectorAll('.repo-section-nav [data-nav]')){if(b.dataset.nav===(isAI?'wibsworth':'wibs'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
    if(view==='reparty'){syncTheme();control('rooms-refresh');window.repoCommunity?.refresh();}
    if(changed){window.repoWibsworthMascot?.stop();document.dispatchEvent(new Event('repo-workspace-view'));}
    media();
  }
  function transition(target,action){
    if(transitioning||view===target||!(wibs.open||reparty.open)||(!reparty.open&&target!=='reparty')||reduced.matches||!document.startViewTransition)return false;
    activeTransition?.skipTransition();
    activeTransition=document.startViewTransition(()=>{transitioning=true;try{action();}finally{transitioning=false;}});
    activeTransition.finished.catch(()=>{});return true;
  }
  function openAI(){if(transition('wibsworth',openAI))return;window.repoMessaging.open('',{intro:false,workspace:'wibsworth'});if(!wibs.open)return;select('wibsworth');window.repoRoutes?.enter('wibsworth');window.accountMenu?.close({route:false});input.focus({preventScroll:true});}
  // The dock's original editor lives in Wibs; Reparty uses the existing shared settings dialog.
  bottom.addEventListener('click',event=>{if(view!=='reparty')return;if(event.target.closest('.rc-account-settings')){event.stopImmediatePropagation();window.repoMedia.openSettings();}else if(event.target.closest('.rc-self-profile')){event.stopImmediatePropagation();window.repoReparty.close();window.accountMenu?.open({tab:'profile'});}},true);
  addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==reparty.querySelector('iframe')?.contentWindow)return;
    if(event.data?.type==='repo-reparty-state'){syncTheme();return;}
    if(event.data?.type!=='repo-reparty-rooms'||!Array.isArray(event.data.rooms))return;
    roomList.replaceChildren();const current=window.repoReparty?.getState().roomId;
    for(const r of event.data.rooms.slice(0,60)){if(!/^[a-f0-9]{12}$/.test(r.id)||typeof r.name!=='string')continue;const b=button('',()=>control('join',r.id));b.classList.toggle('is-current',r.id===current);b.append(el('span','','◖  '+r.name.slice(0,80)),el('small','',Number.isSafeInteger(r.people)&&r.people>0?r.people+' listening':'Open room'));roomList.append(b);}
    if(!roomList.children.length)roomList.append(button('Browse rooms',()=>control('rooms')));
  });
  addEventListener('repo-media-state',media);addEventListener('repo-voice-state',media);addEventListener('repo-workspace-theme',syncTheme);
  addEventListener('repo-account-state',()=>{restoreDraft();if(!window.repoAccount?.state.user){roomList.replaceChildren();input.value='';select('wibs');}});
  // Attach the existing TV/C morph to every actual navigation button.
  for(const nav of document.querySelectorAll('.repo-section-nav [data-nav=reparty]')){const host=el('span','ws-nav-tv');nav.replaceChildren(host);window.repoRepartyHover?.mount(host);}
  window.repoWorkspace=Object.freeze({select,syncTheme,transition});window.repoWibsworth=Object.freeze({open:openAI});select('wibs');
})();
