(() => {
  'use strict';
  window.__REPO_DIVER_BUILD__='v18-1.2-deep-signal-gameplay-polish-20260816';

  const $ = id => document.getElementById(id);
  const D = window.RepoDiverData;
  const E = window.RepoDiverEngine;
  const A = window.RepoDiverAudio || {setScene(){},update(){},ui(){},setVolume(){},toggleMute(){return false},get volume(){return .58}};
  // V18.1 economy pass: future Repo Diver GP payouts are ~20% lower.
  // The server catalog uses the same tuning; this constant keeps the live service UI honest.
  const DIVER_GP_TUNING=.80;

  let profile = {
    day_number: 1,
    level: 1,
    unlocked_biomes: ['karamja'],
    equipment: { tank: 1, cargo: 1, harpoon: 1, suit: 1, boost: 1 },
    restaurant: { rank: 1, tables: 3, kitchen: 1 },
    fish_journal: {}, recipes: [], stats: {}
  };
  let run = null;
  let runId = null;
  let raf = 0;
  let serviceRaf = 0;
  let last = 0;
  let input = {};
  let mouse = { x: 480, y: 270 };
  let selectedRecipes = [];
  let service = null;
  let restaurantRenderSig = { orders: '', scene: '' };
  let noticeEl = null;
  let lastRecentCatchSerial = 0;
  let discoveryTimer = 0;
  let restaurantTheme = 'harbour';
  let servicePreviewEvent = null;
  let career = {chapter:1,relationships:{},boat:{hull:1,engine:1,sonar:1,storage:1,crane:1,lab:1},titles:['Rookie Diver'],active_title:'Rookie Diver',contract_status:[],research:{photos:0,observations:0},weather:{id:'clear',name:'CLEAR WATER',effect:'Balanced expedition conditions.'},endgame:{prestige_xp:0,descent_best:0,bosses:{},variants:{},materials:{scrap:0,alloy:0,crystal:0,shard:0,vent:0},crafted:{}},mastery:{}};
  let sharedWorld={available:false,feed:[],community_stats:{},records:{},hall_of_fame:{},legacy:[],tournament_archive:[],tournament:null,community_event:null,season:null,named_specimen:null,my_public_profile:true};
  let ecologyState={observations:[],tags:[],observation_count:0,tag_count:0};
  let explorationState={locations:[],artifacts:[],discovered_count:0,completed_count:0,artifact_count:0};
  let campaignState={available:false,current_mission:null,act:1,stage:0,active_run_id:null,completed_missions:[],story_artifacts:[],mission_grades:{},flags:{},missions:[],artifacts:[],firsts:[]};
  let postgameState={unlocked:false,renown:0,rank:'VETERAN DIVER',atlas:{},trophies:[],timeline:[],expeditions:[],projects:[],master_stats:{completed:0,s_ranks:0,best_score:0},cosmetics:{unlocked:[],active:{}},daily_expedition_id:null,weekly_expedition_id:null,epilogue_operations:[]};
  let masterDifficulty='veteran';
  let campaignBusy=false,campaignRadioTimer=0;
  let specialistTools=['cutter','scanner','dive_line'];
  let explorationBusy=false;
  let sharedWorldLoadedAt=0,sharedWorldLoading=null;
  let myVerifiedCatches=[],myFeaturedCatchId=null,myVerifiedLoaded=false,currentPublicUsername=null;
  let expeditionTime = 'day';
  let cameraBusy = false;
  let expeditionMode='standard', expeditionModifier='balanced', expeditionHarpoon='precision', expeditionLure='balanced';
  const SETTINGS_KEY='repoDiverV11Settings';
  const PENDING_SAVE_KEY='repoDiverPendingCompletionV11';
  const DEV_MODE=(()=>{try{return new URLSearchParams(location.search).has('repoDiverDev')||localStorage.getItem('repoDiverDev')==='1'}catch(_){return false}})();
  const DEFAULT_SETTINGS={shake:1,flash:1,uiScale:1,graphics:'high',highContrast:false,tutorial:true,storyAssist:false,reducedMotion:false,autoPause:true,controllerSensitivity:1,sfx:.92,ambience:.28,music:.24};
  let settings={...DEFAULT_SETTINGS,...(()=>{try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch(_){return{}}})()};
  let paused=false,photoMode=false,transitionTimer=0,pendingConfirm=null,lastContextKey='',tutorialState={...(()=>{try{return JSON.parse(localStorage.getItem('repoDiverTutorialV11')||'{}')}catch(_){return{}}})()};
  let rewardQueue=[],rewardShowing=false,saveStateTimer=0;
  let harbourFocusReturn=null,settingsFocusReturn=null,harbourLayoutTimer=0;
  let journalFilters={query:'',biome:'all',rarity:'all',status:'all'};

  function setSaveState(text='SAVED',type='ok'){const el=$('rdSaveState');if(!el)return;el.textContent=text;el.dataset.type=type;el.classList.add('show');clearTimeout(saveStateTimer);saveStateTimer=setTimeout(()=>el.classList.remove('show'),1800)}
  async function retryPendingSave(){let pending=null;try{pending=JSON.parse(localStorage.getItem(PENDING_SAVE_KEY)||'null')}catch(_){}if(!pending?.run_id)return false;setSaveState('RETRYING SAVE…','saving');try{await rpc('repo_diver_complete_day',{p_run_id:pending.run_id,p_catches:pending.catches||[],p_dishes:pending.dishes||[],p_max_depth:pending.max_depth||0,p_customers:pending.customers||0});localStorage.removeItem(PENDING_SAVE_KEY);setSaveState('RECOVERED SAVE','ok');return true}catch(e){setSaveState('SAVE PENDING','warning');return false}}
  function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}catch(_){}applySettings()}
  function applySettings(){const d=$('repoDiverDialog');if(!d)return;d.style.setProperty('--rd-ui-scale',String(settings.uiScale||1));d.dataset.graphics=settings.graphics||'high';d.classList.toggle('rd-high-contrast',!!settings.highContrast);d.classList.toggle('rd-reduced-motion',!!settings.reducedMotion);d.dataset.inputMode=inputMode;try{A.setMix?.({sfx:settings.sfx,ambience:settings.ambience,music:settings.music})}catch(_){}}
  function focusFirstControl(root){if(!root)return;const el=root.querySelector('button:not([disabled]),select:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])');if(el){try{el.focus({preventScroll:true})}catch(_){el.focus?.()}el.scrollIntoView?.({block:'nearest',inline:'nearest'})}}
  function showSettings(){settingsFocusReturn=document.activeElement;applySettings();$('rdSettingsOverlay')?.classList.remove('hidden');syncSettingsControls();requestAnimationFrame(()=>focusFirstControl($('rdSettingsOverlay')))}
  function hideSettings(){$('rdSettingsOverlay')?.classList.add('hidden');const back=settingsFocusReturn;settingsFocusReturn=null;if(back?.isConnected){requestAnimationFrame(()=>{try{back.focus({preventScroll:true})}catch(_){back.focus?.()}})}}
  function syncSettingsControls(){const pairs=[['rdSfxVolume','sfx'],['rdAmbVolume','ambience'],['rdMusicVolume','music']];for(const [id,key] of pairs){if($(id))$(id).value=Math.round(Number(settings[key]??DEFAULT_SETTINGS[key])*100)}if($('rdUiScale'))$('rdUiScale').value=String(settings.uiScale||1);if($('rdShake'))$('rdShake').value=String(settings.shake??1);if($('rdFlashIntensity'))$('rdFlashIntensity').value=String(settings.flash??1);if($('rdGraphics'))$('rdGraphics').value=settings.graphics||'high';if($('rdHighContrast'))$('rdHighContrast').checked=!!settings.highContrast;if($('rdTutorialTips'))$('rdTutorialTips').checked=settings.tutorial!==false;if($('rdStoryAssist'))$('rdStoryAssist').checked=!!settings.storyAssist;if($('rdReducedMotion'))$('rdReducedMotion').checked=!!settings.reducedMotion;if($('rdAutoPause'))$('rdAutoPause').checked=settings.autoPause!==false;if($('rdControllerSensitivity'))$('rdControllerSensitivity').value=String(settings.controllerSensitivity||1);if($('rdInputDevice'))$('rdInputDevice').textContent=inputMode==='gamepad'?'GAMEPAD ACTIVE':'KEYBOARD / MOUSE';const mv=Math.round((A.volume||.58)*100);if($('rdMasterVolume'))$('rdMasterVolume').value=mv;if($('rdMasterValue'))$('rdMasterValue').textContent=mv+'%';for(const [id,key] of [['rdSfxValue','sfx'],['rdAmbValue','ambience'],['rdMusicValue','music']])if($(id))$(id).textContent=Math.round(Number(settings[key]||0)*100)+'%'}
  function saveTutorial(){try{localStorage.setItem('repoDiverTutorialV11',JSON.stringify(tutorialState))}catch(_){}}
  function contextTip(key,label,keycap=''){if(settings.tutorial===false||tutorialState[key]||lastContextKey===key)return;const el=$('rdDiveContext');if(!el)return;lastContextKey=key;el.innerHTML=`${keycap?`<kbd>${keycap}</kbd>`:''}<span>${label}</span>`;el.classList.remove('hidden');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.add('hidden'),4200)}
  function markTutorial(key){tutorialState[key]=true;saveTutorial();if(lastContextKey===key){$('rdDiveContext')?.classList.add('hidden');lastContextKey=''}}
  function cinematic(title,sub='',seconds=1.35){const el=$('rdCinematicOverlay');if(!el)return;el.querySelector('b').textContent=title;el.querySelector('span').textContent=sub;el.classList.add('show');clearTimeout(transitionTimer);const duration=settings.reducedMotion?Math.min(.48,seconds):seconds;transitionTimer=setTimeout(()=>el.classList.remove('show'),duration*1000)}
  function showConfirm(title,text,onConfirm){pendingConfirm=typeof onConfirm==='function'?onConfirm:null;if($('rdConfirmTitle'))$('rdConfirmTitle').textContent=title||'CONFIRM ACTION';if($('rdConfirmText'))$('rdConfirmText').textContent=text||'Are you sure?';$('rdConfirmOverlay')?.classList.remove('hidden')}
  function hideConfirm(){pendingConfirm=null;$('rdConfirmOverlay')?.classList.add('hidden')}
  function enqueueReward(payload){rewardQueue.push(payload);pumpRewardQueue()}
  function pumpRewardQueue(){if(rewardShowing||!rewardQueue.length)return;rewardShowing=true;const item=rewardQueue.shift(),card=$('rdDiscoveryCard');if(!card){rewardShowing=false;return}card.dataset.rarity=item.rarity||'common';card.innerHTML=`<small>${item.kicker||'EXPEDITION RECORD'}</small><b>${item.title||''}</b><span>${item.meta||''}</span><strong>${item.value||''}</strong>${item.delta?`<em>${item.delta}</em>`:''}`;card.classList.add('show');setTimeout(()=>{card.classList.remove('show');setTimeout(()=>{rewardShowing=false;pumpRewardQueue()},260)},item.duration||2300)}
  function setPaused(next,reason='PAUSED'){paused=!!next;if(service)service.paused=paused;const diving=run&&!$('rdDiveView')?.classList.contains('hidden'),serving=!!service?.active&&!$('rdRestaurantView')?.classList.contains('hidden');const ov=$('rdPauseOverlay'),sov=$('rdServicePauseOverlay');if(ov)ov.classList.toggle('hidden',!(paused&&diving&&!photoMode));if(sov)sov.classList.toggle('hidden',!(paused&&serving));if(paused){input={};$('rdPauseOverlay')?.querySelector('h2')&&($('rdPauseOverlay').querySelector('h2').textContent=reason)}else{last=performance.now();if(service)service.last=performance.now();try{$('rdDiveCanvas')?.focus({preventScroll:true})}catch(_){}}}
  function togglePhotoMode(){if(!run||$('rdDiveView')?.classList.contains('hidden'))return;photoMode=!photoMode;const view=$('rdDiveView');view?.classList.toggle('photo-mode',photoMode);$('rdPhotoModeOverlay')?.classList.toggle('hidden',!photoMode);if(photoMode){setPaused(true,'PHOTO MODE');$('rdPauseOverlay')?.classList.add('hidden')}else setPaused(false)}
  function setAction(action,active=true){const on=!!active;switch(action){case'move_up':input.up=on;break;case'move_down':input.down=on;break;case'move_left':input.left=on;break;case'move_right':input.right=on;break;case'boost':input.boost=on;break;case'reel':input.reel=on;break;}return input}

  // V17 Release Candidate input layer: keyboard/mouse and standard Gamepad API share one action model.
  let inputMode='keyboard',gamepadRaf=0,gamepadPrev=[],gamepadNavAt=0,gamepadAim={x:480,y:270},gamepadConnected=false,inputModeChangedAt=0,lastPointerPoint=null;
  const GAMEPAD_DEADZONE=.18, INPUT_MODE_HYSTERESIS_MS=420;
  function setInputMode(mode,force=false){mode=mode==='gamepad'?'gamepad':'keyboard';const now=performance.now();if(inputMode===mode)return;if(!force&&now-inputModeChangedAt<INPUT_MODE_HYSTERESIS_MS)return;inputMode=mode;inputModeChangedAt=now;applySettings();syncInputHints();syncSettingsControls()}
  function syncInputHints(){const help=document.querySelector('#rdDiveView .rd-dive-help'),photo=$('rdPhotoModeOverlay')?.querySelector('small');if(help)help.textContent=inputMode==='gamepad'?'LEFT STICK MOVE · RIGHT STICK AIM · RT HARPOON · RB BOOST · LB SONAR · Y CAMERA · X TAG · A INTERACT · LT REEL · START PAUSE':'WASD MOVE · MOUSE AIM · CLICK HARPOON · SHIFT BOOST · Q SONAR · C RESEARCH CAMERA · R TAG CREATURE · X RELEASE CATCH · E INTERACT / SALVAGE · SPACE REEL · P PHOTO MODE · ESC PAUSE';if(photo)photo.textContent=inputMode==='gamepad'?'START · RETURN TO EXPEDITION':'P · RETURN TO EXPEDITION';const dev=$('rdInputDevice');if(dev)dev.textContent=inputMode==='gamepad'?'GAMEPAD ACTIVE':'KEYBOARD / MOUSE'}
  function gpAxis(v){v=Number(v||0);const a=Math.abs(v);if(a<GAMEPAD_DEADZONE)return 0;return Math.sign(v)*Math.min(1,(a-GAMEPAD_DEADZONE)/(1-GAMEPAD_DEADZONE))}
  function gpButton(gp,i){const b=gp?.buttons?.[i];return !!(b&&(b.pressed||Number(b.value||0)>.55))}
  function gpRising(gp,i){return gpButton(gp,i)&&!gamepadPrev[i]}
  function clearControllerInput(){input.moveX=0;input.moveY=0;if(inputMode==='gamepad'){setAction('boost',false);setAction('reel',false)}}
  function visibleFocusable(){const root=$('repoDiverDialog');if(!root)return[];return [...root.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>{if(el.id==='rdDiveCanvas')return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('.hidden')})}
  function focusByDirection(dx,dy){const list=visibleFocusable();if(!list.length)return;let cur=document.activeElement;if(!list.includes(cur)){list[0].focus({preventScroll:true});list[0].scrollIntoView({block:'nearest',inline:'nearest'});return}const a=cur.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2;let best=null,bestScore=Infinity;for(const el of list){if(el===cur)continue;const b=el.getBoundingClientRect(),bx=b.left+b.width/2,by=b.top+b.height/2,rx=bx-ax,ry=by-ay;if(dx<0&&rx>=-2||dx>0&&rx<=2||dy<0&&ry>=-2||dy>0&&ry<=2)continue;const primary=Math.abs(dx?rx:ry),cross=Math.abs(dx?ry:rx),score=primary+cross*1.8;if(score<bestScore){bestScore=score;best=el}}if(best){best.focus({preventScroll:true});best.scrollIntoView({block:'nearest',inline:'nearest'})}}
  function gamepadBack(){if(!$('rdConfirmOverlay')?.classList.contains('hidden'))return hideConfirm();if(!$('rdSettingsOverlay')?.classList.contains('hidden'))return hideSettings();if(!$('rdPublicDiverCard')?.classList.contains('hidden'))return $('rdPublicDiverCard')?.classList.add('hidden');if(run&&!$('rdDiveView')?.classList.contains('hidden')){if(photoMode)return togglePhotoMode();return setPaused(!paused)}const sub=['rdExpeditionPanel','rdQuestPanel','rdCampaignPanel','rdLegacyPanel','rdContractPanel','rdBoatPanel','rdResearchPanel','rdEndgamePanel','rdProfilePanel','rdCommunityPanel'].some(id=>!$(id)?.classList.contains('hidden'));if(sub)return returnToHarbour();if(!$('rdJournalPanel')?.classList.contains('hidden')||!$('rdUpgradePanel')?.classList.contains('hidden')){document.querySelector('[data-rd-back]')?.click();return}}
  function pollGamepads(now=performance.now()){gamepadRaf=requestAnimationFrame(pollGamepads);if(!$('repoDiverDialog')?.open||!navigator.getGamepads)return;const gp=[...navigator.getGamepads()].find(Boolean);if(!gp){gamepadConnected=false;clearControllerInput();return}gamepadConnected=true;const lx=gpAxis(gp.axes?.[0]),ly=gpAxis(gp.axes?.[1]),rx=gpAxis(gp.axes?.[2]),ry=gpAxis(gp.axes?.[3]);const strongAxis=Math.max(Math.abs(lx),Math.abs(ly),Math.abs(rx),Math.abs(ry))>.48;const freshButton=(gp.buttons||[]).some((b,i)=>!!(b&&(b.pressed||Number(b.value||0)>.55))&&!gamepadPrev[i]);if(strongAxis||freshButton)setInputMode('gamepad');const diving=!!run&&!$('rdDiveView')?.classList.contains('hidden');const blocking=!$('rdSettingsOverlay')?.classList.contains('hidden')||!$('rdConfirmOverlay')?.classList.contains('hidden')||paused||photoMode;const sens=Math.max(.6,Math.min(1.8,Number(settings.controllerSensitivity||1)));if(diving&&!blocking){input.moveX=lx;input.moveY=ly;setAction('boost',gpButton(gp,5));setAction('reel',gpButton(gp,6));if(Math.abs(rx)+Math.abs(ry)>.04){gamepadAim.x=Math.max(0,Math.min(960,(run.player?.x||480)+rx*310*sens));gamepadAim.y=Math.max(0,Math.min(540,(run.player?.y||270)+ry*220*sens));mouse.x=gamepadAim.x;mouse.y=gamepadAim.y}if(gpRising(gp,7)){E.harpoon(run,mouse,profile.equipment);markTutorial('harpoon')}if(gpRising(gp,4)){useSonarReadout();markTutorial('sonar')}if(gpRising(gp,0)){if(!interactExploration())E.interact(run,profile.equipment);markTutorial('salvage')}if(gpRising(gp,3)){takePhoto();markTutorial('camera')}if(gpRising(gp,2)){tagCreature();markTutorial('tag')}if(gpRising(gp,9))setPaused(true)}else{clearControllerInput();const navReady=now>=gamepadNavAt;if(navReady){let dx=0,dy=0;if(gpRising(gp,14)||lx<-.72)dx=-1;else if(gpRising(gp,15)||lx>.72)dx=1;else if(gpRising(gp,12)||ly<-.72)dy=-1;else if(gpRising(gp,13)||ly>.72)dy=1;if(dx||dy){focusByDirection(dx,dy);gamepadNavAt=now+170}}if(gpRising(gp,0)){if(service?.active&&service.cook)hitCook();else{const el=document.activeElement;if(el&&el!==document.body)el.click?.()}}if(gpRising(gp,1))gamepadBack();if(gpRising(gp,9)&&diving)setPaused(!paused)}gamepadPrev=(gp.buttons||[]).map(b=>!!(b.pressed||Number(b.value||0)>.55))}
  function startGamepadLoop(){if(gamepadRaf)return;gamepadRaf=requestAnimationFrame(pollGamepads)}
  function stopGamepadLoop(){cancelAnimationFrame(gamepadRaf);gamepadRaf=0;clearControllerInput()}
  async function toggleFullscreen(){const target=$('repoDiverDialog');try{if(!document.fullscreenElement){if(target?.requestFullscreen)await target.requestFullscreen()}else if(document.exitFullscreen)await document.exitFullscreen()}catch(err){$('rdStatus').textContent='Fullscreen is unavailable in this browser.'}syncFullscreenButton()}
  function syncFullscreenButton(){const b=$('rdFullscreenButton');if(b)b.textContent=document.fullscreenElement?'EXIT FULLSCREEN':'FULLSCREEN'}

  const db = () => window.db || window.__QD_HOST__?.getDb?.();
  function friendlyRpcError(error){const raw=String(error?.message||error||'Repo Diver service error');if(/failed to fetch|networkerror|fetch failed|load failed/i.test(raw))return 'Could not reach Repo Diver services. Your current progress will remain pending and can be retried.';if(/duplicate key|unique constraint/i.test(raw))return 'That result has already been recorded.';if(/jwt|not authenticated|must be logged in|session/i.test(raw))return 'Your RepoCompany session needs refreshing before Repo Diver can save.';if(/sqlstate|pgrst|schema cache|permission denied|relation .*does not exist|column .*does not exist|violates .*constraint/i.test(raw))return 'Repo Diver could not complete that action. Your saved career has not been overwritten.';return raw.replace(/^error:\s*/i,'').slice(0,180)}
  async function rpc(name, args = {}) {
    const client = db();
    if (!client) throw new Error('Repo Diver services are not available right now.');
    const { data, error } = await client.rpc(name, args);
    if (error) { console.warn(`[Repo Diver RPC ${name}]`, error); throw new Error(friendlyRpcError(error)); }
    return data;
  }

  function rdEsc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
  function repoDiverErrorRelevant(err,filename=''){const text=`${filename||''} ${err?.stack||''} ${err?.message||err||''}`;return /assets\/repo-diver\/|RepoDiver|repo_diver/i.test(text)}
  function hideRecoveryOverlay(){document.querySelector('#repoDiverDialog .rd-fatal-recovery')?.remove()}
  function showRecoveryOverlay(err){const dialog=$('repoDiverDialog');if(!dialog?.open)return;let ov=dialog.querySelector('.rd-fatal-recovery');if(!ov){ov=document.createElement('section');ov.className='rd-fatal-recovery';ov.innerHTML='<div><small>SAFE RECOVERY</small><h2>REPO DIVER ENCOUNTERED A PROBLEM</h2><p>The game stopped this screen before it could cascade into a broken session. Server-authoritative progress has not been overwritten.</p><span data-rd-recovery-code></span><footer><button type="button" data-rd-recovery-harbour>RETURN TO HARBOUR</button><button type="button" data-rd-recovery-reload>RELOAD GAME</button></footer></div>';dialog.appendChild(ov);ov.querySelector('[data-rd-recovery-harbour]')?.addEventListener('click',()=>{hideRecoveryOverlay();cancelAnimationFrame(raf);cancelAnimationFrame(serviceRaf);input={};paused=false;photoMode=false;if(service)service.active=false;run=null;runId=null;show('rdHomeView');renderHome();loadProfile()});ov.querySelector('[data-rd-recovery-reload]')?.addEventListener('click',()=>location.reload())}const code=ov.querySelector('[data-rd-recovery-code]');if(code)code.textContent=String(err?.message||'Unexpected Repo Diver error').slice(0,160)}

  function socialAgo(ts){if(!ts)return '';const s=Math.max(0,(Date.now()-new Date(ts).getTime())/1000);if(s<60)return 'JUST NOW';if(s<3600)return Math.floor(s/60)+'M AGO';if(s<86400)return Math.floor(s/3600)+'H AGO';return Math.floor(s/86400)+'D AGO'}
  function socialUser(name){const raw=String(name||'Diver'),n=rdEsc(raw);return `<button type="button" class="rd-social-user" data-rd-public-profile="${n}">${n}</button>`}
  async function loadSharedWorld(force=false){
    if(!force&&sharedWorld.available&&Date.now()-sharedWorldLoadedAt<45000)return sharedWorld;
    if(sharedWorldLoading)return sharedWorldLoading;
    sharedWorldLoading=Promise.all([rpc('repo_diver_get_shared_world'),rpc('repo_diver_get_tournament_archive').catch(()=>[])]).then(([data,archive])=>{sharedWorld={...sharedWorld,...(data||{}),tournament_archive:Array.isArray(archive)?archive:[],available:true};sharedWorldLoadedAt=Date.now();renderSharedWorld();renderCareerHub();return sharedWorld}).catch(err=>{console.warn('Repo Diver community:',err?.message||err);sharedWorld={...sharedWorld,available:false,error:err?.message||'Community services unavailable'};renderSharedWorld();return sharedWorld}).finally(()=>{sharedWorldLoading=null});
    return sharedWorldLoading;
  }
  async function loadMyVerifiedCatches(force=false){
    if(myVerifiedLoaded&&!force)return myVerifiedCatches;
    try{const r=await rpc('repo_diver_get_my_verified_catches');myVerifiedCatches=Array.isArray(r?.catches)?r.catches:[];myFeaturedCatchId=r?.featured_catch_id??null;myVerifiedLoaded=true;renderProfile();return myVerifiedCatches}catch(err){console.warn('Repo Diver trophy cabinet:',err?.message||err);return myVerifiedCatches}
  }
  function trophyName(c){return `${c?.variant&&c.variant!=='normal'?String(c.variant).toUpperCase()+' ':''}${c?.name||'Verified Catch'}`}

  function activityCopy(a){
    const p=a?.payload||{},u=socialUser(a?.username||'Diver');
    if(a?.kind==='world_record'){const fish=p?.detail?.fish_name||p?.detail?.fish_id;return `${u} set a world record${fish?` with <b>${rdEsc(fish)}</b>`:''}${p.value?` at <strong>${Number(p.value).toLocaleString()}${p.category==='species_weight'?' KG':''}</strong>`:''}.`}
    if(a?.kind==='rare_variant')return `${u} discovered a <b>${rdEsc(String(p.variant||'rare').toUpperCase())} ${rdEsc(p.fish_name||'specimen')}</b>${p.weight_kg?` · ${Number(p.weight_kg).toFixed(2)} KG`:''}.`;
    if(a?.kind==='ancient_victory')return `${u} completed an Ancient hunt against <b>${rdEsc(D.fishById(p.boss_id)?.name||p.boss_id||'an Ancient creature')}</b>.`;
    if(a?.kind==='first_ancient')return `${u} became the <b>first recorded diver</b> to complete ${rdEsc(p.fish_name||D.fishById(p.boss_id)?.name||'an Ancient encounter')}.`;
    if(a?.kind==='first_discovery')return `${u} made the <b>first verified discovery</b> of ${rdEsc(p.fish_name||D.fishById(p.fish_id)?.name||'a new species')}.`;
    if(a?.kind==='perfect_photo')return `${u} filed a perfect research photograph of <b>${rdEsc(p.fish_name||'a marine specimen')}</b>.`;
    if(a?.kind==='named_specimen')return `${u} found the named specimen <b>${rdEsc(p.name||'UNKNOWN')}</b>${p.weight_kg?` at ${Number(p.weight_kg).toFixed(2)} KG`:''}.`;
    return `${u} landed <b>${rdEsc(p.fish_name||'a notable catch')}</b>${p.weight_kg?` · ${Number(p.weight_kg).toFixed(2)} KG`:''}.`;
  }
  function recordCard(label,row,unit=''){
    if(!row)return `<article class="empty"><small>${label}</small><b>NO HOLDER YET</b><span>The next verified expedition can claim it.</span></article>`;
    const val=row.value??row.quality??0,suffix=unit||row.unit||'';return `<article><small>${label}</small><b>${socialUser(row.username)}</b><strong>${Number(val).toLocaleString()}${suffix?` ${rdEsc(suffix)}`:''}</strong>${row.fish_name?`<span>${rdEsc(row.fish_name)}</span>`:''}</article>`;
  }
  function renderSharedWorld(){
    const el=$('rdCommunity');if(!el)return;
    if(!sharedWorld.available){el.innerHTML=`<div class="rd-community-offline"><small>THE SHARED OCEAN</small><h3>COMMUNITY SERVICES UNAVAILABLE</h3><p>Repo Diver itself is still fully playable. The Tideboard will reconnect automatically next time you enter the harbour.</p><button data-rd-community-refresh>RETRY COMMUNITY LINK</button></div>`;return;}
    const s=sharedWorld.season||{},ev=sharedWorld.community_event||{},t=sharedWorld.tournament||{},stats=sharedWorld.community_stats||{},records=sharedWorld.records||{},hall=sharedWorld.hall_of_fame||{},named=sharedWorld.named_specimen;
    const board=Array.isArray(t.leaderboard)?t.leaderboard:[];
    const halls=[['DEEPEST DIVER',hall.deepest_diver],['GREATEST CATCH',hall.greatest_catch],['ANCIENT HUNTER',hall.ancient_hunter],['MARINE RESEARCHER',hall.marine_researcher],['MASTER CHEF',hall.master_chef],['FISH HOUSE LEGEND',hall.fish_house_legend],['DESCENT CHAMPION',hall.descent_champion],['COMPLETIONIST',hall.completionist]];
    const latest=(sharedWorld.feed||[])[0],leader=board[0],heavy=records.heaviest_catch;
    const latestHeadline=latest?activityCopy(latest):'The Tideboard is waiting for the next verified legend.';
    el.innerHTML=`<section class="rd-community-hero"><div><small>REPO DIVER SHARED OCEAN</small><h2>${rdEsc(s.name||'LIVE HARBOUR')}</h2><p>${rdEsc(s.subtitle||'Verified records and ocean activity from RepoCompany divers.')}</p></div><div class="rd-community-live"><i></i><b>LIVE</b><span>${Number(stats.active_divers_28d||0)} ACTIVE DIVERS</span></div></section>
      <section class="rd-repo-tide"><div class="rd-paper-masthead"><small>THE REPO TIDE</small><b>HARBOUR EDITION</b><span>VERIFIED STORIES · SERVER TIME</span></div><div class="rd-paper-grid"><article><small>LEAD STORY</small><h3>${rdEsc(ev.title||'THE SHARED OCEAN')}</h3><p>Community progress stands at <b>${Math.round(Number(ev.pct||0))}%</b>. ${Number(ev.my_contribution||0)>0?`You have contributed ${Number(ev.my_contribution).toLocaleString()}.`:'Every verified expedition can move the harbour forward.'}</p></article><article><small>TOURNAMENT DESK</small><h3>${rdEsc(t.title||'WEEKLY OPEN')}</h3><p>${leader?`${socialUser(leader.username)} currently leads with <b>${Number(leader.value||0).toLocaleString()} ${rdEsc(leader.unit||'')}</b>.`:'No qualifying entry yet — the first verified result takes the board.'}</p></article><article><small>RECORD WATCH</small><h3>${heavy?rdEsc(heavy.fish_name||'GREATEST CATCH'):'THE BOOKS ARE OPEN'}</h3><p>${heavy?`${socialUser(heavy.username)} holds the heaviest verified catch at <b>${Number(heavy.value||0).toLocaleString()} KG</b>.`:'Complete a new expedition to begin the live record book.'}</p></article><article><small>LATEST FROM THE DOCKS</small><h3>RECENT LEGEND</h3><p>${latestHeadline}</p></article></div></section>
      <div class="rd-community-upper">
        <section class="rd-community-event"><small>COMMUNITY EXPEDITION</small><h3>${rdEsc(ev.title||'OCEAN SURVEY')}</h3><p>${rdEsc(ev.desc||'Every verified expedition contributes.')}</p><div class="rd-community-progress"><i style="width:${Math.min(100,Number(ev.pct||0))}%"></i></div><footer><b>${Number(ev.progress||0).toLocaleString()} / ${Number(ev.target||0).toLocaleString()}</b><span>YOUR CONTRIBUTION ${Number(ev.my_contribution||0).toLocaleString()}</span></footer></section>
        <section class="rd-tournament-card"><small>WEEKLY TOURNAMENT</small><h3>${rdEsc(t.title||'TOURNAMENT PREPARING')}</h3><p>${rdEsc(t.target_name||'Validated expeditions only.')}</p><div class="rd-tournament-board">${board.length?board.map((x,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><span>${socialUser(x.username)}</span><strong>${Number(x.value||0).toLocaleString()} ${rdEsc(x.unit||'')}</strong></article>`).join(''):'<span class="rd-community-empty">No qualifying result yet. First verified result takes the board.</span>'}</div></section>
      </div>
      ${named?`<section class="rd-named-specimen"><div class="rd-named-mark"><i></i></div><div><small>GLOBAL NAMED SIGHTING</small><h3>${rdEsc(named.name)}</h3><p>${rdEsc(named.fish_name)} · ${rdEsc(D.biome(named.biome)?.name||named.biome)}. ${named.caught_by?`History made by ${rdEsc(named.caught_by)}.`:'Still at large. The whole RepoCompany ocean can encounter it.'}</p></div><button data-rd-community-expedition="${rdEsc(named.biome)}" ${named.caught_by?'disabled':''}>${named.caught_by?'ARCHIVED':'HUNT THE SIGHTING'}</button></section>`:''}
      <div class="rd-community-columns">
        <section class="rd-tideboard"><header><div><small>THE TIDEBOARD</small><h3>RECENT LEGENDS</h3></div><button data-rd-community-refresh>REFRESH</button></header><div>${(sharedWorld.feed||[]).length?(sharedWorld.feed||[]).map(a=>`<article><i data-kind="${rdEsc(a.kind)}"></i><p>${activityCopy(a)}</p><time>${socialAgo(a.created_at)}</time></article>`).join(''):'<div class="rd-community-empty">The board is quiet. Significant catches, records and Ancient victories will appear here.</div>'}</div></section>
        <section class="rd-world-records"><header><small>WORLD RECORDS</small><h3>CURRENT HOLDERS</h3></header><div>${recordCard('HEAVIEST VERIFIED CATCH',records.heaviest_catch,'KG')}${recordCard('DEEPEST DESCENT',records.deepest_descent,'M')}${recordCard('HIGHEST EXPEDITION SCORE',records.highest_score,'PTS')}${recordCard('BEST RESEARCH PHOTO',records.best_photo,'★')}</div></section>
      </div>
      <section class="rd-hall"><header><small>REPO DIVER HALL OF FAME</small><h3>THE HARBOUR REMEMBERS</h3></header><div>${halls.map(([label,row])=>recordCard(label,row)).join('')}</div></section>
      <section class="rd-community-stats"><article><small>FISH CAUGHT</small><b>${Number(stats.total_fish||0).toLocaleString()}</b></article><article><small>MARINE ARCHIVE</small><b>${Number(stats.species_documented||0)} / ${Number(stats.species_total||D.FISH.length)}</b></article><article><small>ANCIENT HUNTS</small><b>${Number(stats.ancient_hunts||0).toLocaleString()}</b></article><article><small>DEEPEST EXPEDITION</small><b>${Number(stats.deepest_expedition||0).toLocaleString()}M</b></article><article><small>GOLDEN SPECIMENS</small><b>${Number(stats.golden_specimens||0).toLocaleString()}</b></article><article><small>FISH HOUSE GUESTS</small><b>${Number(stats.customers_served||0).toLocaleString()}</b></article></section>
      <section class="rd-legacy"><header><small>REPO DIVER LEGACY</small><h3>RECORD HISTORY</h3></header><div>${(sharedWorld.legacy||[]).slice(0,14).map(x=>`<article><span>${rdEsc(x.detail?.fish_name||x.category.replaceAll('_',' ').toUpperCase())}</span><b>${socialUser(x.username)}</b><strong>${Number(x.value||0).toLocaleString()}${x.category==='species_weight'?' KG':''}</strong><time>${socialAgo(x.achieved_at)}</time></article>`).join('')||'<div class="rd-community-empty">Legacy history begins here.</div>'}</div></section>
      <section class="rd-champions-archive"><header><small>TOURNAMENT ARCHIVE</small><h3>PAST HARBOUR CHAMPIONS</h3></header><div>${(sharedWorld.tournament_archive||[]).filter(x=>x.winner).slice(0,8).map(x=>`<article><small>${rdEsc(String(x.week_start||''))}</small><h4>${rdEsc(x.title||'TOURNAMENT')}</h4><b>${socialUser(x.winner)}</b><strong>${Number(x.winner_value||0).toLocaleString()} ${rdEsc(x.podium?.[0]?.unit||'')}</strong></article>`).join('')||'<div class="rd-community-empty">No completed V12 tournament has a verified champion yet.</div>'}</div></section>`;
  }
  function publicReactionMarkup(r={}){
    const counts=r.counts||{},mine=new Set(r.mine||[]),defs=[['impressive_catch','IMPRESSIVE CATCH'],['great_aquarium','GREAT AQUARIUM'],['beautiful_fish_house','BEAUTIFUL FISH HOUSE'],['legendary_diver','LEGENDARY DIVER']];
    return `<section class="rd-public-guestbook"><div><small>FISH HOUSE GUESTBOOK</small><h3>REPOCOMPANY REACTIONS</h3><p>Preset reactions only — no public free-text wall.</p></div><div>${defs.map(([id,label])=>`<button data-rd-public-reaction="${id}" ${!r.can_react||mine.has(id)?'disabled':''}><span>${label}</span><b>${Number(counts[id]||0).toLocaleString()}</b>${mine.has(id)?'<em>LEFT BY YOU</em>':''}</button>`).join('')}</div></section>`;
  }
  async function openPublicDiver(username){
    const card=$('rdPublicDiverCard'),body=$('rdPublicDiverContent');if(!card||!body)return;
    currentPublicUsername=String(username||'');card.classList.remove('hidden');body.innerHTML='<div class="rd-community-loading">LOADING VERIFIED DIVER PROFILE…</div>';
    try{
      const [p,reactions]=await Promise.all([rpc('repo_diver_get_public_profile',{p_username:currentPublicUsername}),rpc('repo_diver_get_public_reactions',{p_username:currentPublicUsername}).catch(()=>({}))]);
      if(p?.private){body.innerHTML=`<section class="rd-public-private"><small>REPO DIVER PROFILE</small><h3>${rdEsc(p.username)}</h3><p>This diver has chosen to keep their Repo Diver career private.</p></section>`;return;}
      const f=p.featured_catch,ph=p.featured_photo;
      body.innerHTML=`<section class="rd-public-hero"><div class="rd-public-avatar"><i></i></div><div><small>${rdEsc(p.active_title||'DIVER')}</small><h2>${rdEsc(p.username)}</h2><p>DAY ${Number(p.day||1)} · ${Number(p.species||0)}/${Number(p.species_total||D.FISH.length)} SPECIES · FISH HOUSE RANK ${Number(p.fish_house_rank||1)}</p></div></section>
        <div class="rd-public-stats"><article><small>DEEPEST</small><b>${Number(p.deepest||0).toLocaleString()}M</b></article><article><small>DESCENT PB</small><b>${Number(p.descent_best||0).toLocaleString()}M</b></article><article><small>ANCIENT HUNTS</small><b>${Number(p.ancient_hunts||0).toLocaleString()}</b></article><article><small>PRESTIGE XP</small><b>${Number(p.prestige_xp||0).toLocaleString()}</b></article><article><small>MASTERY</small><b>${Number(p.mastery_total||0).toLocaleString()}</b></article><article><small>FISH HOUSE REP</small><b>${Number(p.fish_house_reputation||0).toLocaleString()}</b></article></div>
        ${f?`<section class="rd-featured-catch"><small>FEATURED CATCH</small><h3>${rdEsc(f.variant&&f.variant!=='normal'?String(f.variant).toUpperCase()+' '+f.name:f.name)}</h3><b>${Number(f.weight_kg||0).toFixed(2)} KG · ★${Number(f.quality||1)}</b><span>${rdEsc(D.biome(f.biome)?.name||f.biome)} · ${rdEsc(String(f.rarity||'').toUpperCase())}</span></section>`:'<section class="rd-featured-catch empty"><small>FEATURED CATCH</small><h3>NO VERIFIED TROPHY SELECTED</h3></section>'}
        ${ph?`<section class="rd-featured-photo"><small>FEATURED RESEARCH</small><h3>${rdEsc(ph.fish_name)}</h3><b>★${Number(ph.quality||1)} FIELD PHOTOGRAPH</b></section>`:''}
        ${p.social_badges&&Object.values(p.social_badges).some(Boolean)?`<section class="rd-public-badges"><small>SHARED OCEAN HONOURS</small><div>${p.social_badges.record_breaker?'<span>RECORD BREAKER</span>':''}${p.social_badges.champion?'<span>HARBOUR CHAMPION</span>':''}${p.social_badges.pioneer?'<span>PIONEER</span>':''}${p.social_badges.legacy_diver?'<span>LEGACY DIVER</span>':''}</div></section>`:''}
        ${p.postgame_unlocked?`<section class="rd-v16-public-legacy"><div><small>LIVING POSTGAME</small><h3>${rdEsc(p.renown_rank||'VETERAN DIVER')}</h3><p>The Deep Signal complete · veteran career active.</p></div><div><span><b>${Number(p.renown||0).toLocaleString()}</b> RENOWN</span><span><b>${Number(p.master_expeditions||0)}</b> MASTER EXPEDITIONS</span><span><b>${Number(p.master_s_ranks||0)}</b> S RANKS</span><span><b>${Number(p.tournament_wins||0)}</b> TOURNAMENT WINS</span><span><b>${Number(p.world_record_entries||0)}</b> RECORD ENTRIES</span></div></section>`:''}
        ${publicReactionMarkup(reactions)}`;
    }catch(err){body.innerHTML=`<div class="rd-community-offline"><h3>PROFILE UNAVAILABLE</h3><p>${rdEsc(err?.message||'Could not load this diver.')}</p></div>`}
  }


  function show(id) {
    const ids=['rdHomeView','rdDiveView','rdSurfaceView','rdRestaurantView','rdResultsView'];
    ids.forEach(x=>{const el=$(x);if(!el)return;el.classList.toggle('hidden',x!==id);if(x===id){el.classList.remove('rd-view-enter');void el.offsetWidth;el.classList.add('rd-view-enter')}});
    if(id!=='rdDiveView'){photoMode=false;paused=false;$('rdPhotoModeOverlay')?.classList.add('hidden');$('rdPauseOverlay')?.classList.add('hidden')}
    try{A.setScene(id,run)}catch(_){}
  }

  function rankName(n) {
    return ['DOCKSIDE SHACK','LOCAL FAVOURITE','HARBOUR KITCHEN','COASTAL DINING','SEAFOOD HOUSE','REGIONAL FAVOURITE','FINE DINING','VELMORAN DESTINATION','MASTER FISH HOUSE','LEGENDARY RESTAURANT'][Math.max(0, Math.min(9, (n || 1) - 1))];
  }

  function ensureDiveNotice() {
    if (noticeEl) return noticeEl;
    const wrap = $('rdDiveCanvas')?.parentElement;
    if (!wrap) return null;
    noticeEl = document.createElement('div');
    noticeEl.className = 'rd-dive-notice';
    noticeEl.setAttribute('aria-live', 'polite');
    wrap.appendChild(noticeEl);
    return noticeEl;
  }

  async function loadProfile() {
    try { await retryPendingSave(); } catch (_) {}
    try {
      const [p,c,eco,explore,campaign,postgame,epilogues] = await Promise.all([rpc('repo_diver_get_profile'),rpc('repo_diver_get_career_state').catch(()=>null),rpc('repo_diver_get_ecology_state').catch(()=>null),rpc('repo_diver_get_exploration_state').catch(()=>null),rpc('repo_diver_get_campaign_state').catch(()=>null),rpc('repo_diver_get_postgame_state').catch(()=>null),rpc('repo_diver_get_crew_epilogues').catch(()=>[])]);
      profile = p || profile;if(eco)ecologyState={...ecologyState,...eco};if(explore)explorationState={...explorationState,...explore};if(campaign)campaignState={...campaignState,...campaign};if(postgame)postgameState={...postgameState,...postgame};if(Array.isArray(epilogues))postgameState.epilogue_operations=epilogues;normalizePostgameAtlas();
      if((profile.day_number||1)>3&&!Object.keys(tutorialState).length){tutorialState={move:true,harpoon:true,sonar:true,salvage:true,camera:true,firstCatch:true};saveTutorial();}
      if(c) career={...career,...c};setSaveState('SAVED','ok');
    } catch (e) { console.warn(e); setSaveState('SAVE PENDING','warning'); }
    renderHome();
    loadSharedWorld(false);
  }


  const CAMPAIGN_STAGE_LABELS={
    signal_in_shallows:['FIND THE BUOY','MAP THE WRECK','TRACE THE PULSE','RECOVER THE LOG','REPORT THE SIGNAL'],
    silence_at_erebos:['LOCATE EREBOS','RESTORE ACCESS','ENTER SERVICE BAY','RESTORE POWER','REACH RESEARCH CORE','OPEN OBSERVATION DOME','RECOVER THE BLACKBOX'],
    below_charted_depths:['CROSS THE CHART EDGE','DESCEND PAST 180M','FOLLOW THE DEEP RETURN','REACH 420M AND SURFACE'],
    the_deep_signal:['LEAVE THE CHART','PASS 220M','FIND THE STRUCTURE','DESCEND PAST 430M','APPROACH THE SOURCE','PING THE SOURCE · THEN RETURN']
  };
  function campaignMission(id=campaignState.current_mission){return (campaignState.missions||[]).find(x=>x.id===id)||D.campaignMission?.(id)||null}
  function campaignActName(act){return D.DEEP_SIGNAL_ACTS?.find(x=>Number(x.id)===Number(act))?.name||'THE DEEP SIGNAL'}
  function campaignCrewName(id){return D.npc?.(id)?.name||D.campaignCrew?.(id)?.id?.toUpperCase()||String(id||'CREW').toUpperCase()}
  function campaignStageLabel(m,stage=campaignState.stage){const custom=CAMPAIGN_STAGE_LABELS[m?.id]||[];if(custom[stage])return custom[stage];if(m?.location_id){const loc=D.locationById?.(m.location_id);if(stage===0)return `LOCATE ${loc?.name||'MISSION SITE'}`;if(stage>=Number(m.stage_count||5)-1)return 'SECURE THE PRIMARY OBJECTIVE';return `PUSH INTO CHAMBER ${stage+1}`;}return `MISSION STAGE ${Math.min(Number(m?.stage_count||1),Number(stage||0)+1)}`}
  function campaignRecap(){const last=campaignState.flags?.last_completed;if(!last)return 'A repeating signal has begun appearing where no charted source exists.';const m=campaignMission(last);if(!m)return 'The evidence board is filling, but the source remains below the known ocean.';const next=campaignMission();return `${m.title} is secured. ${next&&next.id!==m.id?`The crew is preparing for ${next.title}.`:'The crew is waiting on the next lead.'}`}
  function campaignRadio(speaker,text,duration=null){
    const el=$('rdCampaignRadio');if(!el)return;
    const copy=String(text||'');
    // Dialogue used to disappear in barely four seconds, often underneath the mission reveal.
    // Give every radio call a readable minimum and scale longer lines by actual copy length.
    const readable=Math.min(12000,Math.max(6500,3200+copy.length*48));
    const hold=Math.max(readable,Number(duration)||0);
    el.classList.remove('hidden');el.innerHTML=`<small>${rdEsc(String(speaker||'TIDELINE').toUpperCase())}</small><b>${rdEsc(copy)}</b>`;
    clearTimeout(campaignRadioTimer);campaignRadioTimer=setTimeout(()=>el.classList.add('hidden'),hold);
    try{A.play?.('radio')}catch(_){}
  }
  function campaignDialogueFor(id,m){const lines={darro:'The sea rewards patience. Whatever this is, don’t chase it faster than we can understand it.',lyra:'That isn’t random noise. It’s repeating.',orin:'If the lights go out, give me ten seconds before you decide we are all doomed.',ivar:'That symbol predates the city around it. By a lot.',cass:'Nothing personal. I’m still getting there first.',sella:'I can get you a route. I cannot make the ocean approve of it.',mara:'You lot find the impossible thing. I’ll keep dinner warm.'};if(m?.id==='silence_at_erebos'&&id==='orin')return 'No surface power. Emergency circuit only. Erebos should be dead.';if(m?.id==='silence_at_erebos'&&id==='lyra')return 'The station received the same pulse before it went dark. I want the lower archive.';if(m?.id==='the_deep_signal'&&id==='lyra')return 'Signal just doubled. Something moved.';return lines[id]||D.npc(id)?.intro||'The harbour is waiting.'}
  async function refreshCampaignState(render=true){try{const x=await rpc('repo_diver_get_campaign_state');if(x)campaignState={...campaignState,...x};if(render){renderCareerHub();renderCampaign();}return campaignState}catch(e){console.warn('Repo Diver campaign:',e?.message||e);return campaignState}}
  function renderCampaign(){const el=$('rdCampaign');if(!el)return;if(!campaignState.available){el.innerHTML=`<section class="rd-campaign-locked"><small>THE DEEP SIGNAL</small><h3>THE DEEP WATER HAS NOT CALLED YET</h3><p>The main campaign unlocks at Diver Day 12. Continue the harbour career, improve the Tideline and learn the water first.</p><b>DAY ${Number(profile.day_number||1)} / 12</b></section>`;return;}
    const active=campaignMission(),completed=new Set(campaignState.completed_missions||[]),stage=Number(campaignState.stage||0),stageCount=Number(active?.stage_count||1),pct=Math.round(Math.min(100,stage/stageCount*100)),unlocked=(profile.unlocked_biomes||[]).includes(active?.biome),crew=(active?.crew||[]).map(campaignCrewName),tools=(active?.recommended_tools||[]).map(id=>D.EXPLORATION_TOOLS?.find(x=>x.id===id)?.name||String(id).replaceAll('_',' ').toUpperCase());
    const evidence=(campaignState.artifacts||[]).map(a=>`<article class="${a.recovered?'found':'unknown'}"><i></i><small>${a.recovered?'RECOVERED EVIDENCE':'UNRESOLVED'}</small><b>${a.recovered?rdEsc(a.name):'UNKNOWN SIGNAL EVIDENCE'}</b><p>${a.recovered?rdEsc(a.clue_text):'No verified evidence recovered from this lead yet.'}</p></article>`).join('');
    const acts=(D.DEEP_SIGNAL_ACTS||[]).map(act=>{const ms=(campaignState.missions||[]).filter(m=>Number(m.act)===Number(act.id));return `<section class="rd-campaign-act"><header><span>ACT ${act.id}</span><b>${rdEsc(act.name)}</b></header>${ms.map(m=>{const done=completed.has(m.id),isActive=m.id===campaignState.current_mission,grade=campaignState.mission_grades?.[m.id]||'';return `<article class="rd-campaign-mission ${done?'complete':isActive?'active':'locked'}"><span>${String(m.order||0).padStart(2,'0')}</span><div><b>${rdEsc(m.title)}</b><small>${rdEsc(D.biome(m.biome)?.name||m.biome)}${m.location_id?` · ${rdEsc(D.locationById?.(m.location_id)?.name||'AUTHORED SITE')}`:''}</small></div><em>${done?`${rdEsc(grade||'A')} · COMPLETE`:isActive?'ACTIVE':'LOCKED'}</em>${done?`<button data-rd-campaign-replay="${rdEsc(m.id)}">REPLAY</button>`:''}</article>`}).join('')}</section>`}).join('');
    const crewCards=(D.CAMPAIGN_CREW||[]).map(c=>{const n=D.npc(c.id),onMission=(active?.crew||[]).includes(c.id);return `<article class="rd-campaign-crew-card ${onMission?'active':''}" style="--crew:${n?.tone||'#7ebcc0'}"><div class="rd-campaign-crew-sprite"><i class="head"></i><i class="body"></i></div><div><small>${rdEsc(c.role)}</small><b>${rdEsc(n?.name||c.id)}</b><p>${rdEsc(c.duty)}</p></div></article>`}).join('');
    const firsts=(campaignState.firsts||[]).length?campaignState.firsts.map(x=>`<article><small>${rdEsc(String(x.achievement||'LEGACY').replaceAll('_',' ').toUpperCase())}</small><b>${rdEsc(x.username||'Diver')}</b><span>${x.achieved_at?new Date(x.achieved_at).toLocaleDateString('en-GB'):''}</span></article>`).join(''):'<article class="empty"><small>CAMPAIGN LEGACY</small><b>NO FIRSTS RECORDED YET</b><span>The archive is waiting for history.</span></article>';
    el.innerHTML=`<section class="rd-campaign-hero"><div class="signal-rings"><i></i><i></i><i></i></div><div><small>ACT ${Number(active?.act||campaignState.act||1)} · ${rdEsc(campaignActName(active?.act||campaignState.act))}</small><h3>${rdEsc(active?.title||'THE DEEP SIGNAL')}</h3><p>${rdEsc(active?.description||'The source remains below the charted sea.')}</p><div class="rd-campaign-progress"><i style="width:${pct}%"></i></div><span>${rdEsc(campaignStageLabel(active,stage))} · ${stage}/${stageCount} CHECKPOINTS</span></div><aside><small>MISSION BRIEF</small><b>${rdEsc(D.biome(active?.biome)?.name||'UNKNOWN WATER')}</b><span>${active?.min_depth?`${Number(active.min_depth)}M MINIMUM DEPTH`:(active?.location_id?rdEsc(D.locationById?.(active.location_id)?.name||'AUTHORED SITE'):'FIELD OPERATION')}</span><span>${tools.length?`TOOLS · ${rdEsc(tools.join(' / '))}`:'STANDARD LOADOUT'}</span><span>${crew.length?`CREW · ${rdEsc(crew.join(' / '))}`:'TIDELINE CREW'}</span><button data-rd-campaign-launch="${rdEsc(active?.id||'')}" ${!active||!unlocked?'disabled':''}>${unlocked?'LAUNCH STORY EXPEDITION':'REGION NOT YET UNLOCKED'}</button></aside></section><section class="rd-campaign-recap"><small>PREVIOUSLY</small><p>${rdEsc(campaignRecap())}</p></section><section class="rd-campaign-section"><header><small>THE EVIDENCE BOARD</small><h4>WHAT WE KNOW</h4></header><div class="rd-campaign-evidence">${evidence}</div></section><section class="rd-campaign-section"><header><small>R.C. TIDELINE</small><h4>CORE CREW</h4></header><div class="rd-campaign-crew-grid">${crewCards}</div></section><section class="rd-campaign-section"><header><small>EXPEDITION ARCHIVE</small><h4>THE DEEP SIGNAL · 25 MISSIONS</h4></header><div class="rd-campaign-acts">${acts}</div></section><section class="rd-campaign-section"><header><small>LEGACY ARCHIVE</small><h4>FIRSTS BELOW THE CHARTS</h4></header><div class="rd-campaign-firsts">${firsts}</div></section>`;
  }
  async function launchCampaignMission(id,replay=false){const m=campaignMission(id);if(!m)return;specialistTools=[...(m.recommended_tools||[])].slice(0,3);expeditionMode='standard';const loc=m.location_id||null;returnToHarbour();await startDive(m.biome,loc,m.id,replay)}
  async function syncCampaignCheckpoint(expected,opts={}){if(!run?.campaign||run.campaign.replay||campaignBusy)return null;if(Number(expected)<=Number(run.campaign.stage||0))return null;campaignBusy=true;try{const r=await rpc('repo_diver_campaign_checkpoint',{p_run_id:runId,p_mission_id:run.campaign.id,p_expected_stage:Number(expected)});run.campaign.stage=Number(r?.stage||expected);if(r?.completed){run.campaign.completed=true;E.banner?.(run,'MISSION COMPLETE',`${run.campaign.title} · RETURN WHEN READY`,'success',3.6);try{A.play?.('campaign_reveal')}catch(_){}enqueueReward({kicker:'THE DEEP SIGNAL',title:run.campaign.title,meta:'AUTHORED MISSION COMPLETE',value:'A · MISSION GRADE',delta:r?.reward_artifact?'NEW EVIDENCE RECOVERED':'THE EVIDENCE BOARD HAS UPDATED',rarity:'ancient',duration:3400});await refreshCampaignState(false);}return r}catch(e){E.notice?.(run,e?.message||'CAMPAIGN CHECKPOINT FAILED','warning',2);return null}finally{campaignBusy=false}}
  async function catchUpCampaignSite(site){if(!run?.campaign||run.campaign.replay||run.campaign.location_id!==site.id)return;const state=explorationLocationState(site.id),m=run.campaign;let desired=1;if(state.completed)desired=Number(m.stage_count||5);else if(m.id==='silence_at_erebos')desired=Math.min(5,1+Number(state.stage||0));else desired=Math.min(4,1+Math.min(3,Number(state.stage||0)));for(let s=Number(m.stage||0)+1;s<=desired;s++)await syncCampaignCheckpoint(s);if(m.id==='silence_at_erebos'&&state.completed&&Number(m.stage||0)<7){await syncCampaignCheckpoint(6);campaignRadio('LYRA · TIDELINE','Something just crossed the observation glass.',5200);cinematic('STATION EREBOS','OBSERVATION DOME · CONTACT OUTSIDE THE GLASS',2.2);try{A.play?.('deep_signal')}catch(_){}await new Promise(r=>setTimeout(r,850));await syncCampaignCheckpoint(7)}}
  function updateCampaignDive(dt){if(!run?.campaign||run.campaign.replay||run.campaign.completed)return;const m=run.campaign,stage=Number(m.stage||0),depth=Number(run.maxDepth||0),elapsed=Number(run.elapsed||0);if(m.type==='depth'){const targets=[[8,0],[16,180],[24,320],[32,420]];const next=targets[stage];if(next&&elapsed>=next[0]&&depth>=next[1]){void syncCampaignCheckpoint(stage+1);if(stage===0)campaignRadio('DARRO · TIDELINE','Chart edge behind us. Keep the ascent route in your head.');if(stage===2)campaignRadio('LYRA · TIDELINE','The return is below us now. Strong and clean.');}}else if(m.type==='finale'){const targets=[[8,0],[16,220],[24,330],[32,430],[40,500]];if(stage<5){const next=targets[stage];if(next&&elapsed>=next[0]&&depth>=next[1]){void syncCampaignCheckpoint(stage+1).then(()=>{if(stage===0)campaignRadio('CASS · FIELD DIVER','Nothing personal. I still got here first.');if(stage===2)campaignRadio('IVAR · TIDELINE','That structure is not a ruin. It is still aligned.');if(stage===4){m.sonarBaseline=Number(run.stats?.sonars||0);campaignRadio('LYRA · TIDELINE','Signal just doubled. Something moved.',5200);try{A.play?.('deep_signal')}catch(_){}}});}}else if(stage===5&&depth>=520&&Number(run.stats?.sonars||0)>Number(m.sonarBaseline??run.stats?.sonars??0)){void syncCampaignCheckpoint(6).then(()=>{campaignRadio('DARRO · TIDELINE','We have the source. Do not chase it. Bring us home.',5200);E.banner?.(run,'THE SOURCE ANSWERED','OBSERVATION COMPLETE · RETURN TO THE TIDELINE','ancient',5)})}}}
  function campaignObjectiveMarkup(){const m=run?.campaign;if(m){const stage=Number(m.stage||0),count=Number(m.stage_count||1);return {act:`ACT ${m.act} · ${campaignActName(m.act)}`,title:m.title,stage:m.replay?'ARCHIVE REPLAY':m.completed?'MISSION COMPLETE':campaignStageLabel(m,stage),progress:`${Math.min(stage,count)} / ${count}`}}const mx=run?.master;if(mx)return {act:`${String(mx.difficulty||'veteran').toUpperCase()} · ${String(mx.source||'free').toUpperCase()} MASTER OP`,title:mx.title,stage:masterObjectiveText(mx),progress:masterObjectiveProgress()};return null}


  const POSTGAME_CREW_LINES={
    darro:'The chart ends in fewer places than it used to. That does not make the sea smaller.',
    lyra:'I am trying very hard not to call the Signal a migration cue. The data keeps making that difficult.',
    orin:'The Tideline survived below the charts. I am now emotionally attached to several bulkheads.',
    ivar:'Finishing the expedition did not finish the questions. Archaeologists call that job security.',
    cass:'Story is over. Good. Now we can race without somebody discovering an apocalypse halfway through.',
    sella:'Half the harbour wants a tour. The other half wants a permit. I regret making you famous.',
    mara:'You finished the impossible expedition. Lovely. Table six still wants their haddock.'
  };
  const POSTGAME_COSMETICS={
    tideline_classic:{name:'TIDELINE CLASSIC',slot:'hull'},research_hull:{name:'INSTITUTE SURVEY HULL',slot:'hull'},
    signal_banner:{name:'BELOW THE CHARTS',slot:'banner'},survey_banner:{name:'SURVEY CORPS',slot:'banner'},velmoran_banner:{name:'VELMORAN MASTER',slot:'banner'},master_expedition_banner:{name:'MASTER EXPEDITION',slot:'banner'},
    standard:{name:'STANDARD DIVE SUIT',slot:'suit'},ancient_hunter_suit:{name:'ANCIENT HUNTER SUIT',slot:'suit'},rivalry_suit:{name:'ROOK RIVALRY SUIT',slot:'suit'},velmoran_legend_suit:{name:'VELMORAN LEGEND SUIT',slot:'suit'},
    veteran_hull:{name:'VETERAN TIDELINE HULL',slot:'hull'},champion_hull:{name:'HARBOUR CHAMPION HULL',slot:'hull'},velmoran_master_hull:{name:'VELMORAN MASTER HULL',slot:'hull'},
    command_banner:{name:'TIDELINE COMMAND',slot:'banner'},quill_archive_banner:{name:'QUILL GRAND ARCHIVE',slot:'banner'},harbour_legacy_banner:{name:'HARBOUR LEGACY',slot:'banner'},
    tideline_depth_marks:{name:'CHART-EDGE DEPTH MARKS',slot:'decor'},engine_room_plaque:{name:'ENGINE ROOM S-RANK PLAQUE',slot:'decor'},archive_plaque:{name:'RESTORED ARCHIVE PLAQUE',slot:'decor'},legacy_table_set:{name:'LEGACY CREW TABLE SET',slot:'decor'},ocean_crown_service:{name:'OCEAN CROWN SERVICE',slot:'decor'}
  };
  function postgameExpedition(id){return (postgameState.expeditions||[]).find(x=>x.expedition_id===id)||null}
  function postgameUnlocked(){return !!postgameState.unlocked}
  function renownNext(){const r=Number(postgameState.renown||0),tiers=[0,500,1500,3000,5000,7500,10000];let lo=0,hi=500;for(let i=0;i<tiers.length-1;i++){if(r>=tiers[i]){lo=tiers[i];hi=tiers[i+1]}}return {lo,hi,pct:Math.min(100,Math.max(0,(r-lo)/Math.max(1,hi-lo)*100))}}
  function atlasPercent(){const vals=Object.values(postgameState.atlas||{}).filter(x=>x&&Number(x.total)>0);if(!vals.length)return 0;return vals.reduce((a,x)=>a+Math.min(1,Number(x.current||0)/Math.max(1,Number(x.total||1))),0)/vals.length*100}
  function postgameSecretCount(){let n=0;const variants=career.endgame?.variants||{};if(Object.keys(variants).some(k=>k.endsWith(':golden')&&Number(variants[k])>0))n++;if(Number(career.endgame?.descent_best||0)>=600)n++;const a=postgameState.atlas||{};if(Number(a.locations?.current||0)>=Number(a.locations?.total||9999))n++;if(Number(a.archaeology?.current||0)>=Number(a.archaeology?.total||9999))n++;if(Number(a.ancients?.current||0)>=Number(a.ancients?.total||9999))n++;return n}
  function normalizePostgameAtlas(){if(!postgameState.atlas)return;postgameState.atlas={...postgameState.atlas,secrets:{current:postgameSecretCount(),total:5,hidden:true}}}
  function crewEpilogueFor(id){const ops=(postgameState.epilogue_operations||[]).filter(x=>x.crew_id===id).sort((a,b)=>a.step-b.step);return ops.find(x=>x.claimable)||ops.find(x=>x.unlocked&&!x.claimed)||ops.find(x=>!x.claimed)||ops[ops.length-1]||null}
  function tidelineRoomInfo(room){const map={bridge:['BRIDGE','Master Expedition charts, daily operations and the route history from Below the Charts.'],sonar:['SONAR STATION','Rare sightings, migration calls and record-class contacts are tracked here.'],lab:['RESEARCH BENCH','Tag returns, long-term Institute projects and recovered samples are reviewed here.'],galley:['GALLEY','The crew decompresses here after difficult operations. Mara insists this is not a second Fish House.'],rack:['TROPHY WALL','Campaign plaques, Master Expedition grades and veteran vessel honours are bolted directly into the Tideline.']};return map[room]||['R.C. TIDELINE','Veteran expedition compartment.']}
  async function loadMasterLeaderboards(){for(const [scope,id] of [['daily','rdV16DailyBoard'],['weekly','rdV16WeeklyBoard']]){const el=$(id);if(!el)continue;try{const rows=await rpc('repo_diver_get_master_leaderboard',{p_scope:scope});el.innerHTML=(rows||[]).slice(0,8).map((x,i)=>`<article><b>#${i+1}</b><span>${rdEsc(x.username||'Diver')}</span><em>${rdEsc(String(x.grade||'C'))} · ${rdEsc(String(x.difficulty||'veteran').toUpperCase())}</em><strong>${Number(x.score||0).toLocaleString()}</strong></article>`).join('')||'<span>NO VALIDATED RUNS YET</span>'}catch(_){el.innerHTML='<span>BOARD UNAVAILABLE</span>'}}}
  function masterModifierToEngine(mods=[]){if(mods.includes('heavy_current'))return 'rough_current';if(mods.includes('low_visibility')||mods.includes('blackout'))return 'low_visibility';if(mods.includes('predator_surge')||mods.includes('ancient_territory'))return 'predator_territory';if(mods.includes('migration'))return 'migration';if(mods.includes('unstable_wreck')||mods.includes('rare_sighting'))return 'treasure_rich';return 'balanced'}
  function masterObjectiveText(x){const o=x?.objective||{},k=o.kind||'depth';if(k==='photos')return `DOCUMENT ${Number(o.target||3)} MARINE SUBJECTS`;if(k==='treasures')return `RECOVER ${Number(o.target||2)} SALVAGE CONTACTS`;if(k==='site')return `ENTER ${D.locationById?.(x.location_id)?.name||'THE TARGET SITE'}`;if(k==='ancient')return 'COMPLETE AN ANCIENT CONTACT';if(k==='ancient_or_depth')return `ANCIENT CONTACT OR REACH ${Number(o.depth||500)}M`;if(k==='mixed'){const bits=[];if(o.depth)bits.push(`${o.depth}M DEPTH`);if(o.fish)bits.push(`${o.fish} FISH`);if(o.photos)bits.push(`${o.photos} PHOTOS`);return bits.join(' + ')||'COMPLETE MIXED OBJECTIVES'}return `REACH ${Number(o.target||250)}M`}
  function masterObjectiveProgress(){const x=run?.master;if(!x)return '';const o=x.objective||{},k=o.kind||'depth';if(k==='photos')return `${Number(run.masterPhotoCount||0)} / ${Number(o.target||3)}`;if(k==='treasures')return `${run.catches.filter(c=>c.kind!=='fish').length} / ${Number(o.target||2)}`;if(k==='site')return run.interior?.site?.id===x.location_id?'SITE ENTERED':'LOCATE SITE';if(k==='ancient')return run.boss?.caught?'ANCIENT SECURED':'ANCIENT ACTIVE';if(k==='ancient_or_depth')return `${Math.round(run.maxDepth||0)}M / ${Number(o.depth||500)}M`;if(k==='mixed'){let n=0,t=0;if(o.depth){t++;if(Number(run.maxDepth||0)>=Number(o.depth))n++}if(o.fish){t++;if(run.catches.filter(c=>c.kind==='fish').length>=Number(o.fish))n++}if(o.photos){t++;if(Number(run.masterPhotoCount||0)>=Number(o.photos))n++}return `${n} / ${t} CONDITIONS`;}return `${Math.round(run.maxDepth||0)}M / ${Number(o.target||250)}M`}
  async function refreshPostgame(render=true){try{const [x,eps]=await Promise.all([rpc('repo_diver_get_postgame_state'),rpc('repo_diver_get_crew_epilogues').catch(()=>[])]);if(x)postgameState={...postgameState,...x};if(Array.isArray(eps))postgameState.epilogue_operations=eps;normalizePostgameAtlas();if(render){renderCareerHub();renderLegacy();renderBoatView();}return postgameState}catch(e){console.warn('Repo Diver postgame:',e?.message||e);return postgameState}}
  async function launchMasterExpedition(id,source='free'){const x=postgameExpedition(id);if(!x||!postgameUnlocked())return;specialistTools=[...(x.recommended_tools||[])].slice(0,3);expeditionMode=(x.category==='ancient'?'boss':'standard');expeditionModifier=masterModifierToEngine(x.modifiers||[]);returnToHarbour();await startDive(x.biome,x.location_id||null,null,false,{expedition_id:id,source,difficulty:masterDifficulty})}
  function legacyTrophyMarkup(t){return `<article class="rd-v16-trophy ${t.unlocked?'unlocked':'locked'}" data-kind="${rdEsc(t.kind||'legacy')}"><i></i><small>${t.unlocked?'CAREER DISPLAY':'LOCKED DISPLAY'}</small><b>${rdEsc(t.name||'LEGACY TROPHY')}</b><span>${t.unlocked?'Installed in your Legacy Hall.':'Keep building your career.'}</span></article>`}
  function atlasCard(k,v){const labels={marine_life:'MARINE LIFE',recipes:'RECIPES',ecology:'ECOLOGY',research:'RESEARCH',tagging:'TAGGING',archaeology:'ARCHAEOLOGY',locations:'MAJOR LOCATIONS',campaign:'CAMPAIGN',ancients:'ANCIENT HUNTS',fish_house:'FISH HOUSE',mastery:'REGION MASTERY',tournaments:'TOURNAMENTS',legacy:'LEGACY',secrets:'SECRETS'};const cur=Number(v?.current||0),tot=Math.max(1,Number(v?.total||1)),pct=Math.min(100,cur/tot*100),hidden=!!v?.hidden;return `<article class="rd-v16-atlas-card ${pct>=100?'complete':''}"><div class="rd-v16-ring" style="--pct:${pct.toFixed(1)}"><i></i><b>${Math.round(pct)}%</b></div><div><small>${rdEsc(labels[k]||k.replaceAll('_',' ').toUpperCase())}</small><strong>${hidden&&cur<tot?'???':`${cur.toLocaleString()} / ${tot.toLocaleString()}`}</strong><span>${pct>=100?'COMPLETE':hidden?'UNDISCOVERED THREADS REMAIN':'CAREER PROGRESS'}</span></div></article>`}
  function renderLegacy(){const el=$('rdLegacy');if(!el)return;if(!postgameUnlocked()){el.innerHTML=`<section class="rd-v16-locked"><div class="signal-rings"><i></i><i></i><i></i></div><small>REPO DIVER LEGACY</small><h3>THE HALL IS NOT OPEN YET</h3><p>Complete <b>The Deep Signal</b> to unlock the living postgame, Master Expeditions, personal Legacy Hall and Velmoran Ocean Atlas.</p><span>${Number(campaignState.completed_missions?.length||0)} / 25 CAMPAIGN MISSIONS</span></section>`;return}
    const rn=renownNext(),daily=postgameExpedition(postgameState.daily_expedition_id),weekly=postgameExpedition(postgameState.weekly_expedition_id),atlas=postgameState.atlas||{},overall=atlasPercent();
    const activeCos=postgameState.cosmetics?.active||{},unlockedCos=postgameState.cosmetics?.unlocked||[];
    const cosMarkup=['hull','banner','suit'].map(slot=>`<section><small>${slot.toUpperCase()}</small><div>${unlockedCos.filter(id=>(POSTGAME_COSMETICS[id]?.slot||'')===slot).map(id=>`<button class="${activeCos[slot]===id?'active':''}" data-rd-postgame-cosmetic="${slot}" data-value="${id}">${rdEsc(POSTGAME_COSMETICS[id]?.name||id.replaceAll('_',' ').toUpperCase())}</button>`).join('')||'<span>NO EXTRA COSMETICS YET</span>'}</div></section>`).join('');
    const decorMarkup=unlockedCos.filter(id=>(POSTGAME_COSMETICS[id]?.slot||'')==='decor').map(id=>`<article class="rd-v16-trophy unlocked veteran-decor"><i></i><small>VETERAN DISPLAY</small><b>${rdEsc(POSTGAME_COSMETICS[id]?.name||id.replaceAll('_',' ').toUpperCase())}</b><span>Installed from a long-term crew or Institute milestone.</span></article>`).join('');
    const crew=(D.CAMPAIGN_CREW||[]).map(c=>{const n=D.npc(c.id),q=crewEpilogueFor(c.id),pct=q?Math.min(100,Number(q.current||0)/Math.max(1,Number(q.target||1))*100):100;return `<article class="${q?.claimed?'complete':q?.claimable?'ready':''}" style="--crew:${n?.tone||'#78b8c0'}"><div class="rd-v16-crew-sprite"><i></i><i></i></div><small>${rdEsc(c.role)}</small><b>${rdEsc(n?.name||c.id)}</b><p>${rdEsc(POSTGAME_CREW_LINES[c.id]||'The campaign is over. The work is not.')}</p>${q?`<div class="rd-v16-epilogue"><em>EPILOGUE ${Number(q.step||1)}/3 · ${rdEsc(q.title)}</em><span>${rdEsc(q.description)}</span><i><b style="width:${pct}%"></b></i><strong>${Number(q.current||0).toLocaleString()} / ${Number(q.target||0).toLocaleString()}</strong>${q.claimed?'<button disabled>EPILOGUE COMPLETE</button>':q.claimable?`<button data-rd-epilogue="${rdEsc(q.id)}">COMPLETE OPERATION · +${Number(q.renown_reward||0)} RENOWN</button>`:q.unlocked?'<button disabled>OPERATION IN PROGRESS</button>':'<button disabled>PREVIOUS EPILOGUE REQUIRED</button>'}</div>`:'<span>EPILOGUE ARCHIVE COMPLETE</span>'}</article>`}).join('');
    const projects=(postgameState.projects||[]).map(p=>{const pct=Math.min(100,Number(p.current||0)/Math.max(1,Number(p.target||1))*100);return `<article class="${p.claimed?'claimed':p.claimable?'ready':''}"><small>LONG-FORM RESEARCH</small><b>${rdEsc(p.title)}</b><p>${rdEsc(p.description)}</p><div><i style="width:${pct}%"></i></div><span>${Number(p.current||0)} / ${Number(p.target||0)} · +${Number(p.renown_reward||0)} RENOWN</span>${p.claimed?'<button disabled>PROJECT COMPLETE</button>':p.claimable?`<button data-rd-postgame-project="${rdEsc(p.id)}">ARCHIVE PROJECT</button>`:'<button disabled>IN PROGRESS</button>'}</article>`}).join('');
    const expCards=(postgameState.expeditions||[]).map(x=>{const isDaily=x.expedition_id===postgameState.daily_expedition_id,isWeekly=x.expedition_id===postgameState.weekly_expedition_id;return `<article class="rd-v16-master-card ${isWeekly?'weekly':isDaily?'daily':''}"><header><span>${isWeekly?'GRAND EXPEDITION':isDaily?'DAILY MASTER':'MASTER EXPEDITION'}</span><em>${rdEsc(String(x.category||'mixed').toUpperCase())}</em></header><h4>${rdEsc(x.title)}</h4><p>${rdEsc(x.description)}</p><div class="rd-v16-modifiers">${(x.modifiers||[]).slice(0,3).map(m=>`<span>${rdEsc(m.replaceAll('_',' ').toUpperCase())}</span>`).join('')}</div><strong>${rdEsc(masterObjectiveText(x))}</strong><small>${rdEsc(D.biome(x.biome)?.name||x.biome)}${x.location_id?` · ${rdEsc(D.locationById?.(x.location_id)?.name||'AUTHORED SITE')}`:''}</small><button data-rd-master-launch="${rdEsc(x.expedition_id)}" data-source="${isWeekly?'weekly':isDaily?'daily':'free'}">LAUNCH ${isWeekly?'GRAND':isDaily?'DAILY':'MASTER'} EXPEDITION</button></article>`}).join('');
    const timeline=(postgameState.timeline||[]).map(x=>`<article><i></i><div><small>${rdEsc(String(x.event_type||'legacy').replaceAll('_',' ').toUpperCase())}</small><b>${rdEsc(x.title||'CAREER EVENT')}</b><span>${x.occurred_at?new Date(x.occurred_at).toLocaleDateString('en-GB'):'PRE-LEGACY RECORD'}</span></div></article>`).join('')||'<article><i></i><div><small>CAREER HISTORY</small><b>THE ARCHIVE STARTS HERE</b><span>Your veteran career is ready.</span></div></article>';
    el.innerHTML=`<section class="rd-v16-legacy-hero"><div class="rd-v16-monument"><i class="beam"></i><i class="plinth"></i><span>THE DEEP SIGNAL<br>EXPEDITION</span></div><div><small>POSTGAME CAREER · ${campaignState.campaign_completed_at?new Date(campaignState.campaign_completed_at).toLocaleDateString('en-GB'):''}</small><h3>${rdEsc(postgameState.rank||'VETERAN DIVER')}</h3><p>The story is complete. Your permanent diving career is now being written into the harbour.</p><div class="rd-v16-renown"><span><b>${Number(postgameState.renown||0).toLocaleString()}</b> DIVER RENOWN</span><div><i style="width:${rn.pct}%"></i></div><small>NEXT VETERAN RANK · ${rn.hi.toLocaleString()}</small></div></div><aside><small>VELMORAN OCEAN ATLAS</small><b>${overall.toFixed(1)}%</b><span>OVERALL CAREER COMPLETION</span><strong>${Number(postgameState.master_stats?.completed||0)} MASTER EXPEDITIONS · ${Number(postgameState.master_stats?.s_ranks||0)} S RANKS</strong></aside></section>
    <section class="rd-v16-hall"><header><small>REPO DIVER LEGACY HALL</small><h4>YOUR CAREER, BUILT INTO THE HARBOUR</h4></header><div class="rd-v16-hall-room"><div class="rd-v16-campaign-case"><i></i><b>BELOW THE CHARTS</b><span>Deep Signal Campaign Trophy</span></div><div class="rd-v16-trophy-grid">${(postgameState.trophies||[]).map(legacyTrophyMarkup).join('')}${decorMarkup}</div></div></section>
    <section class="rd-v16-section"><header><div><small>R.C. TIDELINE</small><h4>VETERAN VESSEL CUSTOMISATION</h4></div><span>Cosmetic only · no stat creep</span></header><div class="rd-v16-boat-interior"><button class="bridge" data-rd-tideline-room="bridge"><b>BRIDGE</b><i></i></button><button class="sonar" data-rd-tideline-room="sonar"><b>SONAR STATION</b><i></i></button><button class="lab" data-rd-tideline-room="lab"><b>RESEARCH BENCH</b><i></i></button><button class="galley" data-rd-tideline-room="galley"><b>GALLEY</b><i></i></button><button class="rack" data-rd-tideline-room="rack"><b>TROPHY WALL</b><i></i></button></div><div id="rdTidelineRoomDetail" class="rd-v16-room-detail"><small>R.C. TIDELINE INTERIOR</small><b>SELECT A COMPARTMENT</b><span>The veteran vessel is now part of your permanent career space.</span></div><div class="rd-v16-cosmetics">${cosMarkup}</div></section>
    <section class="rd-v16-section"><header><div><small>VETERAN OPERATIONS</small><h4>MASTER EXPEDITIONS</h4></div><span>Daily and weekly configurations are server-selected</span></header><div class="rd-v16-difficulty"><button class="${masterDifficulty==='veteran'?'active':''}" data-rd-master-difficulty="veteran">VETERAN</button><button class="${masterDifficulty==='master'?'active':''}" data-rd-master-difficulty="master">MASTER</button><button class="${masterDifficulty==='abyssal'?'active':''}" data-rd-master-difficulty="abyssal">ABYSSAL</button><span>Higher tiers increase environmental risk and Renown — not enemy HP walls.</span></div><div class="rd-v16-featured-expeditions">${daily?`<article><small>TODAY'S MASTER</small><b>${rdEsc(daily.title)}</b><span>${rdEsc(masterObjectiveText(daily))}</span></article>`:''}${weekly?`<article class="grand"><small>WEEKLY GRAND EXPEDITION</small><b>${rdEsc(weekly.title)}</b><span>${rdEsc(masterObjectiveText(weekly))}</span></article>`:''}</div><div class="rd-v16-master-grid">${expCards}</div><div class="rd-v16-master-boards"><section><small>DAILY MASTER BOARD</small><div id="rdV16DailyBoard"><span>SYNCING VALIDATED RUNS…</span></div></section><section><small>WEEKLY GRAND BOARD</small><div id="rdV16WeeklyBoard"><span>SYNCING VALIDATED RUNS…</span></div></section></div></section>
    <section class="rd-v16-section"><header><div><small>VELMORAN OCEAN ATLAS</small><h4>WHAT IS ACTUALLY LEFT?</h4></div><span>${overall.toFixed(1)}% COMPLETE</span></header><div class="rd-v16-atlas-grid">${Object.entries(atlas).map(([k,v])=>atlasCard(k,v)).join('')}</div>${overall>=99.999&&!unlockedCos.includes('velmoran_legend_suit')?'<button class="rd-v16-legend-claim" data-rd-claim-velmoran-legend>CLAIM 100% CAREER LEGACY</button>':unlockedCos.includes('velmoran_legend_suit')?'<div class="rd-v16-legend-complete"><b>VELMORAN LEGEND</b><span>100% career legacy archived.</span></div>':''}</section>
    <section class="rd-v16-section"><header><div><small>MARINE INSTITUTE</small><h4>LONG-TERM RESEARCH PROJECTS</h4></div><span>Multi-dive objectives · permanent archive rewards</span></header><div class="rd-v16-project-grid">${projects}</div></section>
    <section class="rd-v16-section"><header><div><small>R.C. TIDELINE CREW</small><h4>AFTER THE DEEP SIGNAL</h4></div><span>Their lives continue after the credits</span></header><div class="rd-v16-crew-grid">${crew}</div></section>
    <section class="rd-v16-section"><header><div><small>CAREER HISTORY</small><h4>YOUR REPO DIVER TIMELINE</h4></div><span>Unknown old dates are marked honestly as Pre-Legacy</span></header><div class="rd-v16-timeline">${timeline}</div></section>`;void loadMasterLeaderboards();
  }


  function explorationLocationState(id){return (explorationState.locations||[]).find(x=>x.location_id===id)||{location_id:id,stage:0,discovered:false,completed:false,artifact_found:0,artifact_total:(D.artifactsForLocation?.(id)||[]).length}}
  function explorationArtifactState(id){return (explorationState.artifacts||[]).find(x=>x.artifact_id===id)||{artifact_id:id,recovered:false,identified:false}}
  async function refreshExplorationState(render=true){try{const x=await rpc('repo_diver_get_exploration_state');if(x)explorationState={...explorationState,...x};if(render){renderHome();renderResearchView();renderJournal();}return explorationState}catch(e){console.warn('Repo Diver archaeology:',e?.message||e);return explorationState}}
  function selectedToolLabel(){return specialistTools.map(id=>D.EXPLORATION_TOOLS?.find(x=>x.id===id)?.name||id).join(' · ')}
  function toggleSpecialistTool(id){
    if(specialistTools.includes(id))specialistTools=specialistTools.filter(x=>x!==id);
    else if(specialistTools.length<3)specialistTools=[...specialistTools,id];
    else {const el=$('rdStatus');if(el)el.textContent='SPECIALIST LOADOUT FULL · REMOVE A TOOL FIRST';return}
    renderHome();
  }
  function locationProgressPct(loc){const p=explorationLocationState(loc.id);return Math.round(Math.min(100,Number(p.stage||0)/Math.max(1,loc.rooms.length)*100))}
  function archaeologyMarkup(){
    const recovered=(explorationState.artifacts||[]).filter(x=>x.recovered),identified=recovered.filter(x=>x.identified),found=(explorationState.locations||[]).filter(x=>x.discovered),complete=(explorationState.locations||[]).filter(x=>x.completed);
    const recoveredRows=recovered.slice().sort((a,b)=>String(b.recovered_at||'').localeCompare(String(a.recovered_at||''))).slice(0,18);
    return `<section class="rd-v14-archaeology"><header><div><small>UNDERWATER ARCHAEOLOGY</small><h3>WRECKS, RUINS &amp; RECOVERED HISTORY</h3><p>Major sites persist across expeditions. Open sealed routes, recover artifacts and return unidentified finds to the Marine Institute.</p></div><div class="rd-v14-arch-stats"><span><b>${found.length}</b> / ${D.EXPLORATION_LOCATIONS.length} SITES</span><span><b>${complete.length}</b> COMPLETED</span><span><b>${recovered.length}</b> / ${D.ARCHAEOLOGY_ARTIFACTS.length} RELICS</span></div></header>
      <div class="rd-v14-artifact-grid">${recoveredRows.length?recoveredRows.map(a=>{const def=D.artifactById?.(a.artifact_id)||a;return `<article class="${a.identified?'identified':'unknown'}" data-rarity="${rdEsc(a.rarity||def.rarity||'historic')}"><small>${a.identified?rdEsc(String(a.rarity||def.rarity||'historic').toUpperCase()):'UNIDENTIFIED RECOVERY'}</small><h4>${a.identified?rdEsc(a.name||def.name):'UNKNOWN RELIC'}</h4><p>${a.identified?rdEsc(a.lore||def.lore||'Catalogued by the Marine Institute.'):'Return this object to the Institute for identification and archival notes.'}</p>${a.identified?'<b>CATALOGUED</b>':`<button data-rd-identify-artifact="${rdEsc(a.artifact_id)}">IDENTIFY RELIC</button>`}</article>`}).join(''):'<article class="empty"><small>ARCHAEOLOGY</small><h4>NO ARTIFACTS RECOVERED</h4><p>Discover a major underwater site and push into its deeper chambers.</p></article>'}</div>
      <div class="rd-v14-site-ledger">${D.EXPLORATION_LOCATIONS.map(loc=>{const p=explorationLocationState(loc.id),pct=locationProgressPct(loc);return `<article class="${p.discovered?'known':'unknown'} ${p.completed?'complete':''}"><small>${rdEsc(D.biome(loc.biome)?.short||loc.biome)} · ${rdEsc(loc.type.toUpperCase())}</small><h4>${p.discovered?rdEsc(loc.name):'UNDISCOVERED SITE'}</h4><div><i style="width:${pct}%"></i></div><span>${p.discovered?`${Number(p.stage||0)}/${loc.rooms.length} CHAMBERS · ${Number(p.artifact_found||0)}/${Number(p.artifact_total||2)} ARTIFACTS`:'FIND THE ENTRANCE DURING A DIVE'}</span>${p.first_discovered_by?`<em>FIRST DISCOVERY · ${rdEsc(p.first_discovered_by)}</em>`:''}</article>`}).join('')}</div></section>`;
  }
  async function identifyArtifact(id){
    try{const r=await rpc('repo_diver_identify_artifact',{p_artifact_id:id});const a=(explorationState.artifacts||[]).find(x=>x.artifact_id===id);if(a)Object.assign(a,r||{}, {identified:true});enqueueReward({kicker:'MARINE INSTITUTE',title:r?.name||'ARTIFACT IDENTIFIED',meta:String(r?.rarity||'HISTORIC').toUpperCase(),value:'CATALOGUED',delta:r?.lore||'',rarity:'legendary',duration:3000});renderResearchView();renderJournal();}catch(e){setSaveState(e.message||'IDENTIFICATION FAILED','warning')}
  }
  function nearestMajorSite(){
    if(!run||run.interior)return null;let hit=null,best=9999;for(const s of run.sites||[]){const d=Math.hypot(s.x-run.player.x,s.y-run.player.y);if(d<best){best=d;hit=s}}return best<115?hit:null;
  }

  // The first Deep Signal mission explicitly asks the player to FIND THE BUOY.
  // V18 previously had the story text but no authored buoy entity, so the only
  // visible target was the wreck itself. Keep this objective deterministic and
  // independent of random world generation so every campaign run can progress.
  function campaignFieldObjective(){
    if(!run?.campaign||run.interior||run.campaign.replay||run.campaign.completed)return null;
    const stage=Number(run.campaign.stage||0);
    if(run.campaign.id==='signal_in_shallows'&&stage===0){
      return {id:'deep_signal_buoy',x:355,y:220,radius:94,label:'DAMAGED SIGNAL BUOY',hint:'INSPECT THE REPEATING PULSE'};
    }
    return null;
  }
  function nearestCampaignFieldObjective(maxDistance=105){
    const obj=campaignFieldObjective();if(!obj||!run?.player)return null;
    return Math.hypot(obj.x-run.player.x,obj.y-run.player.y)<=maxDistance?obj:null;
  }
  async function activateCampaignFieldObjective(obj){
    if(!obj||explorationBusy||campaignBusy||!run?.campaign||run.campaign.replay)return;
    if(obj.id!=='deep_signal_buoy')return;
    explorationBusy=true;
    try{
      const site=(run.sites||[]).find(s=>s.id===run.campaign.location_id);
      if(!site)throw new Error('The Coral Lantern Wreck route could not be located.');
      // Registering the nearby wreck here gives the authoritative campaign
      // checkpoint a valid location-progress row without teleporting the player
      // inside it. The player still has to swim to the wreck and explore it.
      const r=await rpc('repo_diver_discover_location',{p_run_id:runId,p_location_id:site.id});
      let st=(explorationState.locations||[]).find(x=>x.location_id===site.id);
      if(!st){st={location_id:site.id};explorationState.locations.push(st)}
      Object.assign(st,{discovered:true,stage:Number(r?.stage||st.stage||0),first_discovered_by:r?.first_discovered_by||st.first_discovered_by});
      site.discovered=true;site.stage=Number(r?.stage||site.stage||0);
      if(r?.new_discovery)explorationState.discovered_count=Number(explorationState.discovered_count||0)+1;
      const before=Number(run.campaign.stage||0);
      await syncCampaignCheckpoint(1);
      if(Number(run.campaign.stage||0)>before){
        run.campaignFieldObjectiveResolved=true;
        run.ecology.landmark={id:'deep_signal_buoy',name:'DAMAGED SIGNAL BUOY',time:4.4};
        E.banner?.(run,'SIGNAL BUOY LOCATED','PULSE MAPPED · CORAL LANTERN WRECK BEARING ACQUIRED','success',4.2);
        campaignRadio('LYRA · TIDELINE','There. Same pulse, clean repeat. I have locked the wreck bearing. Follow the STORY OBJECTIVE beacon to Coral Lantern Wreck and press E at the entrance.',7600);
        try{A.play?.('deep_signal')}catch(_){}
      }
    }catch(e){E.notice?.(run,e?.message||'SIGNAL BUOY INTERACTION FAILED','warning',2.2)}
    finally{explorationBusy=false}
  }
  function interactCampaignFieldObjective(){
    const obj=nearestCampaignFieldObjective();if(!obj)return false;
    void activateCampaignFieldObjective(obj);return true;
  }
  function toolAvailable(id){return !id||id==='none'||specialistTools.includes(id)}
  function interiorWildlife(){
    const pool=D.fishForBiome(run.biome.id).filter(f=>['eel','crustacean','jelly','seahorse','ray'].includes(f.archetype)||['bottom','ambush'].includes(f.behavior));
    const out=[];for(let i=0;i<Math.min(4,pool.length);i++){const src=pool[((i*3+Math.floor(run.elapsed))%pool.length)],f=E.spawnFish(run.biome.id,run.level,profile.equipment?.sonar||1,{source:src,x:280+i*150,y:250+(i%2)*105,timeOfDay:run.timeOfDay,weather:run.weather});if(f){f.indoor=true;f.awareness='unaware';out.push(f)}}return out;
  }
  function enterMajorSite(site){
    if(!run||run.interior)return;const replay=!!(run.campaign?.replay&&run.campaign?.location_id===site.id),state=replay?{stage:0,completed:false}:explorationLocationState(site.id);run.openWorldState={fish:run.fish,treasures:run.treasures,hazards:run.hazards,player:{x:run.player.x,y:run.player.y},camera:{...run.camera}};run.fish=interiorWildlife();run.treasures=[];run.hazards=[];run.player.x=105;run.player.y=320;run.player.vx=0;run.player.vy=0;run.camera.x=0;run.camera.y=0;run.camera.zoom=.96;run.interior={site,stage:Number(state.stage||0),room:Math.min(Number(state.stage||0),site.rooms.length-1),objective:{x:770,y:325},taskBusy:false,completed:!!state.completed};cinematic(site.name,`${String(site.type).toUpperCase()} INTERIOR · ${site.rooms[Math.min(Number(state.stage||0),site.rooms.length-1)]?.name||'ENTRY'}`,1.25);try{A.play?.('location_enter',{type:site.type})}catch(_){}
  }
  function exitMajorSite(){
    if(!run?.interior||!run.openWorldState)return;const saved=run.openWorldState;run.fish=saved.fish;run.treasures=saved.treasures;run.hazards=saved.hazards;run.player.x=saved.player.x;run.player.y=saved.player.y;run.player.vx=0;run.player.vy=0;run.camera={...saved.camera};run.interior=null;run.openWorldState=null;cinematic(run.biome.name,'RETURNING TO OPEN WATER',.9);
  }
  async function recoverStageArtifacts(site,stage){
    for(const def of D.artifactsForLocation(site.id)||[]){
      if(Number(def.stage)!==Number(stage))continue;
      const current=explorationArtifactState(def.id);if(current.recovered)continue;
      try{const r=await rpc('repo_diver_recover_artifact',{p_run_id:runId,p_location_id:site.id,p_artifact_id:def.id});if(r){let row=(explorationState.artifacts||[]).find(x=>x.artifact_id===def.id);if(!row){row={artifact_id:def.id,location_id:site.id};explorationState.artifacts.push(row)}Object.assign(row,{...r,recovered:true,identified:false,name:r.name||def.name,rarity:r.rarity||def.rarity});try{A.play?.('artifact',{rarity:r.rarity||def.rarity})}catch(_){}explorationState.artifact_count=Number(explorationState.artifact_count||0)+(r.saved?1:0);const ls=(explorationState.locations||[]).find(x=>x.location_id===site.id);if(ls&&r.saved)ls.artifact_found=Number(ls.artifact_found||0)+1;enqueueReward({kicker:'ARCHAEOLOGICAL RECOVERY',title:r.name||def.name,meta:`${String(r.rarity||def.rarity||'historic').toUpperCase()} · IDENTIFICATION PENDING`,value:'RECOVERED',rarity:'legendary',duration:2600});}}
      catch(e){console.warn('Artifact recovery:',e?.message||e)}
    }
  }
  async function discoverAndEnterSite(site){
    if(explorationBusy)return;if(run?.campaign?.replay&&run.campaign.location_id===site.id){site.discovered=true;site.stage=0;enterMajorSite(site);return}explorationBusy=true;try{
      const r=await rpc('repo_diver_discover_location',{p_run_id:runId,p_location_id:site.id});let st=(explorationState.locations||[]).find(x=>x.location_id===site.id);if(!st){st={location_id:site.id};explorationState.locations.push(st)}Object.assign(st,{discovered:true,stage:Number(r?.stage||st.stage||0),first_discovered_by:r?.first_discovered_by||st.first_discovered_by});site.discovered=true;site.stage=Number(r?.stage||0);
      if(r?.new_discovery){explorationState.discovered_count=Number(explorationState.discovered_count||0)+1;enqueueReward({kicker:r?.first_discovery?'FIRST DISCOVERY':'LOCATION DISCOVERED',title:site.name,meta:`${String(site.type).toUpperCase()} · ${run.biome.short}`,value:r?.first_discovery?'LEGACY FIRST':'MAPPED',rarity:r?.first_discovery?'ancient':'epic',duration:2800});}
      enterMajorSite(site);
      if(run?.master?.location_id===site.id){rpc('repo_diver_master_checkpoint',{p_run_id:runId,p_event:'site_entered',p_value:1}).catch(()=>{});}
      if(run?.campaign?.location_id===site.id&&!run.campaign.replay)await catchUpCampaignSite(site);
    }catch(e){E.notice?.(run,e?.message||'SITE ACCESS FAILED','warning',1.8)}finally{explorationBusy=false}
  }
  async function advanceInterior(){
    const inside=run?.interior;if(!inside||explorationBusy)return;const site=inside.site;if(inside.completed||inside.stage>=site.rooms.length){
      // A completed archaeology route can still be an unfinished campaign route.
      // The old site-campaign checkpoint RPC recorded checkpoint rows without
      // advancing campaign_state.stage, so players could reach 5/5 here while
      // the HUD remained stuck on MAP THE WRECK. Reconcile the story state
      // before telling the player there is nothing left to do.
      if(run?.campaign?.location_id===site.id&&!run.campaign.replay&&!run.campaign.completed){
        explorationBusy=true;
        try{
          await catchUpCampaignSite(site);
          if(run.campaign.completed){
            E.banner?.(run,'MISSION COMPLETE',`${run.campaign.title} · WRECK MAPPED · RETURN TO THE TIDELINE`,'success',4.2);
            campaignRadio('LYRA · TIDELINE','That is the full wreck mapped. The pulse is in the log and the route is clean. Bring the report home — we have our first real lead.',7600);
          }else{
            E.notice?.(run,`${campaignStageLabel(run.campaign,run.campaign.stage)} · STORY CHECKPOINT ${Number(run.campaign.stage||0)} / ${Number(run.campaign.stage_count||1)}`,'event',2.2);
          }
        }finally{explorationBusy=false}
        return;
      }
      E.notice?.(run,'SITE EXPLORATION COMPLETE · RETURN TO THE ENTRANCE','success',1.5);return
    }
    const room=site.rooms[Math.min(inside.stage,site.rooms.length-1)],tool=room?.tool||'none';if(!toolAvailable(tool)){const def=D.EXPLORATION_TOOLS?.find(x=>x.id===tool);E.banner?.(run,'SPECIALIST TOOL REQUIRED',`${def?.name||tool.toUpperCase()} · CHANGE LOADOUT AT THE HARBOUR`,'warning',2.4);return}
    if(Math.hypot(run.player.x-inside.objective.x,run.player.y-inside.objective.y)>95){E.notice?.(run,'MOVE CLOSER TO THE INTERACTION POINT','muted',.9);return}
    explorationBusy=true;inside.taskBusy=true;const label={enter:'SECURING ENTRY',cut:'CUTTING DEBRIS',power:'RESTORING POWER',scan:'SCANNING STRUCTURE',line:'SETTING DIVE LINE',align:'ALIGNING MECHANISM',artifact:'RECOVERING RELIC'}[room.task]||'WORKING';E.banner?.(run,label,`${room.name} · ${tool==='none'?'NO SPECIALIST TOOL':(D.EXPLORATION_TOOLS?.find(x=>x.id===tool)?.name||tool.toUpperCase())}`,'event',1.4);try{A.play?.('mechanism',{task:room.task,type:site.type})}catch(_){}
    try{await new Promise(r=>setTimeout(r,650));const next=inside.stage+1;if(run?.campaign?.replay&&run.campaign.location_id===site.id){inside.stage=next;inside.completed=next>=site.rooms.length;if(inside.completed){E.banner?.(run,'ARCHIVE REPLAY COMPLETE',`${site.name} · NO DUPLICATE PROGRESSION REWARDS`,'success',3);run.campaign.completed=true}else{inside.room=Math.min(inside.stage,site.rooms.length-1);run.player.x=110;run.player.y=320;cinematic(site.rooms[inside.room]?.name||'NEXT CHAMBER',`ARCHIVE STAGE ${inside.stage+1} / ${site.rooms.length}`,.8)}return}const res=await rpc('repo_diver_advance_location',{p_run_id:runId,p_location_id:site.id,p_expected_stage:next});inside.stage=Number(res?.stage||next);inside.completed=!!res?.completed;let st=(explorationState.locations||[]).find(x=>x.location_id===site.id);if(!st){st={location_id:site.id};explorationState.locations.push(st)}Object.assign(st,{discovered:true,stage:inside.stage,completed:inside.completed});await recoverStageArtifacts(site,inside.stage);
      if(run?.campaign?.location_id===site.id&&!run.campaign.replay){const m=run.campaign;if(m.id==='silence_at_erebos'){if(inside.stage<=4)await syncCampaignCheckpoint(inside.stage+1);else if(inside.completed){await syncCampaignCheckpoint(6);campaignRadio('LYRA · TIDELINE','Something just crossed the observation glass.',5200);cinematic('STATION EREBOS','OBSERVATION DOME · CONTACT OUTSIDE THE GLASS',2.2);try{A.play?.('deep_signal')}catch(_){}await new Promise(r=>setTimeout(r,850));await syncCampaignCheckpoint(7)}}else{if(inside.stage<=3)await syncCampaignCheckpoint(inside.stage+1);else if(inside.completed)await syncCampaignCheckpoint(Number(m.stage_count||5));}}
      if(inside.completed){explorationState.completed_count=Math.max(Number(explorationState.completed_count||0), (explorationState.locations||[]).filter(x=>x.completed).length);E.banner?.(run,'SITE EXPLORATION COMPLETE',`${site.name} · ALL PRIMARY CHAMBERS SECURED`,'success',3.4);enqueueReward({kicker:'AUTHORED EXPEDITION',title:site.name,meta:'PRIMARY ROUTE COMPLETE',value:'A-RANK EXPLORATION',delta:'Artifacts remain valuable for Marine Institute identification.',rarity:'ancient',duration:3200});}
      else{inside.room=Math.min(inside.stage,site.rooms.length-1);run.player.x=110;run.player.y=320;cinematic(site.rooms[inside.room]?.name||'NEXT CHAMBER',`STAGE ${inside.stage+1} / ${site.rooms.length}`,.8)}
    }catch(e){E.notice?.(run,e?.message||'EXPLORATION SAVE FAILED','warning',1.8)}finally{inside.taskBusy=false;explorationBusy=false}
  }
  function interactExploration(){
    if(!run)return false;
    if(run.interior){
      if(run.player.x<135){
        const site=run.interior.site;
        // Leaving a completed story site is also a final reconciliation point.
        // Do not allow an already-mapped wreck to strand the mission if an old
        // client/server checkpoint mismatch exists.
        if(run?.campaign?.location_id===site.id&&!run.campaign.replay&&!run.campaign.completed){
          void catchUpCampaignSite(site).finally(()=>exitMajorSite());
        }else exitMajorSite();
        return true
      }
      void advanceInterior();return true
    }
    if(interactCampaignFieldObjective())return true;
    const site=nearestMajorSite();if(site){
      // Mission 1 must actually resolve the authored buoy before the wreck can
      // advance the story. This prevents the old accidental bypass.
      if(run?.campaign?.id==='signal_in_shallows'&&!run.campaign.replay&&Number(run.campaign.stage||0)===0&&site.id===run.campaign.location_id){
        E.banner?.(run,'FOLLOW THE SIGNAL FIRST','THE DAMAGED BUOY IS PULSING NORTH-WEST OF THE WRECK','event',2.6);
        return true;
      }
      void discoverAndEnterSite(site);return true
    }
    return false;
  }

  function boatAverageLevel(){const b=career.boat||{};const vals=D.BOAT_UPGRADES.map(x=>Number(b[x.key]||1));return vals.reduce((a,v)=>a+v,0)/Math.max(1,vals.length)}
  function boatDisplayName(){const lv=boatAverageLevel();return lv>=4.6?'R.C. ABYSSWARD':lv>=3.5?'R.C. DEEPWAKE':lv>=2.3?'R.C. COASTAL VOYAGER':'R.C. TIDELINE'}
  function boatTierText(){return `Mk ${['I','II','III','IV','V','VI'][Math.max(0,Math.min(5,Math.floor(boatAverageLevel())-1))]}`}
  const HARBOUR_NPC_SLOTS=[
    {left:15,bottom:10},{left:29,bottom:9},{left:38,bottom:8},{left:65,bottom:8},{left:77,bottom:10},{left:88,bottom:9},
    {left:45,bottom:7},{left:56,bottom:7},{left:22,bottom:7},{left:72,bottom:7}
  ];
  function rectsOverlap(a,b,pad=8){return !(a.right+pad<=b.left||a.left-pad>=b.right||a.bottom+pad<=b.top||a.top-pad>=b.bottom)}
  function layoutHarbourActors(){
    const scene=$('rdHarbourScene'),actors=[...document.querySelectorAll('#rdHubNpcActors .rd-hub-npc')];if(!scene||!actors.length||scene.classList.contains('subpanel-open'))return;
    const sr=scene.getBoundingClientRect();if(sr.width<200||sr.height<180)return;
    // Interactive scenery forms real NPC exclusion zones at runtime, so the Tideboard fix cannot regress at another viewport size.
    const blockers=[...scene.querySelectorAll('.rd-hub-tideboard,.rd-hub-building,.rd-hub-boat')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0});
    const placed=[];const narrow=sr.width<820;const slots=narrow?HARBOUR_NPC_SLOTS.map((s,i)=>({...s,left:Math.max(8,Math.min(90,s.left+(i%2?2:-2))),bottom:Math.max(5,s.bottom-1)})):HARBOUR_NPC_SLOTS;
    actors.forEach((actor,i)=>{
      let chosen=slots[i%slots.length];
      for(let step=0;step<slots.length;step++){
        const s=slots[(i+step)%slots.length];actor.style.left=s.left+'%';actor.style.bottom=s.bottom+'%';const ar=actor.getBoundingClientRect();
        const blocked=blockers.some(el=>rectsOverlap(ar,el.getBoundingClientRect(),10))||placed.some(r=>rectsOverlap(ar,r,7));
        if(!blocked){chosen=s;break}
      }
      actor.style.left=chosen.left+'%';actor.style.bottom=chosen.bottom+'%';actor.dataset.safeSlot=String(i);placed.push(actor.getBoundingClientRect());
    });
  }
  function scheduleHarbourLayout(){clearTimeout(harbourLayoutTimer);harbourLayoutTimer=setTimeout(()=>requestAnimationFrame(layoutHarbourActors),55)}
  function openHomePanel(id){
    const active=document.activeElement;if(active?.closest?.('#rdHarbourScene,.rd-career-nav'))harbourFocusReturn=active;
    ['rdExpeditionPanel','rdQuestPanel','rdCampaignPanel','rdLegacyPanel','rdContractPanel','rdBoatPanel','rdResearchPanel','rdEndgamePanel','rdProfilePanel','rdCommunityPanel'].forEach(x=>$(x)?.classList.add('hidden'));$(id)?.classList.remove('hidden');$('rdHarbourScene')?.classList.add('subpanel-open');document.querySelector('.rd-career-strip')?.classList.add('subpanel-open');document.querySelector('.rd-career-nav')?.classList.add('subpanel-open');requestAnimationFrame(()=>focusFirstControl($(id)))
  }
  function returnToHarbour(){
    ['rdExpeditionPanel','rdQuestPanel','rdCampaignPanel','rdLegacyPanel','rdContractPanel','rdBoatPanel','rdResearchPanel','rdEndgamePanel','rdProfilePanel','rdCommunityPanel'].forEach(x=>$(x)?.classList.add('hidden'));$('rdHarbourScene')?.classList.remove('subpanel-open');document.querySelector('.rd-career-strip')?.classList.remove('subpanel-open');document.querySelector('.rd-career-nav')?.classList.remove('subpanel-open');scheduleHarbourLayout();const target=harbourFocusReturn;harbourFocusReturn=null;requestAnimationFrame(()=>{if(target?.isConnected){try{target.focus({preventScroll:true});return}catch(_){}}const fallback=document.querySelector('.rd-career-nav button:not([disabled])');fallback?.focus?.({preventScroll:true})})
  }
  function chapterMetricLabel(ch){const current=Number(career.chapter_progress?.current||0),target=Number(career.chapter_progress?.target||ch?.target||1);return `${current.toLocaleString()} / ${target.toLocaleString()} ${String(ch?.metric||'progress').toUpperCase()}`}
  function renderCareerHub(){
    const weather=career.weather||D.WEATHER[0],ch=D.CAREER_CHAPTERS[Math.max(0,Math.min(39,(career.chapter||1)-1))];
    if($('rdWeatherName'))$('rdWeatherName').textContent=weather.name||'CLEAR WATER';if($('rdWeatherEffect'))$('rdWeatherEffect').textContent=weather.effect||'';
    const cm=campaignState.available&&!campaignState.campaign_completed_at?campaignMission():null;if($('rdMainQuest'))$('rdMainQuest').textContent=cm?cm.title:(ch?.title||'CAREER COMPLETE');if($('rdMainQuestProgress'))$('rdMainQuestProgress').textContent=cm?`ACT ${cm.act} · ${campaignActName(cm.act)} · STAGE ${Number(campaignState.stage||0)}/${Number(cm.stage_count||1)}`:(ch?`Chapter ${ch.chapter} / 40 · ${chapterMetricLabel(ch)}`:'All career chapters complete');
    if($('rdCareerRep'))$('rdCareerRep').textContent=`${Number(profile.restaurant?.reputation_points||profile.stats?.restaurant_reputation||0).toLocaleString()} reputation`;
    if($('rdBoatName'))$('rdBoatName').textContent=boatDisplayName();if($('rdBoatLevel'))$('rdBoatLevel').textContent=boatTierText();if($('rdActiveTitle'))$('rdActiveTitle').textContent=career.active_title||'Rookie Diver';
    if($('rdSpeciesCount'))$('rdSpeciesCount').textContent=`${Object.keys(profile.fish_journal||{}).length} / ${D.FISH.length}`;
    const harbour=$('rdHarbourScene');if(harbour){harbour.dataset.weather=weather.id||'clear';harbour.dataset.season=sharedWorld.season?.id||'';harbour.dataset.campaignAct=String(campaignState.available?campaignState.act||1:0);harbour.dataset.postgame=String(postgameUnlocked());}const legacyHall=document.querySelector('#rdHarbourScene .legacy-hall');if(legacyHall)legacyHall.classList.toggle('locked',!postgameUnlocked());if($('rdHarbourBrief'))$('rdHarbourBrief').textContent=cm?`${campaignActName(cm.act)} · ${campaignStageLabel(cm,Number(campaignState.stage||0))}`:postgameUnlocked()?`${postgameState.rank} · ${Number(postgameState.renown||0).toLocaleString()} RENOWN · MASTER OPERATIONS AVAILABLE`:(weather.desc||weather.effect||'The tide is waiting.');
    const tide=$('rdTideboardPreview');if(tide){const ev=sharedWorld.community_event,t=sharedWorld.tournament,pct=Math.round(Number(ev?.pct||0));tide.parentElement.dataset.milestone=pct>=100?'100':pct>=75?'75':pct>=50?'50':pct>=25?'25':'0';tide.innerHTML=sharedWorld.available?`<small>${rdEsc(sharedWorld.season?.name||'SHARED OCEAN')}</small><b>${rdEsc(t?.title||'THE TIDEBOARD')}</b><span>${ev?`${pct}% ${rdEsc(ev.title)}`:'Verified community records live here.'}</span>`:'<small>SHARED OCEAN</small><b>THE TIDEBOARD</b><span>Connecting community records…</span>';}
    const actorIds=['darro','mara','lyra','bram','cass','ivar'];const actors=$('rdHubNpcActors');if(actors){actors.innerHTML=actorIds.map((id,i)=>{const n=D.npc(id);return `<button type="button" class="rd-hub-npc n${i}" data-rd-npc="${id}" aria-label="Talk to ${rdEsc(n.name)}" style="--npc:${n.tone}"><i class="head"></i><i class="hair"></i><i class="body"></i><i class="arm a"></i><i class="arm b"></i><i class="leg a"></i><i class="leg b"></i><span>${rdEsc(n.name)}</span></button>`}).join('');scheduleHarbourLayout();}
    if($('rdExpeditionWeather'))$('rdExpeditionWeather').textContent=`${weather.name} · ${weather.effect}`;
  }
    function openNpc(id){const n=D.npc(id),ch=D.CAREER_CHAPTERS[Math.max(0,Math.min(39,(career.chapter||1)-1))],relevant=ch?.giver===id,cm=campaignState.available&&!campaignState.campaign_completed_at?campaignMission():null,inCrew=!!cm?.crew?.includes(id),veteran=postgameUnlocked();const rel=Number(career.relationships?.[id]||0);const d=$('rdNpcDialogue');if(!d)return;d.classList.remove('hidden');$('rdNpcRole').textContent=veteran?`${n.role} · POSTGAME CREW`:inCrew?`${n.role} · DEEP SIGNAL CREW`:`${n.role} · TRUST ${rel}`;$('rdNpcName').textContent=n.name;$('rdNpcPortrait').style.setProperty('--npc',n.tone);$('rdNpcPortrait').innerHTML='<i class="portrait-head"></i><i class="portrait-hair"></i><i class="portrait-body"></i>';$('rdNpcText').textContent=veteran?(POSTGAME_CREW_LINES[id]||n.intro):inCrew?campaignDialogueFor(id,cm):(relevant?`${n.intro} Right now: ${ch.title}. ${ch.desc}`:n.intro);$('rdNpcActions').innerHTML=veteran?`<button data-rd-open-legacy>OPEN LEGACY OPERATIONS</button><span>${rdEsc(n.specialty||'TIDELINE CREW')}</span>`:inCrew?`<button data-rd-open-campaign>OPEN THE DEEP SIGNAL</button><span>${rdEsc(n.specialty||'TIDELINE CREW')}</span>`:(relevant&&career.chapter_can_claim?`<button data-rd-claim-chapter="${ch.chapter}">COMPLETE "${ch.title}"</button>`:`<span>${rdEsc(n.specialty||'HARBOUR CREW')}</span>`)}
  function renderQuestLog(){const el=$('rdQuestLog');if(!el)return;const active=Number(career.chapter||1);el.innerHTML=`<div class="rd-active-quest">${(()=>{const c=D.CAREER_CHAPTERS[active-1];if(!c)return '<h4>CAREER COMPLETE</h4><p>The harbour knows your name.</p>';const n=D.npc(c.giver);return `<small>ACTIVE STORY CHAPTER ${c.chapter}/40 · ${n.name}</small><h4>${c.title}</h4><p>${c.desc}</p><div class="rd-quest-progress"><i style="width:${Math.min(100,Number(career.chapter_progress?.pct||0))}%"></i></div><span>${chapterMetricLabel(c)}</span>${career.chapter_can_claim?`<button data-rd-claim-chapter="${c.chapter}">REPORT BACK TO ${n.name.toUpperCase()}</button>`:''}`})()}</div><div class="rd-chapter-list">${D.CAREER_CHAPTERS.map(c=>`<article class="${c.chapter<active?'done':c.chapter===active?'active':'locked'}"><span>${String(c.chapter).padStart(2,'0')}</span><div><b>${c.title}</b><small>${D.npc(c.giver).name} · ${c.desc}</small></div><em>${c.chapter<active?'COMPLETE':c.chapter===active?'ACTIVE':'LOCKED'}</em></article>`).join('')}</div>`}
  function renderContracts(){const el=$('rdContracts');if(!el)return;const states=career.contract_status||[];el.innerHTML=`<div class="rd-contract-intro"><b>THREE JOBS. ONE TIDE.</b><span>Contracts award modest skill XP + Fish House reputation — not piles of GP.</span></div><div class="rd-contract-grid">${states.map(st=>{const c=D.CONTRACTS.find(x=>x.id===st.id)||{name:st.id,desc:'Harbour contract',icon:'JOB'};return `<article class="${st.claimed?'claimed':st.claimable?'ready':''}"><i>${c.icon}</i><small>DAILY CONTRACT</small><h4>${c.name}</h4><p>${c.desc}</p><div class="rd-contract-progress"><i style="width:${Math.min(100,Number(st.current||0)/Math.max(1,Number(st.target||1))*100)}%"></i></div><b>${Number(st.current||0)} / ${Number(st.target||0)}</b>${st.claimed?'<button disabled>CLAIMED</button>':st.claimable?`<button data-rd-claim-contract="${st.id}">CLAIM CONTRACT</button>`:'<button disabled>IN PROGRESS</button>'}</article>`}).join('')}</div>`}
  function renderBoatView(){const el=$('rdBoatUpgrades');if(!el)return;const b=career.boat||{},veteran=postgameUnlocked(),active=postgameState.cosmetics?.active||{};el.innerHTML=`<div class="rd-boat-hero ${veteran?'veteran':''}"><div class="rd-boat-art" data-hull="${rdEsc(active.hull||'tideline_classic')}"><i class="boat-hull"></i><i class="boat-cabin"></i><i class="boat-mast"></i></div><div><small>YOUR EXPEDITION VESSEL</small><h3>${boatDisplayName()} <em>${boatTierText()}</em></h3><p>${veteran?'The Tideline is now a veteran expedition vessel. Its postgame interior, trophy wall and cosmetic refits live in the Legacy Hall.':'The boat grows with the career: better survey contacts, more salvage opportunities and a visibly more serious expedition operation.'}</p>${veteran?'<button data-rd-open-legacy>OPEN TIDELINE VETERAN DECK</button>':''}</div></div>${veteran?`<div class="rd-v16-boat-mini"><span>BRIDGE</span><span>SONAR STATION</span><span>RESEARCH BENCH</span><span>GALLEY</span><span>TROPHY WALL</span></div>`:''}<div class="rd-boat-grid">${D.BOAT_UPGRADES.map(x=>{const lv=Number(b[x.key]||1),max=lv>=x.max;return `<article><small>VESSEL SYSTEM</small><h4>${x.name}</h4><p>${x.desc}</p><div class="rd-level-pips">${Array.from({length:x.max},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div><button data-rd-boat-upgrade="${x.key}" ${max?'disabled':''}>${max?'MAXIMUM SPEC':`UPGRADE FROM LV ${lv}`}</button></article>`}).join('')}</div>`}
  function achievementUnlocked(a,i){
    const s=profile.stats||{},found=Object.keys(profile.fish_journal||{}).length,tier=1+Math.floor((i%50)/10),eg=career.endgame||{};
    if(a.group==='EXPLORATION')return Number(s.deepest||0)>=tier*80;
    if(a.group==='MARINE LIFE')return found>=tier*15;
    if(a.group==='FISH HOUSE')return Number(profile.restaurant?.rank||1)>=Math.min(10,tier*2);
    if(a.group==='SALVAGE')return Number(s.treasures_found||0)>=tier*3;
    if(a.group==='LEGENDARY')return Number(s.legendary_catches||0)>=tier;
    const vt=Object.values(eg.variants||{}).reduce((a,v)=>a+Number(v||0),0),bosses=Object.values(eg.bosses||{}).reduce((a,v)=>a+Number(v||0),0),mastery=Object.values(career.mastery||{}).reduce((a,v)=>a+Number(v||0),0),px=Number(eg.prestige_xp||0);
    if(a.group==='ENDGAME')return Number(profile.day_number||1)>=44+tier*5;
    if(a.group==='BOSSES')return bosses>=tier;
    if(a.group==='VARIANTS')return vt>=tier;
    if(a.group==='MASTERY')return mastery>=tier*4;
    if(a.group==='PRESTIGE')return px>=tier*900;
    if(a.group==='SOCIAL')return !!eg.social?.[a.metric];
    return false;
  }
  function renderResearchView(){
    const el=$('rdResearch');if(!el)return;const photos=Number(career.research?.photos||0),observed=Number(career.research?.observations||0),ecoObs=Array.isArray(ecologyState.observations)?ecologyState.observations:[],tags=Array.isArray(ecologyState.tags)?ecologyState.tags:[];
    const byKind=Object.entries(D.ECOLOGY_OBSERVATIONS||{}).map(([k,label])=>({k,label,count:ecoObs.filter(x=>x.observation===k).length}));
    const dart=(D.CRAFTING||[]).find(x=>x.id==='research_dart'),mats=endgameMaterials(),crafted=endgameCrafted(),dartReady=!!crafted.research_dart;
    const dartCost=dart?.cost||{crystal:2,scrap:4},canCraft=Object.entries(dartCost).every(([k,v])=>Number(mats[k]||0)>=Number(v||0));
    el.innerHTML=`<div class="rd-research-summary"><article><small>CAMERA ARCHIVE</small><b>${photos}</b><span>field photographs</span></article><article><small>OBSERVED SPECIES</small><b>${observed}</b><span>documented subjects</span></article><article><small>ECOLOGY NOTES</small><b>${ecoObs.length}</b><span>unique behaviours documented</span></article><article><small>ACTIVE TAGS</small><b>${tags.length}</b><span>research animals that may return</span></article></div>
      <div class="rd-crafting rd-research-workshop"><header><div><small>MARINE INSTITUTE · FIELD RESEARCH KIT</small><h4>PROTECTED SPECIES ARE RESEARCH-ONLY</h4><p>Do not harpoon protected or juvenile wildlife. The <b>Research Camera is standard issue</b>: aim at the animal and press <b>C</b>. The Research Dart Array is optional tagging gear: craft it here, then aim and press <b>R</b>.</p></div><div class="rd-material-wallet">${Object.entries(mats).map(([k,v])=>`<span><b>${String(k).toUpperCase()}</b>${Number(v)}</span>`).join('')}</div></header><div><article class="crafted"><small>STANDARD ISSUE</small><h4>RESEARCH CAMERA</h4><p>Photographs protected species and records ecology behaviour. No crafting is required.</p><em>ALWAYS AVAILABLE</em><button disabled>C · CAMERA READY</button></article><article class="${dartReady?'crafted':''}"><small>OPTIONAL FIELD TAGGING</small><h4>${rdEsc(dart?.name||'RESEARCH DART ARRAY')}</h4><p>${rdEsc(dart?.desc||'Tags research wildlife so it can be identified on later expeditions.')}</p><em>${dartReady?'INSTALLED':materialCostText(dartCost)}</em><button data-rd-craft="research_dart" ${dartReady||!canCraft?'disabled':''}>${dartReady?'INSTALLED':canCraft?'CRAFT RESEARCH DART':'MATERIALS REQUIRED'}</button></article></div></div>
      <h4 class="rd-research-heading">LIVING OCEAN ECOLOGY</h4><div class="rd-ecology-research-grid">${byKind.map(x=>`<article class="${x.count?'done':''}"><small>BEHAVIOUR FILE</small><b>${x.label}</b><span>${x.count?`${x.count} documented species`:'Not documented yet'}</span></article>`).join('')}</div>
      <div class="rd-tag-ledger"><div><small>RESEARCH TAG LEDGER</small><h4>${tags.length?`${tags.length} ACTIVE FIELD TAG${tags.length===1?'':'S'}`:'NO ACTIVE TAGS'}</h4><p><b>C = photograph</b> any visible subject. <b>R = tag</b> a subject once the Research Dart Array is installed. Tagged animals can unexpectedly return on later dives in the same region.</p></div>${tags.slice(0,12).map(t=>`<article><b>${rdEsc(t.tag_code||'MR-TAG')}</b><span>${rdEsc(D.fishById(t.fish_id)?.name||t.fish_id)}</span><small>${rdEsc(D.biome(t.biome)?.short||t.biome)} · ${Number(t.sightings||1)} SIGHTING${Number(t.sightings||1)===1?'':'S'}</small></article>`).join('')}</div>
      <h4 class="rd-research-heading">LEGENDARY HUNT FILES</h4><div class="rd-hunt-grid">${D.LEGENDARY_HUNTS.map(h=>{const b=D.biome(h.biome),caught=!!profile.fish_journal?.[h.fish_id],unlocked=(profile.day_number||1)>=b.unlock;return `<article class="${caught?'done':unlocked?'tracking':'locked'}"><small>${b.short}</small><h4>${h.name}</h4><ol>${h.stages.map((x,i)=>`<li class="${caught?'done':unlocked&&i<2?'active':''}">${x}</li>`).join('')}</ol><b>${caught?'LEGEND DOCUMENTED':unlocked?'CLUES AVAILABLE':'WATERS LOCKED'}</b></article>`}).join('')}</div><h4 class="rd-research-heading">CAREER ACHIEVEMENTS</h4><div class="rd-achievement-grid">${D.ACHIEVEMENTS.map((a,i)=>`<article class="${achievementUnlocked(a,i)?'done':''}"><small>${a.group}</small><b>${a.name}</b><span>${a.desc}</span><em>${achievementUnlocked(a,i)?'UNLOCKED':'IN PROGRESS'}</em></article>`).join('')}</div>`;
    el.insertAdjacentHTML('beforeend',archaeologyMarkup());
    if(postgameUnlocked()){const prs=(postgameState.projects||[]).map(p=>`<article class="${p.claimed?'claimed':p.claimable?'ready':''}"><small>POSTGAME PROJECT</small><b>${rdEsc(p.title)}</b><span>${Number(p.current||0)} / ${Number(p.target||0)}</span><p>${rdEsc(p.description)}</p>${p.claimed?'<button disabled>ARCHIVED</button>':p.claimable?`<button data-rd-postgame-project="${rdEsc(p.id)}">ARCHIVE · +${Number(p.renown_reward||0)} RENOWN</button>`:'<button disabled>FIELD WORK IN PROGRESS</button>'}</article>`).join('');el.insertAdjacentHTML('beforeend',`<section class="rd-v16-institute-postgame"><header><small>MARINE INSTITUTE · VETERAN WING</small><h3>LONG-TERM RESEARCH PROJECTS</h3><p>Multi-dive work continues after The Deep Signal. These projects use real research, tagging, archaeology and Ancient records already in your career.</p></header><div>${prs}</div></section>`);}
    el.querySelectorAll('[data-rd-identify-artifact]').forEach(b=>b.onclick=()=>identifyArtifact(b.dataset.rdIdentifyArtifact));
  }

  function syncTimeToggle(){document.querySelectorAll('[data-rd-time]').forEach(b=>b.classList.toggle('selected',b.dataset.rdTime===expeditionTime))}

  function endgameUnlocked(){return Number(profile.day_number||1)>=44||D.ENDGAME_BIOMES?.some(id=>profile.unlocked_biomes?.includes?.(id));}
  function biomeMastery(id){const pool=D.fishForBiome(id),found=pool.filter(f=>profile.fish_journal?.[f.id]).length,boss=D.BOSSES?.[id]&&profile.fish_journal?.[D.BOSSES[id]];const depth=Math.min(1,Number(profile.stats?.deepest||0)/Math.max(1,D.biome(id).max_depth));const derived=Math.min(10,Math.floor((found/Math.max(1,pool.length))*6+(boss?2:0)+depth*2));return Math.max(derived,Number(career.mastery?.[id]||0));}
  function prestigeInfo(){const found=Object.keys(profile.fish_journal||{}).length,ancient=D.FISH.filter(f=>f.rarity==='ancient'&&profile.fish_journal?.[f.id]).length,raw=Math.max(0,found-120)*22+ancient*450+Math.max(0,Number(profile.day_number||1)-40)*35;const xp=Math.max(raw,Number(career.endgame?.prestige_xp||0));const rank=Math.min(D.PRESTIGE_RANKS.length-1,Math.floor(xp/1800));return {xp,rank,name:D.PRESTIGE_RANKS[rank],next:(rank+1)*1800};}
  function currentSeasonalEvent(){const events=D.SEASONAL_EVENTS||[];if(!events.length)return null;if(sharedWorld.available&&sharedWorld.season?.id){const map={season_migration:'tuna_run',season_stormwake:'storm_season',season_crystal:'crystal_bloom',season_deep:'ruin_tide'};const hit=events.find(x=>x.id===map[sharedWorld.season.id]);if(hit)return hit;}const week=Math.floor(Date.now()/604800000);return events[Math.abs(week)%events.length]||events[0]}
  function endgameMaterials(){return {scrap:0,alloy:0,crystal:0,shard:0,vent:0,...(career.endgame?.materials||{})}}
  function endgameCrafted(){return career.endgame?.crafted||{}}
  function variantCount(){return Object.values(career.endgame?.variants||{}).reduce((a,v)=>a+Number(v||0),0)}
  function bossCount(){return Object.values(career.endgame?.bosses||{}).reduce((a,v)=>a+Number(v||0),0)}
  function completionInfo(){
    const species=Object.keys(profile.fish_journal||{}).length,recipes=(profile.recipes||[]).length||D.RECIPES.filter(r=>r.unlock<=Number(profile.day_number||1)).length,bosses=Object.keys(D.BOSSES||{}).filter(id=>Number(career.endgame?.bosses?.[D.BOSSES[id]]||0)>0||!!profile.fish_journal?.[D.BOSSES[id]]).length,ach=D.ACHIEVEMENTS.filter(achievementUnlocked).length,mastery=Object.values(career.mastery||{}).reduce((a,v)=>a+Math.min(10,Number(v||0)),0),masteryMax=Math.max(1,(D.ENDGAME_BIOMES||[]).length*10);
    const parts=[species/Math.max(1,D.FISH.length),recipes/Math.max(1,D.RECIPES.length),bosses/Math.max(1,Object.keys(D.BOSSES||{}).length),ach/Math.max(1,D.ACHIEVEMENTS.length),mastery/masteryMax];
    return {species,recipes,bosses,ach,mastery,masteryMax,pct:Math.round(parts.reduce((a,v)=>a+Math.min(1,v),0)/parts.length*1000)/10};
  }
  function materialCostText(cost={}){return Object.entries(cost).map(([k,v])=>`${String(k).toUpperCase()} ${v}`).join(' · ')}
  function renderEndgame(){
    const el=$('rdEndgame');if(!el)return;const p=prestigeInfo(),advanced=D.ENDGAME_BIOMES||[],sighting=advanced[(new Date().getUTCDate()+new Date().getUTCMonth())%Math.max(1,advanced.length)],sightBoss=D.BOSSES?.[sighting],season=currentSeasonalEvent(),mats=endgameMaterials(),crafted=endgameCrafted(),comp=completionInfo();
    const seasonActive=season?.biomes?.includes?.(sighting);
    el.innerHTML=`<div class="rd-endgame-hero"><div><small>DEEP OPERATIONS</small><h3>THE WATER AFTER THE STORY</h3><p>Long-form expeditions, Ancient boss signatures, rare specimens, biome mastery and validated prestige records. Endgame rewards focus on progression and equipment rather than raw GP.</p></div><div class="rd-prestige"><small>MASTER DIVER PRESTIGE</small><b>${p.name}</b><span>${p.xp.toLocaleString()} PX · DESCENT PB ${Number(career.endgame?.descent_best||0)}M</span></div></div>
    <div class="rd-endgame-summary"><article><small>REPO DIVER COMPLETION</small><b>${comp.pct}%</b><span>${comp.species}/${D.FISH.length} species · ${comp.recipes}/${D.RECIPES.length} recipes</span></article><article><small>ANCIENT BOSSES</small><b>${comp.bosses}/${Object.keys(D.BOSSES||{}).length}</b><span>${bossCount()} validated boss landings</span></article><article><small>RARE VARIANTS</small><b>${variantCount()}</b><span>Albino · melanistic · luminous · golden</span></article><article><small>ACHIEVEMENTS</small><b>${comp.ach}/${D.ACHIEVEMENTS.length}</b><span>${comp.mastery}/${comp.masteryMax} mastery points</span></article></div>
    ${season?`<div class="rd-seasonal"><i></i><div><small>THIS WEEK · OCEAN CONDITION</small><b>${season.name}</b><span>${season.desc}</span></div><em>${season.biomes.map(id=>D.biome(id)?.short||id).join(' · ')}</em></div>`:''}
    <div class="rd-sighting ${seasonActive?'season-active':''}"><i></i><div><small>RARE SIGHTING · TODAY</small><b>${D.biome(sighting)?.name||'UNKNOWN WATER'}</b><span>${D.fishById(sightBoss)?.name||'Ancient signature'} has been reported on expedition sonar.</span></div><button data-rd-sighting="${sighting}">PREPARE HUNT</button></div>
    <div class="rd-loadout"><section><small>EXPEDITION TYPE</small><div>${[['standard','STANDARD'],['boss','ANCIENT HUNT'],['descent','THE DESCENT']].map(([id,n])=>`<button data-rd-mode="${id}" class="${expeditionMode===id?'selected':''}">${n}</button>`).join('')}</div></section><section><small>HARPOON HEAD</small><div>${D.HARPOON_LOADOUTS.map(x=>`<button data-rd-harpoon="${x.id}" class="${expeditionHarpoon===x.id?'selected':''}"><b>${x.name}</b><span>${x.desc}</span></button>`).join('')}</div></section><section><small>LURE</small><div>${D.LURES.map(x=>`<button data-rd-lure="${x.id}" class="${expeditionLure===x.id?'selected':''}"><b>${x.name}</b><span>${x.desc}</span></button>`).join('')}</div></section><section><small>CONDITIONS</small><div>${D.EXPEDITION_MODIFIERS.map(x=>`<button data-rd-modifier="${x.id}" class="${expeditionModifier===x.id?'selected':''}"><b>${x.name}</b><span>${x.desc}</span></button>`).join('')}</div></section></div>
    <div class="rd-crafting"><header><div><small>EXPEDITION WORKSHOP</small><h4>SALVAGE CRAFTING</h4></div><div class="rd-material-wallet">${Object.entries(mats).map(([k,v])=>`<span><b>${String(k).toUpperCase()}</b>${Number(v)}</span>`).join('')}</div></header><div>${(D.CRAFTING||[]).map(x=>{const done=!!crafted[x.id];return `<article class="${done?'crafted':''}"><small>ADVANCED FIELD GEAR</small><h4>${x.name}</h4><p>${x.desc}</p><em>${done?'INSTALLED':materialCostText(x.cost)}</em><button data-rd-craft="${x.id}" ${done?'disabled':''}>${done?'INSTALLED':'CRAFT MODULE'}</button></article>`}).join('')}</div></div>
    <div class="rd-endgame-grid">${advanced.map(id=>{const b=D.biome(id),open=(profile.day_number||1)>=b.unlock,m=biomeMastery(id),boss=D.fishById(D.BOSSES?.[id]),bossWins=Number(career.endgame?.bosses?.[boss?.id]||0),seasonal=season?.biomes?.includes?.(id);return `<article class="${open?'':'locked'} ${seasonal?'seasonal-water':''}" style="--rd-accent:${b.accent}"><small>${seasonal?'WEEKLY ACTIVE WATER':'ENDGAME WATER'} · ${b.max_depth}M</small><h4>${b.name}</h4><p>${b.mood}</p><div class="rd-mastery"><span>MASTERY ${m}/10</span><i><b style="width:${m*10}%"></b></i></div><footer><span>${boss?.name||'Ancient contact'}${bossWins?` · ${bossWins} LANDED`:''}</span><button data-rd-endgame-biome="${id}" ${open?'':'disabled'}>${open?'LAUNCH EXPEDITION':`DAY ${b.unlock}`}</button></footer></article>`}).join('')}</div>
    <div class="rd-endgame-leaderboard"><div><small>VALIDATED EXPEDITION RECORDS</small><h4>DEEP OPS LEADERBOARD</h4></div><div id="rdEndgameLeaderboard"><span>Loading validated records…</span></div></div>`;loadEndgameLeaderboard();
  }
  async function loadEndgameLeaderboard(){const el=$('rdEndgameLeaderboard');if(!el)return;try{const rows=await rpc('repo_diver_get_endgame_leaderboard');el.innerHTML=(rows||[]).slice(0,10).map((x,i)=>`<article><b>#${i+1}</b><span>${x.username||'Diver'}</span><em>${String(x.mode||'standard').toUpperCase()} · ${D.biome(x.biome)?.short||x.biome}</em><strong>${Number(x.score||0).toLocaleString()}</strong><small>${Number(x.depth||0)}M</small></article>`).join('')||'<span>No validated endgame expeditions yet.</span>';}catch(e){el.innerHTML='<span>Leaderboard unavailable.</span>'}}

  function renderProfile(){
    const el=$('rdProfile');if(!el)return;
    const journal=profile.fish_journal||{},stats=profile.stats||{},bosses=career.endgame?.bosses||{},mastery=career.mastery||{};
    const found=Object.keys(journal).length,bossCount=Object.values(bosses).filter(v=>Number(v)>0).length,masteryTotal=Object.values(mastery).reduce((a,v)=>a+Number(v||0),0),prestige=Number(career.endgame?.prestige_xp||0);
    const completion=Math.min(100,((found/Math.max(1,D.FISH.length))*42)+(bossCount/Math.max(1,Object.keys(D.BOSSES||{}).length)*18)+(Math.min(180,masteryTotal)/180*20)+(Math.min(100,D.ACHIEVEMENTS.filter((a,i)=>achievementUnlocked(a,i)).length)/100*20));
    const biggest=Object.entries(journal).sort((a,b)=>Number(b[1]?.best_weight||0)-Number(a[1]?.best_weight||0))[0],biggestFish=biggest?D.fishById(biggest[0]):null;
    const prestigeRank=prestige>=12000?'LEGENDARY DIVER':prestige>=7000?'ABYSS DIVER':prestige>=4000?'PLATINUM DIVER':prestige>=1800?'GOLD DIVER':prestige>=700?'SILVER DIVER':'BRONZE DIVER';
    const trophies=myVerifiedCatches.slice(0,12);
    el.innerHTML=`<section class="rd-profile-hero"><div class="rd-profile-emblem"><i></i><b>${Math.round(completion)}%</b><span>COMPLETE</span></div><div><small>${career.active_title||'Rookie Diver'}</small><h2>${prestigeRank}</h2><p>${boatDisplayName()} ${boatTierText()} · Fish House ${rankName(profile.restaurant?.rank||1)}</p></div></section>
      <div class="rd-profile-stats"><article><small>DEEPEST DIVE</small><b>${Math.round(Number(stats.deepest||0))}M</b></article><article><small>SPECIES</small><b>${found}/${D.FISH.length}</b></article><article><small>ANCIENT BOSSES</small><b>${bossCount}/${Object.keys(D.BOSSES||{}).length}</b></article><article><small>PRESTIGE XP</small><b>${prestige.toLocaleString()}</b></article><article><small>BIGGEST CATCH</small><b>${biggestFish?biggestFish.name:'—'}</b><span>${biggest?Number(biggest[1]?.best_weight||0).toFixed(2)+' KG':'No record yet'}</span></article><article><small>CUSTOMERS SERVED</small><b>${Number(stats.total_customers||0).toLocaleString()}</b></article></div>
      <section class="rd-mastery-overview"><div class="rd-profile-section-head"><small>OCEAN MASTERY</small><b>${masteryTotal} / ${D.BIOMES.length*10}</b></div>${D.BIOMES.map(b=>`<article><span>${b.short}</span><div><i style="width:${Math.min(100,Number(mastery[b.id]||0)*10)}%"></i></div><b>${Number(mastery[b.id]||0)}/10</b></article>`).join('')}</section>
      <section class="rd-trophy-cabinet"><div class="rd-profile-section-head"><small>VERIFIED TROPHY CABINET</small><b>${myVerifiedLoaded?`${myVerifiedCatches.length} RECENT CATCHES`:'SYNCING…'}</b></div>${trophies.length?`<div>${trophies.map(c=>`<article class="${Number(c.id)===Number(myFeaturedCatchId)?'featured':''}"><small>${rdEsc(String(c.rarity||'catch').toUpperCase())}</small><h4>${rdEsc(trophyName(c))}</h4><b>${Number(c.weight_kg||0).toFixed(2)} KG · ★${Number(c.quality||1)}</b><span>${rdEsc(D.biome(c.biome)?.short||c.biome)}</span><button data-rd-feature-catch="${Number(c.id)}" ${Number(c.id)===Number(myFeaturedCatchId)?'disabled':''}>${Number(c.id)===Number(myFeaturedCatchId)?'FEATURED':'FEATURE ON PROFILE'}</button></article>`).join('')}</div>`:`<p class="rd-trophy-empty">${myVerifiedLoaded?'Complete a new expedition to add server-verified catches here.':'Loading your validated catches…'}</p>`}</section>
      ${career.endgame?.social&&Object.values(career.endgame.social).some(Boolean)?`<section class="rd-own-social-badges"><div class="rd-profile-section-head"><small>SHARED OCEAN HONOURS</small><b>PERMANENT PRESTIGE</b></div><div>${career.endgame.social.record_breaker?'<span>RECORD BREAKER</span>':''}${career.endgame.social.champion?'<span>HARBOUR CHAMPION</span>':''}${career.endgame.social.pioneer?'<span>PIONEER</span>':''}${career.endgame.social.legacy_diver?'<span>LEGACY DIVER</span>':''}</div></section>`:''}
      ${campaignState.campaign_completed_at||career.endgame?.deep_signal_trophy?`<section class="rd-campaign-profile-trophy"><div class="signal-core"><i></i></div><div><small>THE DEEP SIGNAL</small><h3>BELOW THE CHARTS</h3><p>Main campaign complete · The Signal Core Fragment is archived at the Marine Institute.</p></div><b>CAMPAIGN TROPHY</b></section>`:''}
      ${postgameUnlocked()?`<section class="rd-v16-profile-legacy"><div><small>LIVING POSTGAME CAREER</small><h3>${rdEsc(postgameState.rank||'VETERAN DIVER')}</h3><p>${Number(postgameState.renown||0).toLocaleString()} Diver Renown · ${Number(postgameState.master_stats?.completed||0)} Master Expeditions · ${Number(postgameState.master_stats?.s_ranks||0)} S ranks</p></div><button data-rd-open-legacy>OPEN LEGACY HALL</button></section>`:''}
      <section class="rd-profile-sharing"><div><small>PUBLIC DIVER PROFILE</small><h3>${sharedWorld.my_public_profile===false?'PRIVATE CAREER':'VISIBLE TO REPOCOMPANY'}</h3><p>Only Repo Diver achievements, verified records and your username are shared. Email, account IDs and private account data are never exposed.</p></div><button data-rd-public-toggle="${sharedWorld.my_public_profile===false?'true':'false'}">${sharedWorld.my_public_profile===false?'MAKE PROFILE PUBLIC':'MAKE PROFILE PRIVATE'}</button></section>`;
  }

  function renderHome() {
    if (!$('rdHomeView')) return;
    $('rdDay').textContent = profile.day_number || 1;
    $('rdRank').textContent = rankName(profile.restaurant?.rank || 1);
    $('rdDeepest').textContent = Math.round(profile.stats?.deepest || 0) + 'm';
    if($('rdStatus'))$('rdStatus').innerHTML = `<b>${profile.day_number<=40?`DIVER LEVEL ${profile.day_number}/40`:`MASTER DIVER · DAY ${profile.day_number}`}</b> · ${Object.keys(profile.fish_journal || {}).length}/${D.FISH.length} species · ${Number(profile.stats?.total_revenue || 0).toLocaleString()} GP Fish House lifetime revenue`;
    if($('rdBiomes')){
      const cards=D.BIOMES.map((b, i) => {
        const open = (profile.day_number || 1) >= b.unlock;
        const discovered = D.fishForBiome(b.id).filter(f => profile.fish_journal?.[f.id]).length;
        const sites=D.locationsForBiome?.(b.id)||[],mapped=sites.filter(x=>explorationLocationState(x.id).discovered).length;
        return `<button class="rd-biome ${open ? '' : 'locked'}" data-biome="${b.id}" style="--rd-accent:${b.accent};--rd-deep:${b.deep}"><span class="rd-biome-art"><i></i><em>${open ? 'EXPEDITION' : 'LOCKED'}</em></span><small>ZONE ${String(i + 1).padStart(2, '0')} · ${b.max_depth}M</small><h4>${b.name}</h4><p>${b.mood}</p><footer><span>${discovered}/${D.fishForBiome(b.id).length} SPECIES · ${mapped}/${sites.length} SITES</span><b>${open ? (expeditionTime==='night'?'NIGHT DIVE':'ENTER WATER') : 'DAY ' + b.unlock}</b></footer></button>`;
      }).join('');
      const toolMarkup=`<section class="rd-v14-tool-loadout"><header><div><small>AUTHORED EXPEDITION LOADOUT</small><h4>SPECIALIST TOOLS · CHOOSE 3</h4></div><b>${specialistTools.length}/3 EQUIPPED</b></header><div>${(D.EXPLORATION_TOOLS||[]).map(t=>`<button type="button" data-rd-special-tool="${t.id}" class="${specialistTools.includes(t.id)?'selected':''}"><b>${t.name}</b><span>${t.desc}</span></button>`).join('')}</div></section>`;
      const known=D.EXPLORATION_LOCATIONS.filter(loc=>(profile.day_number||1)>=D.biome(loc.biome).unlock&&explorationLocationState(loc.id).discovered);
      const locMarkup=`<section class="rd-v14-location-intel"><header><div><small>DISCOVERED UNDERWATER SITES</small><h4>AUTHORED EXPEDITIONS</h4></div><span>${Number(explorationState.discovered_count||known.length)} / ${D.EXPLORATION_LOCATIONS.length} MAPPED</span></header><div>${known.length?known.map(loc=>{const st=explorationLocationState(loc.id);return `<article class="${st.completed?'complete':''}"><small>${D.biome(loc.biome).short} · ${loc.type.toUpperCase()}</small><h4>${loc.name}</h4><p>${loc.desc}</p><div class="rd-v14-site-progress"><i style="width:${locationProgressPct(loc)}%"></i></div><footer><span>${Number(st.stage||0)}/${loc.rooms.length} CHAMBERS · ${Number(st.artifact_found||0)}/${Number(st.artifact_total||2)} RELICS</span><button data-rd-location-launch="${loc.id}">${st.completed?'RETURN TO SITE':'AUTHORED EXPEDITION'}</button></footer></article>`}).join(''):`<article class="empty"><small>NO MAJOR SITES MAPPED</small><h4>EXPLORE THE WATER</h4><p>Large wrecks, caves, ruins and facilities can now be entered physically during free dives.</p></article>`}</div></section>`;
      $('rdBiomes').innerHTML=toolMarkup+cards+locMarkup;
    }
    document.querySelectorAll('[data-biome]').forEach(btn => btn.onclick = () => { if (!btn.classList.contains('locked')) startDive(btn.dataset.biome); });
    document.querySelectorAll('[data-rd-special-tool]').forEach(btn=>btn.onclick=()=>toggleSpecialistTool(btn.dataset.rdSpecialTool));
    document.querySelectorAll('[data-rd-location-launch]').forEach(btn=>btn.onclick=()=>{const loc=D.locationById(btn.dataset.rdLocationLaunch);if(loc)startDive(loc.biome,loc.id)});
    renderCareerHub();renderQuestLog();renderContracts();renderBoatView();renderResearchView();renderEndgame();renderProfile();syncTimeToggle();renderJournal();renderUpgrades();applySettings();
  }

  function applyJournalFilters(){
    const root=$('rdJournal');if(!root)return;const q=journalFilters.query.trim().toLowerCase();let visible=0;
    root.querySelectorAll('.rd-fish-card').forEach(card=>{const show=(!q||String(card.dataset.name||'').includes(q))&&(journalFilters.biome==='all'||card.dataset.biome===journalFilters.biome)&&(journalFilters.rarity==='all'||card.dataset.rarity===journalFilters.rarity)&&(journalFilters.status==='all'||card.dataset.status===journalFilters.status);card.hidden=!show;if(show)visible++});
    if($('rdJournalVisible'))$('rdJournalVisible').textContent=`${visible} SHOWN`;
  }
  function bindJournalFilters(){
    const q=$('rdJournalSearch'),biome=$('rdJournalBiome'),rarity=$('rdJournalRarity'),status=$('rdJournalStatus');if(!q)return;q.value=journalFilters.query;biome.value=journalFilters.biome;rarity.value=journalFilters.rarity;status.value=journalFilters.status;
    q.addEventListener('input',()=>{journalFilters.query=q.value;applyJournalFilters()});biome.addEventListener('change',()=>{journalFilters.biome=biome.value;applyJournalFilters()});rarity.addEventListener('change',()=>{journalFilters.rarity=rarity.value;applyJournalFilters()});status.addEventListener('change',()=>{journalFilters.status=status.value;applyJournalFilters()});applyJournalFilters();
  }

  function renderJournal() {
    const j = $('rdJournal');
    if (!j) return;
    const found = Object.keys(profile.fish_journal || {}).length;
    j.innerHTML = `<div class="rd-journal-top"><div><small>MARINE ARCHIVE</small><h4>${found} / ${D.FISH.length} DISCOVERED</h4></div><div class="rd-journal-progress"><i style="width:${found / D.FISH.length * 100}%"></i></div></div><div class="rd-gold-filterbar"><label><span>SEARCH</span><input id="rdJournalSearch" type="search" autocomplete="off" placeholder="Species name"></label><label><span>REGION</span><select id="rdJournalBiome"><option value="all">ALL REGIONS</option>${D.BIOMES.map(b=>`<option value="${rdEsc(b.id)}">${rdEsc(b.short||b.name)}</option>`).join('')}</select></label><label><span>RARITY</span><select id="rdJournalRarity"><option value="all">ALL RARITIES</option>${[...new Set(D.FISH.map(f=>f.rarity))].map(r=>`<option value="${rdEsc(r)}">${rdEsc(String(r).toUpperCase())}</option>`).join('')}</select></label><label><span>STATUS</span><select id="rdJournalStatus"><option value="all">ALL</option><option value="found">DISCOVERED</option><option value="unknown">MISSING</option></select></label><b id="rdJournalVisible">${D.FISH.length} SHOWN</b></div><div class="rd-journal-grid">` + D.FISH.map(f => {
      const x = profile.fish_journal?.[f.id];
      return `<article class="rd-fish-card ${x ? 'found' : 'unknown'}" data-name="${rdEsc(f.name.toLowerCase())}" data-biome="${rdEsc(f.biome)}" data-rarity="${rdEsc(f.rarity)}" data-status="${x?'found':'unknown'}" style="--fish:${f.color}"><div class="rd-fish-silhouette">${x ? '<i class="rd-fish-mark" aria-hidden="true"></i>' : '<b aria-hidden="true">?</b>'}</div><small>${rdEsc(f.rarity)}</small><b>${x ? rdEsc(f.name) : 'UNDISCOVERED SPECIES'}</b><span>${rdEsc(D.biome(f.biome).short)}</span>${x ? `<footer>CAUGHT ${x.count || 0} · BEST ★${x.best_q || 1}${x.best_weight ? ` · PB ${Number(x.best_weight).toFixed(2)}KG` : ''}</footer>` : '<footer>FIND IT IN THE DEEP</footer>'}</article>`;
    }).join('') + '</div>';
    const rs = profile.stats || {}, rest = profile.restaurant || {};
    j.innerHTML += `<section class="rd-food-journal"><div class="rd-journal-top"><div><small>FISH HOUSE LEDGER</small><h4>RESTAURANT CAREER</h4></div><div class="rd-journal-progress"><i style="width:${Math.min(100, Number(rest.rank || 1) * 10)}%"></i></div></div><div class="rd-food-stats"><article><small>RANK</small><b>${rankName(rest.rank || 1)}</b></article><article><small>REPUTATION</small><b>${Number(rest.reputation_points || rs.restaurant_reputation || 0).toLocaleString()}</b></article><article><small>CUSTOMERS</small><b>${Number(rs.total_customers || 0).toLocaleString()}</b></article><article><small>PERFECT DISHES</small><b>${Number(rs.perfect_dishes || 0).toLocaleString()}</b></article><article><small>LIFETIME REVENUE</small><b>${Number(rs.total_revenue || 0).toLocaleString()} GP</b></article><article><small>RECIPES</small><b>${D.RECIPES.filter(r => r.unlock <= (profile.day_number || 1)).length} / ${D.RECIPES.length}</b></article></div></section>`;
    const eco=ecologyState.observations||[],tagCount=(ecologyState.tags||[]).length;j.innerHTML+=`<section class="rd-ecology-journal"><div class="rd-journal-top"><div><small>ECOLOGY ARCHIVE</small><h4>LIVING OCEAN RESEARCH</h4></div><div class="rd-journal-progress"><i style="width:${Math.min(100,eco.length/Math.max(1,Object.keys(D.ECOLOGY_OBSERVATIONS||{}).length*5)*100)}%"></i></div></div><div class="rd-food-stats"><article><small>BEHAVIOURS</small><b>${new Set(eco.map(x=>x.observation)).size} / ${Object.keys(D.ECOLOGY_OBSERVATIONS||{}).length}</b></article><article><small>SPECIES STUDIED</small><b>${new Set(eco.map(x=>x.fish_id)).size}</b></article><article><small>ACTIVE TAGS</small><b>${tagCount}</b></article><article><small>PROTECTED SPECIES</small><b>${[...D.PROTECTED_SPECIES].filter(id=>eco.some(x=>x.fish_id===id)).length} / ${D.PROTECTED_SPECIES.size}</b></article></div><div class="rd-ecology-biomes">${D.BIOMES.map(b=>{const species=D.fishForBiome(b.id),caught=species.filter(f=>profile.fish_journal?.[f.id]).length,notes=eco.filter(x=>x.biome===b.id).length;const pct=Math.min(100,(caught/Math.max(1,species.length))*70+Math.min(30,notes*6));return `<article><span>${b.short}</span><div><i style="width:${pct}%"></i></div><b>${Math.round(pct)}%</b><small>${notes} ECOLOGY NOTES</small></article>`}).join('')}</div></section>`;
    j.insertAdjacentHTML('beforeend',archaeologyMarkup());
    j.querySelectorAll('[data-rd-identify-artifact]').forEach(b=>b.onclick=()=>identifyArtifact(b.dataset.rdIdentifyArtifact));bindJournalFilters();
  }

  function renderUpgrades() {
    const u = $('rdUpgrades');
    if (!u) return;
    u.innerHTML = ['Diving', 'Restaurant'].map(group => `<section class="rd-upgrade-group"><div class="rd-upgrade-title"><small>OPERATIONS</small><h4>${group.toUpperCase()}</h4></div><div class="rd-upgrade-grid">${D.UPGRADES.filter(x => x.group === group).map(x => {
      const lv = profile[x.group === 'Restaurant' ? 'restaurant' : 'equipment']?.[x.key] || 1;
      const max = lv >= x.max;
      const cost = Math.round(x.baseCost * Math.pow(x.mult, lv - 1));
      return `<button data-upgrade="${x.key}" class="rd-upgrade-card ${max ? 'maxed' : ''}"><span>${x.name}</span><small>${x.desc}</small><i>LV ${lv}/${x.max}</i><b>${max ? 'MAXED' : cost.toLocaleString() + ' GP'}</b></button>`;
    }).join('')}</div></section>`).join('');
    document.querySelectorAll('[data-upgrade]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      try {
        const r = await rpc('repo_diver_buy_upgrade', { p_upgrade: b.dataset.upgrade });
        profile.equipment = r.equipment || profile.equipment;
        profile.restaurant = r.restaurant || profile.restaurant;
        renderUpgrades();
      } catch (e) { $('rdStatus').textContent = e.message; }
      finally { b.disabled = false; }
    });
  }

  function ecologyObservationFor(f){
    if(!f)return 'habitat';if(f.protected)return 'protected';if(f.juvenile)return 'parent_young';if(f.activity==='feed')return 'feeding';if(f.behavior==='school')return run?.ecology?.migrationPulse>0?'migration':'schooling';if(f.behavior==='predator'||f.predatorTarget)return run?.ecology?.lastHunt?'predator_hunt':'territorial';if(f.behavior==='ambush')return 'ambush';if(f.behavior==='territorial')return 'territorial';if(f.behavior==='curious'||f.awareness==='curious')return 'curious';if((run?.ecology?.current?.strength||0)>.62)return 'current_riding';return 'habitat';
  }
  function ecologyLabel(kind){return D.ECOLOGY_OBSERVATIONS?.[kind]||String(kind||'HABITAT').replaceAll('_',' ').toUpperCase()}
  async function recordEcologyObservation(f,quality=1){
    if(!runId||!f)return null;const kind=ecologyObservationFor(f);try{const r=await rpc('repo_diver_record_ecology_observation',{p_run_id:runId,p_fish_id:f.id,p_observation:kind,p_quality:Math.max(1,Math.min(4,quality))});if(r?.research)career.research=r.research;const key=`${f.id}:${kind}`;if(!ecologyState.observations.some(x=>`${x.fish_id}:${x.observation}`===key))ecologyState.observations.unshift({fish_id:f.id,biome:run.biome.id,observation:kind,quality});ecologyState.observation_count=Number(r?.ecology_observations||ecologyState.observations.length);return r}catch(_){return null}
  }
  async function tagCreature(){
    if(!run||!runId)return;const crafted=!!career.endgame?.crafted?.research_dart;if(!crafted){E.notice?.(run,'RESEARCH DART ARRAY REQUIRED','warning',1.7);return}
    let target=null,best=9999;for(const f of run.fish){if(f.hidden||f.hooked||f.boss)continue;const d=Math.hypot(f.x-mouse.x,f.y-mouse.y);if(d<best){best=d;target=f}}if(!target||best>130){E.notice?.(run,'NO TAGGABLE SUBJECT IN FRAME','muted',1.1);return}
    try{const r=await rpc('repo_diver_tag_creature',{p_run_id:runId,p_fish_id:target.id});target.tagged=true;target.tagCode=r?.tag_code||'MR-TAG';target.tagId=Number(r?.tag_id||0);ecologyState.tags=[...(ecologyState.tags||[]).filter(x=>x.fish_id!==target.id),{tag_id:target.tagId,tag_code:target.tagCode,fish_id:target.id,biome:run.biome.id,sightings:Number(r?.sightings||1),last_seen_at:new Date().toISOString()}];ecologyState.tag_count=ecologyState.tags.length;E.banner?.(run,'RESEARCH TAG ATTACHED',`${target.tagCode} · ${target.name.toUpperCase()} CAN NOW RETURN ON FUTURE EXPEDITIONS`,'success',3);await recordEcologyObservation(target,3)}catch(err){E.notice?.(run,err?.message||'TAGGING FAILED','warning',1.6)}
  }

  async function startDive(biome, missionLocationId=null, campaignMissionId=null, campaignReplay=false, masterLaunch=null) {
    try {
      const data = await rpc('repo_diver_start_day', { p_biome: biome });
      runId = Array.isArray(data) ? data[0]?.run_id : data?.run_id;
    } catch (e) {
      $('rdStatus').textContent = e.message;
      return;
    }
    let masterConfig=null;if(masterLaunch){try{masterConfig=await rpc('repo_diver_begin_master_expedition',{p_run_id:runId,p_expedition_id:masterLaunch.expedition_id,p_difficulty:masterLaunch.difficulty||masterDifficulty,p_source:masterLaunch.source||'free'});missionLocationId=masterConfig?.location_id||missionLocationId;specialistTools=[...(masterConfig?.recommended_tools||specialistTools)].slice(0,3);expeditionMode=(masterConfig?.category==='ancient'?'boss':'standard');expeditionModifier=masterModifierToEngine(masterConfig?.modifiers||[]);}catch(e){$('rdStatus').textContent=e?.message||'MASTER EXPEDITION LAUNCH FAILED';return;}}
    const season=currentSeasonalEvent(),named=sharedWorld.available&&sharedWorld.named_specimen?.biome===biome&&!sharedWorld.named_specimen?.caught_by?sharedWorld.named_specimen:null;
    const tagCandidates=(ecologyState.tags||[]).filter(x=>x.biome===biome),tagged=tagCandidates.length?tagCandidates[Math.floor(Math.random()*tagCandidates.length)]:null;
    run = E.createRun({ biome, level: profile.day_number, equipment: profile.equipment, timeOfDay: expeditionTime, weather: career.weather?.id || 'clear', boat: career.boat || {}, mode:expeditionMode, modifier:expeditionModifier, loadout:{harpoonType:expeditionHarpoon,lure:expeditionLure}, crafted:endgameCrafted(), seasonal:season?.id||null, namedSpecimen:named, taggedSpecimen:tagged, graphics:settings.graphics, missionLocationId, specialistTools, masterDifficulty:masterConfig?.difficulty||null });
    if(masterConfig){run.master={...masterConfig};run.masterStartedAt=run.elapsed||0;}
    if(campaignMissionId){const m=campaignMission(campaignMissionId);try{const cs=await rpc('repo_diver_begin_campaign_mission',{p_run_id:runId,p_mission_id:campaignMissionId});run.campaign={...m,...cs,id:campaignMissionId,title:cs?.title||m?.title||'THE DEEP SIGNAL',act:Number(m?.act||campaignState.act||1),stage:Number(cs?.stage||0),stage_count:Number(cs?.stage_count||m?.stage_count||1),type:cs?.type||m?.type||'site',location_id:cs?.location_id||m?.location_id||null,replay:!!(campaignReplay||cs?.replay),completed:false,sonarBaseline:null};run.campaignStartedAt=run.elapsed||0;}catch(e){$('rdStatus').textContent=e?.message||'CAMPAIGN LAUNCH FAILED';console.warn('Campaign launch:',e);}}
    for(const site of run.sites||[]){const st=explorationLocationState(site.id);site.discovered=!!st.discovered;site.completed=!!st.completed;site.stage=Number(st.stage||0);if(missionLocationId===site.id){site.x=600;site.y=330;run.ecology.landmark={id:'mission_site',name:site.name,time:4.2};}}
    if(missionLocationId){const target=D.locationById(missionLocationId);if(target){const firstBuoy=run?.campaign?.id==='signal_in_shallows'&&!run.campaign.replay&&Number(run.campaign.stage||0)===0;E.banner?.(run,run.campaign?'STORY EXPEDITION':run.master?'MASTER EXPEDITION':'AUTHORED EXPEDITION',firstBuoy?'DAMAGED SIGNAL BUOY · FOLLOW THE CYAN PULSE AND PRESS E':`${target.name} · LOCATE THE ENTRANCE AND PRESS E`,'event',4.2);}}if(run.master&&!run.campaign){cinematic(run.master.title,`${String(run.master.difficulty||'veteran').toUpperCase()} · MASTER EXPEDITION`,1.8);E.banner?.(run,'MASTER OPERATION',masterObjectiveText(run.master),'event',4.2);try{A.play?.('campaign_reveal')}catch(_){}}if(run.campaign){cinematic(run.campaign.title,`${run.campaign.replay?'EXPEDITION ARCHIVE REPLAY':`ACT ${run.campaign.act} · ${campaignActName(run.campaign.act)}`}`,1.9);const radioRunId=runId,radioMissionId=run.campaign.id,radioSpeaker=run.campaign.crew?.[0]||'darro',radioCopy=campaignDialogueFor(run.campaign.crew?.[0]||'darro',run.campaign);setTimeout(()=>{if(run&&runId===radioRunId&&run.campaign?.id===radioMissionId&&!run.done)campaignRadio(campaignCrewName(radioSpeaker),radioCopy)},settings.reducedMotion?650:2050);try{A.play?.('campaign_reveal')}catch(_){}}
    if(run.ecology?.tagReturn?.tagId){rpc('repo_diver_note_tag_return',{p_run_id:runId,p_tag_id:run.ecology.tagReturn.tagId}).then(r=>{const t=(ecologyState.tags||[]).find(x=>Number(x.tag_id)===Number(r?.tag_id));if(t)t.sightings=Number(r?.sightings||t.sightings)}).catch(()=>{});}
    lastRecentCatchSerial = 0;
    show('rdDiveView');
    ensureDiveNotice();if(!run.campaign&&!run.master)cinematic(run.biome.name,`${expeditionTime==='night'?'NIGHT EXPEDITION':'DAY EXPEDITION'} · ${String(expeditionMode).toUpperCase()}`,1.45);contextTip('move','MOVE THROUGH THE WATER','WASD');
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    const diveCanvas=$('rdDiveCanvas');
    if(diveCanvas){ try{ diveCanvas.focus({preventScroll:true}); }catch(_){ diveCanvas.focus(); } }
  }

  async function takePhoto(){
    if(!run||cameraBusy||run.done)return;cameraBusy=true;
    try{
      const visible=run.fish.filter(f=>!f.hidden&&!f.hooked);let target=null,best=9999;
      for(const f of visible){const d=Math.hypot(f.x-mouse.x,f.y-mouse.y);if(d<best){best=d;target=f}}
      if(!target||best>125){E.notice?.(run,'NO CLEAR SUBJECT IN FRAME','muted',1.2);return;}
      const rank=D.RARITY[target.rarity]?.rank||1;const dartBonus=endgameCrafted()?.research_dart?1:0;const quality=Math.max(1,Math.min(4,Math.round(4-best/48)+(rank>=5?1:0)+dartBonus));
      const r=await rpc('repo_diver_record_photo',{p_run_id:runId,p_fish_id:target.id,p_quality:quality});
      if(r?.research)career.research=r.research;else if(r)career.research=r;if(run?.master)run.masterPhotoCount=Number(run.masterPhotoCount||0)+1;
      const eco=await recordEcologyObservation(target,quality),kind=ecologyObservationFor(target);run.flash=.45;run.shake=2;run.eventBanner={title:eco?'BEHAVIOUR DOCUMENTED':'MARINE PHOTO RECORDED',text:`${target.name.toUpperCase()} · ★${quality} · ${ecologyLabel(kind)}`,type:'success',time:2.2,serial:(run.eventBanner?.serial||0)+1};try{A.play?.('camera',{quality})}catch(_){ }
    }catch(e){if(run)run.notice={text:e.message||'CAMERA FAILED',type:'warning',time:1.4};}
    finally{cameraBusy=false}
  }

  function loop(t) {
    if (!run) return;
    const dt = Math.min(.034, (t - last) / 1000 || .016);last=t;
    if(!paused){input.aimX=mouse.x;input.aimY=mouse.y;E.update(run,dt,input,profile.equipment);updateCampaignDive(dt);try{A.update(run,dt)}catch(_){}updateParticles(dt)}
    draw();hud();
    if (run.done&&!paused) { if(run.player?.hp<=0){const ro=$('rdRescueOverlay');ro?.classList.remove('hidden');setTimeout(()=>{ro?.classList.add('hidden');surface()},900);return;} surface();return; }
    raf = requestAnimationFrame(loop);
  }

  function updateParticles(dt) {
    if(settings.graphics==='balanced'&&run.particles.length>90)run.particles=run.particles.slice(-90);
    for (const p of run.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 18 * dt;
      p.life -= dt;
    }
    run.particles = run.particles.filter(p => p.life > 0);
  }

  function rr(x){return Math.round(x)}
  function depthRatio(){ return run ? E.depthBand(run).ratio : 0; }
  function parallax(mult=1){ return {x:(run?.player?.x-480)*mult,y:(run?.player?.y-270)*mult}; }

  function drawLightRays(ctx,w,h,intensity=.10,tint='#e8ffff'){
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=intensity;
    for(let i=0;i<9;i++){
      const drift=Math.sin(run.elapsed*.13+i)*28;
      const x=(i*137+35+drift)% (w+180)-90;
      ctx.fillStyle=tint;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+70,0);ctx.lineTo(x+200,h);ctx.lineTo(x+125,h);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }

  function drawKelpStalk(ctx,x,baseY,height,width,color,phase){
    ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,baseY);
    const sway=Math.sin(run.elapsed*.8+phase)*13;
    ctx.bezierCurveTo(x-10+sway*.3,baseY-height*.35,x+10+sway*.7,baseY-height*.7,x+sway,baseY-height);ctx.stroke();
    ctx.lineWidth=Math.max(1,width*.45);for(let i=1;i<5;i++){const t=i/5,yy=baseY-height*t,xx=x+sway*t;ctx.beginPath();ctx.moveTo(xx,yy);ctx.quadraticCurveTo(xx+(i%2?18:-18),yy-9,xx+(i%2?24:-24),yy-2);ctx.stroke();}ctx.restore();
  }

  function drawCoralCluster(ctx,x,y,scale,colors){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineCap='round';
    colors.forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=4+i%2;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo((i-1.5)*10,-18-(i%2)*8,(i-1.5)*14,-34-(i%3)*6);ctx.stroke();ctx.beginPath();ctx.moveTo((i-1.5)*7,-14);ctx.lineTo((i-2)*17,-24);ctx.stroke();});
    ctx.restore();
  }

  function drawShipwreck(ctx,x,y,scale,ghost=false){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=ghost?.42:.9;ctx.fillStyle=ghost?'#101820':'#171d21';ctx.strokeStyle=ghost?'#283642':'#7c6649';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-90,18);ctx.lineTo(74,18);ctx.lineTo(55,45);ctx.lineTo(-70,48);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=ghost?'#24343d':'#776143';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-18,17);ctx.lineTo(-10,-74);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,-68);ctx.lineTo(58,-18);ctx.moveTo(-10,-55);ctx.lineTo(-66,-12);ctx.stroke();
    ctx.restore();
  }

  function drawRuins(ctx,w,h,front=false){
    const p=parallax(front?.16:.05);ctx.save();ctx.translate(-p.x,-p.y*.2);ctx.fillStyle=front?'#101918':'#173037';ctx.globalAlpha=front?.95:.55;
    for(let i=0;i<7;i++){const x=70+i*155;const base=h-42;ctx.fillRect(x,base-rr(110+(i%3)*28),18,rr(110+(i%3)*28));ctx.fillRect(x-12,base-rr(115+(i%3)*28),42,10);if(i%2===0){ctx.beginPath();ctx.arc(x+70,base-80,48,Math.PI,0);ctx.lineWidth=14;ctx.strokeStyle=ctx.fillStyle;ctx.stroke();}}
    ctx.restore();
  }

  function drawEnvironment(ctx,w,h,b){
    const scene=D.sceneForBiome(b.id),dr=depthRatio();
    let top=scene.sky,mid=scene.mid,bottom=scene.floor;
    const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,top);gradient.addColorStop(.45,mid);gradient.addColorStop(1,bottom);ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    // Depth colour grade turns every zone progressively colder/darker as the player descends.
    ctx.fillStyle=`rgba(0,5,15,${Math.max(0,dr-.2)*.48})`;ctx.fillRect(0,0,w,h);
    if(!['abyssal','shipgrave','morytania'].includes(b.id))drawLightRays(ctx,w,h,.055+Math.max(0,.12-dr*.08));

    const far=parallax(.035),midP=parallax(.08),near=parallax(.16);
    ctx.save();ctx.translate(-far.x,-far.y*.25);ctx.globalAlpha=.45;ctx.fillStyle='#06131a';
    for(let i=0;i<9;i++){const x=(i*151+35)%w;ctx.beginPath();ctx.ellipse(x,h-54,90+(i%3)*24,26+(i%2)*12,0,0,Math.PI*2);ctx.fill();}ctx.restore();

    if(b.id==='karamja'){
      ctx.save();ctx.translate(-midP.x,-midP.y*.15);ctx.fillStyle='#c2a76f';ctx.fillRect(-40,h-74,w+80,100);for(let i=0;i<10;i++)drawCoralCluster(ctx,80+i*105,h-55,.65+(i%3)*.16,['#df715d','#e9b95b','#4db9a6','#8059ac']);ctx.restore();
      ctx.strokeStyle='rgba(228,206,145,.35)';ctx.lineWidth=7;ctx.beginPath();ctx.arc(770-midP.x*.3,h-75,75,Math.PI,Math.PI*2);ctx.stroke();
    }else if(b.id==='fremennik'){
      ctx.fillStyle='rgba(215,242,255,.78)';ctx.beginPath();ctx.moveTo(0,0);for(let x=0;x<=w;x+=70)ctx.lineTo(x,18+(x%140?12:35));ctx.lineTo(w,0);ctx.closePath();ctx.fill();
      ctx.save();ctx.translate(-midP.x,0);ctx.fillStyle='#203443';for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(i*190-40,h-40);ctx.lineTo(i*190+55,h-190-(i%2)*35);ctx.lineTo(i*190+145,h-40);ctx.fill();}drawShipwreck(ctx,720,h-92,.72,true);ctx.restore();
    }else if(b.id==='kelp'){
      ctx.fillStyle='#132d25';ctx.fillRect(0,h-58,w,80);ctx.save();ctx.translate(-midP.x*.5,0);for(let i=0;i<34;i++){const x=(i*41)% (w+80)-40;drawKelpStalk(ctx,x,h-43,100+(i%7)*24,3+(i%3),'rgba(39,112,76,.72)',i*.8);}ctx.restore();
      ctx.save();ctx.translate(-near.x*.7,0);for(let i=0;i<14;i++){drawKelpStalk(ctx,(i*83+30)%w,h-35,145+(i%5)*33,5,'rgba(20,79,52,.94)',i);}ctx.restore();
    }else if(b.id==='morytania'){
      ctx.save();ctx.translate(-far.x,0);ctx.fillStyle='rgba(39,48,42,.68)';for(let i=0;i<6;i++){const x=i*180+20;ctx.fillRect(x,h-210,13,165);ctx.strokeStyle='#27312b';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x+7,h-170);ctx.lineTo(x-35,h-225);ctx.moveTo(x+7,h-145);ctx.lineTo(x+48,h-205);ctx.stroke();}ctx.restore();
      ctx.fillStyle='#17181b';ctx.fillRect(690-midP.x*.2,h-176,150,132);ctx.fillStyle='#090b0d';ctx.beginPath();ctx.arc(765-midP.x*.2,h-44,58,Math.PI,Math.PI*2);ctx.fill();
      for(let i=0;i<6;i++){ctx.fillStyle=`rgba(160,225,179,${.08+(i%3)*.04})`;ctx.beginPath();ctx.arc((i*173+80)%w,120+(i%4)*72,18+(i%2)*10,0,Math.PI*2);ctx.fill();}
    }else if(b.id==='coral'){
      ctx.fillStyle='#262443';ctx.fillRect(0,h-60,w,80);ctx.save();ctx.translate(-midP.x*.6,0);for(let i=0;i<20;i++)drawCoralCluster(ctx,(i*61+30)%w,h-44,.75+(i%4)*.24,['#ff6f9d','#6ce0d1','#f4ce66','#8c78ff']);ctx.restore();
      ctx.globalAlpha=.22;for(let i=0;i<14;i++){ctx.strokeStyle=['#ff8bc2','#77e4ff','#ffe170'][i%3];ctx.lineWidth=3;ctx.beginPath();ctx.arc((i*83+35)%w,160+(i%5)*47,20+(i%4)*5,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
    }else if(b.id==='shipgrave'){
      ctx.save();ctx.translate(-far.x*.8,0);drawShipwreck(ctx,180,h-118,1.05,true);drawShipwreck(ctx,700,h-95,.9,true);ctx.restore();ctx.save();ctx.translate(-midP.x*.5,0);drawShipwreck(ctx,450,h-92,1.05,false);ctx.strokeStyle='#403a31';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(890,-10);ctx.lineTo(790,h);ctx.stroke();for(let i=0;i<10;i++){ctx.beginPath();ctx.arc(860-i*8,40+i*50,8,0,Math.PI*2);ctx.stroke();}ctx.restore();
    }else if(b.id==='abyssal'){
      ctx.fillStyle='#03050d';ctx.fillRect(0,h-60,w,80);ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='#5577a8';ctx.beginPath();ctx.ellipse(790-far.x*.2,260,150,44,-.08,0,Math.PI*2);ctx.fill();ctx.restore();for(let i=0;i<34;i++){ctx.fillStyle=`rgba(${80+i%2*50},${180+i%3*20},220,${.14+i%4*.04})`;ctx.beginPath();ctx.arc((i*107+55)%w,80+(i*59)%390,1.2+(i%3),0,Math.PI*2);ctx.fill();}
    }else if(b.id==='crystal'){
      ctx.fillStyle='#142833';ctx.fillRect(0,h-62,w,90);ctx.save();ctx.translate(-midP.x*.5,0);for(let i=0;i<18;i++){const x=(i*61+20)%w,ht=45+(i%6)*22;ctx.fillStyle=['#5bd8e8','#8f8cff','#a5f1ff'][i%3];ctx.globalAlpha=.45+(i%3)*.12;ctx.beginPath();ctx.moveTo(x,h-45);ctx.lineTo(x+12,h-45-ht);ctx.lineTo(x+28,h-45);ctx.closePath();ctx.fill();}ctx.restore();ctx.globalAlpha=1;drawLightRays(ctx,w,h,.07,'#9ef7ff');
    }else if(b.id==='volcanic'){
      ctx.fillStyle='#17100d';ctx.fillRect(0,h-68,w,100);ctx.strokeStyle='#ff6e32';ctx.shadowColor='#ff5b24';ctx.shadowBlur=12;ctx.lineWidth=3;for(let i=0;i<11;i++){ctx.beginPath();ctx.moveTo(i*95,h);ctx.lineTo(i*95+35,h-34);ctx.lineTo(i*95+70,h-12);ctx.stroke();}ctx.shadowBlur=0;ctx.save();ctx.translate(-midP.x*.4,0);for(let i=0;i<8;i++){const x=i*130+40;ctx.fillStyle='#24201e';ctx.beginPath();ctx.moveTo(x-35,h-50);ctx.lineTo(x,h-130-(i%3)*22);ctx.lineTo(x+38,h-50);ctx.fill();ctx.fillStyle='rgba(255,120,52,.12)';ctx.beginPath();ctx.ellipse(x,h-135-(i%3)*22,28,60,0,0,Math.PI*2);ctx.fill();}ctx.restore();
    }else if(b.id==='ruins'){
      drawRuins(ctx,w,h,false);ctx.fillStyle='#172520';ctx.fillRect(0,h-52,w,80);ctx.save();ctx.translate(-midP.x*.35,0);ctx.fillStyle='#1c302e';ctx.beginPath();ctx.moveTo(365,h-55);ctx.lineTo(480,h-240);ctx.lineTo(595,h-55);ctx.fill();ctx.fillStyle='#0e1717';ctx.fillRect(446,h-142,68,88);ctx.restore();drawRuins(ctx,w,h,true);
    }else if(b.id==='shattered'){
      ctx.fillStyle='#0b171d';ctx.fillRect(0,h-50,w,70);ctx.save();ctx.translate(-midP.x*.5,0);ctx.fillStyle='#162b32';for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(i*145-40,h);ctx.lineTo(i*145+30,h-170-(i%3)*45);ctx.lineTo(i*145+85,h);ctx.fill();}ctx.strokeStyle='#72aab3';ctx.globalAlpha=.22;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(80+i*170,h-40);ctx.lineTo(140+i*170,h-170);ctx.stroke();}ctx.restore();
    }else if(b.id==='cathedral'){
      ctx.fillStyle='#161626';ctx.fillRect(0,h-55,w,80);ctx.save();ctx.translate(-midP.x*.3,0);ctx.strokeStyle='#4f4d6a';ctx.lineWidth=12;for(let i=0;i<6;i++){const x=90+i*170;ctx.beginPath();ctx.moveTo(x,h-55);ctx.lineTo(x,h-260);ctx.stroke();ctx.beginPath();ctx.arc(x+70,h-180,70,Math.PI,0);ctx.stroke();}ctx.fillStyle='rgba(185,150,255,.13)';for(let i=0;i<5;i++){ctx.fillRect(120+i*180,120,55,110);}ctx.restore();
    }else if(b.id==='midnight'){
      ctx.fillStyle='#010208';ctx.fillRect(0,h-45,w,60);ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#7a88ff';ctx.beginPath();ctx.ellipse(760,300,190,50,-.08,0,Math.PI*2);ctx.fill();ctx.restore();for(let i=0;i<44;i++){ctx.fillStyle=`rgba(100,180,255,${.08+(i%4)*.025})`;ctx.beginPath();ctx.arc((i*97+41)%w,70+(i*67)%420,1+(i%3)*.7,0,Math.PI*2);ctx.fill();}
    }else if(b.id==='crossing'||b.id==='endless'){
      ctx.fillStyle=b.id==='endless'?'#031424':'#071f31';ctx.fillRect(0,h-45,w,65);ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#8cdfff';for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse((i*290+120)%w,180+i*70,130+i*15,24+i*6,-.04,0,Math.PI*2);ctx.fill();}ctx.restore();drawLightRays(ctx,w,h,.045,'#8bdfff');
    }else if(b.id==='citadel'){
      drawRuins(ctx,w,h,false);ctx.save();ctx.translate(-midP.x*.25,0);ctx.fillStyle='#1a2f32';ctx.fillRect(305,h-245,350,195);ctx.fillStyle='#0c1718';ctx.beginPath();ctx.arc(480,h-50,110,Math.PI,0);ctx.fill();ctx.fillStyle='rgba(235,202,107,.17)';ctx.fillRect(448,h-210,64,105);ctx.restore();
    }else if(b.id==='blackrift'){
      ctx.fillStyle='#120707';ctx.fillRect(0,h-60,w,90);ctx.strokeStyle='#ff6545';ctx.lineWidth=3;ctx.shadowColor='#ff4d2e';ctx.shadowBlur=14;for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(i*120,h);ctx.lineTo(i*120+45,h-60);ctx.lineTo(i*120+90,h-25);ctx.stroke();}ctx.shadowBlur=0;for(let i=0;i<7;i++){ctx.fillStyle='rgba(255,120,70,.11)';ctx.beginPath();ctx.ellipse(80+i*145,h-140-(i%3)*25,35,95,0,0,Math.PI*2);ctx.fill();}
    }else if(b.id==='pale'){
      ctx.fillStyle='#b5dce9';ctx.beginPath();ctx.moveTo(0,0);for(let x=0;x<=w;x+=90)ctx.lineTo(x,15+(x%180?22:45));ctx.lineTo(w,0);ctx.closePath();ctx.fill();ctx.save();ctx.translate(-midP.x*.4,0);ctx.fillStyle='#1c3948';for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(i*160-30,h);ctx.lineTo(i*160+45,h-210-(i%2)*50);ctx.lineTo(i*160+125,h);ctx.fill();}ctx.restore();
    }

    // Fine suspended particles and bubbles.
    for(let i=0;i<46;i++){const yy=(i*83+run.elapsed*(10+i%4))%h,xx=(i*173+Math.sin(i*7)*44)%w;ctx.fillStyle=`rgba(210,250,255,${.07+(i%3)*.035})`;ctx.beginPath();ctx.arc(xx,yy,.7+(i%4)*.34,0,Math.PI*2);ctx.fill();}
  }

  function drawLivingOceanBackdrop(ctx,w,h){
    const eco=run?.ecology;if(!eco)return;ctx.save();
    // Moving current streaks make water direction readable without HUD arrows.
    const cur=eco.current||{x:0,y:0,strength:0};ctx.globalAlpha=.07+.08*Math.min(1,cur.strength||0);ctx.strokeStyle='#d2f7ff';ctx.lineWidth=1.1;for(let i=0;i<14;i++){const y=60+(i*37+run.elapsed*9*(cur.y||.2))%430,x=((i*89+run.elapsed*28*(cur.x||.2))%1100)-70;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+42*(cur.x>=0?1:-1),y+12*cur.y);ctx.stroke();}
    // Distant mega-fauna are atmosphere, not collectibles.
    for(const m of eco.megaFauna||[]){ctx.save();ctx.translate(m.x,m.y);ctx.scale(m.scale,m.scale);ctx.globalAlpha=.08;ctx.fillStyle='#020811';if(m.kind==='manta'){ctx.beginPath();ctx.moveTo(28,0);ctx.quadraticCurveTo(0,-18,-38,-5);ctx.quadraticCurveTo(-5,1,-38,8);ctx.quadraticCurveTo(0,19,28,0);ctx.fill();}else if(m.kind==='serpent'){ctx.strokeStyle='#020811';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(-45,0);ctx.bezierCurveTo(-20,-16,10,18,46,0);ctx.stroke();}else{ctx.beginPath();ctx.ellipse(0,0,44,12,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-35,0);ctx.lineTo(-58,-14);ctx.lineTo(-55,14);ctx.closePath();ctx.fill();}ctx.restore();}
    if(eco.sediment>0){ctx.globalAlpha=.05+.16*eco.sediment;ctx.fillStyle='#c6b894';for(let i=0;i<38;i++){const x=(i*83+run.elapsed*7)%w,y=h-100+(i*29)%90;ctx.beginPath();ctx.arc(x,y,1+(i%4)*.45,0,Math.PI*2);ctx.fill();}}
    ctx.restore();
  }

  function drawHazards(ctx){
    for(const h of run.hazards||[]){
      const pulse=.7+Math.sin(h.phase*2)*.2;ctx.save();ctx.globalAlpha=.42;
      if(h.type==='current'){ctx.strokeStyle='#a9efff';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(h.x,h.y,h.r*(.35+i*.15),-.8,.9);ctx.stroke();}}
      else if(h.type==='vent'){ctx.fillStyle='#ff7638';ctx.beginPath();ctx.ellipse(h.x,h.y,26,10,0,0,Math.PI*2);ctx.fill();for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(h.x+(i-2)*6,h.y-18-i*7,3+i%2,0,Math.PI*2);ctx.fill();}}
      else if(h.type==='jelly'){ctx.strokeStyle='#ff9fe1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y,18*pulse,Math.PI,Math.PI*2);ctx.stroke();for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(h.x+i*6,h.y);ctx.quadraticCurveTo(h.x+i*9,h.y+25,h.x+i*5,h.y+43);ctx.stroke();}}
      else if(['coral','shard','debris','rubble'].includes(h.type)){ctx.fillStyle=h.type==='shard'?'#75dbe7':'#4b3e34';ctx.beginPath();ctx.moveTo(h.x-h.r*.5,h.y+h.r*.25);ctx.lineTo(h.x,h.y-h.r*.55);ctx.lineTo(h.x+h.r*.5,h.y+h.r*.25);ctx.closePath();ctx.fill();}
      else if(h.type==='toxic'){ctx.fillStyle='rgba(124,206,112,.18)';ctx.beginPath();ctx.arc(h.x,h.y,h.r*pulse,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
  }

  function fishBody(ctx,f){
    const s=f.visualScale||f.size||1,a=f.archetype||'fish';
    if(a==='eel'){
      ctx.strokeStyle=f.color;ctx.lineWidth=7*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-22*s,0);ctx.bezierCurveTo(-8*s,-9*s,6*s,9*s,22*s,0);ctx.stroke();ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(20*s,0,6*s,0,Math.PI*2);ctx.fill();
    }else if(a==='ray'){
      ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(19*s,0);ctx.quadraticCurveTo(2*s,-18*s,-25*s,-5*s);ctx.quadraticCurveTo(-7*s,0,-25*s,7*s);ctx.quadraticCurveTo(4*s,18*s,19*s,0);ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(-20*s,3*s);ctx.lineTo(-42*s,9*s);ctx.stroke();
    }else if(a==='crustacean'){
      ctx.fillStyle=f.color;ctx.beginPath();ctx.ellipse(0,0,13*s,8*s,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=2*s;for(let i=-1;i<=1;i+=2){for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(i*7*s,(j-1)*3*s);ctx.lineTo(i*(18+j*2)*s,(j-1)*7*s);ctx.stroke();}}ctx.beginPath();ctx.moveTo(8*s,-4*s);ctx.lineTo(18*s,-13*s);ctx.moveTo(8*s,4*s);ctx.lineTo(18*s,13*s);ctx.stroke();
    }else if(a==='jelly'){
      ctx.fillStyle=f.color+'cc';ctx.beginPath();ctx.arc(0,0,12*s,Math.PI,Math.PI*2);ctx.lineTo(12*s,2*s);ctx.lineTo(-12*s,2*s);ctx.closePath();ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=1.5*s;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*4*s,2*s);ctx.quadraticCurveTo(i*6*s,12*s,i*3*s,20*s);ctx.stroke();}
    }else if(a==='squid'){
      ctx.fillStyle=f.color;ctx.beginPath();ctx.ellipse(3*s,0,15*s,8*s,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-8*s,0);ctx.lineTo(-24*s,-10*s);ctx.lineTo(-22*s,10*s);ctx.closePath();ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=1.7*s;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(17*s,i*2*s);ctx.lineTo(31*s,(i-1)*4*s);ctx.stroke();}
    }else if(a==='seahorse'){
      ctx.strokeStyle=f.color;ctx.lineWidth=6*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(2*s,-14*s);ctx.quadraticCurveTo(14*s,-4*s,2*s,7*s);ctx.quadraticCurveTo(-6*s,14*s,2*s,18*s);ctx.stroke();ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(2*s,-15*s);ctx.lineTo(13*s,-11*s);ctx.lineTo(4*s,-6*s);ctx.closePath();ctx.fill();
    }else{
      const heavy=a==='heavy'||a==='puffer',pred=a==='predator';ctx.fillStyle=f.color;ctx.beginPath();ctx.ellipse(0,0,(heavy?18:pred?20:15)*s,(heavy?10:pred?7:7)*s,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-12*s,0);ctx.lineTo(-(pred?30:24)*s,-9*s);ctx.lineTo(-(pred?27:22)*s,9*s);ctx.closePath();ctx.fill();if(pred){ctx.fillStyle='#f4f4e8';ctx.beginPath();ctx.moveTo(12*s,3*s);ctx.lineTo(21*s,0);ctx.lineTo(12*s,-3*s);ctx.closePath();ctx.fill();}
    }
    ctx.fillStyle='#07131a';ctx.beginPath();ctx.arc(8*s,-2*s,1.6*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(8.5*s,-2.4*s,.55*s,0,Math.PI*2);ctx.fill();
  }

  function drawFish(ctx,f){
    const s=f.visualScale||f.size||1,a=f.archetype||'fish',turn=Math.abs(f.turnEase??f.facing??1)<.08?(f.facing||1):(f.turnEase??f.facing??1);
    const speed=Math.hypot(f.vx||0,f.vy||0),swim=Math.sin(f.phase*2.1),idle=f.activity==='pause';
    ctx.save();ctx.translate(f.x,f.y);ctx.rotate((f.bank||0)*.18+Math.sin(f.phase*.7)*.015);ctx.scale(turn*(f.juvenile?.72:1),f.juvenile?.72:1);
    if(a==='jelly')ctx.scale(1+.035*Math.sin(f.phase*2),1-.055*Math.sin(f.phase*2));
    else if(a==='ray')ctx.scale(1,1+.06*Math.sin(f.phase*2.6));
    else if(a==='eel')ctx.rotate(Math.sin(f.phase*1.8)*.06);
    if(f.hidden)ctx.globalAlpha=.14;else if(['legendary','mythic','ancient'].includes(f.rarity)||f.sonarReveal>0){ctx.shadowColor=f.variant==='golden'?'#fff2a1':f.color;ctx.shadowBlur=f.boss?34:f.legendary?22:f.rarity==='mythic'?16:8;}
    if(f.variant==='albino')ctx.filter='brightness(1.45) saturate(.35)';else if(f.variant==='melanistic')ctx.filter='brightness(.58) saturate(.75)';else if(f.variant==='luminous')ctx.shadowBlur=Math.max(ctx.shadowBlur||0,22);else if(f.variant==='golden')ctx.filter='sepia(.45) saturate(1.8) brightness(1.15)';
    if(f.hitFlash>0)ctx.globalAlpha=Math.max(.25,.55+Math.sin(f.hitFlash*30)*.4);
    // Animated tail/fin pass behind the body for swimming archetypes.
    if(!['eel','ray','crustacean','jelly','squid','seahorse'].includes(a)){
      const tailAmp=(idle?.18:1)*(4+Math.min(8,speed*8))*s;ctx.save();ctx.translate(-18*s,0);ctx.rotate(swim*.12);ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(-2*s,0);ctx.lineTo(-16*s,-8*s-tailAmp*.18);ctx.lineTo(-14*s,8*s+tailAmp*.18);ctx.closePath();ctx.fill();ctx.restore();
      ctx.globalAlpha*=.72;ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(-2*s,-5*s);ctx.lineTo(2*s,-13*s-swim*2*s);ctx.lineTo(7*s,-5*s);ctx.closePath();ctx.fill();ctx.globalAlpha=f.hidden?.14:1;
    }
    fishBody(ctx,f);
    if(f.activity==='feed'&&!f.hooked){ctx.globalAlpha=.22;ctx.fillStyle='#d8efdf';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc((10+i*4)*s,(5+i*2)*s,1.1*s,0,Math.PI*2);ctx.fill();}}
    if(f.boss){ctx.globalAlpha=.18+.08*Math.sin(run.elapsed*3);ctx.fillStyle=f.color;ctx.beginPath();ctx.ellipse(0,0,44*s,22*s,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
    if(f.maxHp>1&&!f.hooked&&!f.boss){const barW=26*s;ctx.shadowBlur=0;ctx.globalAlpha=.92;ctx.fillStyle='rgba(0,0,0,.58)';ctx.fillRect(-barW/2,-17*s,barW,2.5);ctx.fillStyle='#7ff2d0';ctx.fillRect(-barW/2,-17*s,barW*(f.hp/f.maxHp),2.5);}
    ctx.restore();
    if(f.namedSpecimen){
      const pulse=.72+.28*Math.sin(run.elapsed*2.1);ctx.save();ctx.translate(f.x,f.y);ctx.shadowColor='#d9b65f';ctx.shadowBlur=18*pulse;ctx.strokeStyle=`rgba(226,190,103,${.34+.22*pulse})`;ctx.lineWidth=1.25;ctx.beginPath();ctx.ellipse(0,0,48*s,26*s,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.font='900 7px ui-monospace, monospace';ctx.fillStyle='#ead79c';ctx.fillText(String(f.namedName||'NAMED SPECIMEN').toUpperCase(),0,-31*s);ctx.font='800 4.5px ui-monospace, monospace';ctx.fillStyle='#79aeb2';ctx.fillText('GLOBAL NAMED SIGHTING',0,-23*s);ctx.restore();
    }
    if(f.tagged||f.protected||f.juvenile){ctx.save();ctx.translate(f.x,f.y);ctx.textAlign='center';ctx.font='800 5px ui-monospace,monospace';ctx.fillStyle=f.tagged?'#8df7df':f.protected?'#9fd8ff':'#a6b9c4';ctx.fillText(f.tagged?`${f.tagCode||'MR-TAG'} · TAGGED`:f.protected?'RESEARCH SPECIES':'JUVENILE',0,-24*s);ctx.restore();}
  }

  function drawDiver(ctx,p){
    const aimAngle=Math.atan2(mouse.y-p.y,mouse.x-p.x);p.aimAngle=aimAngle;const move=Math.hypot(p.vx||0,p.vy||0),moveAngle=move>8?Math.atan2(p.vy,p.vx):aimAngle;const flip=(p.facing||1);const kick=Math.sin(p.swimPhase)*(p.boosting?6:4)*(p.moveAmount||.35),breath=Math.sin(run.elapsed*2.3)*.7,lowO2=p.o2<20;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(moveAngle*.10+(p.vy||0)*.0008);ctx.scale(flip,1);
    if(lowO2)ctx.translate(Math.sin(run.elapsed*10)*.8,0);
    // Tank and harness.
    ctx.fillStyle='#1d3d49';ctx.strokeStyle='#75bfcf';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(-20,-12,11,25,4);ctx.fill();ctx.stroke();ctx.fillStyle='#d7a84d';ctx.fillRect(-17,-15,4,5);ctx.fillStyle='#0b1c23';ctx.fillRect(-17,-8,2,17);
    // Legs + fins.
    ctx.strokeStyle='#14323f';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-5,8);ctx.lineTo(-18,17+kick);ctx.stroke();ctx.beginPath();ctx.moveTo(-2,9);ctx.lineTo(-12,21-kick);ctx.stroke();ctx.fillStyle=p.boosting?'#79e8f5':'#45b4c9';ctx.beginPath();ctx.moveTo(-19,14+kick);ctx.lineTo(-36,16+kick);ctx.lineTo(-23,23+kick);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-12,18-kick);ctx.lineTo(-30,23-kick);ctx.lineTo(-15,28-kick);ctx.closePath();ctx.fill();
    // Suit torso.
    const suit=ctx.createLinearGradient(-9,-14,13,13);suit.addColorStop(0,'#0d2733');suit.addColorStop(.55,'#286878');suit.addColorStop(1,'#0b202a');ctx.fillStyle=suit;ctx.strokeStyle='#79d9e4';ctx.beginPath();ctx.roundRect(-10,-13,24,26,7);ctx.fill();ctx.stroke();ctx.fillStyle='#d9aa48';ctx.fillRect(-3,-11,3,21);ctx.fillStyle='rgba(143,235,247,.24)';ctx.fillRect(2,-9,8,2);
    // Helmet and face.
    ctx.fillStyle='#081820';ctx.beginPath();ctx.arc(10,-13,11,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a0edf3';ctx.stroke();ctx.fillStyle='#d8a16e';ctx.beginPath();ctx.ellipse(13,-13,5.5,6.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(139,231,245,.75)';ctx.beginPath();ctx.roundRect(8.5,-18,10.5,7,3);ctx.fill();
    // Arms brace toward the weapon while aiming/reeling.
    const armLift=run.harpoon?.fight?3:0;ctx.strokeStyle='#22515e';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(5,-2);ctx.lineTo(17,1-armLift);ctx.moveTo(4,2);ctx.lineTo(16,6-armLift);ctx.stroke();ctx.restore();
    // Weapon follows aim independently so movement stays readable.
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(aimAngle);const recoil=(p.recoil||0)*34;ctx.translate(-recoil,0);ctx.fillStyle='#162d35';ctx.fillRect(10,-3,30,6);ctx.fillStyle='#d4a647';ctx.fillRect(19,-2,15,3);ctx.fillStyle='#a7f6ff';ctx.fillRect(36,-1.3,11,2.6);ctx.restore();
    // Boost trail and breathing bubbles.
    if(p.boosting&&settings.graphics!=='balanced'){ctx.save();ctx.globalAlpha=.42;ctx.fillStyle='#baf8ff';for(let i=0;i<6;i++){const d=(i*9+(run.elapsed*70)%45);ctx.beginPath();ctx.arc(p.x-(p.facing||1)*(24+d),p.y+Math.sin(i*2+run.elapsed*5)*5,1.3+(i%2),0,Math.PI*2);ctx.fill();}ctx.restore();}
    if(Math.floor(run.elapsed*2.1)!==Math.floor((run.elapsed-.016)*2.1)){ctx.save();ctx.globalAlpha=.28;ctx.fillStyle='#d9fbff';ctx.beginPath();ctx.arc(p.x+Math.cos(aimAngle)*14,p.y-13+breath,1.5,0,Math.PI*2);ctx.fill();ctx.restore();}
    if(p.damageFlash>0){ctx.save();ctx.globalAlpha=p.damageFlash*.4*Number(settings.flash||1);ctx.strokeStyle='#ff6767';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,p.y,28+p.damageFlash*8,0,Math.PI*2);ctx.stroke();ctx.restore();}
  }

  function drawHarpoon(ctx){
    if(!run?.harpoon)return;const p=run.player,h=run.harpoon;
    if(h.projectile){ctx.save();const sag=Math.min(18,h.projectile.travel*.02);ctx.strokeStyle='rgba(208,246,255,.52)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo((p.x+h.projectile.x)/2,(p.y+h.projectile.y)/2+sag,h.projectile.x,h.projectile.y);ctx.stroke();ctx.translate(h.projectile.x,h.projectile.y);ctx.rotate(h.projectile.angle);ctx.shadowColor='#bdf8ff';ctx.shadowBlur=7;ctx.strokeStyle='#ecfbff';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(9,0);ctx.stroke();ctx.fillStyle='#e7bd62';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(3,-4);ctx.lineTo(4,4);ctx.closePath();ctx.fill();ctx.restore();}
    const fish=h.fight?.fish||h.hooked?.fish;if(fish){ctx.save();const tension=h.fight?.tension??.45,slack=h.fight?Math.max(0,.45-tension)*38:18,vibe=h.fight&&tension>.76?Math.sin(run.elapsed*48)*(tension-.72)*16:0;ctx.strokeStyle=h.fight?(tension>.84?'#ff756b':tension<.2?'#75c8ff':'#edfaff'):'#edfaff';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=h.fight?5:2;ctx.lineWidth=h.fight?1.9:1.4;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.bezierCurveTo(p.x+(fish.x-p.x)*.32,p.y+(fish.y-p.y)*.28+slack+vibe,p.x+(fish.x-p.x)*.68,p.y+(fish.y-p.y)*.72+slack-vibe,fish.x,fish.y);ctx.stroke();if(h.fight&&tension>.84){ctx.globalAlpha=.55+.35*Math.sin(run.elapsed*24);ctx.lineWidth=3;ctx.stroke();}ctx.restore();}
  }

  function sonarRareContacts(){return (run?.fish||[]).filter(f=>Number(f.sonarReveal||0)>0&&(D.RARITY?.[f.rarity]?.rank||1)>=3&&!f.hooked)}
  function useSonarReadout(){
    if(!run)return null;const result=E.useSonar(run,profile.equipment);
    if(result?.ok){
      const contacts=sonarRareContacts().sort((a,b)=>(D.RARITY?.[b.rarity]?.rank||1)-(D.RARITY?.[a.rarity]?.rank||1));
      if(contacts.length){const names=contacts.slice(0,2).map(f=>`${String(f.rarity||'rare').toUpperCase()} ${String(f.name||f.id).toUpperCase()}`).join(' · '),more=contacts.length>2?` · +${contacts.length-2} MORE`:'';E.notice?.(run,`SONAR LOCK · ${names}${more}`,'success',2.8)}
      else E.notice?.(run,'SONAR CLEAR · NO RARE CONTACTS IN RANGE','info',2.0);
    }
    return result;
  }
  function drawSonarContacts(ctx){
    if(!run)return;const contacts=(run.fish||[]).filter(f=>Number(f.sonarReveal||0)>0&&!f.hooked);
    if(!contacts.length)return;ctx.save();ctx.textAlign='center';ctx.textBaseline='bottom';
    for(const f of contacts){const rank=D.RARITY?.[f.rarity]?.rank||1,rare=rank>=3,pulse=.72+.28*Math.sin(run.elapsed*7+(f.x||0)*.02),r=(rare?25:17)*(f.visualScale||f.size||1);
      ctx.translate(f.x,f.y);ctx.globalAlpha=Math.min(1,.28+Number(f.sonarReveal||0)*.22);ctx.strokeStyle=rare?'#77f4ff':'rgba(122,224,232,.58)';ctx.lineWidth=rare?1.8:1;ctx.setLineDash(rare?[5,3]:[2,4]);ctx.beginPath();ctx.arc(0,0,r+pulse*3,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      if(rare){ctx.shadowColor='#61e9f4';ctx.shadowBlur=9;for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.moveTo(r+6,-6);ctx.lineTo(r+6,6);ctx.lineTo(r+12,6);ctx.stroke();ctx.restore()}ctx.shadowBlur=0;ctx.fillStyle='rgba(2,13,18,.86)';ctx.fillRect(-68,-r-31,136,20);ctx.fillStyle='#c8fbff';ctx.font='900 7px ui-monospace,monospace';ctx.fillText(`${String(D.RARITY?.[f.rarity]?.label||f.rarity||'RARE').toUpperCase()} · ${String(f.name||f.id).toUpperCase()}`,0,-r-17)}
      ctx.translate(-f.x,-f.y);
    }
    ctx.restore();
  }
  function drawSonar(ctx){
    if(!run?.sonar?.pulse)return;ctx.save();ctx.strokeStyle='rgba(105,244,255,.8)';ctx.lineWidth=2;ctx.globalAlpha=Math.min(1,run.sonar.pulse);ctx.beginPath();ctx.arc(run.player.x,run.player.y,run.sonar.radius,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(105,244,255,.25)';ctx.beginPath();ctx.arc(run.player.x,run.player.y,Math.max(0,run.sonar.radius-34),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.92;ctx.fillStyle='rgba(1,13,18,.82)';ctx.fillRect(344,84,272,24);ctx.fillStyle='#9cf7ff';ctx.font='800 8px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('SONAR · RARE CONTACTS STAY MARKED FOR 3 SEC',480,100);ctx.restore();
  }

  function drawAim(ctx){
    if(photoMode)return;const ready=run?.harpoon&&!run.harpoon.projectile&&!run.harpoon.hooked&&!run.harpoon.fight&&run.harpoon.cooldown<=0;const pulse=1+Math.sin(run.elapsed*5)*.06;ctx.save();ctx.translate(mouse.x,mouse.y);ctx.scale(pulse,pulse);ctx.strokeStyle=ready?'rgba(203,255,247,.9)':'rgba(255,211,115,.48)';ctx.lineWidth=1.2;for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.moveTo(9,-7);ctx.lineTo(15,-7);ctx.lineTo(15,-1);ctx.stroke();ctx.restore();}ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(0,0,2.2,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  function drawVisibilityMask(ctx,w,h){
    const id=run.biome.id,dr=depthRatio(),deepBiome=['abyssal','shipgrave','morytania','midnight','blackrift','cathedral'].includes(id);if(!deepBiome&&dr<.68)return;const lamp=profile.equipment?.lamp||1;const darkness=(id==='midnight'?.93:id==='abyssal'?.84:id==='shipgrave'?.48:id==='blackrift'?.66:.40)+Math.max(0,dr-.55)*.24;const radius=110+lamp*37+(run.event.visibility-1)*90;
    const g=ctx.createRadialGradient(run.player.x,run.player.y,20,run.player.x,run.player.y,radius);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.48,`rgba(0,2,9,${darkness*.22})`);g.addColorStop(1,`rgba(0,2,9,${Math.min(.95,darkness)})`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    // Directional lamp beam: a restrained additive cone rather than a giant UI flashlight circle.
    const a=run.player.aimAngle||0,len=135+lamp*20,wide=44+lamp*6;ctx.save();ctx.globalCompositeOperation='screen';const lg=ctx.createLinearGradient(run.player.x,run.player.y,run.player.x+Math.cos(a)*len,run.player.y+Math.sin(a)*len);lg.addColorStop(0,'rgba(160,238,245,.10)');lg.addColorStop(1,'rgba(150,225,235,0)');ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(run.player.x,run.player.y);ctx.lineTo(run.player.x+Math.cos(a-.30)*len+Math.cos(a+Math.PI/2)*wide*.2,run.player.y+Math.sin(a-.30)*len+Math.sin(a+Math.PI/2)*wide*.2);ctx.lineTo(run.player.x+Math.cos(a+.30)*len-Math.cos(a+Math.PI/2)*wide*.2,run.player.y+Math.sin(a+.30)*len-Math.sin(a+Math.PI/2)*wide*.2);ctx.closePath();ctx.fill();ctx.restore();
  }


  function drawMajorSites(ctx){
    for(const site of run.sites||[]){
      const d=Math.hypot(site.x-run.player.x,site.y-run.player.y),known=site.discovered||d<185||run.missionLocationId===site.id,pulse=.72+.28*Math.sin(run.elapsed*1.6+(site.pulse||0));
      ctx.save();ctx.translate(site.x,site.y);ctx.globalAlpha=known?1:.48;ctx.shadowColor=run.biome.accent;ctx.shadowBlur=known?14:3;
      if(site.type==='wreck'){
        ctx.rotate(-.08);ctx.fillStyle='#10171b';ctx.strokeStyle='#8b6d45';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-62,12);ctx.lineTo(58,12);ctx.lineTo(38,43);ctx.lineTo(-48,43);ctx.closePath();ctx.fill();ctx.stroke();ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,10);ctx.lineTo(-6,-62);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,-54);ctx.lineTo(46,-13);ctx.stroke();
      }else if(site.type==='cave'){
        const g=ctx.createLinearGradient(0,-65,0,48);g.addColorStop(0,'#172731');g.addColorStop(1,'#080d12');ctx.fillStyle=g;ctx.strokeStyle='#50626b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-72,45);ctx.quadraticCurveTo(-60,-65,0,-72);ctx.quadraticCurveTo(62,-58,72,45);ctx.lineTo(42,45);ctx.quadraticCurveTo(30,-20,0,-25);ctx.quadraticCurveTo(-30,-18,-40,45);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='rgba(0,5,9,.92)';ctx.beginPath();ctx.ellipse(0,20,34,42,0,0,Math.PI*2);ctx.fill();
      }else if(site.type==='facility'){
        ctx.fillStyle='#101d24';ctx.strokeStyle='#72a7a8';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-65,-46,130,88,14);ctx.fill();ctx.stroke();ctx.fillStyle='#172c32';ctx.fillRect(-48,-30,38,22);ctx.fillRect(6,-30,42,22);ctx.strokeStyle='rgba(150,230,230,.35)';ctx.lineWidth=2;for(let i=-42;i<=42;i+=21){ctx.beginPath();ctx.moveTo(i,12);ctx.lineTo(i,35);ctx.stroke()}ctx.fillStyle=`rgba(141,236,232,${.25+.25*pulse})`;ctx.fillRect(-4,-7,8,8);
      }else{
        ctx.strokeStyle='#8d8a69';ctx.fillStyle='#151d1d';ctx.lineWidth=4;ctx.fillRect(-57,-5,114,49);ctx.strokeRect(-57,-5,114,49);for(const x of [-40,0,40]){ctx.beginPath();ctx.moveTo(x,39);ctx.lineTo(x,-58);ctx.stroke();ctx.beginPath();ctx.moveTo(x-10,-58);ctx.lineTo(x+10,-58);ctx.stroke()}ctx.beginPath();ctx.moveTo(-66,-8);ctx.lineTo(0,-72);ctx.lineTo(66,-8);ctx.stroke();
      }
      ctx.shadowBlur=0;
      if(known){ctx.fillStyle='rgba(4,12,17,.82)';ctx.strokeStyle='rgba(170,230,225,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(-80,55,160,33,6);ctx.fill();ctx.stroke();ctx.fillStyle='#dff7f1';ctx.font='700 9px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(site.discovered?site.name:'UNMAPPED STRUCTURE',0,69);ctx.fillStyle='#91b8b7';ctx.font='7px ui-monospace,monospace';ctx.fillText(site.completed?'SITE COMPLETE · E TO RE-ENTER':'E · ENTER / MAP SITE',0,80);}
      ctx.restore();
    }
  }
  function interiorPalette(type){
    if(type==='wreck')return {bg:'#07141a',wall:'#172127',edge:'#8a704c',glow:'#e9b86a',accent:'#7c6342'};
    if(type==='cave')return {bg:'#061117',wall:'#17262e',edge:'#526a72',glow:'#9adbe6',accent:'#314650'};
    if(type==='facility')return {bg:'#061015',wall:'#11242a',edge:'#5e8f91',glow:'#82e3dc',accent:'#27424a'};
    return {bg:'#081414',wall:'#1b2421',edge:'#8e896a',glow:'#e3d07c',accent:'#474c3c'};
  }
  function drawInterior(ctx,w,h){
    const inside=run.interior,site=inside.site,room=site.rooms[Math.min(inside.room,site.rooms.length-1)]||site.rooms[0],pal=interiorPalette(site.type);
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,pal.bg);g.addColorStop(.55,pal.wall);g.addColorStop(1,'#04090c');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    // ceiling / floor geometry
    ctx.fillStyle='rgba(3,8,11,.72)';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w,0);ctx.lineTo(w,112);for(let x=w;x>=0;x-=80)ctx.lineTo(x,95+Math.sin(x*.019+inside.room)*18);ctx.lineTo(0,120);ctx.closePath();ctx.fill();
    ctx.fillStyle='#071013';ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(w,h);ctx.lineTo(w,470);for(let x=w;x>=0;x-=75)ctx.lineTo(x,466+Math.sin(x*.025+1.7)*10);ctx.lineTo(0,474);ctx.closePath();ctx.fill();
    if(site.type==='wreck'){
      ctx.strokeStyle=pal.edge;ctx.lineWidth=4;for(let x=70;x<w;x+=115){ctx.beginPath();ctx.moveTo(x,110);ctx.quadraticCurveTo(x-24,270,x,465);ctx.stroke()}ctx.strokeStyle='rgba(190,150,90,.28)';ctx.lineWidth=2;for(let y=155;y<445;y+=58){ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(w-30,y+Math.sin(y)*5);ctx.stroke()}ctx.fillStyle='rgba(232,184,106,.10)';ctx.fillRect(285,160,220,8);
    }else if(site.type==='cave'){
      ctx.fillStyle='#0c171d';for(let i=0;i<18;i++){const x=(i*137+inside.room*47)%w,y=95+(i*61)%360,r=18+(i%5)*11;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}ctx.strokeStyle='rgba(126,178,185,.16)';ctx.lineWidth=2;for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(i*130,110);ctx.lineTo(i*130+70,465);ctx.stroke();}
    }else if(site.type==='facility'){
      ctx.strokeStyle=pal.edge;ctx.lineWidth=2;for(let x=55;x<w;x+=120){ctx.strokeRect(x,132,88,304)}ctx.fillStyle='rgba(70,164,163,.12)';for(let x=74;x<w;x+=240)ctx.fillRect(x,170,54,78);ctx.fillStyle=`rgba(100,245,224,${.12+.08*Math.sin(run.elapsed*2)})`;for(let x=101;x<w;x+=240)ctx.fillRect(x,189,5,12);
    }else{
      ctx.strokeStyle=pal.edge;ctx.lineWidth=5;for(let x=70;x<w;x+=160){ctx.beginPath();ctx.moveTo(x,455);ctx.lineTo(x,125);ctx.stroke();ctx.beginPath();ctx.moveTo(x-18,125);ctx.lineTo(x+18,125);ctx.stroke()}ctx.strokeStyle='rgba(211,198,130,.24)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(w/2,275,120,Math.PI,Math.PI*2);ctx.stroke();
    }
    // left exit beacon
    ctx.save();ctx.translate(92,320);ctx.shadowColor=pal.glow;ctx.shadowBlur=12;ctx.strokeStyle=pal.glow;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(0,0,34+Math.sin(run.elapsed*3)*3,0,Math.PI*2);ctx.stroke();ctx.restore();
    // authored interaction objective
    ctx.save();ctx.translate(inside.objective.x,inside.objective.y);ctx.shadowColor=pal.glow;ctx.shadowBlur=18;ctx.fillStyle=pal.accent;ctx.strokeStyle=pal.glow;ctx.lineWidth=2.4;ctx.beginPath();ctx.roundRect(-30,-24,60,48,8);ctx.fill();ctx.stroke();ctx.globalAlpha=.38+.25*Math.sin(run.elapsed*4);ctx.strokeRect(-38,-32,76,64);ctx.restore();
    ctx.save();ctx.fillStyle='rgba(2,8,12,.80)';ctx.beginPath();ctx.roundRect(18,18,360,66,8);ctx.fill();ctx.strokeStyle='rgba(160,220,215,.2)';ctx.stroke();ctx.fillStyle='#8eb4b2';ctx.font='700 9px ui-monospace,monospace';ctx.fillText(`${site.type.toUpperCase()} INTERIOR · STAGE ${Math.min(inside.stage+1,site.rooms.length)} / ${site.rooms.length}`,32,39);ctx.fillStyle='#e4f4ed';ctx.font='700 15px ui-monospace,monospace';ctx.fillText(site.name,32,59);ctx.fillStyle=pal.glow;ctx.font='700 9px ui-monospace,monospace';ctx.fillText(inside.completed?'PRIMARY ROUTE COMPLETE':room.name,32,75);ctx.restore();
  }
  function drawCampaignFieldObjective(ctx){
    const obj=campaignFieldObjective();if(!obj)return;
    const pulse=.5+.5*Math.sin((run?.elapsed||0)*3.4),near=Math.hypot(obj.x-run.player.x,obj.y-run.player.y)<145;
    ctx.save();ctx.translate(obj.x,obj.y);
    // Sonar-like rings make the buoy findable without turning it into a giant UI marker.
    ctx.strokeStyle=`rgba(92,235,242,${.25+.28*pulse})`;ctx.lineWidth=1.4;
    for(let i=0;i<3;i++){ctx.globalAlpha=Math.max(.12,.72-i*.19);ctx.beginPath();ctx.arc(0,0,30+i*18+pulse*5,0,Math.PI*2);ctx.stroke()}
    ctx.globalAlpha=1;ctx.shadowColor='#68edf2';ctx.shadowBlur=12+10*pulse;
    // Tether / damaged antenna.
    ctx.strokeStyle='#7f9a91';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,18);ctx.quadraticCurveTo(-8,55,7,92);ctx.stroke();
    ctx.strokeStyle='#c7d4be';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(4,-18);ctx.lineTo(10,-39);ctx.lineTo(15,-28);ctx.stroke();
    // Buoy body.
    ctx.fillStyle='#a74b2e';ctx.strokeStyle='#e2b05d';ctx.lineWidth=2.2;ctx.beginPath();ctx.roundRect(-18,-18,36,36,9);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e0b55c';ctx.fillRect(-18,-4,36,7);
    ctx.fillStyle=pulse>.35?'#8ffff7':'#397d7f';ctx.beginPath();ctx.arc(5,-25,4.2,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='rgba(2,10,14,.86)';ctx.strokeStyle=near?'#9bf6ef':'rgba(102,190,190,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(-72,-72,144,25,5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#d9fbf3';ctx.font='900 8px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(obj.label,0,-57);
    if(near){ctx.fillStyle='#ffe7a4';ctx.font='800 7px ui-monospace,monospace';ctx.fillText(inputMode==='gamepad'?'A · INSPECT':'E · INSPECT',0,61)}
    ctx.restore();
    if(settings.storyAssist){
      ctx.save();ctx.strokeStyle='rgba(109,236,238,.45)';ctx.setLineDash([6,7]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(run.player.x,run.player.y);ctx.lineTo(obj.x,obj.y);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }
  }

  function visualDepthMeters(){
    if(!run)return 0;const physical=Math.round(((run.player?.y||0)/540)*Number(run.biome?.max_depth||0));
    const journey=run.mode==='descent'||['depth','finale'].includes(run.campaign?.type);
    return journey?Math.max(physical,Math.round(Number(run.maxDepth||0))):physical;
  }
  function drawDepthJourney(ctx,w,h){
    if(!run||run.interior)return;const active=run.mode==='descent'||['depth','finale'].includes(run.campaign?.type);if(!active)return;
    const depth=visualDepthMeters(),deep=Math.min(1,depth/600),scroll=depth*1.85;
    ctx.save();
    // The world now visibly travels upward around the diver as recorded depth rises.
    const wash=ctx.createLinearGradient(0,0,0,h);wash.addColorStop(0,`rgba(0,8,24,${.05+deep*.28})`);wash.addColorStop(1,`rgba(0,1,10,${.10+deep*.46})`);ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
    if(depth<230){ctx.globalAlpha=Math.max(0,.23-depth/1000);ctx.fillStyle='#91e4ef';for(let i=0;i<6;i++){const x=80+i*185+(i%2)*34;ctx.beginPath();ctx.moveTo(x-45,0);ctx.lineTo(x+35,0);ctx.lineTo(x+105,340);ctx.lineTo(x+48,340);ctx.closePath();ctx.fill()}}
    ctx.globalAlpha=.15+deep*.22;ctx.fillStyle='#8fd8e1';for(let i=0;i<(settings.graphics==='balanced'?10:20);i++){const x=(i*173+37)%w,y=((i*113-scroll*(.55+(i%4)*.08))%(h+100)+(h+100))%(h+100)-50;ctx.fillRect(x,y,1+(i%3)*.45,10+(i%5)*4)}
    // Passing rock/ruin silhouettes create actual parallax instead of a number-only descent.
    ctx.globalAlpha=.26+deep*.18;ctx.fillStyle='#04101a';ctx.strokeStyle='rgba(88,158,177,.18)';ctx.lineWidth=2;
    for(let i=0;i<7;i++){const x=30+i*155+(i%2)*45,y=((i*151-scroll*.72)%(h+260)+(h+260))%(h+260)-130,hg=75+(i%4)*38;ctx.beginPath();ctx.moveTo(x-58,y+hg);ctx.lineTo(x-25,y+22);ctx.lineTo(x,y);ctx.lineTo(x+30,y+34);ctx.lineTo(x+64,y+hg);ctx.closePath();ctx.fill();ctx.stroke()}
    // 100m depth gates visibly sweep up the screen as the journey continues.
    ctx.globalAlpha=.62;ctx.font='800 7px ui-monospace,monospace';ctx.textAlign='left';for(let m=Math.max(100,Math.floor(depth/100)*100-100);m<=Math.floor(depth/100)*100+300;m+=100){const y=h*.70+(m-depth)*1.45;if(y<70||y>h-25)continue;ctx.strokeStyle='rgba(102,221,229,.25)';ctx.setLineDash([8,12]);ctx.beginPath();ctx.moveTo(28,y);ctx.lineTo(w-28,y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(3,19,25,.82)';ctx.fillRect(32,y-18,92,16);ctx.fillStyle='#9debf1';ctx.fillText(`${m}M DEPTH GATE`,39,y-7)}
    ctx.globalAlpha=.92;ctx.fillStyle='rgba(2,13,20,.84)';ctx.fillRect(w-166,92,142,34);ctx.fillStyle='#7ddbe4';ctx.font='800 7px ui-monospace,monospace';ctx.textAlign='right';ctx.fillText('VISUAL DESCENT',w-35,105);ctx.fillStyle='#e8fbf7';ctx.font='900 15px ui-monospace,monospace';ctx.fillText(`${depth}M`,w-35,120);ctx.restore();
  }

  function drawCampaignMissionGuidance(ctx){
    const c=run?.campaign;if(!c||run.interior||c.replay||c.completed)return;const stage=Number(c.stage||0);let target=null,label='STORY OBJECTIVE',hint='E · ENTER';
    if(c.location_id&&stage>0){target=(run.sites||[]).find(s=>s.id===c.location_id);if(target){label=String(target.name||'MISSION SITE').toUpperCase();hint='STORY OBJECTIVE · E AT ENTRANCE'}}
    if(c.id==='the_deep_signal'&&stage===5){target={x:760,y:190};label='DEEP SIGNAL SOURCE';hint=inputMode==='gamepad'?'LB · SONAR PING':'Q · SONAR PING'}
    if(!target)return;const pulse=.5+.5*Math.sin(run.elapsed*4.1);ctx.save();ctx.translate(target.x,target.y);ctx.strokeStyle=`rgba(105,238,242,${.38+.28*pulse})`;ctx.lineWidth=1.5;for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(0,0,33+i*17+pulse*4,0,Math.PI*2);ctx.stroke()}ctx.fillStyle='rgba(1,13,18,.88)';ctx.strokeStyle='rgba(110,226,230,.55)';ctx.beginPath();ctx.roundRect(-78,-72,156,29,5);ctx.fill();ctx.stroke();ctx.fillStyle='#d9fbf6';ctx.font='900 8px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(label,0,-59);ctx.fillStyle='#ffdfa0';ctx.font='800 6px ui-monospace,monospace';ctx.fillText(hint,0,-49);ctx.restore();if(settings.storyAssist||c.id==='signal_in_shallows'||(c.id==='the_deep_signal'&&stage===5)){ctx.save();ctx.strokeStyle='rgba(101,231,235,.38)';ctx.setLineDash([7,8]);ctx.beginPath();ctx.moveTo(run.player.x,run.player.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);ctx.restore()}
  }

  function drawCampaignSetpiece(ctx,w,h){const c=run?.campaign;if(!c)return;const stage=Number(c.stage||0);if(c.id==='silence_at_erebos'&&run.interior&&run.interior.site?.id==='station_erebos'&&stage>=5){ctx.save();ctx.fillStyle='#02070a';ctx.strokeStyle='rgba(114,210,217,.28)';ctx.lineWidth=6;ctx.fillRect(570,115,320,225);ctx.strokeRect(570,115,320,225);const t=(run.elapsed*.08)%1;ctx.globalAlpha=.18+.14*Math.sin(run.elapsed*.6);ctx.fillStyle='#9bd3dc';ctx.beginPath();ctx.ellipse(930-t*520,235,125,36,-.08,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='rgba(3,9,12,.88)';ctx.fillRect(575,305,310,30);ctx.fillStyle='#9cc9ca';ctx.font='700 9px ui-monospace,monospace';ctx.fillText('OBSERVATION DOME · EXTERNAL CONTACT',592,324);ctx.restore();}
    if(!run.interior&&c.crew?.includes?.('cass')){ctx.save();const rx=760+Math.sin(run.elapsed*.23)*80,ry=175+Math.sin(run.elapsed*.9)*18;ctx.translate(rx,ry);ctx.globalAlpha=.68;ctx.fillStyle='#203b43';ctx.strokeStyle='#8fc8cd';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,16,7,.08,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(18,-1,6,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(124,202,210,.5)';ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(-34,7);ctx.lineTo(-46,3);ctx.stroke();ctx.fillStyle='rgba(5,13,17,.72)';ctx.fillRect(-35,15,76,18);ctx.fillStyle='#9bc8ca';ctx.font='700 7px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('CASS ROOK · FIELD RIVAL',3,27);ctx.restore();}
    if(c.type!=='depth'&&c.type!=='finale')return;ctx.save();const intensity=Math.min(1,Math.max(0,(Number(run.maxDepth||0)-120)/420));ctx.fillStyle=`rgba(0,2,8,${.16+intensity*.48})`;ctx.fillRect(0,0,w,h);ctx.globalAlpha=.18+intensity*.34;ctx.fillStyle='#9ad9e8';for(let i=0;i<(settings.graphics==='balanced'?10:22);i++){const x=(i*173+run.elapsed*(4+i%3))%w,y=(i*97+run.elapsed*(16+i%4)*2)%h;ctx.fillRect(x,y,.7+(i%3)*.5,8+(i%4)*7)}ctx.globalAlpha=1;
    if(stage>=2){ctx.fillStyle='rgba(3,8,15,.92)';ctx.strokeStyle='rgba(91,164,185,.16)';ctx.lineWidth=3;const base=455;for(let i=0;i<6;i++){const x=120+i*155,hg=110+(i%3)*75;ctx.beginPath();ctx.moveTo(x-50,base);ctx.lineTo(x-20,base-hg);ctx.lineTo(x+20,base-hg-35);ctx.lineTo(x+55,base);ctx.closePath();ctx.fill();ctx.stroke()}ctx.strokeStyle='rgba(142,218,228,.19)';ctx.beginPath();ctx.arc(w*.52,335,180,Math.PI,Math.PI*2);ctx.stroke();}
    if(c.type==='finale'&&stage>=4){const x=w+180-((run.elapsed*22)%1400);ctx.globalAlpha=.16+.08*Math.sin(run.elapsed*.4);ctx.fillStyle='#9fd5dc';ctx.beginPath();ctx.ellipse(x,190,240,55,.05,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x+150,185);ctx.quadraticCurveTo(x+310,120,x+390,208);ctx.quadraticCurveTo(x+270,220,x+150,195);ctx.fill();ctx.globalAlpha=.4;ctx.fillStyle='#d8fbff';ctx.beginPath();ctx.arc(x-122,177,5,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }

  function draw(){
    const canvas=$('rdDiveCanvas'),ctx=canvas?.getContext('2d');if(!ctx||!run)return;const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.save();const shakeAmt=run.shake*Number(settings.shake??1);ctx.translate((Math.random()-.5)*shakeAmt,(Math.random()-.5)*shakeAmt);const z=run.camera?.zoom||1;ctx.translate(w/2,h/2);ctx.scale(z,z);ctx.translate(-w/2-(run.camera?.x||0)*.055,-h/2-(run.camera?.y||0)*.035);
    if(run.interior){drawInterior(ctx,w,h);}else{drawEnvironment(ctx,w,h,run.biome);drawLivingOceanBackdrop(ctx,w,h);drawDepthJourney(ctx,w,h);drawMajorSites(ctx);drawHazards(ctx);}drawCampaignSetpiece(ctx,w,h);drawCampaignFieldObjective(ctx);drawCampaignMissionGuidance(ctx);
    for(const t of run.treasures){if(run.interior||t.opened)continue;const pulse=1+Math.sin(t.phase*3)*.06;ctx.save();ctx.translate(t.x,t.y);ctx.scale(pulse,pulse);ctx.shadowColor='#ffd96c';ctx.shadowBlur=t.revealed?20:7;ctx.fillStyle='#68451e';ctx.beginPath();ctx.roundRect(-14,-9,28,18,3);ctx.fill();ctx.strokeStyle=t.revealed?'#fff09b':'#d8aa55';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#d5a847';ctx.fillRect(-2,-9,4,18);if((profile.equipment?.salvage||1)<(t.required||1)){ctx.shadowBlur=0;ctx.fillStyle='#c7d5d7';ctx.font='7px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(`RIG ${t.required}`,0,-15);}ctx.restore();}
    for(const f of run.fish)drawFish(ctx,f);drawSonarContacts(ctx);for(const p of run.particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color||'#c8ffff';ctx.beginPath();ctx.arc(p.x,p.y,p.size||2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;drawHarpoon(ctx);drawSonar(ctx);drawDiver(ctx,run.player);drawAim(ctx);
    // Near-field particulate gives a real foreground layer without obscuring play.
    if(settings.graphics!=='balanced'){ctx.globalAlpha=.10;ctx.fillStyle='#d8fbff';for(let i=0;i<14;i++){const x=(i*191+run.elapsed*17)%w,y=(i*117+run.elapsed*(22+i%3))%h;ctx.beginPath();ctx.arc(x,y,1.4+(i%4)*.6,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
    ctx.restore();drawVisibilityMask(ctx,w,h);
    if(run.ecology?.debug){ctx.save();ctx.fillStyle='rgba(0,10,15,.78)';ctx.fillRect(12,92,220,104);ctx.fillStyle='#9cebdc';ctx.font='11px ui-monospace,monospace';const z=E.ecologyZoneAt?.(run,run.player.x,run.player.y),lines=[`V13 ECOLOGY DEBUG`,`ZONE ${z?.name||'OPEN WATER'}`,`FISH ${run.fish.length} · SCHOOLS ${new Set(run.fish.filter(f=>f.groupId).map(f=>f.groupId)).size}`,`NOISE ${(run.ecology.noise||0).toFixed(2)} · CURRENT ${(run.ecology.current?.strength||0).toFixed(2)}`,`DIRECTOR ${run.ecology.personality?.id||'—'} · NEXT ${Math.max(0,run.ecology.directorTimer||0).toFixed(1)}S`,`EVENTS ${run.stats.ecologyEvents||0} · HISTORY ${(run.ecology.history||[]).slice(0,2).join(', ')}`];lines.forEach((x,i)=>ctx.fillText(x,22,111+i*15));ctx.restore();}
    const vg=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.32,w/2,h/2,Math.max(w,h)*.66);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,run.player.o2<18?'rgba(44,0,0,.32)':'rgba(0,5,10,.22)');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);
    if(run.flash>0&&Number(settings.flash)>0){ctx.fillStyle=`rgba(255,255,255,${run.flash*.10*Number(settings.flash)})`;ctx.fillRect(0,0,w,h);}
  }

  function showCatchDiscovery(item){
    if(!item)return;const fish=D.fishById(item.id);if(!fish)return;run._sessionSeen=run._sessionSeen||{};const prior=profile.fish_journal?.[item.id];const sessionPrior=run._sessionSeen[item.id];const isNew=!prior&&!sessionPrior;const oldBest=Math.max(Number(prior?.best_weight||0),Number(sessionPrior?.best||0));const isRecord=item.weight>oldBest+.005;run._sessionSeen[item.id]={best:Math.max(oldBest,item.weight)};
    const variant=item.variant&&item.variant!=='normal'?` · ${String(item.variant).toUpperCase()}`:'';const title=item.namedName?'NAMED SPECIMEN LANDED':fish.rarity==='ancient'?'ANCIENT SPECIMEN LANDED':isNew?'NEW SPECIES DISCOVERED':isRecord?'NEW PERSONAL RECORD':'CATCH LANDED';const delta=isRecord&&oldBest>0?`PREVIOUS ${oldBest.toFixed(2)} KG · +${(item.weight-oldBest).toFixed(2)} KG`:isNew?'ADDED TO MARINE JOURNAL':'';
    enqueueReward({kicker:title+variant,title:item.namedName||fish.name,meta:`${fish.rarity.toUpperCase()} · ${D.biome(fish.biome).short}${item.namedName?` · ${fish.name}`:''}`,value:`${Number(item.weight).toFixed(2)} KG · ★${item.q}`,delta,rarity:item.namedName?'ancient':fish.rarity,duration:item.namedName?4600:fish.rarity==='ancient'?4200:isNew?3200:2200});
    if(isNew)markTutorial('firstCatch');
  }


  function hud(){
    if(!run)return;const co=campaignObjectiveMarkup(),objective=$('rdCampaignObjective');if(objective){objective.classList.toggle('hidden',!co);objective.classList.toggle('assist',!!settings.storyAssist);if(co){objective.querySelector('small').textContent=co.act;objective.querySelector('b').textContent=co.title;objective.querySelector('span').textContent=co.stage+(settings.storyAssist&&run.campaign?.location_id?` · ${D.locationById?.(run.campaign.location_id)?.name||'FOLLOW SITE BEACON'}`:'');objective.querySelector('em').textContent=co.progress;}}$('rdO2Fill').style.width=run.player.o2+'%';$('rdHpFill').style.width=run.player.hp+'%';const band=E.depthBand(run),depth=visualDepthMeters();$('rdDepth').textContent=depth+'m';$('rdDepthBand')&&($('rdDepthBand').textContent=run.interior?(run.interior.site.rooms[Math.min(run.interior.room,run.interior.site.rooms.length-1)]?.name||'INTERIOR'):band.label);$('rdBiomeName')&&($('rdBiomeName').textContent=run.interior?run.interior.site.name:(run.campaign?.type==='finale'||run.campaign?.type==='depth'?'UNCHARTED DEPTHS':run.biome.short));
    const kg=E.cargoWeight(run),cap=E.cargoCap(profile.equipment);$('rdCargo').textContent=kg.toFixed(1)+'/'+cap+'kg';$('rdCargo')?.closest('.rd-hudbox')?.classList.toggle('rd-cargo-full',kg>=cap-.05);$('rdCatchCount').textContent=run.catches.filter(x=>x.kind==='fish').length;
    const sonarMax=Math.max(7,22-(profile.equipment?.sonar||1)*2.2),ready=Math.max(0,1-run.sonar.cooldown/sonarMax);if($('rdSonarFill'))$('rdSonarFill').style.width=(ready*100)+'%';if($('rdSonarLabel'))$('rdSonarLabel').textContent=run.sonar.cooldown>0?Math.ceil(run.sonar.cooldown)+'S':(inputMode==='gamepad'?'LB · PING':'Q · PING');
    if(run.boss?.activeFish&&$('rdDepthBand'))$('rdDepthBand').textContent=`ANCIENT CONTACT · ${Math.max(0,run.boss.activeFish.hp)}/${run.boss.activeFish.maxHp} ARMOUR`;
    const bossBar=$('rdBossBar'),boss=run.boss?.activeFish;if(bossBar){bossBar.classList.toggle('hidden',!boss);if(boss){$('rdBossName').textContent=boss.name;$('rdBossFill').style.width=`${Math.max(0,boss.hp/boss.maxHp*100)}%`;}}
    if(run.harpoon?.fight)contextTip('reel','HOLD / RELEASE TO MANAGE LINE TENSION','SPACE');else if(run.interior){const inside=run.interior,room=inside.site.rooms[Math.min(inside.stage,inside.site.rooms.length-1)],nearExit=run.player.x<145,nearObj=Math.hypot(run.player.x-inside.objective.x,run.player.y-inside.objective.y)<110;if(nearExit)contextTip('site_exit_'+inside.site.id,'RETURN TO OPEN WATER','E');else if(nearObj&&!inside.completed)contextTip('site_task_'+inside.site.id+'_'+inside.stage,`${(room?.task||'INTERACT').replaceAll('_',' ').toUpperCase()} · ${room?.tool&&room.tool!=='none'?(D.EXPLORATION_TOOLS?.find(x=>x.id===room.tool)?.name||room.tool.toUpperCase()):'NO TOOL REQUIRED'}`,'E');}
    else if(nearestCampaignFieldObjective(135))contextTip('deep_signal_buoy','INSPECT THE DAMAGED SIGNAL BUOY',inputMode==='gamepad'?'A':'E');else if(run.campaign?.id==='the_deep_signal'&&Number(run.campaign.stage||0)===5&&run.sonar?.cooldown<=0)contextTip('deep_signal_source','LYRA HAS LOCKED THE SOURCE — PING IT WITH SONAR',inputMode==='gamepad'?'LB':'Q');else if(nearestMajorSite())contextTip('major_site_'+nearestMajorSite().id,`${nearestMajorSite().discovered?'ENTER':'DISCOVER'} ${nearestMajorSite().name}`,'E');else if((run.fish||[]).some(f=>(f.protected||f.juvenile)&&!f.hidden&&Math.hypot(f.x-run.player.x,f.y-run.player.y)<190))contextTip('protected_research','PROTECTED WILDLIFE · C PHOTO · R TAG (RESEARCH DART)','C / R');else if(run.recentCatch?.releaseUntil>run.elapsed&&!run.recentCatch?.released)contextTip('release','RELEASE THIS CATCH BACK INTO THE OCEAN','X');else if(run.sonar?.cooldown<=0&&run.elapsed>8)contextTip('sonar','SONAR READY — Q PINGS THE WATER; RARE CONTACTS WILL BE BRACKETED','Q');else if(run.treasures?.some(t=>!t.opened&&Math.hypot(t.x-run.player.x,t.y-run.player.y)<95))contextTip('salvage','SALVAGE WITHIN REACH','E');
    if($('rdGearCondition'))$('rdGearCondition').textContent=`${Math.round(run.durability??100)}%`;
    if($('rdDescentLayer')){$('rdDescentLayer').textContent=run.mode==='descent'?`L${Number(run.descent?.layer||1)}`:'—';$('rdDescentLayer').closest('.rd-hudbox')?.classList.toggle('hidden',run.mode!=='descent');}
    if(tutorialState.move&&!tutorialState.harpoon&&run.elapsed>2&&run.fish?.some(x=>!x.hidden&&Math.hypot(x.x-run.player.x,x.y-run.player.y)<260))contextTip('harpoon','AIM WITH THE MOUSE · FIRE THE HARPOON','CLICK');
    const help=document.querySelector('#rdDiveView .rd-dive-help');if(help)help.classList.toggle('learned',!!(tutorialState.move&&tutorialState.harpoon&&tutorialState.sonar));
    const n=ensureDiveNotice();if(n){const active=run.notice?.time>0;n.textContent=active?run.notice.text:(run.harpoon?.fight?'SPACE · CONTROL LINE TENSION':run.harpoon?.hooked?'REELING CATCH…':run.harpoon?.projectile?'HARPOON IN FLIGHT':'CLICK TO FIRE HARPOON');n.dataset.type=active?run.notice.type:'muted';n.classList.toggle('show',!!n.textContent);}
    const f=$('rdFightPanel');if(f){const fight=run.harpoon?.fight;f.classList.toggle('hidden',!fight);if(fight){$('rdFightName').textContent=fight.fish.name;$('rdTensionFill').style.width=(fight.tension*100)+'%';$('rdTensionFill').dataset.zone=fight.tension>.84?'high':fight.tension<.2?'low':'good';$('rdReelFill').style.width=(fight.progress*100)+'%';}}
    const ev=$('rdEventBanner');if(ev){const data=run.eventBanner,active=data&&data.time>0;ev.classList.toggle('show',!!active);if(active){ev.dataset.type=data.type;ev.querySelector('b').textContent=data.title;ev.querySelector('span').textContent=data.text||'';}}
    if(run.ecology?.landmark?.time>0){run.ecology.landmark.time=Math.max(0,run.ecology.landmark.time-.016);if(run.ecology.landmark.time>2.6)contextTip('habitat_'+run.ecology.landmark.id,`ENTERING ${run.ecology.landmark.name}`,'');}
    if(run.recentCatch?.serial&&run.recentCatch.serial!==lastRecentCatchSerial){lastRecentCatchSerial=run.recentCatch.serial;showCatchDiscovery(run.recentCatch);}
  }

  function menuCapacity() {
    return Math.min(8, 2 + Math.max(1, Number(profile.restaurant?.menu || 1)));
  }

  function crewForTonight() {
    return D.staffForLevel(profile.restaurant?.staff || 1);
  }

  function crewWages() {
    return crewForTonight().reduce((sum, x) => sum + Number(x.wage || 0), 0);
  }

  function serviceEventForTonight() {
    if (servicePreviewEvent) return servicePreviewEvent;
    const fishCount = run?.catches?.filter(x => x.kind === 'fish').length || 0;
    const idx = Math.abs(((profile.day_number || 1) * 7 + fishCount * 3 + (profile.restaurant?.rank || 1))) % D.SERVICE_EVENTS.length;
    servicePreviewEvent = D.SERVICE_EVENTS[idx];
    return servicePreviewEvent;
  }

  function plannedSpecialForTonight(event = serviceEventForTonight()) {
    const day = Number(profile.day_number || 1);
    const repLv = Number(profile.restaurant?.reputation || 1);
    const rank = Number(profile.restaurant?.rank || 1);
    if (postgameUnlocked() && rank >= 8 && day % 4 === 0) return { type:'vip', label:"CHEF'S TABLE", name:'Velmoran Tasting Reservation', note:'A veteran-career reservation built around premium plates, variety and presentation.', legacy:true };
    if (event?.id === 'critic' || (repLv >= 2 && day % 5 === 0)) {
      return { type: 'critic', label: 'FISH HOUSE CRITIC', name: 'Velmora Table Review', note: 'Judges food, speed, ambience and plating.' };
    }
    if (rank >= 3 && day % 3 === 0) {
      return { type: 'vip', label: 'VIP RESERVATION', name: 'Coastal Guild Patron', note: 'Wants one of tonight’s premium dishes.' };
    }
    return null;
  }

  function renderSurfaceSetup() {
    const maxMenu = menuCapacity();
    if ($('rdMenuCapacity')) $('rdMenuCapacity').textContent = `${selectedRecipes.length} / ${maxMenu} SLOTS`;
    const crew = crewForTonight();
    const crewBox = $('rdCrewPreview');
    if (crewBox) {
      crewBox.innerHTML = crew.length
        ? crew.map(x => `<article><span class="rd-staff-avatar">${x.name[0]}</span><div><b>${x.name}</b><small>${x.role} · ${x.wage} GP wage</small><em>${x.trait}</em></div></article>`).join('')
        : `<article class="player-run"><span class="rd-staff-avatar">YOU</span><div><b>YOU RUN THE LINE</b><small>No hired crew yet</small><em>Upgrade Kitchen Crew to hire staff.</em></div></article>`;
    }
    const themes = $('rdThemeChoices');
    if (themes) {
      themes.innerHTML = D.RESTAURANT_THEMES.map(x => `<button type="button" data-rd-theme="${x.id}" class="${restaurantTheme === x.id ? 'selected' : ''}"><b>${x.name}</b><small>${x.desc}</small></button>`).join('');
      themes.querySelectorAll?.('[data-rd-theme]')?.forEach?.(b => b.addEventListener('click', async () => {
        restaurantTheme = b.dataset.rdTheme;
        themes.querySelectorAll('[data-rd-theme]').forEach(x => x.classList.toggle('selected', x === b));
        try { await rpc('repo_diver_save_restaurant_theme', { p_theme: restaurantTheme }); profile.restaurant = { ...profile.restaurant, theme: restaurantTheme }; } catch (_) {}
      }));
    }
    const event = serviceEventForTonight();
    const special = plannedSpecialForTonight(event);
    const ecoBrief=run?.ecology?.personality?.id==='migration'?' · MIGRATION CATCHES ARE TRENDING TONIGHT':run?.ecology?.personality?.id==='salvage'?' · HARBOUR CROWD IS TALKING ABOUT TODAY’S WRECK FINDS':'';
    if ($('rdNightBrief')) $('rdNightBrief').innerHTML = `<b>${event.name}</b><span>${event.desc}${special ? ` · ${special.label} EXPECTED` : ''}${ecoBrief}</span>`;
    const list = $('rdOpeningChecklist');
    if (list) {
      const fish = run?.catches?.filter(x => x.kind === 'fish').length || 0;
      list.innerHTML = `<span class="${fish ? 'ok' : ''}"><b>${fish}</b> menu-grade catches</span><span class="${selectedRecipes.length ? 'ok' : ''}"><b>${selectedRecipes.length}</b> dishes selected</span><span class="ok"><b>${Math.min(8, Math.max(3, Number(profile.restaurant?.tables || 3)))}</b> dining tables</span><span class="ok"><b>${crew.length}</b> hired staff · ${crewWages()} GP wages</span>`;
    }
  }

  function surface() {
    cancelAnimationFrame(raf);
    if (!run) return;
    show('rdSurfaceView');cinematic('EXPEDITION RECOVERED',`${Math.round(run.maxDepth)}M MAXIMUM DEPTH`,1.2);
    servicePreviewEvent = null;
    restaurantTheme = profile.restaurant?.theme || restaurantTheme || 'harbour';
    $('rdSurfaceDepth').textContent = run.maxDepth + 'm';
    $('rdSurfaceNotice').innerHTML = `Expedition recovered <b>${run.catches.filter(x => x.kind === 'fish').length} fish</b> and <b>${run.catches.filter(x => x.kind === 'treasure').length} treasures</b>. Cargo used: <b>${E.cargoWeight(run).toFixed(1)}/${E.cargoCap(profile.equipment)}kg</b>.`;

    $('rdCatchList').innerHTML = run.catches.length ? run.catches.map(x => `<div class="rd-catch-row ${x.legendary ? 'legendary' : ''}"><span>${x.kind === 'treasure' ? '◆' : x.legendary ? '★' : '◈'} ${x.namedName||x.name}${x.namedName?` <em>${x.name}</em>`:''}</span><small>${x.rarity}${x.variant&&x.variant!=='normal'?' · '+String(x.variant).toUpperCase():''} · ${Number(x.weight || 0).toFixed(2)}kg · ★${x.q}</small></div>`).join('') : '<p>No catches made. The sea wins this one.</p>';

    selectedRecipes = [];
    const rec = D.recipesForCatches(run.catches, profile.day_number);
    const fishCounts = {};
    for (const x of run.catches.filter(x => x.kind === 'fish')) fishCounts[x.id] = (fishCounts[x.id] || 0) + 1;
    const maxMenu = menuCapacity();
    $('rdRecipeChoices').innerHTML = rec.map(r => `<button data-recipe="${r.id}" data-category="${r.category || 'seared'}"><span class="rd-recipe-meta">${String(r.category || 'house').toUpperCase()} · COMPLEXITY ${r.complexity || r.tier || 1}</span><b>${r.name}</b><small>${Math.round(r.base_price*DIVER_GP_TUNING).toLocaleString()} GP base · ${fishCounts[r.fish_id] || 0} portions · ${String(r.appeal || 'local').toUpperCase()} APPEAL</small></button>`).join('') || '<p>No menu-grade fish are available for service. You can still bank the expedition and return to harbour.</p>';
    const serviceButton=$('rdOpenRestaurant');
    if(serviceButton){
      serviceButton.dataset.emptyNight=rec.length?'false':'true';
      serviceButton.textContent=rec.length?'OPEN REPO COMPANY FISH HOUSE →':'SAVE EXPEDITION & RETURN TO HARBOUR →';
    }
    document.querySelectorAll('[data-recipe]').forEach(b => b.onclick = () => {
      const id = b.dataset.recipe;
      if (b.classList.contains('selected')) {
        b.classList.remove('selected');
        selectedRecipes = selectedRecipes.filter(x => x !== id);
      } else {
        if (selectedRecipes.length >= maxMenu) {
          $('rdSurfaceNotice').innerHTML = `Menu capacity is <b>${maxMenu}</b> dishes. Upgrade the Menu Board for a larger evening menu.`;
          return;
        }
        b.classList.add('selected');
        selectedRecipes.push(id);
      }
      if(serviceButton)serviceButton.disabled = !selectedRecipes.length;
      renderSurfaceSetup();
    });
    if(serviceButton)serviceButton.disabled = rec.length ? true : false;
    if(!rec.length)$('rdSurfaceNotice').innerHTML += ' <b>No Fish House service is required tonight.</b> Saving the expedition still records depth, salvage, story progress and eligible rewards.';
    renderSurfaceSetup();
  }

  function restaurantReadyCapacity() {
    const crewBonus = crewForTonight().some(x => x.role === 'Dishwasher') ? 1 : 0;
    return Math.min(8, 2 + Math.floor((profile.restaurant?.kitchen || 1) / 2) + Math.floor((profile.restaurant?.staff || 1) / 2) + crewBonus);
  }

  function buildRestaurantStock() {
    const fishById = {};
    for (const item of run.catches.filter(x => x.kind === 'fish')) {
      (fishById[item.id] ||= []).push({ q: Number(item.q || 1), weight: Number(item.weight || 0) });
    }
    const stock = {}, quality = {};
    for (const id of selectedRecipes) {
      const recipe = D.RECIPES.find(r => r.id === id);
      if (!recipe) continue;
      const items = [...(fishById[recipe.fish_id] || [])].sort((a, b) => b.q - a.q);
      stock[id] = items.length;
      quality[id] = items;
    }
    return { stock, quality };
  }

  function ensureRestaurantLayout() {
    const view = $('rdRestaurantView');
    const grid = view?.querySelector('.rd-rest-grid');
    const scene = view?.querySelector('.rd-rest-scene');
    if (!view || !grid || !scene) return false;
    void view.offsetHeight;
    scene.style.minHeight = Math.max(590, grid.clientHeight || 590) + 'px';
    return true;
  }

  function applyRestaurantVisualLevels() {
    const scene = $('rdRestaurantScene');
    if (!scene) return;
    restaurantTheme = profile.restaurant?.theme || restaurantTheme || 'harbour';
    scene.dataset.theme = restaurantTheme;
    const kitchen = Number(profile.restaurant?.kitchen || 1);
    const tables = Math.min(8, Math.max(3, Number(profile.restaurant?.tables || 3)));
    const ambience = Number(profile.restaurant?.ambience || 1);
    scene.dataset.kitchenTier = kitchen >= 6 ? 'grand' : kitchen >= 3 ? 'pro' : 'basic';
    scene.dataset.ambienceTier = ambience >= 5 ? 'luxury' : ambience >= 3 ? 'refined' : 'simple';
    scene.querySelectorAll?.('.rd-table')?.forEach?.((t, i) => t.classList.toggle('hidden-table', i >= tables));
  }

  function chooseArchetype(special = null) {
    if (special === 'critic') return { id:'foodie', name:'Food Critic', budget:1.4, patience:.82, pref:['luxury','raw','grilled'], tone:'#d6b56d', tip:1.1 };
    if (special === 'vip') return { id:'wealthy', name:'VIP Guest', budget:1.5, patience:.9, pref:['luxury','raw','grilled'], tone:'#f0c873', tip:1.2 };
    let pool = [...D.CUSTOMER_ARCHETYPES];
    if (service?.event?.id === 'storm') pool = pool.filter(x => ['local','fisher','foodie','adventurer'].includes(x.id));
    if (service?.event?.id === 'market') pool = pool.filter(x => ['foodie','collector','wealthy','adventurer'].includes(x.id));
    return E.pick(pool.length ? pool : D.CUSTOMER_ARCHETYPES);
  }

  function chooseRecipeForCustomer(archetype, special = null) {
    const available = selectedRecipes.filter(id => recipeSpare(id) > 0);
    if (!available.length) return null;
    const ranked = available.map(id => {
      const r = D.RECIPES.find(x => x.id === id);
      let score = Math.random() * 1.3;
      if (archetype?.pref?.includes(r?.category)) score += 2;
      if (special && (r?.tier || 1) >= 2) score += 2.5;
      if (archetype?.budget >= 1.2 && (r?.tier || 1) >= 3) score += 1.4;
      if (archetype?.budget < .9 && (r?.tier || 1) === 1) score += 1.2;
      if(run?.ecology?.personality?.id==='migration'&&D.fishById(r?.fish_id)?.behavior==='school')score+=1.5;
      if(run?.seasonal&&D.fishById(r?.fish_id)?.behavior==='school')score+=.7;
      return { id, score };
    }).sort((a,b)=>b.score-a.score);
    return ranked[0]?.id || E.pick(available);
  }

  function renderReservations() {
    const box = $('rdReservations');
    if (!box || !service) return;
    const special = service.specialPlan;
    box.innerHTML = `<div class="rd-service-event-card"><small>${service.legacyNight?'LEGACY SERVICE':'TONIGHT'}</small><b>${service.legacyNight||service.event.name}</b><span>${service.legacyNight?'Postgame harbour guests are booked around a prestige service night.':service.event.desc}</span></div>` +
      (special ? `<div class="rd-reservation-card ${special.type}"><small>${special.label}</small><b>${special.name}</b><span>${special.note}</span></div>` : `<div class="rd-reservation-card"><small>RESERVATIONS</small><b>WALK-INS TONIGHT</b><span>No special booking on the ledger.</span></div>`);
  }

  function renderCrewLive() {
    if (!service) return;
    const crew = service.crew || [];
    const live = $('rdCrewLive');
    if (live) live.innerHTML = `<article><b>YOU</b><span>Chef / Owner</span><small>Manual station</small></article>` + crew.map(x => `<article><b>${x.name}</b><span>${x.role}</span><small>${x.trait}</small></article>`).join('');
  }

  function renderStaffScene(force=false) {
    const scene = $('rdStaffScene');
    if (!scene || !service) return;
    const busy = service.cook ? service.cook.stage : 0;
    const entering = service.customers.some(c => c.stage === 'entering');
    const ready = service.ready.length > 0;
    const sig = `${busy}:${entering?1:0}:${ready?1:0}:${service.crew.map(x=>x.id).join(',')}`;
    if (!force && service._staffSig === sig) return;
    service._staffSig = sig;
    const positions = {
      'Head Chef':[42,22], 'Prep Chef':[55,24], 'Server':[64,58], 'Host':[9,60],
      'Grill Chef':[69,23], 'Dishwasher':[82,27]
    };
    const statusFor = role => {
      if (role === 'Host') return entering ? 'SEATING GUESTS' : 'WATCHING THE DOOR';
      if (role === 'Server') return ready ? 'RUNNING PLATES' : 'CHECKING TABLES';
      if (role === 'Head Chef' || role === 'Prep Chef' || role === 'Grill Chef') return busy ? 'ON THE LINE' : 'MISE EN PLACE';
      return 'CLEARING DOWN';
    };
    scene.innerHTML = `<div class="rd-staff-actor player-chef" style="left:34%;top:24%"><i></i><b>YOU</b><span>${busy ? 'COOKING' : 'CHEF / OWNER'}</span></div>` +
      service.crew.map(x => {
        const pos=positions[x.role]||[50,30];
        return `<div class="rd-staff-actor role-${x.role.toLowerCase().replace(/\s+/g,'-')}" style="left:${pos[0]}%;top:${pos[1]}%"><i></i><b>${x.name}</b><span>${statusFor(x.role)}</span></div>`;
      }).join('');
  }

  function closeEmptyFishHouseNight() {
    if(!run)return;
    cancelAnimationFrame(serviceRaf);
    service={
      totalDuration:0,time:0,phase:'CLOSED',served:0,revenue:0,lost:0,customers:[],ready:[],servedDishes:[],stock:{},ingredientQuality:{},
      active:false,closing:true,finishStarted:false,cook:null,crew:[],wages:0,event:null,specialPlan:null,specialSpawned:false,specialServed:null,
      communityVisitorName:null,communityVisitorSpawned:false,crewCelebration:null,legacyNight:null,flow:1,streak:0,lastServeAt:0,soldOutReleased:0,emptyNight:true
    };
    finishDay();
  }

  function startRestaurant() {
    if($('rdOpenRestaurant')?.dataset.emptyNight==='true')return closeEmptyFishHouseNight();
    if (!selectedRecipes.length) return;
    cancelAnimationFrame(serviceRaf);
    show('rdRestaurantView');
    ensureRestaurantLayout();
    requestAnimationFrame(ensureRestaurantLayout);
    const event = serviceEventForTonight();
    const duration = 104 + (profile.restaurant?.service || 1) * 4;
    const built = buildRestaurantStock();
    let currentRepoUser='';try{currentRepoUser=String(typeof character!=='undefined'&&character?.username||'')}catch(_){}
    const visitorPool=[...new Set((sharedWorld.feed||[]).map(x=>String(x?.username||'').trim()).filter(x=>x&&x.toLowerCase()!==currentRepoUser.toLowerCase()))];
    const communityVisitorName=sharedWorld.available&&visitorPool.length&&Math.random()<.22?E.pick(visitorPool):null;
    service = {
      totalDuration: duration,
      time: duration,
      phase: 'OPENING',
      served: 0,
      revenue: 0,
      lost: 0,
      customers: [],
      ready: [],
      servedDishes: [],
      stock: built.stock,
      ingredientQuality: built.quality,
      active: true,
      closing: false,
      finishStarted: false,
      last: performance.now(),
      spawn: .8,
      nextCustomer: 1,
      cook: null,
      crew: crewForTonight(),
      wages: crewWages(),
      event,
      specialPlan: plannedSpecialForTonight(event),
      specialSpawned: false,
      specialServed: null,
      communityVisitorName,
      communityVisitorSpawned:false,
      crewCelebration:(()=>{const m=campaignState.flags?.last_completed;if(!m)return null;let seen='';try{seen=localStorage.getItem('repoDiverCampaignCelebrated')||''}catch(_){}return m!==seen?m:null})(),
      legacyNight:postgameUnlocked()&&Number(profile.day_number||1)%4===0?E.pick(['MARINE INSTITUTE GALA','EXPEDITION REUNION','ARCHAEOLOGY EXHIBITION','VETERAN TASTING NIGHT']):null,
      flow: 1,
      streak: 0,
      lastServeAt: 0,
      soldOutReleased: 0
    };
    const rv=$('rdRestaurantView');if(rv)rv.dataset.legacyNight=String(!!service.legacyNight);
        restaurantRenderSig = { orders: '', scene: '' };
    $('rdCookPanel')?.classList.add('hidden');
    applyRestaurantVisualLevels();
    renderReservations();
    renderCrewLive();
    renderRestaurantMenu();
    renderReadyCounter();
    renderRestaurantScene(true);
    renderStaffScene(true);
    renderOrders(true);
    if ($('rdEventChip')) $('rdEventChip').textContent = service.legacyNight||event.name;
    if ($('rdPhaseBanner')) $('rdPhaseBanner').textContent = 'OPENING';
    if(service.crewCelebration){try{localStorage.setItem('repoDiverCampaignCelebrated',service.crewCelebration)}catch(_){}$('rdServiceToast').textContent='TIDELINE CREW TABLE RESERVED · POST-EXPEDITION DINNER';}else if(service.legacyNight)$('rdServiceToast').textContent=`LEGACY SERVICE · ${service.legacyNight} · PRESTIGE GUESTS ARRIVING`;else $('rdServiceToast').textContent = 'THE FISH HOUSE IS OPEN · FIRST GUESTS ARE ARRIVING';
    serviceRaf = requestAnimationFrame(serviceLoop);
  }

  function renderRestaurantMenu() {
    if (!service) return;
    $('rdRestaurantMenu').innerHTML = selectedRecipes.map(id => {
      const r = D.RECIPES.find(x => x.id === id);
      const stock = service.stock[id] || 0;
      const disabled = stock <= 0 || !!service.cook || service.ready.length >= restaurantReadyCapacity();
      const category=String(r?.category||'house').toLowerCase();const stockMax=Math.max(1,stock+recipeDemand(id));
      return `<button data-cook="${id}" data-category="${category}" ${disabled ? 'disabled' : ''}><i class="rd-dish-glyph ${category}"></i><span class="rd-menu-copy"><small>${category.toUpperCase()} · ${Math.round(Number(r?.base_price||0)*DIVER_GP_TUNING).toLocaleString()} GP</small><b>${r?.name || id}</b><span>TONIGHT'S STOCK <strong>${stock}</strong></span><u><i style="width:${Math.min(100,stock/stockMax*100)}%"></i></u></span><em>${disabled && stock <= 0 ? 'SOLD OUT' : service.cook ? 'LINE BUSY' : 'COOK'}</em></button>`;
    }).join('');
    document.querySelectorAll('[data-cook]').forEach(b => b.onclick = () => startCook(b.dataset.cook, null));
  }

  function renderReadyCounter() {
    const box = $('rdReadyCounter');
    if (!box || !service) return;
    if (!service.ready.length) {
      box.innerHTML = `<span class="rd-ready-empty">Pass clear · counter ${service.ready.length}/${restaurantReadyCapacity()}</span>`;
      return;
    }
    box.innerHTML = `<div class="rd-ready-list">${service.ready.map((dish, i) => {
      const r = D.RECIPES.find(x => x.id === dish.id);
      return `<span class="rd-ready-chip" data-ready-index="${i}" data-style="${r?.category || 'house'}"><b>${r?.name || dish.id}</b><small>★${dish.quality} · INGREDIENT ★${dish.ingredientQ || 1}${dish.targetCustomerId ? ' · RESERVED' : ''}</small></span>`;
    }).join('')}</div><small class="rd-ready-cap">PASS ${service.ready.length}/${restaurantReadyCapacity()}</small>`;
  }

  function readyDishIndexForCustomer(customer) {
    if (!service || !customer || !['entering','waiting'].includes(customer.stage)) return -1;
    let idx = service.ready.findIndex(d => d.id === customer.id && d.targetCustomerId === customer.uid);
    if (idx >= 0) return idx;
    return service.ready.findIndex(d => d.id === customer.id && !d.targetCustomerId);
  }

  function recipeSupply(id) {
    if (!service) return 0;
    return Math.max(0, service.stock[id] || 0)
      + service.ready.filter(d => d.id === id).length
      + (service.cook?.id === id ? 1 : 0);
  }

  function recipeDemand(id) {
    if (!service) return 0;
    return service.customers.filter(c => c.id === id && ['entering','waiting'].includes(c.stage)).length;
  }

  function recipeSpare(id) { return recipeSupply(id) - recipeDemand(id); }
  function hasMealPotential() { return !!service && selectedRecipes.some(id => recipeSupply(id) > 0); }

  function releaseCustomerReservation(uid) {
    if (!service) return;
    if (service.cook?.targetCustomerId === uid) service.cook.targetCustomerId = null;
    for (const dish of service.ready) if (dish.targetCustomerId === uid) dish.targetCustomerId = null;
  }

  function findUncommittedCustomerForRecipe(id) {
    if (!service) return null;
    const candidates = service.customers.filter(c => c.id === id && ['entering','waiting'].includes(c.stage)).sort((a, b) => b.uid - a.uid);
    return candidates.find(c => {
      const reservedReady = service.ready.some(d => d.id === id && d.targetCustomerId === c.uid);
      const targetedCook = service.cook?.id === id && service.cook?.targetCustomerId === c.uid;
      return !reservedReady && !targetedCook;
    }) || candidates[0] || null;
  }

  function reconcileImpossibleOrders() {
    if (!service?.active) return false;
    let changed = false;
    const activeIds = new Set(service.customers.filter(c => ['entering','waiting'].includes(c.stage)).map(c => c.uid));
    if (service.cook?.targetCustomerId && !activeIds.has(service.cook.targetCustomerId)) {
      service.cook.targetCustomerId = null; changed = true;
    }
    for (const dish of service.ready) {
      if (dish.targetCustomerId && !activeIds.has(dish.targetCustomerId)) { dish.targetCustomerId = null; changed = true; }
    }
    let guard=0;
    while (guard++ < 40) {
      const oversoldId = selectedRecipes.find(id => recipeDemand(id) > recipeSupply(id));
      if (!oversoldId) break;
      const customer = findUncommittedCustomerForRecipe(oversoldId);
      if (!customer) break;
      const substitutes = selectedRecipes.filter(id => id !== oversoldId && recipeSpare(id) > 0);
      if (substitutes.length) {
        const nextId = substitutes.sort((a,b)=>recipeSpare(b)-recipeSpare(a))[0];
        customer.id = nextId;
        customer.patience = Math.max(customer.patience,72);
        $('rdServiceToast').textContent = `TABLE ${customer.table + 1} SWITCHED TO THE CHEF'S AVAILABLE SPECIAL`;
        changed = true;
      } else {
        releaseCustomerReservation(customer.uid);
        customer.stage = 'leaving';
        customer.stageTime = .8;
        service.soldOutReleased++;
        $('rdServiceToast').textContent = `TABLE ${customer.table + 1} RELEASED · KITCHEN SOLD OUT`;
        changed = true;
      }
    }
    if (changed) {
      renderReadyCounter(); renderRestaurantMenu(); renderOrders(true); renderRestaurantScene(true); renderStaffScene(true);
    }
    return changed;
  }

  function unresolvedCustomers() {
    return service?.customers?.some(c => ['entering','waiting','eating'].includes(c.stage)) || false;
  }

  function endServiceEarly(reason='KITCHEN SOLD OUT · SERVICE COMPLETE') {
    if (!service?.active || service.closing) return false;
    service.closing=true; service.active=false; service.time=0; service.cook=null;
    cancelAnimationFrame(serviceRaf);
    $('rdCookPanel')?.classList.add('hidden');
    $('rdServiceToast').textContent=reason;
    finishDay();
    return true;
  }

  function maybeCloseSoldOutService() {
    if (!service?.active || service.closing) return false;
    if (!hasMealPotential() && !unresolvedCustomers()) {
      return endServiceEarly(service.served > 0 ? 'LAST TABLE HAS LEFT · KITCHEN SOLD OUT · CLOSING' : 'NO SALEABLE FOOD REMAINS · CLOSING EARLY');
    }
    return false;
  }

  function dinerPosition(c) {
    const positions=[[20,49],[42,47],[66,48],[84,50],[22,73],[44,75],[66,74],[84,72]];
    if (c.stage==='entering') return [5,82];
    if (c.stage==='leaving') return [96,84];
    return positions[c.table % positions.length];
  }

  function renderRestaurantScene(force=false) {
    const scene=$('rdCustomerScene');
    if (!scene || !service) return;
    const signature=service.customers.map(c=>`${c.uid}:${c.id}:${c.table}:${c.stage}:${c.reaction||''}:${readyDishIndexForCustomer(c)>=0?1:0}`).join('|');
    if (!force && restaurantRenderSig.scene===signature) return;
    restaurantRenderSig.scene=signature;
    const campaignCrewTable=service.crewCelebration?`<div class="rd-campaign-crew-table"><small>R.C. TIDELINE · CREW TABLE</small><b>${rdEsc(campaignMission(service.crewCelebration)?.title||'POST-EXPEDITION DINNER')}</b><span>${(campaignMission(service.crewCelebration)?.crew||['darro','lyra']).slice(0,4).map(campaignCrewName).map(rdEsc).join(' · ')}</span><i></i><i></i><i></i></div>`:'';
    scene.innerHTML=campaignCrewTable+service.customers.map(c=>{
      const pos=dinerPosition(c),recipe=D.RECIPES.find(r=>r.id===c.id),ready=readyDishIndexForCustomer(c)>=0;
      const archetype=c.archetype||D.customerById('tourist');
      const bubble=c.stage==='entering'?'CHECKING IN':c.stage==='eating'?(c.reaction||'ENJOYING MEAL'):c.stage==='leaving'?'GOOD NIGHT':ready?'✓ SERVE TABLE':recipe?.name.split(' ').slice(0,2).join(' ')||'ORDER';
      return `<button type="button" class="rd-diner stage-${c.stage} ${ready?'has-ready':''} ${c.special||''} ${c.communityName?'community-visitor':''}" data-scene-customer-id="${c.uid}" style="left:${pos[0]}%;top:${pos[1]}%;--diner-tone:${archetype.tone||'#75c7d8'}" ${['eating','leaving'].includes(c.stage)?'disabled':''}><i class="rd-diner-head"></i><i class="rd-diner-body"></i><i class="rd-diner-arm a"></i><i class="rd-diner-arm b"></i><span class="rd-party-size">${c.party>1?'×'+c.party:''}</span><span class="rd-diner-bubble">${c.communityName?`REPO DIVER · ${rdEsc(c.communityName)} · `:c.special?String(c.special).toUpperCase()+' · ':''}${bubble}</span></button>`;
    }).join('');
    scene.onclick=e=>{
      const target=e.target.closest?.('[data-scene-customer-id]');
      if(!target)return;e.preventDefault();handleOrderClick(Number(target.dataset.sceneCustomerId));
    };
  }

  function updateOrderPatienceBars() {
    const orders=$('rdOrders');if(!orders||!service)return;
    for(const c of service.customers.filter(x=>x.stage==='waiting')){
      const bar=orders.querySelector?.(`[data-patience-for="${c.uid}"]`);
      if(bar)bar.style.width=`${Math.max(0,Math.min(100,c.patience))}%`;
    }
  }

  function renderOrders(force=false) {
    if(!service)return;const orders=$('rdOrders');if(!orders)return;
    const visible=service.customers.filter(c=>['entering','waiting'].includes(c.stage));
    const signature=visible.map(c=>{const ready=readyDishIndexForCustomer(c)>=0,cooking=service.cook?.targetCustomerId===c.uid;return`${c.uid}:${c.id}:${c.table}:${c.stage}:${ready?1:0}:${cooking?1:0}`}).join('|');
    if(!force&&restaurantRenderSig.orders===signature){updateOrderPatienceBars();return}
    restaurantRenderSig.orders=signature;
    if(!visible.length)orders.innerHTML='<p class="rd-orders-empty">The pass is clear. Waiting for the next table.</p>';
    else orders.innerHTML=visible.map(c=>{
      const r=D.RECIPES.find(x=>x.id===c.id),ready=readyDishIndexForCustomer(c)>=0,cooking=service.cook?.targetCustomerId===c.uid;
      const action=c.stage==='entering'?'SEATING…':ready?'SERVE TABLE':cooking?'COOKING…':'COOK ORDER';
      const sub=c.communityName?`${rdEsc(c.communityName)} · RepoCompany diver visiting tonight`:c.stage==='entering'?`${c.archetype?.name||'Guest'} party of ${c.party}`:ready?'Dish plated — click this ticket or the table':cooking?'Finish the prep, cook and plating stages':`${c.archetype?.name||'Guest'} · party of ${c.party}`;
      return `<button type="button" class="rd-order ${ready?'ready':''} ${cooking?'cooking':''} ${c.special||''}" data-order-id="${c.uid}" ${c.stage==='entering'?'disabled':''}><span class="rd-order-top"><b>TABLE ${c.table+1}${c.communityName?' · REPO DIVER VISITOR':c.special?' · '+String(c.special).toUpperCase():''}</b><strong>${action}</strong></span><span class="rd-order-name">${r?.name||c.id}</span><small>${sub}</small><i data-patience-for="${c.uid}" style="width:${Math.max(0,c.patience)}%"></i></button>`;
    }).join('');
    orders.onclick=e=>{const btn=e.target.closest?.('[data-order-id]');if(!btn||btn.disabled)return;e.preventDefault();handleOrderClick(Number(btn.dataset.orderId));};
    updateOrderPatienceBars();
  }

  function handleOrderClick(uid) {
    if(!service?.active)return;const customer=service.customers.find(c=>c.uid===uid);
    if(!customer||customer.stage!=='waiting')return;
    const readyIndex=readyDishIndexForCustomer(customer);
    if(readyIndex>=0){serveCustomer(uid,readyIndex);return}
    if(service.cook){$('rdServiceToast').textContent=service.cook.targetCustomerId===uid?'FINISH THIS DISH · COMPLETE THE TIMING STAGES':'ONE STATION AT A TIME · FINISH THE CURRENT DISH';return}
    startCook(customer.id,uid);
  }

  function startCook(id,targetCustomerId=null) {
    if(!service?.active||service.cook)return;
    if((service.stock[id]||0)<=0){$('rdServiceToast').textContent='DISH SOLD OUT · CHECKING THE MENU';reconcileImpossibleOrders();maybeCloseSoldOutService();return}
    if(service.ready.length>=restaurantReadyCapacity()){$('rdServiceToast').textContent='PASS FULL · RUN A PLATE BEFORE COOKING MORE';return}
    const r=D.RECIPES.find(x=>x.id===id);if(!r)return;
    service.stock[id]--;
    const ingredient=(service.ingredientQuality[id]||[]).shift()||{q:1,weight:0};
    const kitchen=Number(profile.restaurant?.kitchen||1);
    const prepChef=service.crew.some(x=>x.role==='Prep Chef');
    const headChef=service.crew.some(x=>x.role==='Head Chef');
    const sweetWidth=Math.min(.34,.14+kitchen*.018+(headChef ? .015 : 0));
    service.cook={id,targetCustomerId,stage:1,stages:(r.complexity||r.tier||1)>=2?3:2,scores:[],needle:Math.random()*.18,dir:1,speed:(prepChef?1.04:1.16)+Math.random()*.20,sweetCenter:.34+Math.random()*.32,sweetWidth,ingredientQ:Number(ingredient.q||1)};
    $('rdCookPanel')?.classList.remove('hidden');updateCookPanel();renderRestaurantMenu();renderOrders(true);renderRestaurantScene(true);renderStaffScene(true);
    $('rdServiceToast').textContent=`${r.name.toUpperCase()} · PREP STARTED`;try{A.play?.('kitchen_start',{category:r.category})}catch(_){}
  }

  function updateCookPanel() {
    if(!service?.cook)return;const c=service.cook,r=D.RECIPES.find(x=>x.id===c.id);
    const labels=c.stages===3?['PREP · KNIFE WORK','COOK · HEAT CONTROL','PLATING · FINISH THE DISH']:['PREP · KNIFE WORK','COOK · HEAT CONTROL'];
    $('rdCookStage').textContent=`${labels[c.stage-1]} · STAGE ${c.stage}/${c.stages}`;
    $('rdCookDish').textContent=r?.name||'Dish';
    $('rdCookInstruction').textContent=c.stage===1?'Stop the marker inside the prep window.':c.stage===c.stages&&c.stages===3?'Finish the plate cleanly — presentation affects the final rating.':r?.category==='raw'?'Slice and cure at the right moment.':'Control the pan and stop inside the green window.';
    const sweet=$('rdCookSweet');if(sweet){sweet.style.left=((c.sweetCenter-c.sweetWidth/2)*100)+'%';sweet.style.width=(c.sweetWidth*100)+'%'}
    if($('rdCookNeedle'))$('rdCookNeedle').style.left=(c.needle*100)+'%';
    $('rdCookPanel')?.classList.toggle('plating-stage',c.stage===c.stages&&c.stages===3);
  }

  function hitCook() {
    if(!service?.cook)return;const c=service.cook,r=D.RECIPES.find(x=>x.id===c.id);
    const half=c.sweetWidth/2,dist=Math.abs(c.needle-c.sweetCenter),normalized=Math.max(0,1-dist/Math.max(.001,half*2.2));c.scores.push(normalized);try{A.play?.('kitchen_hit',{score:normalized,stage:c.stage})}catch(_){}
    if(c.stage<c.stages){
      c.stage++;c.needle=Math.random()<.5?.05:.95;c.dir=c.needle<.5?1:-1;c.speed+=c.stage===c.stages&&c.stages===3?.10:.16;c.sweetCenter=.28+Math.random()*.44;
      if(c.stage===c.stages&&c.stages===3)c.sweetWidth=Math.min(.36,c.sweetWidth+(profile.restaurant?.plating||1)*.012);
      updateCookPanel();$('rdServiceToast').textContent=normalized>.72?(c.stage===c.stages&&c.stages===3?'CLEAN COOK · PLATE IT':'CLEAN STAGE · KEEP THE FLOW'):'ROUGH STAGE · RECOVER THE DISH';return;
    }
    const plating=Number(profile.restaurant?.plating||1);
    const grillBonus=(r?.category==='grilled'&&service.crew.some(x=>x.role==='Grill Chef')) ? .055 : 0;
    const chefBonus=service.crew.some(x=>x.role==='Head Chef')?.025:0;
    const average=c.scores.reduce((a,b)=>a+b,0)/c.scores.length+Math.min(.10,(plating-1)*.018)+grillBonus+chefBonus+(c.ingredientQ-1)*.015;
    let quality=average>=.82?4:average>=.61?3:average>=.36?2:1;
    const ingredientCap=c.ingredientQ<=1?2:c.ingredientQ===2?3:4;quality=Math.min(quality,ingredientCap);
    service.ready.push({id:c.id,quality,targetCustomerId:c.targetCustomerId,ingredientQ:c.ingredientQ});
    $('rdServiceToast').textContent=`${r?.name?.toUpperCase()||'DISH'} · ${quality===4?'EXCEPTIONAL PLATE':quality===3?'GREAT PLATE':'QUALITY ★'+quality} · RUN IT TO THE TABLE`;
    service.cook=null;$('rdCookPanel')?.classList.add('hidden');$('rdCookPanel')?.classList.remove('plating-stage');
    renderReadyCounter();renderRestaurantMenu();renderOrders(true);renderRestaurantScene(true);renderStaffScene(true);
  }

  function reactionForQuality(q,special) {
    if(special==='critic')return q>=4?'CRITIC: EXCELLENT':q>=3?'CRITIC: IMPRESSED':q>=2?'CRITIC: FAIR':'CRITIC: DISAPPOINTED';
    if(q>=4)return 'AMAZING! ✦';if(q>=3)return 'LOVELY!';if(q>=2)return 'GOOD';return 'NOT BAD';
  }

  function serveCustomer(uid,readyIndex) {
    if(!service?.active)return false;const customer=service.customers.find(c=>c.uid===uid);
    if(!customer||customer.stage!=='waiting'||readyIndex<0||readyIndex>=service.ready.length)return false;
    const candidate=service.ready[readyIndex];if(!candidate||candidate.id!==customer.id||(candidate.targetCustomerId&&candidate.targetCustomerId!==uid)){$('rdServiceToast').textContent='WRONG DISH FOR THIS TABLE';return false}
    const dish=service.ready.splice(readyIndex,1)[0],r=D.RECIPES.find(x=>x.id===dish.id);if(!r){service.ready.splice(readyIndex,0,dish);return false}
    const patienceFactor=.82+Math.max(0,customer.patience)/100*.24;
    const ambience=1+Number(profile.restaurant?.ambience||1)*.018;
    const earned=Math.round(r.base_price*DIVER_GP_TUNING*(.72+dish.quality*.13)*patienceFactor*ambience*Number(customer.archetype?.tip||1));
    const now=performance.now();if(now-service.lastServeAt<8000)service.streak=Math.min(5,service.streak+1);else service.streak=1;service.lastServeAt=now;service.flow=1+Math.min(1,service.streak*.18);
    service.served++;service.revenue+=earned;service.servedDishes.push({id:dish.id,quality:dish.quality,ingredient_q:dish.ingredientQ||1,special:customer.special||null});
    customer.stage='eating';customer.stageTime=1.9+customer.party*.28;customer.reaction=reactionForQuality(dish.quality,customer.special);customer.servedQuality=dish.quality;
    if(customer.special){service.specialServed={type:customer.special,quality:dish.quality,patience:customer.patience};showSpecialNotice(customer.special==='critic'?`CRITIC SERVED · ${customer.reaction}`:`VIP TABLE SERVED · ${customer.reaction}`)}
    $('rdServiceToast').textContent=`TABLE ${customer.table+1} SERVED · ★${dish.quality} · ${customer.reaction}`;try{A.play?.('serve',{quality:dish.quality,special:customer.special})}catch(_){}
    renderReadyCounter();renderRestaurantMenu();renderOrders(true);renderRestaurantScene(true);renderStaffScene(true);
    if($('rdServiceFlow'))$('rdServiceFlow').textContent='×'+service.flow.toFixed(1);
    return true;
  }

  function showSpecialNotice(text) {
    const el=$('rdSpecialNotice');if(!el)return;el.textContent=text;el.classList.remove('hidden');clearTimeout(service?._specialTimer);if(service)service._specialTimer=setTimeout(()=>el.classList.add('hidden'),2600);
  }

  function spawnCustomer(forceSpecial=false) {
    if(!service?.active||service.phase==='LAST ORDERS')return false;
    const seats=Math.min(8,Math.max(3,Number(profile.restaurant?.tables||3)));
    const usedTables=new Set(service.customers.filter(c=>c.stage!=='leaving').map(c=>c.table));
    const free=Array.from({length:seats},(_,i)=>i).filter(i=>!usedTables.has(i));if(!free.length)return false;
    let special=null;
    if(forceSpecial&&service.specialPlan&&!service.specialSpawned){special=service.specialPlan.type;service.specialSpawned=true}
    const archetype=chooseArchetype(special),id=chooseRecipeForCustomer(archetype,special);if(!id){maybeCloseSoldOutService();return false}
    const party=special?1:(archetype.id==='family'?Math.min(4,2+Math.floor(Math.random()*3)):1+Math.floor(Math.random()*Math.min(3,1+Number(profile.restaurant?.rank||1)/3)));
    const hostBonus=service.crew.some(x=>x.role==='Host')?10:0;
    const patience=Math.min(125,100*Number(archetype.patience||1)*Number(service.event.patience||1)+hostBonus);
    let communityName=null;if(!special&&!service.communityVisitorSpawned&&service.communityVisitorName&&service.nextCustomer>=2&&Math.random()<.18){communityName=service.communityVisitorName;service.communityVisitorSpawned=true;}
    const customer={uid:service.nextCustomer++,id,table:E.pick(free),patience,stage:'entering',stageTime:.9+Math.random()*.45,archetype,party,special,communityName,reaction:''};
    service.customers.push(customer);service.spawn=(4.4+Math.random()*3.1)*Number(service.event.spawn||1);
    if(special)showSpecialNotice(special==='critic'?'FOOD CRITIC HAS ARRIVED':'VIP RESERVATION HAS ARRIVED');else if(communityName)showSpecialNotice(`${communityName} · REPO DIVER VISITOR`);try{A.play?.(special?'vip_arrive':'door',{special})}catch(_){}
    renderOrders(true);renderRestaurantScene(true);renderStaffScene(true);return true;
  }

  function updateServicePhase() {
    if(!service)return;const p=1-service.time/service.totalDuration;let phase='OPENING';
    if(p>=.82)phase='LAST ORDERS';else if(p>=.58)phase='LATE SERVICE';else if(p>=.18)phase='DINNER RUSH';
    if(phase!==service.phase){service.phase=phase;if($('rdPhaseBanner'))$('rdPhaseBanner').textContent=phase;$('rdServiceToast').textContent=phase==='DINNER RUSH'?'DINNER RUSH · KEEP THE PASS MOVING':phase==='LATE SERVICE'?'LATE SERVICE · WATCH FOR SPECIAL TABLES':phase==='LAST ORDERS'?'LAST ORDERS · NO NEW WALK-INS':'THE DOORS ARE OPEN'}
  }

  function serviceLoop(t) {
    if(!service?.active)return;if(service.paused){service.last=t;serviceRaf=requestAnimationFrame(serviceLoop);return}const dt=Math.min(.05,(t-service.last)/1000||.016);service.last=t;service.time-=dt;service.spawn-=dt;updateServicePhase();
    const progress=1-service.time/service.totalDuration;
    if(service.specialPlan&&!service.specialSpawned&&progress>.44&&service.phase!=='LAST ORDERS')spawnCustomer(true);
    if(service.spawn<=0&&service.time>8&&service.phase!=='LAST ORDERS')spawnCustomer(false);

    const patienceDrain=2.35/(1+Number(profile.restaurant?.service||1)*.10)*(service.crew.some(x=>x.role==='Server')?.88:1);
    let changed=false;
    for(let i=service.customers.length-1;i>=0;i--){
      const c=service.customers[i];c.stageTime=(c.stageTime||0)-dt;
      if(c.stage==='entering'&&c.stageTime<=0){c.stage='waiting';c.stageTime=0;changed=true}
      else if(c.stage==='eating'&&c.stageTime<=0){c.stage='leaving';c.stageTime=1.05;c.reaction='THANK YOU';changed=true}
      else if(c.stage==='leaving'&&c.stageTime<=0){service.customers.splice(i,1);changed=true}
      else if(c.stage==='waiting'){
        c.patience-=dt*patienceDrain;
        if(c.patience<=0){releaseCustomerReservation(c.uid);c.stage='leaving';c.stageTime=.9;c.reaction='WALKOUT';service.lost++;changed=true;$('rdServiceToast').textContent=`TABLE ${c.table+1} WALKED OUT · SERVICE TOO SLOW`;try{A.play?.('walkout')}catch(_){}}
      }
    }
    if(changed){renderReadyCounter();renderRestaurantMenu();renderOrders(true);renderRestaurantScene(true);renderStaffScene(true)}else updateOrderPatienceBars();
    reconcileImpossibleOrders();
    if(maybeCloseSoldOutService())return;
    if(service.cook){const c=service.cook;c.needle+=c.dir*c.speed*dt;if(c.needle>=1){c.needle=1;c.dir=-1}if(c.needle<=0){c.needle=0;c.dir=1}if($('rdCookNeedle'))$('rdCookNeedle').style.left=(c.needle*100)+'%'}
    $('rdServiceTime').textContent=Math.ceil(Math.max(0,service.time));$('rdServed').textContent=service.served;if($('rdRoomCount'))$('rdRoomCount').textContent=service.customers.filter(c=>c.stage!=='leaving').length;$('rdServiceRevenue').textContent=service.revenue.toLocaleString()+' GP';
    if(service.time<=0){service.closing=true;service.active=false;service.cook=null;$('rdCookPanel')?.classList.add('hidden');for(const c of service.customers){if(['entering','waiting'].includes(c.stage))service.lost++}finishDay();return}
    serviceRaf=requestAnimationFrame(serviceLoop);
  }

  function serviceReputationEstimate() {
    if(!service)return 0;const avg=service.servedDishes.length?service.servedDishes.reduce((a,b)=>a+b.quality,0)/service.servedDishes.length:0;
    const special=service.specialServed?3:0;return Math.max(0,Math.round(service.served+service.servedDishes.filter(x=>x.quality===4).length*2+avg+special-service.lost*2));
  }

  function nightReview() {
    const avg=service?.servedDishes?.length?service.servedDishes.reduce((a,b)=>a+b.quality,0)/service.servedDishes.length:0;
    const stars=Math.max(1,Math.min(5,Math.round(avg+1-(service?.lost||0)*.25)));
    const starText='★'.repeat(stars)+'☆'.repeat(5-stars);
    let line=avg>=3.5?'Beautiful seafood and a confident kitchen.':avg>=2.7?'A strong night with flashes of excellent cooking.':avg>=1.8?'A decent service, though the kitchen still has room to sharpen up.':'A rough service, but the Fish House made it through the night.';
    if(service?.lost>0)line+=` ${service.lost} table${service.lost===1?'':'s'} left before being served.`;
    if(service?.specialServed?.type==='critic')line=`The critic filed ${stars} stars. `+line;
    return {stars,starText,line};
  }

  async function finishDay() {
    if(!service||service.finishStarted)return;service.finishStarted=true;cancelAnimationFrame(serviceRaf);show('rdResultsView');
    const emptyNight=!!service.emptyNight,resultCard=$('rdResultsView')?.querySelector('.rd-results-card');
    const resultKicker=resultCard?.querySelector(':scope > small'),resultTitle=resultCard?.querySelector(':scope > h2');
    if(resultKicker)resultKicker.textContent=emptyNight?'EXPEDITION COMPLETE':'SERVICE COMPLETE';
    if(resultTitle)resultTitle.textContent=emptyNight?'THE TIDELINE RETURNS TO HARBOUR':'THE FISH HOUSE CLOSES FOR THE NIGHT';
    if($('rdResultsContinue'))$('rdResultsContinue').textContent=emptyNight?'RETURN TO HARBOUR':'NEXT DAY';
    const avg=service.servedDishes.length?service.servedDishes.reduce((a,b)=>a+b.quality,0)/service.servedDishes.length:0;
    $('rdResultFish').textContent=run.catches.filter(x=>x.kind==='fish').length;$('rdResultDishes').textContent=service.servedDishes.length;$('rdResultPerfect').textContent=service.servedDishes.filter(x=>x.quality===4).length;$('rdResultRevenue').textContent=Number(service.revenue||0).toLocaleString()+' GP';
    if($('rdResultWalkouts'))$('rdResultWalkouts').textContent=service.lost||0;if($('rdResultQuality'))$('rdResultQuality').textContent=emptyNight?'—':'★'+avg.toFixed(1);if($('rdResultWages'))$('rdResultWages').textContent='−'+Number(service.wages||0).toLocaleString()+' GP';if($('rdResultRep'))$('rdResultRep').textContent=emptyNight?'—':'+'+serviceReputationEstimate();
    if($('rdReviewCard')){
      if(emptyNight)$('rdReviewCard').innerHTML='<small>NO SERVICE TONIGHT</small><b>Fish House stayed closed.</b><p>No menu-grade fish were landed. Your expedition, depth, salvage and progression are still being banked normally.</p>';
      else{const review=nightReview();$('rdReviewCard').innerHTML=`<small>${service.specialServed?.type==='critic'?'CRITIC REVIEW':'FISH HOUSE REVIEW'}</small><b>${review.starText}</b><p>${review.line}</p>`;}
    }
    $('rdResultReward').textContent='Balancing the Fish House books…';setSaveState('SAVING…','saving');
    const catches=run.catches.map(x=>({id:x.id,q:x.q,w:Number(x.weight||0),variant:x.variant||'normal',boss:!!x.boss,named_id:x.namedId||null}));const dishes=service.servedDishes.map(x=>({id:x.id,quality:x.quality,ingredient_q:x.ingredient_q||1}));
    const pendingPayload={run_id:runId,catches,dishes,max_depth:Math.round(run.maxDepth),customers:service.servedDishes.length};try{localStorage.setItem(PENDING_SAVE_KEY,JSON.stringify(pendingPayload))}catch(_){}
    try{
      const r=await rpc('repo_diver_complete_day',{p_run_id:runId,p_catches:catches,p_dishes:dishes,p_max_depth:Math.round(run.maxDepth),p_customers:service.servedDishes.length});try{localStorage.removeItem(PENDING_SAVE_KEY)}catch(_){}
      const wages=Number(r.staff_wages??service.wages??0),rep=Number(r.reputation_gained??serviceReputationEstimate()),gross=Number(r.service_gross_gp??service.revenue??0);
      if($('rdResultWages'))$('rdResultWages').textContent='−'+wages.toLocaleString()+' GP';if($('rdResultRep'))$('rdResultRep').textContent='+'+rep;if($('rdResultRevenue'))$('rdResultRevenue').textContent=gross.toLocaleString()+' GP';
      $('rdResultReward').innerHTML=`<b>+${(r.fishing_xp_awarded||0).toLocaleString()} Fishing XP</b> · <b>+${(r.cooking_xp_awarded||0).toLocaleString()} Cooking XP</b> · <b>+${(r.gp_awarded||0).toLocaleString()} GP NET</b>${r.restaurant_rank?` · <b>FISH HOUSE RANK ${r.restaurant_rank}</b>`:''}`;
      try{const pub=await rpc('repo_diver_publish_catches',{p_run_id:runId,p_catches:catches});myVerifiedLoaded=false;if(Number(pub?.world_records||0)>0){try{A.play?.('world_record')}catch(_){}enqueueReward({kicker:'WORLD RECORD',title:'THE TIDEBOARD HAS UPDATED',meta:`${Number(pub.world_records)} VERIFIED RECORD${Number(pub.world_records)===1?'':'S'} BROKEN`,value:'NEW RECORD HOLDER',rarity:'legendary',duration:3600})}if(pub?.count>0)loadSharedWorld(true)}catch(err){console.warn('Shared catch publish:',err?.message||err)}
      const variants=catches.filter(x=>x.variant&&x.variant!=='normal').map(x=>({id:x.id,variant:x.variant}));
      if(variants.length){try{await rpc('repo_diver_record_variants',{p_run_id:runId,p_variants:variants})}catch(err){console.warn('Variant log:',err?.message||err)}}
      if(D.ENDGAME_BIOMES?.includes(run.biome.id)||expeditionMode!=='standard'){
        const rarityScore=run.catches.reduce((a,x)=>a+(D.RARITY[x.rarity]?.rank||1)*85,0),bossId=run.boss?.caught?D.BOSSES?.[run.biome.id]:null,modifierRisk=D.EXPEDITION_MODIFIERS?.find(x=>x.id===expeditionModifier)?.risk||1;
        const endScore=Math.min(250000,Math.round(run.maxDepth*16+rarityScore+(bossId?6500:0)+(expeditionMode==='descent'?run.maxDepth*7:0)+(modifierRisk-1)*900+(run.stats?.variants||0)*700));
        try{const er=await rpc('repo_diver_submit_endgame_score',{p_run_id:runId,p_mode:expeditionMode,p_score:endScore,p_depth:Math.round(run.maxDepth),p_boss_id:bossId});const mg=er?.materials_gained||{};const mat=Object.entries(mg).filter(([,v])=>Number(v)>0).map(([k,v])=>`${String(k).toUpperCase()} +${v}`).join(' · ');$('rdResultReward').innerHTML+=` · <b>${Number(er?.score||endScore).toLocaleString()} EXPEDITION SCORE</b>${er?.mastery?` · <b>MASTERY ${er.mastery}/10</b>`:''}${mat?` · <b>${mat}</b>`:''}`;try{A.play?.(bossId?'boss_clear':'expedition_clear',{score:er?.score||endScore})}catch(_){}}catch(err){console.warn('Endgame score save:',err?.message||err)}
      }
      if(run?.campaign&&!run.campaign.replay&&['depth','finale'].includes(run.campaign.type)){try{const cr=await rpc('repo_diver_finalize_campaign_run',{p_run_id:runId});if(cr?.saved){$('rdResultReward').innerHTML+=` · <b>STORY ${rdEsc(cr.grade||'B')} RANK</b>`;enqueueReward({kicker:cr.campaign_complete?'THE DEEP SIGNAL COMPLETE':'STORY EXPEDITION COMPLETE',title:cr.campaign_complete?'BELOW THE CHARTS':run.campaign.title,meta:cr.campaign_complete?'CAMPAIGN COMPLETE · PERMANENT TITLE UNLOCKED':`MISSION GRADE · ${cr.grade||'B'}`,value:cr.campaign_complete?'BELOW THE CHARTS':`${cr.grade||'B'} RANK`,delta:cr.reward_artifact?'NEW STORY EVIDENCE RECOVERED':'THE TIDELINE IS READY FOR THE NEXT LEAD',rarity:'ancient',duration:cr.campaign_complete?5200:3400});try{A.play?.(cr.campaign_complete?'campaign_complete':'campaign_reveal')}catch(_){}}}catch(err){console.warn('Campaign finalization:',err?.message||err);$('rdResultReward').innerHTML+=` · <b>CAMPAIGN SAVE PENDING</b>`;}}
      if(run?.master){try{const mr=await rpc('repo_diver_finalize_master_expedition',{p_run_id:runId});const replay=!!mr?.replay,failed=!!mr?.failed;$('rdResultReward').innerHTML+=failed?` · <b>MASTER OBJECTIVE FAILED · 0 RENOWN</b>`:` · <b>MASTER ${rdEsc(mr?.grade||'C')} · ${replay?'REPLAY SCORE ONLY':`+${Number(mr?.renown_awarded||0)} RENOWN`}</b>`;enqueueReward({kicker:failed?'MASTER EXPEDITION INCOMPLETE':replay?'MASTER EXPEDITION REPLAY':'MASTER EXPEDITION COMPLETE',title:run.master.title,meta:`${String(run.master.difficulty||'veteran').toUpperCase()} · ${Number(mr?.score||0).toLocaleString()} SCORE`,value:failed?'OBJECTIVE MISSED':`${rdEsc(mr?.grade||'C')} RANK`,delta:failed?'NO RENOWN · COMPLETE THE OPERATION OBJECTIVE':replay?'BEST SCORE CAN IMPROVE · PROGRESSION REWARD ALREADY CLAIMED':`+${Number(mr?.renown_awarded||0)} DIVER RENOWN · ${rdEsc(mr?.rank||postgameState.rank)}`,rarity:failed?'rare':mr?.grade==='S'?'ancient':mr?.grade==='A'?'legendary':'epic',duration:failed?2600:mr?.grade==='S'?4200:3200});try{A.play?.(failed?'warning':'expedition_clear',{score:mr?.score||0})}catch(_){}}catch(err){console.warn('Master Expedition finalization:',err?.message||err);$('rdResultReward').innerHTML+=` · <b>MASTER SAVE PENDING</b>`;}}
      await loadProfile();setSaveState('SAVED','ok');
    }catch(e){$('rdResultReward').textContent=e.message;service.finishStarted=false;setSaveState('SAVE PENDING','warning')}
  }

  function open() {
    const d = $('repoDiverDialog');
    if (!d) return;
    try { d.showModal(); } catch (_) { d.setAttribute('open', ''); }
    show('rdHomeView');applySettings();syncInputHints();startGamepadLoop();loadProfile();
  }

  function close() {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(serviceRaf);
    stopGamepadLoop();input={};
    if (service) service.active = false;
    try { $('repoDiverDialog')?.close(); } catch (_) { $('repoDiverDialog')?.removeAttribute('open'); }
  }

  addEventListener('keydown', e => {
    if (!$('repoDiverDialog')?.open) return;
    setInputMode('keyboard',true);
    const key = e.key.toLowerCase();
    if(key==='escape'&&!$('rdConfirmOverlay')?.classList.contains('hidden')){e.preventDefault();hideConfirm();return;}
    if(key==='escape'&&!$('rdSettingsOverlay')?.classList.contains('hidden')){e.preventDefault();hideSettings();return;}
    const diving = run && !$('rdDiveView')?.classList.contains('hidden');
    const restaurantActive = !!service?.active;
    if(key==='tab'){const list=visibleFocusable();if(list.length){e.preventDefault();let idx=list.indexOf(document.activeElement);idx=e.shiftKey?(idx<=0?list.length-1:idx-1):(idx<0||idx>=list.length-1?0:idx+1);try{list[idx].focus({preventScroll:true})}catch(_){list[idx].focus?.()}list[idx].scrollIntoView?.({block:'nearest',inline:'nearest'});return}}
    const gameKeys = new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','q','c','r','x','e','m','p','f8','escape',' ','spacebar','tab']);
    // Never let gameplay controls move the underlying RepoCompany page.
    if ((diving || restaurantActive) && gameKeys.has(key)) e.preventDefault();
    if(key==='escape'&&(diving||restaurantActive)){e.preventDefault();if(photoMode){togglePhotoMode();return}setPaused(!paused);return}
    if(key==='escape'){const sub=['rdExpeditionPanel','rdQuestPanel','rdCampaignPanel','rdLegacyPanel','rdContractPanel','rdBoatPanel','rdResearchPanel','rdEndgamePanel','rdProfilePanel','rdCommunityPanel'].some(id=>!$(id)?.classList.contains('hidden'));if(sub){e.preventDefault();returnToHarbour();return}if(!$('rdJournalPanel')?.classList.contains('hidden')||!$('rdUpgradePanel')?.classList.contains('hidden')){e.preventDefault();document.querySelector('[data-rd-back]')?.click();return}}
    if(key==='p'&&diving){e.preventDefault();togglePhotoMode();return}
    if(paused)return;
    if (key === 'w' || key === 'arrowup') {setAction('move_up',true);markTutorial('move');}
    if (key === 's' || key === 'arrowdown') {setAction('move_down',true);markTutorial('move');}
    if (key === 'a' || key === 'arrowleft') {setAction('move_left',true);markTutorial('move');}
    if (key === 'd' || key === 'arrowright') {setAction('move_right',true);markTutorial('move');}
    if (key === 'shift') setAction('boost',true);
    if (key === 'e' && diving) {if(!interactExploration())E.interact(run, profile.equipment);markTutorial('salvage');}
    if (key === 'q' && diving) {useSonarReadout();markTutorial('sonar');}
    if (key === 'c' && diving) {takePhoto();markTutorial('camera');}
    if (key === 'r' && diving) {tagCreature();markTutorial('tag');}
    if (key === 'x' && diving) {E.releaseLastCatch?.(run);}
    if (key === 'f8' && diving && DEV_MODE) {run.ecology.debug=!run.ecology.debug;E.notice?.(run,run.ecology.debug?'ECOLOGY DEBUG ON':'ECOLOGY DEBUG OFF','muted',.8);}
    if (key === 'm' && (diving || restaurantActive)) { const muted=A.toggleMute?.(); if($('rdAudioToggle'))$('rdAudioToggle').textContent=muted?'SOUND OFF':'SOUND ON'; if(run) E.notice?.(run,muted?'AUDIO MUTED':'AUDIO ENABLED','info',1); }
    if ((key === ' ' || key === 'spacebar') && diving && run?.harpoon?.fight) setAction('reel',true);
    else if ((key === ' ' || key === 'spacebar') && service?.active && service.cook) hitCook();
  }, {passive:false});

  addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') setAction('move_up',false);
    if (key === 's' || key === 'arrowdown') setAction('move_down',false);
    if (key === 'a' || key === 'arrowleft') setAction('move_left',false);
    if (key === 'd' || key === 'arrowright') setAction('move_right',false);
    if (key === 'shift') setAction('boost',false);
    if (key === ' ' || key === 'spacebar') setAction('reel',false);
  });

  document.addEventListener('visibilitychange',()=>{if(!document.hidden)return;if(!$('repoDiverDialog')?.open)return;input={};if(settings.autoPause!==false&&!paused&&((run&&!$('rdDiveView')?.classList.contains('hidden'))||service?.active))setPaused(true,'WINDOW PAUSED')});
  addEventListener('blur',()=>{if(!$('repoDiverDialog')?.open)return;input={};clearControllerInput();if(settings.autoPause!==false&&!paused&&((run&&!$('rdDiveView')?.classList.contains('hidden'))||service?.active))setPaused(true,'WINDOW PAUSED')});
  addEventListener('gamepadconnected',()=>{gamepadConnected=true;startGamepadLoop();syncSettingsControls()});
  addEventListener('gamepaddisconnected',()=>{gamepadConnected=false;clearControllerInput();syncSettingsControls()});
  addEventListener('resize',scheduleHarbourLayout,{passive:true});
  addEventListener('error',e=>{if($('repoDiverDialog')?.open&&repoDiverErrorRelevant(e.error,e.filename)){console.error('[Repo Diver fatal]',e.error||e.message);showRecoveryOverlay(e.error||new Error(e.message||'Repo Diver error'))}});
  addEventListener('unhandledrejection',e=>{if($('repoDiverDialog')?.open&&repoDiverErrorRelevant(e.reason)){console.error('[Repo Diver rejection]',e.reason);showRecoveryOverlay(e.reason)}});

  addEventListener('DOMContentLoaded', () => {
    const dialog=$('repoDiverDialog');dialog?.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')setInputMode('keyboard')},{passive:true});
    const canvas = $('rdDiveCanvas');
    canvas?.addEventListener('mousemove', e => {
      const p={x:e.clientX,y:e.clientY};const moved=!lastPointerPoint||Math.hypot(p.x-lastPointerPoint.x,p.y-lastPointerPoint.y)>=7;lastPointerPoint=p;if(moved)setInputMode('keyboard');
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * canvas.width / r.width;
      mouse.y = (e.clientY - r.top) * canvas.height / r.height;
    });
    canvas?.addEventListener('click', e => {
      e.preventDefault();
      try{ canvas.focus({preventScroll:true}); }catch(_){ canvas.focus(); }
      if(paused||photoMode)return;E.harpoon(run, mouse, profile.equipment);markTutorial('harpoon');
    });
    $('rdExitDive')?.addEventListener('click', () => { if (run) { run.done = true; surface(); } });
    $('rdOpenRestaurant')?.addEventListener('click', startRestaurant);
    $('rdCookHit')?.addEventListener('click', hitCook);
    $('rdResultsContinue')?.addEventListener('click', () => { show('rdHomeView'); loadProfile(); });
    $('rdClose')?.addEventListener('click', close);
    $('rdAudioToggle')?.addEventListener('click',()=>{const muted=A.toggleMute?.();$('rdAudioToggle').textContent=muted?'SOUND OFF':'SOUND ON';});
    $('rdAudioVolume')?.addEventListener('input',e=>A.setVolume?.(Number(e.target.value)/100));
    if($('rdAudioVolume'))$('rdAudioVolume').value=Math.round((A.volume||.58)*100);
    $('rdSettingsButton')?.addEventListener('click',showSettings);$('rdSettingsClose')?.addEventListener('click',hideSettings);$('rdSettingsDone')?.addEventListener('click',hideSettings);
    $('rdPublicDiverClose')?.addEventListener('click',()=>$('rdPublicDiverCard')?.classList.add('hidden'));
    $('rdPublicDiverCard')?.addEventListener('click',async e=>{const react=e.target.closest?.('[data-rd-public-reaction]');if(!react||react.disabled||!currentPublicUsername)return;react.disabled=true;try{const r=await rpc('repo_diver_leave_reaction',{p_username:currentPublicUsername,p_reaction:react.dataset.rdPublicReaction});const panel=$('rdPublicDiverContent')?.querySelector('.rd-public-guestbook');if(panel)panel.outerHTML=publicReactionMarkup(r?.reactions||{});try{A.ui?.()}catch(_){}}catch(err){$('rdStatus').textContent=err.message;react.disabled=false}});
        $('rdConfirmCancel')?.addEventListener('click',hideConfirm);$('rdConfirmAccept')?.addEventListener('click',()=>{const fn=pendingConfirm;hideConfirm();try{fn?.()}catch(err){console.warn(err)}});
    $('rdPauseDive')?.addEventListener('click',()=>setPaused(!paused));$('rdPauseService')?.addEventListener('click',()=>setPaused(!paused));
    $('rdPauseOverlay')?.addEventListener('click',e=>{if(e.target.closest?.('[data-rd-pause-resume]'))setPaused(false);else if(e.target.closest?.('[data-rd-pause-settings]'))showSettings();else if(e.target.closest?.('[data-rd-pause-abandon]'))showConfirm('ABANDON EXPEDITION','Return to the harbour now? This expedition will surface with only the progress already earned.',()=>{setPaused(false);if(run){run.done=true;surface()}})});
    $('rdServicePauseOverlay')?.addEventListener('click',e=>{if(e.target.closest?.('[data-rd-service-resume]'))setPaused(false);else if(e.target.closest?.('[data-rd-service-settings]'))showSettings()});
    const bindSetting=(id,key,transform=v=>v)=>$(id)?.addEventListener('input',e=>{settings[key]=transform(e.target.type==='checkbox'?e.target.checked:e.target.value);saveSettings();syncSettingsControls()});
    $('rdMasterVolume')?.addEventListener('input',e=>{A.setVolume?.(Number(e.target.value)/100);if($('rdAudioVolume'))$('rdAudioVolume').value=e.target.value;syncSettingsControls()});
    bindSetting('rdSfxVolume','sfx',v=>Number(v)/100);bindSetting('rdAmbVolume','ambience',v=>Number(v)/100);bindSetting('rdMusicVolume','music',v=>Number(v)/100);bindSetting('rdUiScale','uiScale',Number);bindSetting('rdShake','shake',Number);bindSetting('rdFlashIntensity','flash',Number);bindSetting('rdGraphics','graphics',String);bindSetting('rdHighContrast','highContrast',Boolean);bindSetting('rdTutorialTips','tutorial',Boolean);bindSetting('rdStoryAssist','storyAssist',Boolean);bindSetting('rdReducedMotion','reducedMotion',Boolean);bindSetting('rdAutoPause','autoPause',Boolean);bindSetting('rdControllerSensitivity','controllerSensitivity',Number);$('rdFullscreenButton')?.addEventListener('click',toggleFullscreen);document.addEventListener('fullscreenchange',syncFullscreenButton);
    $('rdResetTutorial')?.addEventListener('click',()=>{tutorialState={};saveTutorial();lastContextKey='';$('rdStatus').textContent='Repo Diver tutorial tips reset.'});
    $('rdTabJournal')?.addEventListener('click', () => { $('rdHomeMain').classList.add('hidden'); $('rdJournalPanel').classList.remove('hidden'); });
    $('rdTabUpgrades')?.addEventListener('click', () => { $('rdHomeMain').classList.add('hidden'); $('rdUpgradePanel').classList.remove('hidden'); });
    $('rdHomeView')?.addEventListener('click', async e => {
      const hub=e.target.closest?.('[data-hub-action]');if(hub){const a=hub.dataset.hubAction;if(a==='expedition')openHomePanel('rdExpeditionPanel');else if(a==='quests'){renderQuestLog();openHomePanel('rdQuestPanel')}else if(a==='campaign'){renderCampaign();openHomePanel('rdCampaignPanel')}else if(a==='legacy'){renderLegacy();openHomePanel('rdLegacyPanel')}else if(a==='contracts'){renderContracts();openHomePanel('rdContractPanel')}else if(a==='boat'){renderBoatView();openHomePanel('rdBoatPanel')}else if(a==='research'){renderResearchView();openHomePanel('rdResearchPanel')}else if(a==='endgame'){renderEndgame();openHomePanel('rdEndgamePanel')}else if(a==='profile'){renderProfile();openHomePanel('rdProfilePanel');loadMyVerifiedCatches(false)}else if(a==='community'){try{A.play?.('tideboard')}catch(_){}renderSharedWorld();openHomePanel('rdCommunityPanel');loadSharedWorld(true)}else if(a==='journal'){$('rdHomeMain').classList.add('hidden');$('rdJournalPanel').classList.remove('hidden')}else if(a==='equipment'){$('rdHomeMain').classList.add('hidden');$('rdUpgradePanel').classList.remove('hidden')}else if(a==='fishhouse')openHomePanel('rdExpeditionPanel');return;}
      const openCampaign=e.target.closest?.('[data-rd-open-campaign]');if(openCampaign){$('rdNpcDialogue')?.classList.add('hidden');renderCampaign();openHomePanel('rdCampaignPanel');return;}
      const openLegacy=e.target.closest?.('[data-rd-open-legacy]');if(openLegacy){$('rdNpcDialogue')?.classList.add('hidden');renderLegacy();openHomePanel('rdLegacyPanel');return;}
      const masterDiff=e.target.closest?.('[data-rd-master-difficulty]');if(masterDiff){masterDifficulty=masterDiff.dataset.rdMasterDifficulty||'veteran';renderLegacy();return;}
      const masterLaunch=e.target.closest?.('[data-rd-master-launch]');if(masterLaunch&&!masterLaunch.disabled){masterLaunch.disabled=true;try{await launchMasterExpedition(masterLaunch.dataset.rdMasterLaunch,masterLaunch.dataset.source||'free')}finally{masterLaunch.disabled=false}return;}
      const pgProject=e.target.closest?.('[data-rd-postgame-project]');if(pgProject&&!pgProject.disabled){pgProject.disabled=true;try{const r=await rpc('repo_diver_claim_postgame_project',{p_project_id:pgProject.dataset.rdPostgameProject});enqueueReward({kicker:'RESEARCH PROJECT COMPLETE',title:'MARINE INSTITUTE ARCHIVE UPDATED',meta:`${Number(r?.renown||0).toLocaleString()} TOTAL RENOWN`,value:`PROJECT ARCHIVED`,delta:r?.cosmetic_reward?`COSMETIC UNLOCKED · ${String(r.cosmetic_reward).replaceAll('_',' ').toUpperCase()}`:'PERMANENT RESEARCH MILESTONE',rarity:'legendary',duration:3000});await refreshPostgame(true)}catch(err){$('rdStatus').textContent=err.message;renderLegacy()}return;}
      const ep=e.target.closest?.('[data-rd-epilogue]');if(ep&&!ep.disabled){ep.disabled=true;try{const r=await rpc('repo_diver_claim_crew_epilogue',{p_epilogue_id:ep.dataset.rdEpilogue});enqueueReward({kicker:'CREW EPILOGUE COMPLETE',title:r?.title||'POSTGAME OPERATION',meta:`${String(r?.crew_id||'TIDELINE').toUpperCase()} · ${rdEsc(r?.rank||postgameState.rank)}`,value:`+${Number(r?.renown_awarded||0)} RENOWN`,delta:r?.cosmetic_reward?`COSMETIC UNLOCKED · ${String(r.cosmetic_reward).replaceAll('_',' ').toUpperCase()}`:'CREW HISTORY ARCHIVED',rarity:'legendary',duration:3000});try{A.play?.('renown')}catch(_){}await refreshPostgame(true)}catch(err){$('rdStatus').textContent=err.message;renderLegacy()}return;}
      const room=e.target.closest?.('[data-rd-tideline-room]');if(room){const d=$('rdTidelineRoomDetail'),info=tidelineRoomInfo(room.dataset.rdTidelineRoom);if(d)d.innerHTML=`<small>R.C. TIDELINE INTERIOR</small><b>${rdEsc(info[0])}</b><span>${rdEsc(info[1])}</span>`;try{A.play?.('ui')}catch(_){}return;}
      const legend=e.target.closest?.('[data-rd-claim-velmoran-legend]');if(legend&&!legend.disabled){legend.disabled=true;try{const r=await rpc('repo_diver_claim_velmoran_legend');enqueueReward({kicker:'100% CAREER COMPLETE',title:"MASTER OF VELMORA\'S OCEANS",meta:'EVERY CHART · EVERY ARCHIVE · EVERY MASTERY',value:r?.title||'VELMORAN LEGEND',delta:'+1,000 RENOWN · LEGEND VESSEL SET UNLOCKED',rarity:'ancient',duration:5200});try{A.play?.('legacy_unlock')}catch(_){}await refreshPostgame(true)}catch(err){$('rdStatus').textContent=err.message;renderLegacy()}return;}
      const pgCos=e.target.closest?.('[data-rd-postgame-cosmetic]');if(pgCos&&!pgCos.disabled){pgCos.disabled=true;try{const r=await rpc('repo_diver_set_postgame_cosmetic',{p_kind:pgCos.dataset.rdPostgameCosmetic,p_value:pgCos.dataset.value});postgameState.cosmetics=r?.cosmetics||postgameState.cosmetics;renderLegacy();renderCareerHub();setSaveState('VESSEL STYLE SAVED','ok')}catch(err){$('rdStatus').textContent=err.message;renderLegacy()}return;}
      const campaignLaunch=e.target.closest?.('[data-rd-campaign-launch]');if(campaignLaunch&&!campaignLaunch.disabled){campaignLaunch.disabled=true;try{await launchCampaignMission(campaignLaunch.dataset.rdCampaignLaunch,false)}finally{campaignLaunch.disabled=false}return;}
      const campaignReplay=e.target.closest?.('[data-rd-campaign-replay]');if(campaignReplay&&!campaignReplay.disabled){campaignReplay.disabled=true;try{await launchCampaignMission(campaignReplay.dataset.rdCampaignReplay,true)}finally{campaignReplay.disabled=false}return;}
      const refresh=e.target.closest?.('[data-rd-community-refresh]');if(refresh){refresh.disabled=true;try{await loadSharedWorld(true);renderSharedWorld()}finally{refresh.disabled=false}return;}
      const profileLink=e.target.closest?.('[data-rd-public-profile]');if(profileLink){openPublicDiver(profileLink.dataset.rdPublicProfile);return;}
      const publicToggle=e.target.closest?.('[data-rd-public-toggle]');if(publicToggle){publicToggle.disabled=true;try{const r=await rpc('repo_diver_set_public_profile',{p_public:publicToggle.dataset.rdPublicToggle==='true'});sharedWorld.my_public_profile=r?.public_profile!==false;renderProfile();renderSharedWorld()}catch(err){$('rdStatus').textContent=err.message}return;}
      const featureCatch=e.target.closest?.('[data-rd-feature-catch]');if(featureCatch&&!featureCatch.disabled){featureCatch.disabled=true;try{const r=await rpc('repo_diver_set_featured_catch',{p_catch_id:Number(featureCatch.dataset.rdFeatureCatch)});myFeaturedCatchId=r?.featured_catch_id??Number(featureCatch.dataset.rdFeatureCatch);renderProfile();setSaveState('FEATURED CATCH SAVED','ok')}catch(err){$('rdStatus').textContent=err.message;renderProfile()}return;}
      const communityExp=e.target.closest?.('[data-rd-community-expedition]');if(communityExp&&!communityExp.disabled){returnToHarbour();openHomePanel('rdExpeditionPanel');startDive(communityExp.dataset.rdCommunityExpedition);return;}
      const npc=e.target.closest?.('[data-rd-npc]');if(npc){openNpc(npc.dataset.rdNpc);return;}
      const em=e.target.closest?.('[data-rd-mode]');if(em){expeditionMode=em.dataset.rdMode;renderEndgame();return;}
      const eh=e.target.closest?.('[data-rd-harpoon]');if(eh){expeditionHarpoon=eh.dataset.rdHarpoon;renderEndgame();return;}
      const el=e.target.closest?.('[data-rd-lure]');if(el){expeditionLure=el.dataset.rdLure;renderEndgame();return;}
      const md=e.target.closest?.('[data-rd-modifier]');if(md){expeditionModifier=md.dataset.rdModifier;renderEndgame();return;}
      const craft=e.target.closest?.('[data-rd-craft]');if(craft){craft.disabled=true;try{const cr=await rpc('repo_diver_craft_endgame_item',{p_item:craft.dataset.rdCraft});career.endgame={...(career.endgame||{}),materials:cr.materials||endgameMaterials(),crafted:cr.crafted||endgameCrafted()};try{A.play?.('craft')}catch(_){}renderEndgame();renderResearchView()}catch(err){$('rdStatus').textContent=err.message;renderEndgame();renderResearchView()}return;}
      const eb=e.target.closest?.('[data-rd-endgame-biome]');if(eb&&!eb.disabled){startDive(eb.dataset.rdEndgameBiome);return;}
      const sight=e.target.closest?.('[data-rd-sighting]');if(sight){expeditionMode='boss';renderEndgame();startDive(sight.dataset.rdSighting);return;}
      const time=e.target.closest?.('[data-rd-time]');if(time){expeditionTime=time.dataset.rdTime==='night'?'night':'day';syncTimeToggle();renderHome();openHomePanel('rdExpeditionPanel');return;}
      if(e.target.closest?.('[data-rd-harbour-back]')){returnToHarbour();return;}
      if(e.target.closest?.('[data-rd-npc-close]')){$('rdNpcDialogue')?.classList.add('hidden');return;}
      const chapter=e.target.closest?.('[data-rd-claim-chapter]');if(chapter){chapter.disabled=true;try{career=await rpc('repo_diver_claim_career_chapter',{p_chapter:Number(chapter.dataset.rdClaimChapter)});await loadProfile();$('rdNpcDialogue')?.classList.add('hidden');openHomePanel('rdQuestPanel')}catch(err){$('rdStatus').textContent=err.message}finally{chapter.disabled=false}return;}
      const contract=e.target.closest?.('[data-rd-claim-contract]');if(contract){contract.disabled=true;try{career=await rpc('repo_diver_claim_contract',{p_contract:contract.dataset.rdClaimContract});await loadProfile();openHomePanel('rdContractPanel')}catch(err){$('rdStatus').textContent=err.message}finally{contract.disabled=false}return;}
      const boat=e.target.closest?.('[data-rd-boat-upgrade]');if(boat){boat.disabled=true;try{career=await rpc('repo_diver_buy_boat_upgrade',{p_upgrade:boat.dataset.rdBoatUpgrade});await loadProfile();openHomePanel('rdBoatPanel')}catch(err){$('rdStatus').textContent=err.message}finally{boat.disabled=false}return;}
    });
    document.querySelectorAll('[data-rd-back]').forEach(b => b.onclick = () => {
      $('rdJournalPanel').classList.add('hidden');
      $('rdUpgradePanel').classList.add('hidden');
      $('rdHomeMain').classList.remove('hidden');
      returnToHarbour();
    });
  });


  if (window.__REPO_DIVER_TEST_MODE__) {
    window.__RepoDiverTest = {
      getState: () => ({ profile, run, runId, selectedRecipes: [...selectedRecipes], service }),
      loadProfile,
      setRun: value => { run = value; },
      setSelectedRecipes: value => { selectedRecipes = [...value]; },
      startDive,
      surface,
      startRestaurant,
      spawnCustomer,
      startCook,
      hitCook,
      handleOrderClick,
      serveCustomer,
      finishDay,
      recipeSupply,
      recipeDemand,
      recipeSpare,
      reconcileImpossibleOrders,
      maybeCloseSoldOutService,
      renderOrders: () => renderOrders(true),
      renderScene: () => renderRestaurantScene(true),
      renderStaff: () => renderStaffScene(true),
      serviceLoop,
      updateServicePhase,
      forceServiceTime: seconds => { if (service) service.time = seconds; },
      sonar: () => useSonarReadout(),
      takePhoto,tagCreature,recordEcologyObservation,
      getCareer:()=>career,
      renderCareerHub,renderQuestLog,renderContracts,renderBoatView,renderResearchView,renderProfile,renderLegacy,refreshPostgame,launchMasterExpedition,
      forceEvent: key => E.triggerEvent(run, key),
      forceLegendary: () => E.forceLegendary(run),
      draw,
      hud,setPaused,togglePhotoMode,applySettings,getSettings:()=>({...settings}),showConfirm,hideConfirm
    };
  }

  window.RepoDiverInputActions={setAction};
  window.openRepoDiver = open;
})();
