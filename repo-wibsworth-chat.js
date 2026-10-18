// Wibsworth uses the existing workspace; switching sections never rebuilds it.
(() => {
  'use strict';
  const shell=document.getElementById('repo-messages'),ai=shell?.querySelector('.ws-ai'),account=window.repoAccount;
  if(!ai||!account)return;
  const q=s=>ai.querySelector(s),el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
  const btn=(text,action,cls='')=>{const n=el('button',cls,text);n.type='button';n.onclick=action;return n;};
  const body=q('.ws-ai-body'),welcome=q('.ws-welcome'),form=q('.ws-compose'),input=q('textarea'),send=q('.ws-compose-tools button'),note=q('.ws-compose-note'),status=q('.ws-status');
  const sidebar=shell.querySelector('.ws-ai-sidebar'),newChat=sidebar.querySelector('.ws-new-chat'),empty=sidebar.querySelector('.ws-empty-history');
  let user=account.state.user?.id||null,epoch=0,state=null,threads=[],active=null,busy=false,controller=null,requestId=0,lastState=0,loadingState=false,usageTimer=null,revealing=false,replyView=null,revealFinish=null;
  let retryUntil=0,retryTimer=null;
  const messageRigs=new Set();
  const requests=new Set(),history=el('nav','ws-chat-history'),transcript=el('div','ws-transcript');
  history.setAttribute('aria-label','Conversations');empty.replaceWith(history);transcript.setAttribute('role','log');transcript.setAttribute('aria-label','Conversation with Wibsworth');transcript.setAttribute('aria-live','polite');
  body.insertBefore(transcript,form);input.maxLength=2000;input.setAttribute('aria-label','Ask Wibsworth');send.type='submit';send.onclick=null;send.title='Send question';send.setAttribute('aria-label','Send question');
  const stop=btn('Stop',()=>revealFinish?revealFinish():controller?.abort(),'ws-stop');stop.hidden=true;send.before(stop);
  const options=el('label','ws-spoilers'),spoilers=el('input');spoilers.type='checkbox';options.append(spoilers,document.createTextNode('Allow story spoilers'));q('.ws-compose-tools').firstElementChild.replaceWith(options);
  const errorLine=el('p','ws-chat-error');errorLine.setAttribute('role','status');form.after(errorLine);
  const sourcesPanel=el('aside','ws-sources');sourcesPanel.hidden=true;sourcesPanel.setAttribute('aria-label','Answer sources');ai.append(sourcesPanel);
  const meter=el('section','ws-ai-usage'),meterTitle=el('div','ws-ai-usage-heading','Daily usage'),meterTrack=el('div','ws-ai-usage-track'),meterFill=el('span'),meterDetail=el('div','ws-ai-usage-detail');
  meterTrack.setAttribute('role','progressbar');meterTrack.setAttribute('aria-label','Shared daily AI allowance');meterTrack.setAttribute('aria-valuemin','0');meterTrack.setAttribute('aria-valuemax','100');meterTrack.append(meterFill);meter.append(meterTitle,meterTrack,meterDetail);shell.querySelector('.rc-account-dock')?.prepend(meter);
  function key(){return 'repo-wibsworth-conversations-v1:'+user;}
  function store(){if(!user)return;try{localStorage.setItem(key(),JSON.stringify(threads.slice(0,30)));}catch{errorLine.textContent='This device could not save the conversation. You can still read it here.';}}
  function load(){threads=[];if(user)try{const v=JSON.parse(localStorage.getItem(key())||'[]');if(Array.isArray(v))threads=v.filter(t=>typeof t.id==='string'&&typeof t.title==='string'&&Array.isArray(t.messages)).slice(0,30).map(t=>({...t,title:t.title.slice(0,70),messages:t.messages.filter(m=>['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-24).map(m=>({...m,content:m.content.slice(0,16000),sources:validSources(m.sources)}))}));}catch{}active=null;render();}
  function validSources(value){return Array.isArray(value)?value.slice(0,12).filter(s=>{if(!s||typeof s.title!=='string'||typeof s.url!=='string')return false;try{const u=new URL(s.url,location.origin);return u.protocol==='https:'&&(u.hostname==='repocompany.uk'||u.hostname.endsWith('.repocompany.uk')||u.hostname==='repo-company-games.pages.dev'||u.hostname==='www.exmoor-nationalpark.gov.uk');}catch{return false;}}).map(s=>({id:String(s.id||'').slice(0,100),title:s.title.slice(0,160),url:new URL(s.url,location.origin).href,version:String(s.version||'').slice(0,100),status:s.status==='historical'?'historical':'current'})):[];}
  function inline(target,text){for(const piece of text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g)){if(piece.startsWith('**')&&piece.endsWith('**'))target.append(el('strong','',piece.slice(2,-2)));else if(piece.startsWith('`')&&piece.endsWith('`'))target.append(el('code','',piece.slice(1,-1)));else if(piece.startsWith('*')&&piece.endsWith('*'))target.append(el('em','',piece.slice(1,-1)));else target.append(document.createTextNode(piece));}}
  function prose(text){const out=el('div','ws-answer-text');let list=null;for(const line of text.split('\n')){if(/^\s*[-*_]{3,}\s*$/.test(line)){list=null;out.append(el('hr'));continue;}const item=line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)/);if(item){if(!list){list=el('ul');out.append(list);}const li=el('li');inline(li,item[1]);list.append(li);}else{list=null;if(!line.trim())continue;const p=el(/^#{1,3}\s/.test(line)?'h3':'p');inline(p,line.replace(/^#{1,3}\s+/,''));out.append(p);}}return out;}
  function sourceVersion(source){const date=source.version.match(/(20\d{2}-\d{2}-\d{2})/);if(source.version.startsWith('web-')&&date)return 'Web game · reviewed '+new Date(date[1]+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});if(source.version.includes('preview.'))return 'Launcher · '+(source.version.match(/\d+\.\d+\.\d+-preview\.\d+/)?.[0]||source.version);return date?'Reviewed '+new Date(date[1]+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):source.version;}
  function showSources(sources){sourcesPanel.replaceChildren();const heading=el('div','ws-sources-heading');heading.append(el('h2','','Sources'),btn('×',()=>{sourcesPanel.hidden=true;ai.classList.remove('has-sources');},'ws-text-button'));heading.lastChild.setAttribute('aria-label','Close sources');sourcesPanel.append(heading);for(const s of validSources(sources)){const item=el('article'),link=el('a','',s.title);link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';item.append(link,el('small','',(s.status==='historical'?'Historical · ':'')+sourceVersion(s)));sourcesPanel.append(item);}sourcesPanel.hidden=false;ai.classList.add('has-sources');}
  function renderHistory(){history.replaceChildren();if(!threads.length)history.append(el('p','ws-empty-history','Your conversations will appear here.'));for(const t of threads){const row=el('div','ws-history-row'),open=btn(t.title,()=>{if(busy)return;active=t;spoilers.checked=false;errorLine.textContent='';sourcesPanel.hidden=true;ai.classList.remove('has-sources');render();shell.classList.remove('rc-nav-open');});open.setAttribute('aria-current',String(active?.id===t.id));open.disabled=busy;const remove=btn('×',()=>{if(busy)return;threads=threads.filter(v=>v.id!==t.id);if(active?.id===t.id)active=null;store();render();},'ws-delete-chat');remove.setAttribute('aria-label','Delete conversation: '+t.title);remove.disabled=busy;row.append(open,remove);history.append(row);}}
  function messageView(message,mode='idle'){
    const article=el('article','ws-chat-message ws-chat-'+message.role),heading=el('div','ws-chat-author'),answer=prose(message.content),footer=el('div');
    let rig=null;
    if(message.role==='assistant'){
      const icon=el('span','ws-chat-mascot');icon.setAttribute('aria-hidden','true');heading.append(icon);
      rig=window.repoWibsworthMascot?.mount(icon);if(rig){messageRigs.add(rig);rig.set(mode);}
    }
    heading.append(el('span','',message.role==='user'?'You':'Wibsworth'));article.append(heading,answer,footer);transcript.append(article);
    const view={article,answer,footer,rig};answerSources(view,message.sources);return view;
  }
  function answerSources(view,sources){view.footer.replaceChildren();if(sources?.length)view.footer.append(btn(sources.length+(sources.length===1?' source':' sources'),()=>showSources(sources),'ws-answer-sources'));}
  function render(){
    for(const rig of messageRigs)rig.destroy?.();messageRigs.clear();replyView=null;
    const messages=active?.messages||[];welcome.hidden=messages.length>0;transcript.hidden=messages.length===0;body.classList.toggle('has-conversation',messages.length>0);transcript.replaceChildren();
    for(const message of messages)messageView(message);
    if(busy){replyView=messageView({role:'assistant',content:''},'thinking');replyView.answer.append(el('p','ws-thinking','Having a think…'));}
    renderHistory();controls();requestAnimationFrame(()=>{transcript.scrollTop=transcript.scrollHeight;});
  }
  function revealAnswer(view,text,signal){
    view.answer.replaceChildren(...prose(text).childNodes);
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    if(motion.matches||document.hidden||!shell.open||shell.dataset.workspaceView!=='wibsworth')return Promise.resolve();
    const walker=document.createTreeWalker(view.answer,NodeFilter.SHOW_TEXT),parts=[];let node,total=0;
    while((node=walker.nextNode())){parts.push({node,text:node.textContent,start:total});total+=node.textContent.length;node.textContent='';}
    const blocks=[...view.answer.querySelectorAll('p,h3,ul,li,hr')];blocks.forEach(block=>block.hidden=true);
    return new Promise(resolve=>{
      let frame=0,finished=false;const started=performance.now(),duration=Math.min(7000,Math.max(450,total*7));
      const finish=()=>{
        if(finished)return;finished=true;cancelAnimationFrame(frame);signal.removeEventListener('abort',finish);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',finish);
        const follow=transcript.scrollHeight-transcript.scrollTop-transcript.clientHeight<80;
        if(view.article.isConnected){parts.forEach(part=>part.node.textContent=part.text);blocks.forEach(block=>block.hidden=false);if(follow)transcript.scrollTop=transcript.scrollHeight;}
        if(revealFinish===finish)revealFinish=null;resolve();
      };
      const visibility=()=>{if(document.hidden)finish();};
      const step=now=>{
        if(signal.aborted||!view.article.isConnected){finish();return;}
        const shown=Math.min(total,Math.ceil(total*(now-started)/duration)),follow=transcript.scrollHeight-transcript.scrollTop-transcript.clientHeight<80;
        for(const part of parts){if(part.start>=shown)break;const value=part.text.slice(0,shown-part.start);if(part.node.textContent!==value)part.node.textContent=value;for(let parent=part.node.parentElement;parent&&parent!==view.answer;parent=parent.parentElement)parent.hidden=false;}
        if(follow)transcript.scrollTop=transcript.scrollHeight;
        if(shown>=total)finish();else frame=requestAnimationFrame(step);
      };
      revealFinish=finish;signal.addEventListener('abort',finish,{once:true});document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',finish);frame=requestAnimationFrame(step);
    });
  }
  const allowanceReset=()=>Math.max(Number(state?.allowanceResetAt)||0,state?.usage?.available===false?Number(state.usage.blockedUntil)||0:0);
  const canAsk=()=>!!user&&(state?.available||allowanceReset()>0);
  const localDateTime=when=>new Date(when).toLocaleString('en-GB',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'});
  const allowanceReply=when=>({answer:"You're out of usage until "+localDateTime(when)+'.',sources:[],allowanceExhausted:true});
  function thinkUntil(when,signal){return new Promise((resolve,reject)=>{
    const stop=()=>{clearTimeout(timer);signal.removeEventListener('abort',stop);reject(new DOMException('Stopped','AbortError'));};
    const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve();},Math.max(0,when-performance.now()));
    if(signal.aborted)stop();else signal.addEventListener('abort',stop,{once:true});
  });}
  function controls(){sidebar.querySelector('.ws-ai-mascot')?.wibsworthLogo?.setSearching(busy);send.disabled=busy||retryUntil>Date.now()||!canAsk()||!input.value.trim();input.disabled=busy;stop.hidden=!busy;stop.textContent=revealing?'Show answer':'Stop';send.hidden=busy;transcript.setAttribute('aria-busy',String(busy));newChat.disabled=busy;status.textContent=busy?(revealing?'Writing…':'Having a think…'):canAsk()?'Your Repo Company companion':'Connection pending';note.textContent=canAsk()?'Conversations stay on this device. Wibsworth can make mistakes; check his sources.':state?.reason||'Checking Wibsworth’s connection…';}
  function showRetry(error){
    clearTimeout(retryTimer);retryUntil=error.retryAt;
    function tick(){
      const seconds=Math.max(0,Math.ceil((retryUntil-Date.now())/1000));
      errorLine.textContent=seconds?error.message+' Try again in '+seconds+'s.':error.message+' You can try again now.';
      controls();if(seconds)retryTimer=setTimeout(tick,250);else retryUntil=0;
    }
    tick();
  }
  function paintUsage(usage){
    const local=usage?.provider==='self-hosted',daily=local?usage:usage?.daily,used=Number(daily?.used)||0,limit=Number(daily?.limit)||0,percent=limit?Math.max(0,Math.min(100,used/limit*100)):0;
    meterTitle.textContent='Daily usage';meterTrack.setAttribute('aria-label',local?'Your daily AI allowance':'Shared daily AI allowance');
    meterFill.style.width=percent+'%';meterTrack.setAttribute('aria-valuenow',String(Math.round(percent)));meterTrack.setAttribute('aria-valuetext',limit?Math.round(100-percent)+'% of '+(local?'your':'shared')+' daily allowance remaining':'Daily allowance not connected');
    meterDetail.replaceChildren(el('span','',limit?local?Math.max(0,limit-used).toLocaleString()+' / '+limit.toLocaleString()+' messages left':Math.round(100-percent)+'% remaining · shared AI':'Not connected'));
    if(daily?.resetAt&&Number.isFinite(new Date(daily.resetAt).getTime())){const time=el('time','','Resets '+localDateTime(daily.resetAt));time.dateTime=new Date(daily.resetAt).toISOString();meterDetail.append(time);}
    if(local){meter.title='Your own 100-message allowance, refreshed at midnight UTC. Other members do not use your allowance. No per-message AI fee.';}
    if(usage?.exhaustedPeriod==='month'&&usage.blockedUntil)meterDetail.append(el('span','ws-ai-daily-pause','Monthly allowance reached · back '+localDateTime(usage.blockedUntil)));
  }
  async function api(route,payload,signal){const revision=epoch,id=user;if(!id)throw Error('Sign in to talk to Wibsworth.');const session=(await account.db.auth.getSession()).data?.session;if(revision!==epoch||id!==user||session?.user?.id!==id)throw Object.assign(Error('Account changed.'),{stale:true});const own=new AbortController();requests.add(own);const timeout=setTimeout(()=>own.abort(),115000),combined=signal?AbortSignal.any([signal,own.signal]):own.signal;try{const response=await fetch('/api/wibsworth/'+route,{method:payload===undefined?'GET':'POST',cache:'no-store',signal:combined,headers:{Authorization:'Bearer '+session.access_token,...(payload===undefined?{}:{'Content-Type':'application/json'})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});let data;try{data=await response.json();}catch{throw Error('Wibsworth’s connection is unavailable. Please try again shortly.');}if(revision!==epoch||id!==user)throw Object.assign(Error('Account changed.'),{stale:true});if(data.usage){if(state){state.usage=data.usage;if(data.usage.available===false){state.available=false;state.reason=data.error||data.reason||'Wibsworth’s allowance is resting until the reset.';}}paintUsage(data.usage);scheduleReset();}if(route==='chat'&&response.status===429&&Number(data.allowanceResetAt)>Date.now()){if(state)state.allowanceResetAt=Number(data.allowanceResetAt);scheduleReset();return {...allowanceReply(Number(data.allowanceResetAt)),usage:data.usage};}if(!response.ok)throw Object.assign(Error(data.error||'Wibsworth could not answer just now.'),{retryAt:route==='chat'&&Number.isFinite(data.retryAt)?Math.min(data.retryAt,Date.now()+120000):0});if(route==='chat'&&state&&data.usage?.available===true){state.available=true;state.reason='';delete state.allowanceResetAt;}return data;}finally{clearTimeout(timeout);requests.delete(own);}}
  function scheduleReset(){clearTimeout(usageTimer);const when=allowanceReset()||state?.usage?.daily?.resetAt||state?.usage?.resetAt;if(!user||!when)return;const revision=epoch;usageTimer=setTimeout(()=>{if(revision===epoch)refresh(true);},Math.min(2147483647,Math.max(1000,Number(when)-Date.now()+250)));}
  async function refresh(force=false){if(!user||loadingState||(!force&&Date.now()-lastState<30000))return;const revision=epoch;loadingState=true;try{state=await api('state');lastState=Date.now();paintUsage(state.usage);controls();}catch(e){if(!e.stale&&revision===epoch){state={available:false,reason:e.message};controls();}}finally{if(revision===epoch){loadingState=false;scheduleReset();}}}
  function recentHistory(messages){const result=[],encoder=new TextEncoder();const compact=m=>({role:m.role,content:new TextDecoder().decode(encoder.encode(m.content).slice(0,1400),{stream:true})});for(let i=messages.length-1;i>=0&&result.length<8;){let pair;if(messages[i].role==='assistant'&&messages[i-1]?.role==='user'){pair=[compact(messages[i-1]),compact(messages[i])];i-=2;}else if(messages[i].role==='user'){pair=[compact(messages[i])];i--;}else{i--;continue;}if(encoder.encode(JSON.stringify([...pair,...result])).length>8000)break;result.unshift(...pair);}return result;}
  function animate(mode){for(const host of shell.querySelectorAll('.ws-welcome-mascot'))host.wibsworthRig?.set(mode);}
  async function submit(event){
    event.preventDefault();const question=input.value.trim();if(busy||retryUntil>Date.now()||!question||!canAsk())return;
    const revision=epoch,id=++requestId,started=performance.now();controller=new AbortController();const signal=controller.signal;busy=true;revealing=false;errorLine.textContent='';let answered=false;
    if(!active){active={id:crypto.randomUUID(),title:question.slice(0,70),messages:[]};threads.unshift(active);threads=threads.slice(0,30);}
    const thread=active,previous=recentHistory(thread.messages);thread.messages.push({role:'user',content:question});input.value='';input.dispatchEvent(new Event('input'));store();render();animate('thinking');
    try{
      const reset=allowanceReset();
      const result=reset>Date.now()?allowanceReply(reset):await api('chat',{question,history:previous,context:thread.context,spoilers:spoilers.checked},signal);
      if(result.allowanceExhausted)await thinkUntil(started+2200,signal);
      if(revision!==epoch||id!==requestId)return;
      if(typeof result.answer!=='string'||!result.answer.trim())throw Error('Wibsworth did not finish that answer. Please try again.');
      const message={role:'assistant',content:result.answer.slice(0,16000),sources:validSources(result.sources)};
      thread.context=result.context??null;thread.messages.push(message);thread.messages=thread.messages.slice(-24);store();answered=true;revealing=true;controls();animate('found');
      const view=replyView;view.rig?.set('found');await revealAnswer(view,message.content,signal);
      if(revision!==epoch||id!==requestId)return;answerSources(view,message.sources);
      if(!signal.aborted)window.dashboardAudio?.effect('wibsworthComplete');
    }catch(e){
      if(!e.stale&&revision===epoch&&id===requestId){
        if(!answered){thread.messages.pop();input.value=question;input.dispatchEvent(new Event('input'));store();}
        errorLine.textContent=e.name==='AbortError'?'Stopped. Your question is back in the box.':e.message;if(e.retryAt>Date.now())showRetry(e);animate('idle');
      }
    }finally{
      if(revision===epoch&&id===requestId){busy=false;revealing=false;controller=null;revealFinish=null;if(answered){renderHistory();controls();}else render();input.focus({preventScroll:true});}
    }
  }
  form.onsubmit=submit;input.addEventListener('input',controls);input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
  newChat.onclick=()=>{if(busy)return;active=null;spoilers.checked=false;input.value='';input.dispatchEvent(new Event('input'));errorLine.textContent='';sourcesPanel.hidden=true;ai.classList.remove('has-sources');render();input.focus();};
  const dialog=el('dialog','ws-settings rc-page');dialog.setAttribute('aria-label','Wibsworth settings');shell.append(dialog);
  function field(label,control){const n=el('label','ws-setting-field');n.append(el('span','',label),control);return n;}
  function openSettings(){if(busy)return;dialog.replaceChildren();const header=el('header');header.append(el('h2','','Wibsworth settings'),btn('×',()=>dialog.close(),'ws-text-button'));header.lastChild.setAttribute('aria-label','Close Wibsworth settings');dialog.append(header);const message=el('p','ws-setting-status');message.setAttribute('role','status');const enabled=el('input');enabled.type='checkbox';enabled.checked=!!state?.settings?.memoryEnabled;const preference=el('textarea');preference.rows=4;preference.maxLength=600;preference.value=state?.settings?.preferences||'';preference.placeholder='For example: I prefer beginner-friendly builds and short answers.';preference.disabled=!enabled.checked;enabled.onchange=()=>{preference.disabled=!enabled.checked;};const memoryLabel=el('label','ws-setting-check');memoryLabel.append(enabled,document.createTextNode('Remember my preferences'));dialog.append(memoryLabel,el('p','ws-settings-note','Only preferences you save here are remembered. Turning this off deletes them. Chat history is kept on this device, separately from memory.'),field('My preferences',preference));const save=btn('Save preferences',async()=>{save.disabled=true;try{const data=await api('memory',{enabled:enabled.checked,preferences:enabled.checked?preference.value:''});state={...state,settings:data.settings||data};message.textContent=enabled.checked?'Preferences saved.':'Memory is off and saved preferences have been removed.';}catch(e){if(!e.stale)message.textContent=e.message;}finally{save.disabled=false;}},'ws-primary');dialog.append(save,message);const privacy=el('details','ws-settings-details');privacy.append(el('summary','','About your questions'),el('p','','Your question, recent conversation and enabled preferences are processed by Repo Company’s self-hosted Wibsworth model. Private Wibs messages are not included. Conversations do not automatically become shared knowledge. Each member has 100 messages per day, resetting at midnight UTC; an accepted request counts even if the answer fails or is stopped.'),btn('Clear conversations on this device',()=>{threads=[];active=null;store();render();message.textContent='Conversations cleared on this device.'},'ws-text-button'));dialog.append(privacy);
    const correction=el('details','ws-settings-details');correction.append(el('summary','','Suggest a correction'));const product=el('select');for(const [id,name]of[['site','Website / launcher'],['account','Account'],['demos','Demo collection'],['wibs','Wibs'],['wibsworth','Wibsworth'],['reparty','Reparty'],['morogue','Morogue'],['moratales','Moratales'],['manager','Velmora Manager'],['sports','Repo Sports'],['runners','Repo Runners'],['broomflight','Broomflight'],['dragonbound','Dragonbound'],['diver','Repo Diver'],['goblin','Goblin Bomb Party'],['rooftops','Repo Rooftops'],['seas','High Seas']]){const o=el('option','',name);o.value=id;product.append(o);}const text=el('textarea');text.rows=3;text.maxLength=1200;const source=el('input');source.type='url';source.placeholder='https://repocompany.uk/…';correction.append(field('About',product),field('Suggested fact or correction',text),field('Official source link',source),el('p','ws-settings-note','I’ll check it against the available official references. A developer must approve new shared facts before I use them.'));const suggest=btn('Send for review',async()=>{suggest.disabled=true;try{const data=await api('correction',{product:product.value,text:text.value,sourceUrl:source.value});message.textContent='Thank you — your suggestion is saved for review. '+(data.verification?.summary||'It hasn’t changed shared knowledge yet.');text.value='';source.value='';}catch(e){if(!e.stale)message.textContent=e.message;}finally{suggest.disabled=false;}},'ws-primary');correction.append(suggest);dialog.append(correction);if(state?.developer){const review=el('details','ws-settings-details');review.append(el('summary','','Developer review'));if(state.maintenance?.pricingReviewDueAt){const date=new Date(state.maintenance.pricingReviewDueAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});review.append(el('p','','AI pricing review due '+date+'. Answers pause then until the provider’s free allowance and cost estimate have been checked.'));}const rows=el('div');review.append(btn('Load pending suggestions',async()=>{try{const data=await api('corrections');rows.replaceChildren();for(const entry of (data.corrections||data.items||[])){const row=el('article','ws-review-row');row.append(el('strong','',entry.product),el('p','',entry.text),el('p','',entry.sourceUrl||entry.source_url||''));if(entry.verification){const evidence=el('details','ws-settings-details');evidence.append(el('summary','','Reference check'),el('p','',entry.verification.summary||'Needs review'));for(const ref of entry.verification.references||[]){evidence.append(el('strong','',ref.title),el('p','',ref.text),el('p','',ref.url));}row.append(evidence);}const spoiler=el('input');spoiler.type='checkbox';spoiler.checked=true;const spoilerLabel=el('label','ws-setting-check');spoilerLabel.append(spoiler,document.createTextNode('Contains story spoilers'));row.append(spoilerLabel);for(const action of ['approve','reject'])row.append(btn(action==='approve'?'Approve fact':'Reject',async()=>{try{await api('review',{id:entry.id,action,spoiler:spoiler.checked});row.remove();message.textContent=action==='approve'?'Fact approved.':'Suggestion rejected.';}catch(e){if(!e.stale)message.textContent=e.message;}},'ws-text-button'));rows.append(row);}if(!rows.children.length)rows.append(el('p','','No pending suggestions.'));}catch(e){if(!e.stale)message.textContent=e.message;}},'ws-text-button'),rows);dialog.append(review);}if(!dialog.open)dialog.showModal();}
  shell.querySelector('.rc-sidebar-bottom')?.addEventListener('click',event=>{if(shell.dataset.workspaceView==='wibsworth'&&event.target.closest('.rc-account-settings')){event.stopImmediatePropagation();openSettings();}},true);
  document.addEventListener('repo-workspace-view',()=>{if(revealing&&shell.dataset.workspaceView!=='wibsworth')revealFinish?.();if(shell.dataset.workspaceView==='wibsworth'){refresh();if(busy&&!revealing){animate('thinking');replyView?.rig?.set('thinking');}}});
  addEventListener('focus',()=>{if(shell.open&&shell.dataset.workspaceView==='wibsworth')refresh();});
  addEventListener('repo-account-state',()=>{const id=account.state.user?.id||null;if(id===user)return;epoch++;requestId++;clearTimeout(usageTimer);clearTimeout(retryTimer);retryUntil=0;for(const r of requests)r.abort();controller?.abort();controller=null;user=id;busy=false;revealing=false;loadingState=false;state=null;lastState=0;sourcesPanel.hidden=true;ai.classList.remove('has-sources');dialog.close();dialog.replaceChildren();try{input.value=user?localStorage.getItem('repo-wibsworth-draft:'+user)||'':'';}catch{input.value='';}spoilers.checked=false;errorLine.textContent='';animate('idle');paintUsage(null);load();if(user&&shell.dataset.workspaceView==='wibsworth')refresh(true);});
  load();paintUsage(null);if(shell.dataset.workspaceView==='wibsworth')refresh(true);
})();
