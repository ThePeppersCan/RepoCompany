(() => {
 'use strict';
 const account=window.repoAccount,drawer=document.getElementById('repo-messages');
 if(!account||!drawer||window.repoCommunity)return;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const glyphs={chat:'<path d="M4 5h16v12H8l-4 4V5Z"/><path d="M8 9h8M8 13h5"/>',voice:'<path d="m11 4-6 5H2v6h3l6 5V4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',back:'<path d="M20 5v11H4m5-5-5 5 5 5"/>',edit:'<path d="m15 3 6 6-12 12H3v-6L15 3Zm-3 3 6 6"/>',search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M3 22v-3a9 9 0 0 1 18 0v3H3Z"/>',send:'<path d="m3 3 19 9-19 9 4-9-4-9Zm4 9h15"/>',menu:'<path d="M3 5h18M3 12h18M3 19h18"/>'};
 function icon(name){const n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.setAttribute('viewBox','0 0 24 24');n.setAttribute('aria-hidden','true');n.innerHTML=glyphs[name]||glyphs.chat;return n;}
 function btn(label,fn,cls='',glyph){const b=el('button',cls);b.type='button';if(glyph)b.append(icon(glyph));b.append(el('span','',label));b.onclick=fn;return b;}
 function portrait(name,profile){const n=el('span','rc-avatar',String(name||'?').slice(0,2).toUpperCase());if(profile?.avatar&&window.repoAvatar){n.insertAdjacentHTML('beforeend',window.repoAvatar.markup(profile.avatar,name));window.repoAvatar.hydrate(n);}if(profile?.frame_id&&window.repoFrames){n.insertAdjacentHTML('beforeend',window.repoFrames.markup(profile.frame_id));window.repoFrames.hydrate(n);}return n;}
 let user=account.state.user?.id||null,epoch=0,channel='general',mode='community',data=null,rows=[],hasMore=false,searchTerm='',loading=false,sending=false,polling=false,lastState=0,signature='',bannerURL='',bannerVersion=null,bannerLoading=null,editURL='';
 let channelEpoch=0,editorRevision=0,draftKeys=new Map(),drafts=new Map();const controllers=new Set(),profileURLs=new Map();
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
 drawer.classList.add('rc-page');drawer.setAttribute('aria-label','RE-COMP community');drawer.removeAttribute('aria-labelledby');
 const top=el('header','rc-topbar'),brand=btn('Repo Company',()=>window.repoMessaging.close(),'rc-brand');brand.replaceChildren(el('span','publisher-mark'),el('span','publisher-wordmark'));brand.setAttribute('aria-label','Back to Repo Company');
 const nav=el('nav','rc-topnav');nav.setAttribute('aria-label','Repo Company');
 const collection=el('a','rc-top-link');collection.href='/download/windows';collection.setAttribute('aria-label','Download');collection.title='Download';const downloadIcon=icon('back');downloadIcon.innerHTML='<path d="M12 2v13m-5-5 5 5 5-5M3 15v6h18v-6"/>';collection.append(downloadIcon);
 const current=btn('',()=>show('community'),'rc-top-link is-current rc-community-tab');const wibs=el('span','repo-wibs-icon');wibs.setAttribute('aria-hidden','true');current.prepend(wibs);current.setAttribute('aria-label','Community');current.title='Wibs · Community';
 const accountButton=btn('',()=>{window.repoMessaging.close();window.accountMenu?.open({tab:'profile'});},'rc-top-link','user');accountButton.setAttribute('aria-label','Account');accountButton.title='Account';
 nav.append(collection,current,accountButton);top.append(brand,nav);
 const layout=el('div','rc-layout'),sidebar=el('aside','rc-sidebar'),workspace=el('main','rc-workspace');
 sidebar.setAttribute('aria-label','Channels and direct messages');
 const identity=el('div','rc-community-identity');identity.append(el('span','publisher-mark'),el('strong','','RE-COMP Voice'));sidebar.append(identity);
 const channelHeading=el('div','rc-section-heading');channelHeading.append(el('span','','TEXT CHANNELS'));
 const addChannel=btn('+',()=>editChannel(),'rc-small');addChannel.title='Create text channel';addChannel.setAttribute('aria-label','Create text channel');addChannel.hidden=true;channelHeading.append(addChannel);
 const channelList=el('nav','rc-channel-list');channelList.setAttribute('aria-label','Text channels');sidebar.append(channelHeading,channelList);
 const dmToggle=btn('Direct messages',()=>show('dm'),'rc-dm-toggle','chat'),dmWrap=el('div','rc-dm-wrap');dmWrap.append(dmAside);dmWrap.hidden=true;sidebar.append(dmToggle,dmWrap);
 const voiceSection=el('section','rc-voice');voiceSection.setAttribute('aria-label','RE-COMP voice channel');
 const voiceHeading=btn('RE-COMP',()=>window.repoVoice?.joinCommunity(),'rc-voice-heading','voice');voiceHeading.setAttribute('aria-label','Join RE-COMP voice');
 const voiceMembers=el('div','rc-voice-members'),voiceNotice=el('p','rc-voice-note');
 voiceSection.append(voiceHeading,voiceMembers,voiceNotice);if(voicePanel)voiceSection.append(voicePanel);sidebar.append(voiceSection);
 const bottom=el('div','rc-sidebar-bottom'),back=btn('Back to collection',()=>window.repoMessaging.close(),'rc-back','back'),self=el('div','rc-self');bottom.append(back,self,btn('My profile & settings',()=>myProfile(),'rc-my-profile'));sidebar.append(bottom);
 const banner=el('section','rc-banner'),bannerImage=el('img','rc-banner-image');bannerImage.alt='';bannerImage.hidden=true;
 const bannerCopy=el('div','rc-banner-copy'),bannerLabel=el('p','rc-eyebrow','REPO COMPANY COMMUNITY'),bannerTitle=el('h1','','RE-COMP'),online=el('p','rc-online','Everyone has a place here.');bannerCopy.append(bannerLabel,bannerTitle,online);
 const customize=btn('Customize',()=>editSettings(),'rc-customize','edit');customize.hidden=true;banner.append(bannerImage,bannerCopy,customize);
 const below=el('div','rc-below'),center=el('div','rc-center'),members=el('aside','rc-members');members.setAttribute('aria-label','Community members');
 const channelView=el('section','rc-channel-view'),channelHead=el('header','rc-channel-head');
 const menu=btn('Channels',()=>drawer.classList.toggle('rc-nav-open'),'rc-mobile-menu','menu');
 const channelName=el('h2','','general'),channelDescription=el('p','','A place for everyone in Repo Company.'),rename=btn('Edit channel',()=>editChannel(data?.channels.find(c=>c.id===channel)),'rc-edit-channel','edit');rename.hidden=true;
 const searchForm=el('form','rc-search'),searchInput=el('input');searchInput.type='search';searchInput.placeholder='Search';searchInput.maxLength=100;searchInput.setAttribute('aria-label','Search this channel');searchForm.append(icon('search'),searchInput);
 searchForm.onsubmit=e=>{e.preventDefault();searchTerm=searchInput.value.trim();channelEpoch++;rows=[];signature='';loadMessages();};searchInput.oninput=()=>{if(!searchInput.value&&searchTerm){searchTerm='';channelEpoch++;rows=[];signature='';loadMessages();}};
 const memberToggle=btn('Members',()=>drawer.classList.toggle('rc-members-open'),'rc-member-toggle','user');memberToggle.setAttribute('aria-label','Show or hide members');
 channelHead.append(menu,el('span','rc-hash','#'),channelName,channelDescription,rename,searchForm,memberToggle);
 const log=el('div','rc-log');log.setAttribute('role','log');log.setAttribute('aria-label','Community messages');log.setAttribute('aria-live','polite');log.tabIndex=0;
 const status=el('p','rc-status');status.setAttribute('role','status');
 const composer=el('form','rc-composer'),input=el('textarea');input.rows=1;input.maxLength=4000;input.placeholder='Message #general';input.setAttribute('aria-label','Community message');
 const send=btn('Send',null,'rc-send','send');send.type='submit';composer.append(input,send);
 input.oninput=()=>{drafts.set(channel,input.value);draftKeys.delete(channel);input.style.height='auto';input.style.height=Math.min(120,input.scrollHeight)+'px';};
 input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();composer.requestSubmit();}};
 composer.onsubmit=async e=>{e.preventDefault();const text=input.value.trim(),selected=channel,re=channelEpoch,auth=epoch;if(!text||sending)return;const clientId=draftKeys.get(selected)||crypto.randomUUID();draftKeys.set(selected,clientId);sending=true;send.disabled=input.disabled=true;status.textContent='';try{await api('messages',{channel:selected,text,clientId});drafts.delete(selected);draftKeys.delete(selected);if(re===channelEpoch){input.value='';input.style.height='';await loadMessages();log.scrollTop=log.scrollHeight;}}catch(e){error(e);}finally{if(auth===epoch){sending=false;send.disabled=input.disabled=false;}}};
 channelView.append(channelHead,log,status,composer);center.append(channelView,dmConversation);below.append(center,members);workspace.append(banner,below);layout.append(sidebar,workspace);
 dmConversation.querySelector('.repo-conversation-head').prepend(btn('Channels',()=>drawer.classList.toggle('rc-nav-open'),'rc-mobile-menu','menu'));const atmosphere=el('div','rc-atmosphere');atmosphere.setAttribute('aria-hidden','true');for(let i=0;i<38;i++){const mote=el('i');mote.style.setProperty('--x',((i*47.31)%100)+'%');mote.style.setProperty('--y',((i*29.73)%100)+'%');mote.style.setProperty('--delay',(-i*1.7)+'s');atmosphere.append(mote);}drawer.replaceChildren(atmosphere,top,layout,oldHead);if(voiceForm)drawer.append(voiceForm);
 const editor=el('dialog','rc-editor');editor.setAttribute('aria-label','Community settings');drawer.append(editor);
 editor.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();closeEditor();});
 function closeEditor(){editorRevision++;editor.close();editor.replaceChildren();if(editURL){URL.revokeObjectURL(editURL);editURL='';}}
 function openAccount(tab,player=''){closeCard();closeEditor();window.repoMessaging.close();window.accountMenu?.open({tab,player});}
 function openFullProfile(username){openAccount('profile',username);}
 async function myProfile(){
  const revision=++editorRevision,auth=epoch;
  try{const profile=await api('profile');if(revision!==editorRevision||auth!==epoch)return;
   if(profile.settings.bannerVersion){const blob=await api('profile-banner',undefined,true);if(revision!==editorRevision||auth!==epoch)return;editURL=URL.createObjectURL(blob);profile.bannerURL=editURL;}
   editSettings(profile);
  }catch(e){error(e);}
 }
 const card=el('div','rc-profile-popover');card.popover='auto';card.setAttribute('role','dialog');card.setAttribute('aria-label','Player profile');drawer.append(card);
 let cardRevision=0,cardURL='',cardPoint={x:0,y:0};
 function clearCard(){cardRevision++;card.replaceChildren();if(cardURL){URL.revokeObjectURL(cardURL);cardURL='';}}
 function closeCard(){if(card.matches(':popover-open'))card.hidePopover();else clearCard();}
 card.addEventListener('beforetoggle',e=>{if(e.newState==='closed')clearCard();});
 function placeCard(){if(!card.matches(':popover-open'))return;const box=card.getBoundingClientRect(),gap=12;let x=cardPoint.x+gap,y=cardPoint.y+gap;if(x+box.width>innerWidth-8)x=cardPoint.x-box.width-gap;if(y+box.height>innerHeight-8)y=cardPoint.y-box.height-gap;card.style.left=Math.max(8,Math.min(x,innerWidth-box.width-8))+'px';card.style.top=Math.max(8,Math.min(y,innerHeight-box.height-8))+'px';}
 new ResizeObserver(placeCard).observe(card);addEventListener('resize',placeCard);drawer.addEventListener('close',closeCard);
 async function profileCard(username,event){
  closeCard();const rect=event?.currentTarget?.getBoundingClientRect();cardPoint=event?.detail?{x:event.clientX,y:event.clientY}:{x:rect?.left||20,y:rect?.bottom||80};
  const revision=++cardRevision,valid=()=>revision===cardRevision&&card.matches(':popover-open');
  const feedback=el('p','rc-card-status','Loading profile…');feedback.setAttribute('role','status');card.append(feedback);card.showPopover();placeCard();
  try{const profile=await api('profile?username='+encodeURIComponent(username));if(!valid())return;card.replaceChildren();const cover=el('div','rc-profile-banner'),content=el('div','rc-card-content');card.append(cover,content);
   const dismiss=btn('×',closeCard,'rc-card-close');dismiss.setAttribute('aria-label','Close profile card');card.append(dismiss);
   const avatar=portrait(profile.display||profile.username,profile);avatar.classList.add('rc-profile-avatar');content.append(avatar,btn(profile.display||profile.username,()=>openFullProfile(profile.username),'rc-profile-name'),el('p','rc-profile-handle','@'+profile.username));
   if(profile.role)content.append(el('span','rc-role',profile.role));if(profile.locked||profile.bio)content.append(el('p','rc-profile-bio',profile.locked?'This player shares their profile with accepted friends only.':profile.bio));
   const controls=el('div','rc-profile-actions');if(profile.own)controls.append(btn('Edit my banner',()=>{closeCard();myProfile();}));else if(profile.friend)controls.append(btn('Message',()=>{closeCard();window.repoMessaging.open(profile.username);}));if(controls.children.length)content.append(controls);
   placeCard();if(!event?.detail)content.querySelector('.rc-profile-name').focus({preventScroll:true});
   if(profile.settings?.bannerVersion){const blob=await api('profile-banner?username='+encodeURIComponent(username),undefined,true);if(!valid())return;cardURL=URL.createObjectURL(blob);const image=el('img');image.alt='';image.src=cardURL;image.style.objectPosition=`${profile.settings.x}% ${profile.settings.y}%`;image.style.transform=`scale(${profile.settings.zoom/100})`;image.style.transformOrigin=image.style.objectPosition;cover.append(image);}
  }catch(e){if(valid()){card.replaceChildren(feedback);error(e,feedback);placeCard();}}
 }
 async function hydrateProfiles(root){
  for(const [node,url]of profileURLs)if(!node.isConnected){URL.revokeObjectURL(url);profileURLs.delete(node);}
  for(const node of root.querySelectorAll('[data-community-profile-banner]')){if(node.dataset.loaded)continue;node.dataset.loaded='true';const auth=epoch;
   try{const profile=await api('profile?username='+encodeURIComponent(node.dataset.communityProfileBanner));if(!profile.settings?.bannerVersion||!node.isConnected||auth!==epoch)continue;const blob=await api('profile-banner?username='+encodeURIComponent(profile.username),undefined,true);if(!node.isConnected||auth!==epoch)continue;const url=URL.createObjectURL(blob);profileURLs.set(node,url);const image=el('img');image.alt='Profile banner';image.src=url;image.style.objectPosition=`${profile.settings.x}% ${profile.settings.y}%`;image.style.transform=`scale(${profile.settings.zoom/100})`;image.style.transformOrigin=image.style.objectPosition;node.style.height=profile.settings.height+'px';node.append(image);node.classList.add('has-banner');}catch{}
  }
 }
 function show(next){mode=next;drawer.dataset.communityView=mode;channelView.hidden=mode!=='community';dmConversation.hidden=mode!=='dm';dmWrap.hidden=mode!=='dm';dmToggle.classList.toggle('is-selected',mode==='dm');drawer.classList.remove('rc-nav-open','rc-members-open');if(mode==='community'){paintChannels();poll(true);}else dmAside.querySelector('input')?.focus();}
 function selectChannel(id){if(channel!==id){drafts.set(channel,input.value);channel=id;channelEpoch++;loading=false;rows=[];signature='';input.value=drafts.get(channel)||'';searchTerm='';searchInput.value='';paintMessages();}show('community');paintChannels();loadMessages();}
 function paintChannels(){
  if(!data)return;channelList.replaceChildren();for(const c of data.channels){const b=btn(c.name,()=>selectChannel(c.id),'rc-channel');b.prepend(el('span','rc-hash','#'));b.setAttribute('aria-current',String(c.id===channel&&mode==='community'));channelList.append(b);}
  const c=data.channels.find(c=>c.id===channel);channelName.textContent=c?.name||'general';channelDescription.textContent=c?.description||'';input.placeholder='Message #'+(c?.name||'general');rename.hidden=!data.developer;addChannel.hidden=!data.developer;addChannel.disabled=data.channels.length>=20;
 }
 function paintMembers(){
  members.replaceChildren();for(const role of ['Developer','Member']){const group=data.members.filter(m=>(m.role||'Member')===role);if(!group.length)continue;members.append(el('h3','rc-members-heading',`${role==='Developer'?'DEVELOPER':'MEMBERS'} — ${group.length}`));for(const m of group){const row=btn('',event=>profileCard(m.username,event),'rc-member'),avatar=portrait(m.display_name,m);row.replaceChildren();row.setAttribute('aria-label','View '+m.display_name+' profile card');row.dataset.voiceName=m.username;avatar.classList.toggle('is-online',!!m.online);row.append(avatar,el('span','rc-member-name',m.display_name));if(m.role)row.append(el('span','rc-role',m.role));members.append(row);}}
  if(!data.members.length)members.append(el('p','','Members appear here when they visit.'));
  const n=data.members.filter(m=>m.online).length;online.replaceChildren(el('span','rc-online-dot'),document.createTextNode(`${n} ${n===1?'member':'members'} online`));
  self.dataset.voiceName=data.username;self.replaceChildren(portrait(data.username,account.state.social?.profile),el('span','',data.username),el('span','rc-self-role',data.developer?'Developer':'Member'));paintSpeaking();
 }
 function fitBanner(node,img,s){node.style.setProperty('--rc-banner-height',s.height+'px');img.style.objectPosition=`${s.x}% ${s.y}%`;img.style.transform=`scale(${s.zoom/100})`;img.style.transformOrigin=`${s.x}% ${s.y}%`;}
 async function paintBanner(){
  const s=data.settings;bannerTitle.textContent=s.title;customize.hidden=!data.developer;fitBanner(banner,bannerImage,s);
  if(s.bannerVersion===bannerVersion||s.bannerVersion===bannerLoading)return;
  if(!s.bannerVersion){bannerVersion=null;bannerImage.hidden=true;bannerImage.removeAttribute('src');if(bannerURL)URL.revokeObjectURL(bannerURL);bannerURL='';return;}
  const v=s.bannerVersion;bannerLoading=v;
  try{const blob=await api('banner',undefined,true);if(data?.settings.bannerVersion!==v)return;if(bannerURL)URL.revokeObjectURL(bannerURL);bannerURL=URL.createObjectURL(blob);bannerImage.src=bannerURL;bannerImage.hidden=false;bannerVersion=v;}catch(e){error(e);}finally{if(bannerLoading===v)bannerLoading=null;}
 }
 async function loadState(){const result=await api('state');data=result;if(!data.channels.some(c=>c.id===channel))channel=data.channels[0]?.id||'general';paintChannels();paintMembers();await paintBanner();}
 async function loadMessages(older=false){
  if(loading||!user||mode!=='community')return;loading=true;const selected=channel,re=channelEpoch,auth=epoch;
  try{const result=await api('messages?channel='+encodeURIComponent(selected)+(older&&rows.length?'&before='+rows[0].id:'')+(searchTerm?'&search='+encodeURIComponent(searchTerm):''));if(re!==channelEpoch)return;
   if(older){rows=[...result.messages,...rows.filter(m=>!result.messages.some(n=>m.id===n.id))];hasMore=result.hasMore;}else{const first=result.messages[0]?.id||0;rows=[...rows.filter(m=>m.id<first),...result.messages];if(rows.length<=50)hasMore=result.hasMore;}
   if(rows.length>500){rows=rows.slice(-500);hasMore=true;}paintMessages(older);status.textContent='';
  }catch(e){if(re===channelEpoch)error(e);}finally{if(auth===epoch&&re===channelEpoch)loading=false;}
 }
 function paintMessages(older=false){
  const next=JSON.stringify([rows,hasMore,searchTerm,data?.developer,data?.members.map(m=>[m.username,m.avatar,m.frame_id])]);if(next===signature)return;signature=next;
  const near=log.scrollHeight-log.scrollTop-log.clientHeight<100,oldHeight=log.scrollHeight,oldTop=log.scrollTop;log.replaceChildren();
  if(hasMore){const more=btn('Earlier messages',()=>loadMessages(true),'rc-older');log.append(more);}
  if(!rows.length){const empty=el('div','rc-empty');empty.append(el('span','rc-empty-hash','#'),el('h3','',searchTerm?'No matching messages.':'Welcome to #'+(data?.channels.find(c=>c.id===channel)?.name||'general')),el('p','',searchTerm?'Try another word or clear your search.':'This is the beginning of the conversation. Make yourself at home.'));log.append(empty);}
  let day='';for(const m of rows){const d=new Date(m.createdAt),label=d.toLocaleDateString([],{day:'numeric',month:'long',year:'numeric'});if(label!==day){if(d.toDateString()!==new Date().toDateString())log.append(el('div','rc-day',label));day=label;}
   const article=el('article','rc-message');article.dataset.communityMessageId=m.id;article.append(portrait(m.display,data?.members.find(p=>p.username===m.sender)));const content=el('div','rc-message-content'),meta=el('header','rc-message-meta');meta.append(btn(m.display,event=>profileCard(m.sender,event),'rc-author'+(m.role?' is-developer':'')));if(m.role)meta.append(el('span','rc-role',m.role));const time=el('time','',(d.toDateString()===new Date().toDateString()?'Today at ':'')+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));time.dateTime=d.toISOString();time.title=d.toLocaleString();meta.append(time);content.append(meta,el('p','rc-message-text',m.text));
   const reactions=el('div','rc-reactions');for(const r of m.reactions||[]){const b=btn(`${r.emoji} ${r.count}`,()=>react(m,r.mine?null:r.emoji),'rc-reaction');b.setAttribute('aria-pressed',String(!!r.mine));reactions.append(b);}content.append(reactions);
   const actions=el('div','rc-message-actions'),picker=el('details','rc-reaction-picker'),summary=el('summary','','☺');summary.title='Add reaction';summary.setAttribute('aria-label','Add reaction');const choices=el('div','rc-reaction-choices');for(const emoji of ['👍','❤️','😂','🎉','👀','🌿'])choices.append(btn(emoji,()=>{picker.open=false;react(m,emoji);},''));picker.append(summary,choices);actions.append(picker);
   if(m.mine||data?.developer)actions.append(btn('Delete',async()=>{try{await api('delete',{id:m.id});rows=rows.filter(r=>r.id!==m.id);signature='';paintMessages();}catch(e){error(e);}},'rc-delete'));
   article.append(content,actions);log.append(article);
  }
  if(older)log.scrollTop=oldTop+log.scrollHeight-oldHeight;else if(near)log.scrollTop=log.scrollHeight;else log.scrollTop=oldTop;
 }
 async function react(m,emoji){try{await api('reaction',{id:m.id,emoji});await loadMessages();}catch(e){error(e);}}
 function paintSpeaking(){const speaking=window.repoVoice?.getState().speaking||[];for(const row of drawer.querySelectorAll('.rc-member[data-voice-name],.rc-voice-person[data-voice-name],.rc-self[data-voice-name]')){const active=speaking.includes(row.dataset.voiceName);row.classList.toggle('is-speaking',active);const avatar=row.querySelector('.rc-avatar');if(avatar)avatar.title=active?'Speaking':'';}}
 function paintVoice(){const s=window.repoVoice?.getState();if(!s)return;voiceMembers.replaceChildren();for(const m of s.community?.members||[]){const row=el('div','rc-voice-person');row.dataset.voiceName=m.name;row.append(portrait(m.display,data?.members.find(p=>p.username===m.name)),el('span','',m.display),el('small','',m.muted?'Muted':''));voiceMembers.append(row);}voiceHeading.disabled=!s.available||s.callActive;voiceHeading.classList.toggle('is-connected',s.currentKind==='community'&&s.callActive);voiceHeading.title=s.callActive?'Leave your current call before joining':s.available?'Click to join RE-COMP':'Voice is currently unavailable';voiceNotice.textContent=s.callActive?(s.currentKind==='community'?'Connected to RE-COMP':'Your private call is connected below.'):!s.enabled?'Voice is connecting…':!s.available?'Voice is paused until the allowance renews.':(s.community?.members.length?'Click RE-COMP to join.':'Click RE-COMP to join voice.');paintSpeaking();}
 async function poll(force=false){if(polling||!user||!drawer.open||document.hidden)return;polling=true;const e=epoch;try{if(force||Date.now()-lastState>20000){await loadState();lastState=Date.now();}if(mode==='community')await loadMessages();}catch(e){error(e);}finally{if(e===epoch)polling=false;}}
 function editorBase(title){closeCard();editorRevision++;editor.replaceChildren();editor.append(el('h2','',title));const form=el('form'),feedback=el('p','rc-editor-status');feedback.setAttribute('role','status');editor.append(form,feedback);editor.showModal();return{form,feedback};}
 function field(form,label,value,max=48){const wrap=el('label','rc-field'),i=el('input');i.value=value;i.maxLength=max;wrap.append(el('span','',label),i);form.append(wrap);return i;}
 function actions(form,label='Save changes'){const row=el('div','rc-editor-actions'),save=btn(label,null,'rc-primary');save.type='submit';row.append(btn('Cancel',closeEditor),save);form.append(row);return save;}
 function editChannel(c){if(!data?.developer)return;const {form,feedback}=editorBase(c?'Edit text channel':'Create text channel'),name=field(form,'Channel name',c?.name||'',32),description=field(form,'Description',c?.description||'',180),save=actions(form);form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await api('channel',{id:c?.id,name:name.value,description:description.value});await loadState();closeEditor();}catch(e){error(e,feedback);}finally{save.disabled=false;}};name.focus();}
 function editSettings(profile=null){
  if(!profile&&!data?.developer)return;const original={...(profile?.settings||data.settings)},s={...original,title:profile?.display||original.title};const {form,feedback}=editorBase(profile?'My profile & settings':'Customize RE-COMP');
  const title=field(form,profile?'Display name (edit in account settings)':'Community title',s.title);if(profile)title.readOnly=true;const preview=el('div','rc-banner rc-banner-preview'),img=el('img','rc-banner-image');img.alt='Banner preview';const source=profile?profile.bannerURL:bannerURL;img.hidden=!source;if(source)img.src=source;const text=el('h3','rc-preview-title',s.title);preview.append(img,text);form.append(preview);fitBanner(preview,img,s);title.oninput=()=>{text.textContent=title.value;};
  const upload=el('input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp,image/gif';upload.setAttribute('aria-label','Upload community banner');const fileLabel=el('label','rc-field');fileLabel.append(el('span','','Header image or GIF'),upload,el('small','','One banner · PNG, JPG, WebP or GIF · up to 1 MB'));form.append(fileLabel);
  let pending=undefined,decoding=false,fileRevision=0;const revision=editorRevision;
  upload.onchange=async()=>{const fileToken=++fileRevision;const valid=()=>revision===editorRevision&&fileToken===fileRevision&&editor.open;const file=upload.files[0];if(!file)return;if(file.size>1048576){feedback.textContent='Choose a file up to 1 MB.';upload.value='';return;}decoding=true;save.disabled=true;try{const raw=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});if(!valid())return;const probe=new Image();probe.src=raw;await probe.decode();if(!valid())return;if(probe.naturalWidth*probe.naturalHeight>40000000)throw Error('Choose an image below 40 megapixels.');pending=raw.split(',')[1];if(editURL)URL.revokeObjectURL(editURL);editURL=URL.createObjectURL(file);img.src=editURL;img.hidden=false;feedback.textContent='Preview ready. Save to publish this banner.';}catch(e){if(valid())feedback.textContent=e.message||'That image could not be opened.';}finally{if(valid()){decoding=false;save.disabled=false;}}};
  form.append(btn('Remove banner',()=>{pending=null;img.hidden=true;upload.value='';},'rc-remove-banner'));
  for(const [key,label,min,max,suffix]of [['height','Banner height',140,360,'px'],['zoom','Zoom',100,250,'%'],['x','Horizontal position',0,100,'%'],['y','Vertical position',0,100,'%']]){const wrap=el('label','rc-slider'),range=el('input'),out=el('output','',s[key]+suffix);range.type='range';range.min=min;range.max=max;range.value=s[key];range.setAttribute('aria-label',label);range.oninput=()=>{s[key]=Number(range.value);out.textContent=s[key]+suffix;fitBanner(preview,img,s);};wrap.append(el('span','',label),range,out);form.append(wrap);}
  if(!profile){const roleButton=btn('Manage Developer access',()=>{closeEditor();editRoles();},'rc-manage-roles');form.append(roleButton);}else{form.append(btn('Edit avatar, display name & bio',()=>openFullProfile(profile.username),'rc-manage-roles'),btn('My frames & inventory',()=>openAccount('inventory'),'rc-manage-roles'),btn('Account & privacy settings',()=>openAccount('settings'),'rc-manage-roles'));}const save=actions(form);
  form.onsubmit=async e=>{e.preventDefault();if(decoding)return;save.disabled=true;try{if(pending!==undefined)await api(profile?'profile-banner':'banner',{data:pending});await api(profile?'profile-settings':'settings',{title:title.value,height:s.height,zoom:s.zoom,x:s.x,y:s.y});await loadState();if(revision===editorRevision)closeEditor();}catch(e){if(revision===editorRevision)error(e,feedback);}finally{save.disabled=false;}};
 }
 function editRoles(){if(!data?.developer)return;const {form,feedback}=editorBase('Developer access');form.append(el('p','','Developers can manage channels, the banner and Developer access.'));const list=el('div','rc-role-list');for(const person of data.developers){const row=el('div');row.append(el('span','',person.display_name||person.username));if(person.username!==data.username)row.append(btn('Remove role',async()=>{try{await api('role',{username:person.username,enabled:false});await loadState();closeEditor();editRoles();}catch(e){error(e,feedback);}}));list.append(row);}form.append(list);const name=field(form,'Repo Company username','',16),save=actions(form,'Grant Developer role');form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await api('role',{username:name.value.trim(),enabled:true});await loadState();closeEditor();editRoles();}catch(e){error(e,feedback);}finally{save.disabled=false;}};}
 addEventListener('repo-account-state',()=>{const next=account.state.user?.id||null;if(next!==user){epoch++;channelEpoch++;controllers.forEach(c=>c.abort());user=next;data=null;rows=[];drafts.clear();draftKeys.clear();input.value='';sending=loading=polling=false;input.disabled=send.disabled=false;lastState=0;signature='';members.replaceChildren();channelList.replaceChildren();self.replaceChildren();log.replaceChildren();closeCard();closeEditor();customize.hidden=rename.hidden=addChannel.hidden=true;bannerTitle.textContent='RE-COMP';bannerImage.hidden=true;if(bannerURL)URL.revokeObjectURL(bannerURL);bannerURL='';bannerVersion=bannerLoading=null;status.textContent='';}});
 addEventListener('repo-voice-state',paintVoice);addEventListener('repo-voice-speaking',paintSpeaking);addEventListener('repo-messaging-state',()=>{if(drawer.open)poll();});
 document.addEventListener('visibilitychange',()=>{drawer.classList.toggle('rc-ambient-paused',document.hidden);if(!document.hidden)poll(true);});addEventListener('repo-launcher-portal-visibility',e=>{drawer.classList.toggle('rc-ambient-paused',e.detail?.visible===false||document.hidden);});
 window.repoCommunity=Object.freeze({show,hydrateProfiles});paintVoice();show('community');setInterval(poll,4000);
})();
