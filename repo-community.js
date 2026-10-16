(() => {
 'use strict';
 const account=window.repoAccount,drawer=document.getElementById('repo-messages');
 if(!account||!drawer||window.repoCommunity)return;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const glyphs={chat:'<path d="M4 5h16v12H8l-4 4V5Z"/><path d="M8 9h8M8 13h5"/>',voice:'<path d="m11 4-6 5H2v6h3l6 5V4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',back:'<path d="M20 5v11H4m5-5-5 5 5 5"/>',edit:'<path d="m15 3 6 6-12 12H3v-6L15 3Zm-3 3 6 6"/>',search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M3 22v-3a9 9 0 0 1 18 0v3H3Z"/>',send:'<path d="m3 3 19 9-19 9 4-9-4-9Zm4 9h15"/>',menu:'<path d="M3 5h18M3 12h18M3 19h18"/>'};
 function icon(name){const n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.setAttribute('viewBox','0 0 24 24');n.setAttribute('aria-hidden','true');n.innerHTML=glyphs[name]||glyphs.chat;return n;}
 glyphs.settings='<path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-.5 2 2.5h3l1-3 3-1 2-3-2-2 1-3-2-3-3 .5L12 3H9Z"/><circle cx="11.5" cy="11.5" r="3"/>';
 glyphs.mic='<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>';
 glyphs.sound='<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v9H5a2 2 0 0 1-2-2v-7Zm18 0h-4v9h2a2 2 0 0 0 2-2v-7Z"/>';
 function btn(label,fn,cls='',glyph){const b=el('button',cls);b.type='button';if(glyph)b.append(icon(glyph));b.append(el('span','',label));b.onclick=fn;return b;}
 function portrait(name,profile){const n=el('span','rc-avatar',String(name||'?').slice(0,2).toUpperCase());if(profile?.avatar&&window.repoAvatar){n.insertAdjacentHTML('beforeend',window.repoAvatar.markup(profile.avatar,name));window.repoAvatar.hydrate(n);}if(profile?.frame_id&&window.repoFrames){n.insertAdjacentHTML('beforeend',window.repoFrames.markup(profile.frame_id));window.repoFrames.hydrate(n);}return n;}
 let user=account.state.user?.id||null,epoch=0,channel='general',mode='community',data=null,rows=[],hasMore=false,searchTerm='',loading=false,sending=false,polling=false,lastState=0,signature='',editURL='';
 let channelEpoch=0,editorRevision=0,draftKeys=new Map(),drafts=new Map();const gifKeys=new Map(),latestMessages=new Map();const controllers=new Set();let messageRevision=null,lastPoll=0,portalVisible=document.documentElement.dataset.repoPortalVisible!=='false';
 const defaultTheme={background:'#0c1913',accent:'#b5d39c'},themeKey=()=>user?'repo-wibs-theme:'+user:null;
 const validHex=v=>typeof v==='string'&&/^#[a-f0-9]{6}$/i.test(v);
 const cleanTheme=t=>t&&validHex(t.background)&&validHex(t.accent)?{background:t.background,accent:t.accent}:{...defaultTheme};
 function cachedTheme(){try{return cleanTheme(JSON.parse(localStorage.getItem(themeKey())));}catch{return {...defaultTheme};}}
 let savedTheme=cachedTheme(),themePreview=null;
 const luminance=hex=>{const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
 function paintTheme(value){
  const t=cleanTheme(value),light=luminance(t.background)>.179,ink=light?'#18201f':'#f1f1ed',muted=light?'#475450':'#b3beb9';
  const vars={bg:t.background,accent:t.accent,ink,muted,developer:light?'#806300':'#f0de55','on-accent':luminance(t.accent)>.179?'#162019':'#ffffff',surface:`color-mix(in srgb,${t.background} 93%,${ink})`,raised:`color-mix(in srgb,${t.background} 87%,${ink})`,line:`color-mix(in srgb,${ink} 15%,transparent)`,selected:`color-mix(in srgb,${t.accent} 20%,${t.background})`,hover:`color-mix(in srgb,${t.accent} 9%,transparent)`};
  for(const [key,v] of Object.entries(vars))document.documentElement.style.setProperty('--wibs-'+key,v);
  drawer.style.colorScheme=light?'light':'dark';drawer.dataset.lightTheme=String(light);
 }
 function acceptTheme(value){savedTheme=cleanTheme(value);try{if(themeKey())localStorage.setItem(themeKey(),JSON.stringify(savedTheme));}catch{}if(!themePreview)paintTheme(savedTheme);}
 function coloredName(node,color){if(validHex(color)){node.style.setProperty('--name-color',color);node.classList.add('has-name-color');}return node;}
 const voiceName=()=>data?.voiceName||'RE-COMP';
 async function api(route,body,blob=false){
  const revision=epoch,id=user;if(!id)throw Error('Sign in to join the community.');
  const {data:{session}}=await account.db.auth.getSession();if(revision!==epoch||session?.user?.id!==id)throw Object.assign(Error('Account changed.'),{stale:true});
  const controller=new AbortController();controllers.add(controller);const timeout=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch('/api/community/'+route,{method:body===undefined?'GET':'POST',cache:'no-store',signal:controller.signal,headers:{Authorization:'Bearer '+session.access_token,...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
   const result=response.ok&&blob?await response.blob():await response.json();if(revision!==epoch||id!==user)throw Object.assign(Error('Account changed.'),{stale:true});if(!response.ok)throw Error(result.error||'Community is temporarily unavailable.');return result;
  }finally{clearTimeout(timeout);controllers.delete(controller);}
 }
 function error(e,target=status){if(!e.stale)target.textContent=e.name==='AbortError'?'Connection timed out. Try again.':e.message;}
 const dmAside=drawer.querySelector('.repo-message-sidebar'),dmConversation=drawer.querySelector('.repo-message-conversation'),oldHead=drawer.querySelector('.repo-messages-head');
 const voicePanel=drawer.querySelector('.repo-voice-panel'),voiceForm=drawer.querySelector('.repo-voice-form');
 paintTheme(savedTheme);drawer.classList.add('rc-page');drawer.setAttribute('aria-label','RE-COMP community');drawer.removeAttribute('aria-labelledby');
 const top=el('header','rc-topbar'),brand=btn('Repo Company',()=>window.repoMessaging.close(),'rc-brand');brand.replaceChildren(el('span','publisher-mark'),el('span','publisher-wordmark'));brand.setAttribute('aria-label','Back to Repo Company');
 const nav=el('nav','rc-topnav');nav.setAttribute('aria-label','Repo Company');
 const collection=el('a','rc-top-link');collection.href='/download/windows';collection.setAttribute('aria-label','Download');collection.title='Download';const downloadIcon=icon('back');downloadIcon.innerHTML='<path d="M12 2v13m-5-5 5 5 5-5M3 15v6h18v-6"/>';collection.append(downloadIcon);
 const current=btn('',()=>show('community'),'rc-top-link is-current rc-community-tab');const wibs=el('span','repo-wibs-icon');wibs.setAttribute('aria-hidden','true');current.prepend(wibs);current.setAttribute('aria-label','Community');current.title='Wibs · Community';
 const accountButton=btn('',()=>{window.repoMessaging.close();window.accountMenu?.open({tab:'profile'});},'rc-top-link','user');accountButton.setAttribute('aria-label','Account');accountButton.title='Account';
 nav.append(collection,current,accountButton);top.append(brand,nav);
 const layout=el('div','rc-layout'),sidebar=el('aside','rc-sidebar'),workspace=el('main','rc-workspace');
 sidebar.setAttribute('aria-label','Channels and direct messages');
 const identity=el('div','rc-community-identity'),mascot=el('span','repo-wibs-icon rc-wibs-brand');mascot.setAttribute('aria-hidden','true');identity.tabIndex=0;identity.setAttribute('aria-label','Wibs');identity.append(mascot);sidebar.append(identity);window.repoWibsIntro?.attachHover(mascot,identity,drawer);
 const channelHeading=el('div','rc-section-heading');channelHeading.append(el('span','','TEXT CHANNELS'));
 const addChannel=btn('+',()=>editChannel(),'rc-small');addChannel.title='Create text channel';addChannel.setAttribute('aria-label','Create text channel');addChannel.hidden=true;channelHeading.append(addChannel);
 const channelList=el('nav','rc-channel-list');channelList.setAttribute('aria-label','Text channels');sidebar.append(channelHeading,channelList);
 const dmToggle=btn('Direct messages',()=>show('dm'),'rc-dm-toggle','chat'),dmWrap=el('div','rc-dm-wrap');dmWrap.append(dmAside);dmWrap.hidden=true;sidebar.append(dmToggle,dmWrap);
 const voiceSection=el('section','rc-voice');voiceSection.setAttribute('aria-label','RE-COMP voice channel');
 const voiceHeading=btn('RE-COMP',()=>window.repoVoice?.joinCommunity(),'rc-voice-heading','voice');voiceHeading.setAttribute('aria-label','Join RE-COMP voice');
 const voiceMembers=el('div','rc-voice-members'),voiceNotice=el('p','rc-voice-note');
 const voiceHeadingRow=el('div','rc-voice-heading-row'),voiceSettings=btn('Voice settings',()=>window.repoVoice?.openSettings(),'rc-voice-settings');voiceSettings.setAttribute('aria-label','Voice settings');voiceSettings.title='Voice settings';voiceSettings.replaceChildren(icon('settings'));const voiceRename=btn('Rename voice channel',editVoiceName,'rc-edit-channel rc-edit-voice','edit');voiceRename.setAttribute('aria-label','Rename voice channel');voiceRename.title='Rename voice channel';voiceRename.hidden=true;voiceHeadingRow.append(voiceHeading,voiceRename,voiceSettings);
 voiceSection.append(voiceHeadingRow,voiceMembers,voiceNotice);sidebar.append(voiceSection);
 const bottom=el('div','rc-sidebar-bottom'),back=btn('Back to collection',()=>window.repoMessaging.close(),'rc-back','back'),self=el('div','rc-self'),dock=el('div','rc-account-dock'),selfActivity=el('div','rc-own-activity');selfActivity.hidden=true;dock.append(selfActivity);if(voicePanel)dock.append(voicePanel);dock.append(self);bottom.append(dock,back);sidebar.append(bottom);
 const sidebarScroll=el('div','rc-sidebar-scroll');for(const node of [...sidebar.children])if(node!==bottom)sidebarScroll.append(node);sidebar.prepend(sidebarScroll);
 const below=el('div','rc-below'),center=el('div','rc-center'),members=el('aside','rc-members');members.setAttribute('aria-label','Community members');
 const channelView=el('section','rc-channel-view'),channelHead=el('header','rc-channel-head');
 const menu=btn('Channels',()=>drawer.classList.toggle('rc-nav-open'),'rc-mobile-menu','menu');
 const channelName=el('h2','','general'),rename=btn('Edit channel',()=>editChannel(data?.channels.find(c=>c.id===channel)),'rc-edit-channel','edit');rename.setAttribute('aria-label','Edit channel');rename.title='Edit channel';rename.hidden=true;
 const searchForm=el('form','rc-search'),searchInput=el('input');searchInput.type='search';searchInput.placeholder='Search';searchInput.maxLength=100;searchInput.setAttribute('aria-label','Search this channel');searchForm.append(icon('search'),searchInput);
 searchForm.onsubmit=e=>{e.preventDefault();searchTerm=searchInput.value.trim();channelEpoch++;messageRevision=null;rows=[];signature='';loadMessages();};searchInput.oninput=()=>{if(!searchInput.value&&searchTerm){searchTerm='';channelEpoch++;messageRevision=null;rows=[];signature='';loadMessages();}};
 const memberToggle=btn('Members',()=>drawer.classList.toggle('rc-members-open'),'rc-member-toggle','user');memberToggle.setAttribute('aria-label','Show or hide members');
 channelHead.append(menu,el('span','rc-hash','#'),channelName,rename,searchForm,memberToggle);
 const log=el('div','rc-log');log.setAttribute('role','log');log.setAttribute('aria-label','Community messages');log.setAttribute('aria-live','polite');log.tabIndex=0;
 const status=el('p','rc-status');status.setAttribute('role','status');
 const composer=el('form','rc-composer'),input=el('textarea');input.rows=1;input.maxLength=4000;input.placeholder='Message #general';input.setAttribute('aria-label','Community message');
 const send=btn('Send',null,'rc-send','send');send.type='submit';const gifButton=btn('GIF',()=>gifPicker.choose(gifButton),'repo-gif-button');gifButton.replaceChildren(window.repoChatExtras.emote('wibs-wave'));gifButton.setAttribute('aria-label','Emotes and GIFs');gifButton.title='Emotes and GIFs';gifButton.setAttribute('aria-haspopup','dialog');composer.append(input,gifButton,send);
 const imageDraft=window.repoChatImages?.mount({form:composer,input,send,feedback:status,context:()=>({user,scope:'community',target:channel}),onChange:()=>draftKeys.delete(channel)});
 input.oninput=()=>{drafts.set(channel,input.value);draftKeys.delete(channel);input.style.height='auto';input.style.height=Math.min(120,input.scrollHeight)+'px';};
 input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();composer.requestSubmit();}};
 composer.onsubmit=e=>{e.preventDefault();sendMessage(input.value.trim());};
 async function sendMessage(text,keepDraft=false){const selected=channel,re=channelEpoch,auth=epoch;if((!text&&!(imageDraft?.has()&&!keepDraft))||sending)return;const keys=keepDraft?gifKeys:draftKeys,key=keepDraft?selected+':'+text:selected,clientId=keys.get(key)||crypto.randomUUID();keys.set(key,clientId);sending=true;send.disabled=input.disabled=gifButton.disabled=true;status.textContent='';try{const content=keepDraft?text:await imageDraft?.prepare(text,clientId)||text;await api('messages',{channel:selected,text:content,clientId});keys.delete(key);if(!keepDraft)drafts.delete(selected);if(re===channelEpoch){if(!keepDraft){imageDraft?.clear();input.value='';input.style.height='';}await loadMessages();log.scrollTop=log.scrollHeight;}}catch(e){error(e);if(keepDraft&&!e.stale)status.textContent+=' Choose the GIF again to retry.';}finally{if(auth===epoch){sending=false;send.disabled=input.disabled=gifButton.disabled=false;}}}
 channelView.append(channelHead,log,status,imageDraft?.preview||document.createTextNode(''),composer);center.append(channelView,dmConversation);below.append(center,members);workspace.append(below);layout.append(sidebar,workspace);
 dmConversation.querySelector('.repo-conversation-head').prepend(btn('Channels',()=>drawer.classList.toggle('rc-nav-open'),'rc-mobile-menu','menu'));const atmosphere=el('div','rc-atmosphere');atmosphere.setAttribute('aria-hidden','true');for(let i=0;i<38;i++){const mote=el('i');mote.style.setProperty('--x',((i*47.31)%100)+'%');mote.style.setProperty('--y',((i*29.73)%100)+'%');mote.style.setProperty('--delay',(-i*1.7)+'s');atmosphere.append(mote);}drawer.replaceChildren(atmosphere,top,layout,oldHead);if(voiceForm)drawer.append(voiceForm);
 const reactionPicker=window.repoChatExtras.createPicker(drawer,(m,value)=>react(m,value)),gifPicker=window.repoChatExtras.createGifPicker(drawer,text=>sendMessage(text,true),id=>window.repoChatExtras.insertEmote(input,id));
 const editor=el('dialog','rc-editor');editor.setAttribute('aria-label','Community settings');drawer.append(editor);
 editor.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();closeEditor();});
 function closeEditor(){themePreview=null;paintTheme(savedTheme);editorRevision++;editor.close();editor.replaceChildren();if(editURL){URL.revokeObjectURL(editURL);editURL='';}}
 function openAccount(tab,player=''){closeCard();closeEditor();window.repoMessaging.close();window.accountMenu?.open({tab,player});}
 function openFullProfile(username){openAccount('profile',username);}
 function mySettings(){
  const {form}=editorBase('Your settings');
  const choice=(label,description,action,glyph)=>{const b=btn(label,action,'rc-settings-choice',glyph);b.append(el('small','',description));return b;};
  form.append(choice('Voice & audio','Microphone, speakers, sensitivity, volume and noise suppression',()=>{closeEditor();window.repoVoice?.openSettings();},'voice'),choice('Profile & appearance','Your name, profile colours, Wibs theme, banner and avatar',()=>myProfile(),'user'));
  if(data?.developer)form.append(choice('Community management','Developer access and voice restrictions',manageCommunity,'settings'));
  const row=el('div','rc-editor-actions');row.append(btn('Done',closeEditor));form.append(row);
 }
 async function myProfile(){
  const revision=++editorRevision,auth=epoch;
  try{const profile=await api('profile');if(revision!==editorRevision||auth!==epoch)return;
   if(profile.settings.bannerVersion){const blob=await api('profile-banner',undefined,true);if(revision!==editorRevision||auth!==epoch)return;editURL=URL.createObjectURL(blob);profile.bannerURL=editURL;}
   editSettings(profile);
  }catch(e){error(e);}
 }
 const gameNames={moratales:'MoraTales',morogue:'Morogue',manager:'Velmora Manager',dragonbound:'Dragonbound',diver:'Repo Diver',goblin:'Goblin',rooftops:'Repo Rooftops',seas:'Repo Seas',sports:'Repo Sports'};
 function gameIcon(game){return ['moratales','morogue','manager'].includes(game)?'/account-assets/game-icons/'+game+'.png':'/account-assets/'+game+'-activity-banner-v1.webp';}
 function profileColors(node,colors={}){
  const valid=(v,f)=>/^#[0-9a-f]{6}$/i.test(v)?v:f,background=valid(colors.background,'#14231b'),accent=valid(colors.accent,'#b5d39c');
  const rgb=background.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4),light=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179;
  node.style.setProperty('--profile-bg',background);node.style.setProperty('--profile-accent',accent);node.style.setProperty('--profile-ink',light?'#182019':'#f1f4ed');node.style.setProperty('--profile-muted',light?'#394039':'#c3cbbf');
 }
 function activityView(activity,compact=false){
  if(!activity||!gameNames[activity.game]||activity.expiresAt<=Date.now())return null;
  const box=el(compact?'span':'div',compact?'rc-game-inline':'rc-game-activity');box.dataset.activityExpires=activity.expiresAt;
  const image=el('img','rc-game-icon');image.alt='';image.src=gameIcon(activity.game);image.onerror=()=>{image.onerror=null;image.src='/favicon.png';};
  const copy=el('span','rc-game-copy');if(!compact)copy.append(el('small','','Playing'));
  copy.append(el('span','rc-game-name',(compact?'Playing ':'')+gameNames[activity.game]));
  if(!compact&&Number.isFinite(activity.startedAt)&&activity.startedAt<=Date.now()){const time=el('span','rc-game-time');time.dataset.activityStarted=activity.startedAt;copy.append(time);}
  box.append(image,copy);box.title='Playing '+gameNames[activity.game];return box;
 }
 function paintActivityClocks(){for(const n of drawer.querySelectorAll('[data-activity-expires]')){if(Number(n.dataset.activityExpires)<=Date.now()){n.remove();continue;}for(const t of n.querySelectorAll('[data-activity-started]')){const seconds=Math.max(0,Math.floor((Date.now()-Number(t.dataset.activityStarted))/1000));t.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+' elapsed';}}selfActivity.hidden=!selfActivity.childElementCount;}
 const card=el('div','rc-profile-popover');card.popover='auto';card.setAttribute('role','dialog');card.setAttribute('aria-label','Player profile');drawer.append(card);
 let cardRevision=0,cardURL='',cardPoint={x:0,y:0};
 function clearCard(){cardRevision++;card.replaceChildren();card.removeAttribute('style');if(cardURL){URL.revokeObjectURL(cardURL);cardURL='';}}
 function closeCard(){if(card.matches(':popover-open'))card.hidePopover();else clearCard();}
 card.addEventListener('beforetoggle',e=>{if(e.newState==='closed')clearCard();});
 function placeCard(){if(!card.matches(':popover-open'))return;const box=card.getBoundingClientRect(),gap=12;let x=cardPoint.x+gap,y=cardPoint.y+gap;if(x+box.width>innerWidth-8)x=cardPoint.x-box.width-gap;if(y+box.height>innerHeight-8)y=cardPoint.y-box.height-gap;card.style.left=Math.max(8,Math.min(x,innerWidth-box.width-8))+'px';card.style.top=Math.max(8,Math.min(y,innerHeight-box.height-8))+'px';}
 new ResizeObserver(placeCard).observe(card);addEventListener('resize',placeCard);drawer.addEventListener('close',closeCard);
 async function profileCard(username,event){
  closeCard();const rect=event?.currentTarget?.getBoundingClientRect();cardPoint=event?.detail?{x:event.clientX,y:event.clientY}:{x:rect?.left||20,y:rect?.bottom||80};
  const revision=++cardRevision,valid=()=>revision===cardRevision&&card.matches(':popover-open');
  const feedback=el('p','rc-card-status','Loading profile…');feedback.setAttribute('role','status');card.append(feedback);card.showPopover();placeCard();
  try{const profile=await api('profile?username='+encodeURIComponent(username));if(!valid())return;card.replaceChildren();profileColors(card,profile.colors);const cover=el('div','rc-profile-banner'),content=el('div','rc-card-content');card.append(cover,content);
   const dismiss=btn('×',closeCard,'rc-card-close');dismiss.setAttribute('aria-label','Close profile card');card.append(dismiss);
   const avatar=portrait(profile.display||profile.username,profile);avatar.classList.add('rc-profile-avatar');const nameRow=el('div','rc-profile-name-row');nameRow.append(coloredName(btn(profile.display||profile.username,()=>openFullProfile(profile.username),'rc-profile-name'),profile.nameColor));if(profile.own){const edit=btn('',()=>{closeCard();myProfile();},'rc-profile-edit','edit');edit.setAttribute('aria-label','Edit Wibs profile');edit.title='Edit Wibs profile';nameRow.append(edit);}content.append(avatar,nameRow,el('p','rc-profile-handle','@'+profile.username));
   if(profile.role)content.append(el('span','rc-role',profile.role));if(profile.locked||profile.bio)content.append(el('p','rc-profile-bio',profile.locked?'This player shares their profile with accepted friends only.':profile.bio));
   if(!profile.locked){const score=el('div','rc-profile-score');score.append(el('strong','',Number(profile.repoScore||0).toLocaleString()),el('span','','RepoScore'));content.append(score);}
   const activity=activityView(profile.activity);if(activity)content.append(activity);paintActivityClocks();
   const controls=el('div','rc-profile-actions');if(!profile.own&&profile.friend)controls.append(btn('Message',()=>{closeCard();window.repoMessaging.open(profile.username);}));if(controls.children.length)content.append(controls);
   placeCard();if(!event?.detail)content.querySelector('.rc-profile-name').focus({preventScroll:true});
   if(profile.settings?.bannerVersion){const blob=await api('profile-banner?username='+encodeURIComponent(username),undefined,true);if(!valid())return;cardURL=URL.createObjectURL(blob);const image=el('img');image.alt='';image.src=cardURL;image.style.objectPosition=`${profile.settings.x}% ${profile.settings.y}%`;image.style.transform=`scale(${profile.settings.zoom/100})`;image.style.transformOrigin=image.style.objectPosition;cover.append(image);}
  }catch(e){if(valid()){card.replaceChildren(feedback);error(e,feedback);placeCard();}}
 }
 const personMenu=el('div','rc-person-menu');personMenu.popover='auto';personMenu.setAttribute('role','menu');personMenu.setAttribute('aria-label','Player actions');drawer.append(personMenu);
 let menuPoint={x:0,y:0};
 function closePersonMenu(){if(personMenu.matches(':popover-open'))personMenu.hidePopover();}
 function placePersonMenu(){if(!personMenu.matches(':popover-open'))return;const box=personMenu.getBoundingClientRect();personMenu.style.left=Math.max(8,Math.min(menuPoint.x,innerWidth-box.width-8))+'px';personMenu.style.top=Math.max(8,Math.min(menuPoint.y,innerHeight-box.height-8))+'px';}
 new ResizeObserver(placePersonMenu).observe(personMenu);addEventListener('resize',closePersonMenu);drawer.addEventListener('close',closePersonMenu);drawer.addEventListener('scroll',closePersonMenu,true);addEventListener('repo-account-state',closePersonMenu);
 personMenu.addEventListener('keydown',e=>{const items=[...personMenu.querySelectorAll('button:not(:disabled)')],at=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:items.length-1))%items.length]?.focus();}});
 function personActions(username,event){
  closeCard();closePersonMenu();const rect=event.target.closest('[data-voice-name],[data-community-sender]')?.getBoundingClientRect();menuPoint=event.type==='contextmenu'&&event.clientX?{x:event.clientX,y:event.clientY}:{x:rect?.right||20,y:rect?.top||80};
  const label=data?.members.find(m=>m.username===username)?.display_name||username,s=window.repoVoice?.getState(),restriction=s?.community?.restrictions?.find(m=>m.name===username)||s?.community?.members?.find(m=>m.name===username)||{};
  const action=(title,fn,checked)=>{const b=btn(title,fn);b.setAttribute('aria-label',title);b.setAttribute('role',checked===undefined?'menuitem':'menuitemcheckbox');if(checked!==undefined)b.setAttribute('aria-checked',String(checked));personMenu.append(b);return b;};
  const run=async(kind,options={})=>{for(const b of personMenu.querySelectorAll('button'))b.disabled=true;try{await window.repoVoice.moderate(username,kind,options);closePersonMenu();}catch(e){const note=el('p','rc-menu-error');note.setAttribute('role','status');error(e,note);personMenu.append(note);for(const b of personMenu.querySelectorAll('button'))b.disabled=false;placePersonMenu();}};
  personMenu.replaceChildren(el('strong','rc-menu-name',label));
  action('View profile',()=>{closePersonMenu();profileCard(username,event);});
  if(account.state.social?.friends?.some(f=>f.username===username&&f.status==='accepted'))action('Message',()=>{closePersonMenu();window.repoMessaging.open(username);});
  if(data?.developer&&username!==data.username&&s?.enabled){
   personMenu.append(el('hr'));action('Server mute',()=>run('mute',{enabled:!restriction.serverMuted}),!!restriction.serverMuted);action('Server deafen',()=>run('deafen',{enabled:!restriction.serverDeafened}),!!restriction.serverDeafened);
   if(s.community.members.some(m=>m.name===username))action('Disconnect from voice',()=>run('disconnect')).classList.add('is-danger');
   if(restriction.bannedUntil>Date.now()){const expiry=el('p','rc-menu-note','Voice banned until '+new Date(restriction.bannedUntil).toLocaleString());personMenu.append(expiry);action('Remove voice ban',()=>run('unban'));}
   else action('Temporarily ban from voice…',()=>{personMenu.replaceChildren(el('strong','rc-menu-name','Voice ban · '+label));for(const [seconds,text]of [[300,'5 minutes'],[3600,'1 hour'],[86400,'24 hours']])action(text,()=>run('ban',{seconds})).classList.add('is-danger');action('Back',()=>personActions(username,event));placePersonMenu();personMenu.querySelector('button')?.focus();}).classList.add('is-danger');
  }
  personMenu.showPopover();placePersonMenu();personMenu.querySelector('button')?.focus({preventScroll:true});
 }
 const personSelector='.rc-voice-person[data-voice-name],.rc-member[data-voice-name],[data-community-sender]';
 drawer.addEventListener('contextmenu',e=>{const n=e.target.closest(personSelector);if(!n)return;e.preventDefault();personActions(n.dataset.voiceName||n.dataset.communitySender,e);});
 drawer.addEventListener('keydown',e=>{if(e.key!=='ContextMenu'&&!(e.shiftKey&&e.key==='F10'))return;const n=e.target.closest(personSelector);if(!n)return;e.preventDefault();personActions(n.dataset.voiceName||n.dataset.communitySender,e);});
 function show(next){gifPicker.clear();mode=next;drawer.dataset.communityView=mode;channelView.hidden=mode!=='community';dmConversation.hidden=mode!=='dm';dmWrap.hidden=mode!=='dm';dmToggle.classList.toggle('is-selected',mode==='dm');drawer.classList.remove('rc-nav-open','rc-members-open');if(mode==='community'){paintChannels();poll(true);}else dmAside.querySelector('input')?.focus();}
 function selectChannel(id){reactionPicker.clear();gifPicker.clear();if(channel!==id){imageDraft?.clear();drafts.set(channel,input.value);channel=id;channelEpoch++;messageRevision=null;loading=false;rows=[];signature='';input.value=drafts.get(channel)||'';searchTerm='';searchInput.value='';paintMessages();}show('community');paintChannels();loadMessages();}
 function paintChannels(){
  if(!data)return;channelList.replaceChildren();for(const c of data.channels){const b=btn(c.name,()=>selectChannel(c.id),'rc-channel');b.prepend(el('span','rc-hash','#'));b.setAttribute('aria-current',String(c.id===channel&&mode==='community'));channelList.append(b);}
  const c=data.channels.find(c=>c.id===channel);channelName.textContent=c?.name||'general';input.placeholder='Message #'+(c?.name||'general');rename.hidden=!data.developer;addChannel.hidden=!data.developer;addChannel.disabled=data.channels.length>=20;
 }
 function paintMembers(){
  members.replaceChildren();for(const role of ['Developer','Member']){const group=data.members.filter(m=>(m.role||'Member')===role);if(!group.length)continue;members.append(el('h3','rc-members-heading',`${role==='Developer'?'DEVELOPER':'MEMBERS'} — ${group.length}`));for(const m of group){const row=btn('',event=>profileCard(m.username,event),'rc-member'),avatar=portrait(m.display_name,m);row.replaceChildren();row.setAttribute('aria-label','View '+m.display_name+' profile card');row.dataset.voiceName=m.username;avatar.classList.toggle('is-online',!!m.online);const copy=el('span','rc-member-copy');copy.append(coloredName(el('span','rc-member-name',m.display_name),m.name_color));const activity=activityView(m.activity,true);if(activity)copy.append(activity);row.append(avatar,copy);if(m.role)row.append(el('span','rc-role',m.role));members.append(row);}}
  if(!data.members.length)members.append(el('p','','Members appear here when they visit.'));
  const settings=btn('',mySettings,'rc-account-settings','settings');settings.setAttribute('aria-label','Your settings');settings.title='Voice & profile settings';
  const me=data.members.find(m=>m.username===data.username),identity=btn('',event=>profileCard(data.username,event),'rc-self-profile'),copy=el('span','rc-self-copy');identity.setAttribute('aria-label','Your profile');identity.replaceChildren(portrait(me?.display_name||data.username,me||account.state.social?.profile));copy.append(coloredName(el('span','rc-self-name',me?.display_name||data.username),me?.name_color),el('span','rc-self-role',data.developer?'Developer':'Member'));identity.append(copy);
  const controls=el('div','rc-self-controls');controls.append(btn('',()=>window.repoVoice?.toggleMute(),'rc-self-mic','mic'),btn('',()=>window.repoVoice?.toggleDeafen(),'rc-self-sound','sound'),settings);
  self.dataset.voiceName=data.username;self.replaceChildren(identity,controls);selfActivity.replaceChildren();const activity=activityView(me?.activity);if(activity)selfActivity.append(activity);paintActivityClocks();paintAccountControls();paintSpeaking();
 }
 function fitBanner(node,img,s){node.style.setProperty('--rc-banner-height',s.height+'px');node.style.setProperty('--rc-banner-ratio',`1300 / ${s.height}`);img.style.objectPosition=`${s.x}% ${s.y}%`;img.style.transform=`scale(${s.zoom/100})`;img.style.transformOrigin=`${s.x}% ${s.y}%`;}
 async function loadState(){const result=await api('state');data=result;acceptTheme(data.appearance);voiceHeading.querySelector('span').textContent=voiceName();voiceHeading.setAttribute('aria-label','Join '+voiceName()+' voice');voiceSection.setAttribute('aria-label',voiceName()+' voice channel');voiceRename.hidden=!data.developer;paintVoice();dispatchEvent(new Event('repo-community-voice-name'));if(!data.channels.some(c=>c.id===channel))channel=data.channels[0]?.id||'general';paintChannels();paintMembers();rows=rows.map(m=>{const person=data.members.find(p=>p.username===m.sender);return person?{...m,display:person.display_name||m.sender,nameColor:person.name_color,role:person.role}:m;});paintMessages();}
 async function loadMessages(older=false){
  if(loading||!user||mode!=='community')return;loading=true;const selected=channel,re=channelEpoch,auth=epoch;
  try{const result=await api('messages?channel='+encodeURIComponent(selected)+(older&&rows.length?'&before='+rows[0].id:'')+(searchTerm?'&search='+encodeURIComponent(searchTerm):'')+(!older&&messageRevision!==null?'&revision='+encodeURIComponent(messageRevision):''));if(re!==channelEpoch)return;if(result.unchanged)return;if(!older)messageRevision=result.revision??null;
   if(!older&&!searchTerm){const previous=latestMessages.get(selected),last=Math.max(0,...result.messages.map(m=>m.id));if(previous!==undefined&&result.messages.some(m=>m.id>previous&&!m.mine))window.repoMessaging?.messageSound();latestMessages.set(selected,Math.max(previous||0,last));}
   if(older){rows=[...result.messages,...rows.filter(m=>!result.messages.some(n=>m.id===n.id))];hasMore=result.hasMore;}else{const first=result.messages[0]?.id||0;rows=[...rows.filter(m=>m.id<first),...result.messages];if(rows.length<=50)hasMore=result.hasMore;}
   if(rows.length>500){rows=rows.slice(-500);hasMore=true;}paintMessages(older);status.textContent='';
  }catch(e){if(re===channelEpoch)error(e);}finally{if(auth===epoch&&re===channelEpoch)loading=false;}
 }
 function paintMessages(older=false){
  const next=JSON.stringify([rows,hasMore,searchTerm,data?.developer,data?.members.map(m=>[m.username,m.avatar,m.frame_id])]);if(next===signature)return;signature=next;
  const near=log.scrollHeight-log.scrollTop-log.clientHeight<100,oldHeight=log.scrollHeight,oldTop=log.scrollTop;log.replaceChildren();
  if(hasMore){const more=btn('Earlier messages',()=>loadMessages(true),'rc-older');log.append(more);}
  if(!rows.length){const empty=el('div','rc-empty');empty.append(el('span','rc-empty-hash','#'),el('h3','',searchTerm?'No matching messages.':'Welcome to #'+(data?.channels.find(c=>c.id===channel)?.name||'general')),el('p','',searchTerm?'Try another word or clear your search.':'This is the beginning of the conversation. Make yourself at home.'));log.append(empty);}
  let day='',previous=null,previousArticle=null;for(const m of rows){const d=new Date(m.createdAt),label=d.toLocaleDateString([],{day:'numeric',month:'long',year:'numeric'}),grouped=!searchTerm&&previous?.sender===m.sender&&label===day&&m.createdAt>=previous.createdAt&&m.createdAt-previous.createdAt<300000;if(label!==day){if(d.toDateString()!==new Date().toDateString())log.append(el('div','rc-day',label));day=label;}
   const article=el('article','rc-message'+(grouped?' is-continuation':''));article.dataset.communityMessageId=m.id;article.dataset.communitySender=m.sender;article.setAttribute('aria-label',m.display+', '+d.toLocaleString());
   if(grouped){previousArticle.classList.add('has-continuation');const stamp=el('time','rc-group-time',d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));stamp.dateTime=d.toISOString();stamp.title=d.toLocaleString();article.append(stamp);}else article.append(portrait(m.display,data?.members.find(p=>p.username===m.sender)));
   const content=el('div','rc-message-content');if(!grouped){const meta=el('header','rc-message-meta');meta.append(coloredName(btn(m.display,event=>profileCard(m.sender,event),'rc-author'+(m.role?' is-developer':'')),m.nameColor));if(m.role)meta.append(el('span','rc-role',m.role));const time=el('time','',(d.toDateString()===new Date().toDateString()?'Today at ':'')+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));time.dateTime=d.toISOString();time.title=d.toLocaleString();meta.append(time);content.append(meta);}const textNode=el('p','rc-message-text');window.repoChatExtras.renderText(textNode,m.text,'community:'+m.id);content.append(textNode);
   const reactions=el('div','rc-reactions');for(const r of m.reactions||[]){const b=btn('',()=>react(m,r.mine?null:r.emoji),'rc-reaction');b.replaceChildren(window.repoChatExtras.emote(r.emoji),el('span','',String(r.count)));b.setAttribute('aria-label',window.repoChatExtras.label(r.emoji)+' · '+r.count);b.title=window.repoChatExtras.label(r.emoji);b.setAttribute('aria-pressed',String(!!r.mine));reactions.append(b);}content.append(reactions);
   const actions=el('div','rc-message-actions'),add=btn('',()=>reactionPicker.choose(m,add),'rc-reaction-add');add.replaceChildren(window.repoChatExtras.emote('wibs-wave'));add.title='Add Wibs reaction';add.setAttribute('aria-label','Add Wibs reaction');add.setAttribute('aria-haspopup','dialog');actions.append(add);
   if(m.mine||data?.developer)actions.append(btn('Delete',async()=>{try{await api('delete',{id:m.id});rows=rows.filter(r=>r.id!==m.id);signature='';paintMessages();}catch(e){error(e);}},'rc-delete'));
   article.append(content,actions);log.append(article);previous=m;previousArticle=article;
  }
  if(older)log.scrollTop=oldTop+log.scrollHeight-oldHeight;else if(near)log.scrollTop=log.scrollHeight;else log.scrollTop=oldTop;
 }
 async function react(m,emoji){try{await api('reaction',{id:m.id,emoji});await loadMessages();}catch(e){error(e);}}
 function paintSpeaking(){const speaking=window.repoVoice?.getState().speaking||[];for(const row of drawer.querySelectorAll('.rc-member[data-voice-name],.rc-voice-person[data-voice-name],.rc-self[data-voice-name]')){const active=speaking.includes(row.dataset.voiceName);row.classList.toggle('is-speaking',active);const avatar=row.querySelector('.rc-avatar');if(avatar)avatar.title=active?'Speaking':'';}}
 function paintAccountControls(){const s=window.repoVoice?.getState();if(!s)return;for(const [selector,label,pressed,enabled]of [['.rc-self-mic',s.serverMuted||s.serverDeafened?'Server muted':s.muted?'Unmute':'Mute',s.muted,s.canMute],['.rc-self-sound',s.serverDeafened?'Server deafened':s.deafened?'Undeafen':'Deafen',s.deafened,s.canDeafen]]){const b=self.querySelector(selector);if(!b)continue;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(!!pressed));b.title=s.callActive?label:'Join voice to '+label.toLowerCase();b.disabled=!enabled;}}
 function paintVoice(){paintAccountControls();const s=window.repoVoice?.getState();if(!s)return;voiceMembers.replaceChildren();for(const m of s.community?.members||[]){const row=el('div','rc-voice-person');row.dataset.voiceName=m.name;row.tabIndex=0;row.setAttribute('aria-label',m.display+' in voice');row.append(portrait(m.display,data?.members.find(p=>p.username===m.name)),coloredName(el('span','rc-voice-name',data?.members.find(p=>p.username===m.name)?.display_name||m.display),data?.members.find(p=>p.username===m.name)?.name_color),el('small','',m.serverDeafened?'Deafened':m.serverMuted?'Server muted':m.muted?'Muted':''));voiceMembers.append(row);}const ban=s.community?.mine?.bannedUntil>Date.now()?s.community.mine.bannedUntil:0;voiceHeading.disabled=!s.available||s.callActive||!!ban;voiceHeading.classList.toggle('is-connected',s.currentKind==='community'&&s.callActive);voiceHeading.title=ban?'Temporarily banned from '+voiceName()+' voice':s.callActive?'Leave your current call before joining':s.available?'Click to join '+voiceName():'Voice is currently unavailable';voiceNotice.textContent=ban?'Voice access returns '+new Date(ban).toLocaleString():s.callActive||s.serviceError?'':!s.enabled?'Voice is connecting…':!s.available?'Voice is paused until the allowance renews.':'';voiceNotice.hidden=!voiceNotice.textContent;paintSpeaking();}
 async function poll(force=false){if(polling||!user||!drawer.open||document.hidden||!portalVisible||(!force&&Date.now()-lastPoll<5000))return;lastPoll=Date.now();polling=true;const e=epoch;try{if(force||Date.now()-lastState>30000){await loadState();lastState=Date.now();}if(mode==='community')await loadMessages();}catch(e){error(e);}finally{if(e===epoch)polling=false;}}
 function editorBase(title){themePreview=null;paintTheme(savedTheme);closeCard();editorRevision++;editor.replaceChildren();editor.append(el('h2','',title));const form=el('form'),feedback=el('p','rc-editor-status');feedback.setAttribute('role','status');editor.append(form,feedback);editor.showModal();return{form,feedback};}
 function field(form,label,value,max=48){const wrap=el('label','rc-field'),i=el('input');i.value=value;i.maxLength=max;wrap.append(el('span','',label),i);form.append(wrap);return i;}
 function actions(form,label='Save changes'){const row=el('div','rc-editor-actions'),save=btn(label,null,'rc-primary');save.type='submit';row.append(btn('Cancel',closeEditor),save);form.append(row);return save;}
 function editChannel(c){if(!data?.developer)return;const {form,feedback}=editorBase(c?'Edit text channel':'Create text channel'),name=field(form,'Channel name',c?.name||'',32),save=actions(form);form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await api('channel',{id:c?.id,name:name.value});await loadState();closeEditor();}catch(e){error(e,feedback);}finally{save.disabled=false;}};name.focus();}
 function editVoiceName(){if(!data?.developer)return;const {form,feedback}=editorBase('Rename voice channel'),name=field(form,'Voice channel name',voiceName(),32),save=actions(form);form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await api('voice-name',{name:name.value});await loadState();closeEditor();}catch(e){error(e,feedback);}finally{save.disabled=false;}};name.focus();}
 function editSettings(profile=null){
  if(!profile)return;const original={...profile.settings},s={...original,title:profile.display};const {form,feedback}=editorBase('Edit Wibs profile');
  const title=field(form,'Wibs display name',s.title,32);const preview=el('div','rc-banner rc-banner-preview'),img=el('img','rc-banner-image');img.alt='Banner preview';const source=profile.bannerURL;img.hidden=!source;if(source)img.src=source;const text=el('h3','rc-preview-title',s.title);preview.append(img,text);form.append(preview);fitBanner(preview,img,s);title.oninput=()=>{text.textContent=title.value;};
  let bio,colors,nameColor=profile?.nameColor||null,draftTheme={...savedTheme}; if(profile){
   colors={background:profile.colors?.background||'#14231b',accent:profile.colors?.accent||'#b5d39c'};
   const bioWrap=el('label','rc-field');bio=el('textarea');bio.rows=3;bio.maxLength=300;bio.value=profile.bio||'';bioWrap.append(el('span','','Wibs bio'),bio);form.insertBefore(bioWrap,preview);
   const colourFields=el('div','rc-profile-colors');for(const [key,label]of [['background','Profile colour'],['accent','Accent colour']]){const wrap=el('label','rc-field'),input=el('input');input.type='color';input.value=colors[key];input.setAttribute('aria-label',label);input.oninput=()=>{colors[key]=input.value;profileColors(preview,colors);};wrap.append(el('span','',label),input);colourFields.append(wrap);}form.insertBefore(colourFields,preview);preview.classList.add('rc-profile-color-preview');profileColors(preview,colors);
   const nameFields=el('div','rc-name-colour'),nameLabel=el('label','rc-field'),nameInput=el('input');nameInput.type='color';nameInput.value=nameColor||(profile.role?'#f0de55':'#8ad9e7');nameInput.setAttribute('aria-label','Name colour');
   const nameSample=el('strong','rc-name-sample',profile.display),resetName=btn('Use role colour',()=>{nameColor=null;nameSample.style.removeProperty('--name-color');nameSample.classList.remove('has-name-color');nameInput.value=profile.role?'#f0de55':'#8ad9e7';},'rc-colour-reset');coloredName(nameSample,nameColor);nameInput.oninput=()=>{nameColor=nameInput.value;coloredName(nameSample,nameColor);};nameLabel.append(el('span','','Name colour'),nameInput);nameFields.append(nameLabel,nameSample,resetName);form.insertBefore(nameFields,preview);
   const theme=el('section','rc-theme-settings');theme.setAttribute('aria-label','Wibs theme');theme.append(el('h3','','Wibs theme'),el('p','','Your personal colours for Wibs. Saved with your account.'));
   const presets=[['Forest','#0c1913','#b5d39c'],['Midnight','#101827','#a9c5fa'],['Charcoal','#1b1c22','#c1baff'],['Plum','#231827','#e0b6ec'],['Rose','#281c22','#edb7c4'],['Daylight','#f1eee6','#566c50']],swatches=el('div','rc-theme-presets');
   const themeInputs={},updateTheme=()=>{themePreview={...draftTheme};paintTheme(themePreview);for(const b of swatches.children)b.setAttribute('aria-pressed',String(b.dataset.background===draftTheme.background&&b.dataset.accent===draftTheme.accent));for(const [key,i]of Object.entries(themeInputs))i.value=draftTheme[key];};
   for(const [label,background,accent]of presets){const b=btn(label,()=>{draftTheme={background,accent};updateTheme();},'rc-theme-swatch');b.dataset.background=background;b.dataset.accent=accent;b.style.setProperty('--swatch-bg',background);b.style.setProperty('--swatch-accent',accent);b.setAttribute('aria-pressed',String(background===draftTheme.background&&accent===draftTheme.accent));swatches.append(b);}theme.append(swatches);
   const custom=el('div','rc-profile-colors');for(const [key,label]of [['background','Wibs background'],['accent','Wibs accent']]){const wrap=el('label','rc-field'),i=el('input');i.type='color';i.value=draftTheme[key];i.setAttribute('aria-label',label);i.oninput=()=>{draftTheme[key]=i.value;updateTheme();};themeInputs[key]=i;wrap.append(el('span','',label),i);custom.append(wrap);}theme.append(custom);form.append(theme);
   form.insertBefore(el('p','rc-profile-edit-note','Your Wibs name and bio are separate from your Repo Company account.'),preview);
  }
  const upload=el('input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp,image/gif';upload.setAttribute('aria-label','Upload profile banner');const fileLabel=el('label','rc-field');fileLabel.append(el('span','','Profile banner image or GIF'),upload,el('small','','One banner · PNG, JPG, WebP or GIF · up to 1 MB'));form.append(fileLabel);
  let pending=undefined,decoding=false,fileRevision=0;const revision=editorRevision;
  upload.onchange=async()=>{const fileToken=++fileRevision;const valid=()=>revision===editorRevision&&fileToken===fileRevision&&editor.open;const file=upload.files[0];if(!file)return;if(file.size>1048576){feedback.textContent='Choose a file up to 1 MB.';upload.value='';return;}decoding=true;save.disabled=true;try{const raw=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});if(!valid())return;const probe=new Image();probe.src=raw;await probe.decode();if(!valid())return;if(probe.naturalWidth*probe.naturalHeight>40000000)throw Error('Choose an image below 40 megapixels.');pending=raw.split(',')[1];if(editURL)URL.revokeObjectURL(editURL);editURL=URL.createObjectURL(file);img.src=editURL;img.hidden=false;feedback.textContent='Preview ready. Save to publish this banner.';}catch(e){if(valid())feedback.textContent=e.message||'That image could not be opened.';}finally{if(valid()){decoding=false;save.disabled=false;}}};
  form.append(btn('Remove banner',()=>{pending=null;img.hidden=true;upload.value='';},'rc-remove-banner'));
  for(const [key,label,min,max,suffix]of [['height','Banner height',140,360,'px'],['zoom','Zoom',100,250,'%'],['x','Horizontal position',0,100,'%'],['y','Vertical position',0,100,'%']]){const wrap=el('label','rc-slider'),range=el('input'),out=el('output','',s[key]+suffix);range.type='range';range.min=min;range.max=max;range.value=s[key];range.setAttribute('aria-label',label);range.oninput=()=>{s[key]=Number(range.value);out.textContent=s[key]+suffix;fitBanner(preview,img,s);};wrap.append(el('span','',label),range,out);form.append(wrap);}
  form.append(btn('Edit account avatar',()=>openFullProfile(profile.username),'rc-manage-roles'),btn('My frames & inventory',()=>openAccount('inventory'),'rc-manage-roles'),btn('Account & privacy settings',()=>openAccount('settings'),'rc-manage-roles'));const save=actions(form);
  form.onsubmit=async e=>{e.preventDefault();if(decoding)return;save.disabled=true;try{if(profile)await api('profile-details',{display:title.value,bio:bio.value,...colors,nameColor,theme:draftTheme});if(pending!==undefined)await api('profile-banner',{data:pending});await api('profile-settings',{title:title.value,height:s.height,zoom:s.zoom,x:s.x,y:s.y});await loadState();if(revision===editorRevision)closeEditor();}catch(e){if(revision===editorRevision)error(e,feedback);}finally{save.disabled=false;}};
 }
 function manageCommunity(){if(!data?.developer)return;const {form}=editorBase('Community management');form.append(btn('Manage Developer access',editRoles,'rc-manage-roles'),btn('Manage voice restrictions',editVoiceRestrictions,'rc-manage-roles'),btn('Done',closeEditor,'rc-manage-roles'));}
 function editVoiceRestrictions(){
  if(!data?.developer)return;
  const {form,feedback}=editorBase('Voice restrictions'),revision=editorRevision,restrictions=window.repoVoice?.getState().community?.restrictions||[];
  form.append(el('p','','Restrictions apply to '+voiceName()+' voice.'));
  for(const r of restrictions){
   const row=el('div','rc-voice-restriction');row.append(el('strong','',r.display||r.name));
   const remove=(label,action,options={})=>{const button=btn(label,async()=>{button.disabled=true;try{await window.repoVoice.moderate(r.name,action,options);if(revision===editorRevision){closeEditor();editVoiceRestrictions();}}catch(err){if(revision===editorRevision)error(err,feedback);}finally{button.disabled=false;}});button.disabled=r.name===data.username;row.append(button);};
   if(r.serverMuted)remove('Remove server mute','mute',{enabled:false});
   if(r.serverDeafened)remove('Remove server deafen','deafen',{enabled:false});
   if(r.bannedUntil>Date.now()){row.append(el('p','','Banned until '+new Date(r.bannedUntil).toLocaleString()));remove('Remove voice ban','unban');}
   if(r.name===data.username)row.append(el('p','','Another Developer can lift your restriction.'));
   form.append(row);
  }
  if(!restrictions.length)form.append(el('p','','No active voice restrictions.'));form.append(btn('Close',closeEditor));
 }
 function editRoles(){if(!data?.developer)return;const {form,feedback}=editorBase('Developer access');form.append(el('p','','Developers can manage channels, voice moderation and Developer access.'));const list=el('div','rc-role-list');for(const person of data.developers){const row=el('div');row.append(el('span','',person.display_name||person.username));if(person.username!==data.username)row.append(btn('Remove role',async()=>{try{await api('role',{username:person.username,enabled:false});await loadState();closeEditor();editRoles();}catch(e){error(e,feedback);}}));list.append(row);}form.append(list);const name=field(form,'Repo Company username','',16),save=actions(form,'Grant Developer role');form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await api('role',{username:name.value.trim(),enabled:true});await loadState();closeEditor();editRoles();}catch(e){error(e,feedback);}finally{save.disabled=false;}};}
 addEventListener('repo-account-state',()=>{const next=account.state.user?.id||null;if(next!==user){epoch++;channelEpoch++;controllers.forEach(c=>c.abort());reactionPicker.clear();gifPicker.clear();gifKeys.clear();latestMessages.clear();user=next;savedTheme=cachedTheme();themePreview=null;paintTheme(savedTheme);voiceRename.hidden=true;data=null;rows=[];drafts.clear();draftKeys.clear();input.value='';sending=loading=polling=false;input.disabled=send.disabled=gifButton.disabled=false;lastState=lastPoll=0;messageRevision=null;signature='';members.replaceChildren();channelList.replaceChildren();self.replaceChildren();log.replaceChildren();closeCard();closeEditor();rename.hidden=addChannel.hidden=true;status.textContent='';}});
 addEventListener('repo-voice-state',paintVoice);addEventListener('repo-voice-speaking',paintSpeaking);addEventListener('repo-messaging-state',()=>{if(drawer.open)poll();});
 document.addEventListener('visibilitychange',()=>{drawer.classList.toggle('rc-ambient-paused',document.hidden);if(!document.hidden)poll(true);});addEventListener('repo-launcher-portal-visibility',e=>{portalVisible=e.detail?.visible!==false;drawer.classList.toggle('rc-ambient-paused',!portalVisible||document.hidden);if(portalVisible)poll(true);});
 window.repoCommunity=Object.freeze({show,voiceName});paintVoice();show('community');setInterval(poll,5000);setInterval(()=>{if(drawer.open&&!document.hidden)paintActivityClocks();},1000);
})();
