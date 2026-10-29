import {ReverseOpening} from './reverse-cinematics.js?v=2.27.1';
import {createReverseInterface} from './reverse-interface.js?v=2.27.1';
import {CrossingAbyssOpening,CrossingAbyssEnding} from './crossing-abyss-cinematic.js?v=2.27.1';
import {createAbyssInterface} from './crossing-abyss-interface.js?v=2.27.1';
import {saveAbyssAttempt,loadAbyssAttempt,clearAbyssAttempt,recordAbyssCompletion} from './crossing-abyss-rules.js?v=2.27.1';
import {createCrossingCamera} from './comp-crossing-camera.js?v=2.27.1';
import {RepoScapeOpening} from './reposcape-cinematics.js?v=2.27.1';
import {createRepoScapeFrameBudget} from './reposcape-frame-budget.js?v=2.27.1';
import {sampleGhost} from './ghost-playback.js?v=2.27.1';
import {RaceSessionClock,neutralRaceInput,raceResultTitle} from './race-session.js?v=2.27.1';
import {HollowreachOpening} from './hollowreach-opening.js?v=2.27.1';
import {createFrameBudget} from './hollowreach-performance.js?v=2.27.1';
import {createInterfaceAudio} from './interface-audio.js?v=2.27.1';
import {createRunnerSocial} from './runner-social.js?v=2.27.1';
import {NoSuchPlaceOpening} from './no-such-place-cinematics.js?v=2.27.1';
import {NoSuchPlaceRenderer} from './no-such-place-renderer.js?v=2.27.1';
import {createPlaceInterface} from './no-such-place-interface.js?v=2.27.1';
import {WorldWarROpening} from './world-war-r-cinematics.js?v=2.27.1';
import {UnravelOpening} from './unravel-cinematics.js?v=2.27.1';
import {CastawayOpening} from './castaway-cinematics.js?v=2.27.1';
import {createCameraImmersion} from './camera-immersion.js?v=2.27.1';
import {CameraMotionBlur} from './motion-blur.js?v=2.27.1';
import {OrcaOpening} from './orca-cinematics.js?v=2.27.1';
import {HigherGroundOpening} from './higher-ground-cinematics.js?v=2.27.1';
import {MenuOpening} from './menu-cinematics.js?v=2.27.1';
import {withMenuPaws} from './menu-hands.js?v=2.27.1';
import {createMenuRat} from './menu-rat.js?v=2.27.1';
const LOCAL_PREVIEW=document.documentElement.dataset.menuPreview==='true'||['localhost','127.0.0.1'].includes(location.hostname);
import {DraftOpening} from './draft-cinematics.js?v=2.27.1';
import {createGhostLoader} from './ghosts.js?v=2.27.1';
import {AttemptGhost} from './attempt-ghost.js?v=2.27.1';
import {setupMultiplayer} from './airport-multiplayer.js?v=2.27.2';
import {VerifiedRaceEngine} from './race-engine.js?v=2.27.1';
import {encodeRaceFrame} from './race-protocol.js?v=2.27.1';
import {RECORD_SEASONS} from './record-seasons.js?v=2.27.1';
import {runVersionForCourse} from './run-version.js?v=2.27.1';
import {DRAGON_BOARDING_HINT,dragonRideHint,dragonReinViewTargets} from './no-such-place-controls.js?v=2.27.1';
import {setupLeaderboards} from './leaderboards.js?v=2.27.1';
import * as THREE from './vendor/three.module.js?v=2.27.1';
import {COURSES,buildCourse} from './journeys.js?v=2.27.1';
import {GameWorld,loadSurfaceTextures,surfaceSets} from './stage.js?v=2.27.1';
import {GameAudio} from './audio.js?v=2.27.1';
import {createHands} from './hands.js?v=2.27.1';
import {createWallStride} from './wall-stride.js?v=2.27.1';
import {traversalPrompt} from './traversal.js?v=2.27.1';
import {getHouseWayfindingHint} from './house-wayfinding.js?v=2.27.1';
import {skateboardWayfindingHint} from './skateboard-wayfinding.js?v=2.27.1';
import {curtainSlideHint} from './final-curtain.js?v=2.27.1';
import {MOVEMENT,createMotionState,stepMovement} from './movement.js?v=2.27.1';
import {MODES,VERSION,createRace,updateRace,sampleRoute,spawnForSection,formatTime,getMedal,clamp,lerp,grabFinaleChain,advanceFinale} from './race.js?v=2.27.1';
import {finaleShot} from './finale.js?v=2.27.1';
import {isGameplayShortcut,movementInput,protectGameKeys} from './game-input.js?v=2.27.1';
import {renderView} from './render-view.js?v=2.27.1';
import {attachGameplayCamera} from './scene-lifecycle.js?v=2.27.1';
import {prepareWorldGraphics} from './prepare-graphics.js?v=2.27.1';
import {RUNNERS} from './characters.js?v=2.27.1';
import {runnerUnlocked,unlockedLegendaryCount} from './runner-unlocks.js?v=2.27.1';
import {RunnerRoom} from './runner-room.js?v=2.27.1';
import {RunnerPortraits} from './runner-portraits.js?v=2.27.1';
import {KnifeRoom} from './knife-room.js?v=2.27.1';
import {knifeDiscovered} from './comp-crossing-rewards.js?v=2.27.1';
import {KNIVES,KNIFE_FINISHES,getKnifeSpec,getKnifeFinish,normalizeKnifeSelection} from './knife-catalog.js?v=2.27.1';
import {PlaydateOpening} from './playdate-opening.js?v=2.27.1';
import {SmallHoursOpening} from './small-hours-opening.js?v=2.27.1';
import {FinalCurtainOpening} from './final-curtain-opening.js?v=2.27.1';
import {RuptureOpening} from './rupture-opening.js?v=2.27.1';
import {createEscapeEnding} from './escape-ending.js?v=2.27.1';
import {UncrownedOpening} from './uncrowned-opening.js?v=2.27.1';
import {LastBloomOpening} from './last-bloom-opening.js?v=2.27.1';
import {bloomHint} from './last-bloom-branches.js?v=2.27.1';
import {OpeningSequence,OPENING_DURATION,poseOpeningPursuer} from './opening.js?v=2.27.1';
import {BrandIntro} from './brand-intro.js?v=2.27.1';
import {loadSettings,saveSettings,loadRecords,loadRaceRecords,loadRaceGhost,loadGhosts,loadProgress,recordRun,loadPersonalGhost,recordAttempt} from './storage.js?v=2.27.1';

import {createKnifeShop} from './knife-shop.js?v=2.27.1';
import {premiumFinish} from './premium-catalog.js?v=2.27.1';

const $=id=>document.getElementById(id),show=(id,value=true)=>$(id).classList.toggle('hidden',!value),text=(id,value)=>{if($(id).textContent!==String(value))$(id).textContent=value;};
const canvas=$('game');
const abyssInterface=createAbyssInterface();let abyssRestartHold=0,abyssSavedAt=0;
function suspendAbyss(){if(course?.climb&&!onlineRun&&phase==='playing')saveAbyssAttempt(course,race,motion,world?.theatreMechanisms);}
const requestedCourse=new URLSearchParams(location.search).get('course');
const initialCourseId=COURSES.some(c=>c.id===requestedCourse)?requestedCourse:COURSES[3].id;
let runnerPortraits=null,runnerSocial=null,repoAtlas=null;
let settings=loadSettings();const raceCamera=createCrossingCamera();let raceBodyVisible=false;
function togglePlayerView(){if(phase==='opening'&&opening?.compCrossing)opening.session.toggleCamera();else{settings.thirdPerson=!settings.thirdPerson;raceCamera.reset();toast(settings.thirdPerson?'THIRD PERSON · V to change view':'FIRST PERSON · V to change view',2);}saveSettings(settings);}
function updateViewButtons(){for(const id of ['crossing-camera-pause','race-camera']){const b=$(id),active=!!settings.thirdPerson;if(b.getAttribute('aria-pressed')!==String(active))b.setAttribute('aria-pressed',String(active));const label=(active?'FIRST PERSON':'THIRD PERSON')+' · V';if(b.textContent!==label)b.textContent=label;}}
try{if(!window.localStorage?.getItem('comp-run.settings.v1')&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)settings.motion=false;}catch{if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)settings.motion=false;}
const audio=new GameAudio();audio.setVolume(settings.volume/100);audio.setEffectsVolume(settings.effectsVolume/100);
const placeRenderer=new NoSuchPlaceRenderer({quality:settings.quality});
const placeInterface=createPlaceInterface({onSound:cue=>audio.play(cue)});
const reverseInterface=createReverseInterface();
function reverseFeedback(event){reverseInterface.onEvent(event,race?.time||0);audio.reverseEvent(event);}
function renderGameView(scene,viewCamera,viewmodel,blur=null){
 if(course?.id==='reposcape'&&scene===world?.scene)world.prepareRender?.(viewCamera);
 if(course?.id==='no-such-place'&&scene===world?.scene)placeRenderer.render(renderer,scene,viewCamera,{viewmodel,viewFov:settings.viewFov});
 else renderView(renderer,scene,viewCamera,viewmodel,settings.viewFov,blur);
}
const camera=new THREE.PerspectiveCamera(settings.fov,innerWidth/innerHeight,.04,1400);
camera.rotation.order='YXZ';
camera.layers.enable(1);
const dragonReinTargets=[new THREE.Vector3(),new THREE.Vector3()];
const COURSE_GROUPS=[
  {id:'tutorial',title:'TUTORIAL LEVELS',kicker:'LEARN THE MOVEMENT',description:'Three opening courses to build your movement and timing.',courses:COURSES.slice(0,3)},
  {id:'campaign',title:'THE CAMPAIGN',kicker:'THE CHASE BEGINS',description:'Distinct worlds. Complete escapes. One life to find your way out.',courses:COURSES.slice(3).filter(c=>!c.climb)},
  {id:'crossing',label:'COMP-CROSSING',title:'COMP-CROSSING',kicker:'THE LONG WAY HOME',description:'One continuous climb through the abyss beneath the village. Every metre is yours to lose.',courses:COURSES.filter(c=>c.climb)}
];
const COURSE_NOTES={'crossing-abyss':'','the-reverse':'Turn the world. Keep your momentum. Five minutes of precision.',reposcape:'Lumbridge to Barbarian Village. Four floors below.','no-such-place':'Choose your verbs. Find the gate. Something follows.','world-war-r':'No safe ground. Keep moving.',unravel:'Pull one thread. Wake something enormous.',castaway:'A painted cosmos. A burning dawn. Keep a piece of the night.','higher-ground':'An entire island. Ten biomes. One broken summit.',sanctuary:'Find your pace. Master the rebound.',hollow:'Wall runs, slides and spiral descents.',undertow:'Link swings, climbs and longer jumps.',playdate:'Into the haunted indoor playground.','small-hours':'A huge house. A very small runner.','final-curtain':'The theatre is coming apart.','last-bloom':'Outrun the swamp. Survive what grows inside.',rupture:'The dam is failing. Carry the pressure.',uncrowned:'Thirteen sovereigns. One way out.','on-the-menu':'Dream small. Run big. Myron and Rivia are hungry.','rep-orca':'Escape a living ocean. Follow the last breath.','last-draft':'An artist draws your escape. Until he changes his mind.'};
const courseGroup=id=>COURSE_GROUPS.find(group=>group.courses.some(c=>c.id===id));
const courseLabel=id=>{const group=courseGroup(id);return `${(group.label||group.id).toUpperCase()} ${String(group.courses.findIndex(c=>c.id===id)+1).padStart(2,'0')}`;};
let onlineEngine=null,onlinePrevious={},onlineRestart=false,multiplayerLoadout=false;
let crossingLoadout=false,crossingFrames=false,crossingFrameNode=null,crossingPressure=0,dragLook=false,dragHeld=false;
const crossingBudget=createFrameBudget({onPressure(){if(!opening?.compCrossing||settings.quality==='ultra'||crossingPressure>=4)return false;crossingPressure++;opening.setQuality('performance');renderer.setPixelRatio(Math.max(.7,Math.min(devicePixelRatio||1,1.15)-(crossingPressure-1)*.1));resize();return true;}});
let multiplayer,onlineRules='one-life',onlineRun=false,onlineStartAt=0,onlineOffset=0;
let renderer,world,course,selectedCourse=LOCAL_PREVIEW?(document.documentElement.dataset.previewCourse||'on-the-menu'):initialCourseId,selectedMode='normal',race,motion;
let phase='menu',locked=false,paused=false,settingsFrom='menu',lookBack=false,torchOn=false;
let preparingWorld=false;
const onlineClock=new RaceSessionClock();
let captureWanted=false,captureGeneration=0,capturePending=false,awaitingCapture=false;
function capturePrompt(value){awaitingCapture=value;show('capture-start',value);text('capture-start',phase==='opening'?'CLICK TO EXPLORE':course?.climb?'CLICK TO CLIMB':'CLICK TO RUN');}
function cancelCapture(){captureWanted=false;captureGeneration++;capturePending=false;capturePrompt(false);if(dragLook){dragLook=false;locked=false;}}
function pausePanel(cinematic=false){
 text('resume',cinematic?'CONTINUE':'RESUME RUN ↗');show('restart',!cinematic);show('pause-skip',cinematic);
 text('pause-skip',phase==='ending'?'VIEW RESULTS':opening?.options?.social?'PARTY & DEPARTURES':opening?.compCrossing?'CHOOSE A RUN':'SKIP INTRO');
 $('crossing-controls')?.classList.toggle('hidden',phase!=='opening'||!opening?.compCrossing);show('race-camera',phase==='playing');updateViewButtons();
 show('pause',true);$('resume').focus();
}
let clock=0,gameVisualTime=0,accumulator=0,countdown=0,lastCount=-1,toastUntil=0,bannerUntil=0,contextUntil=0;
let inputs={jumpSeq:0,slideSeq:0,interactSeq:0},keys=new Set(),lookYaw=0,lookPitch=0;
let chuteHeading=null,chuteBank=0;
const wallStride=createWallStride(),cameraImmersion=createCameraImmersion(),cameraBlur=new CameraMotionBlur();
let cameraEye=1.63,cameraImpact=0,slidePulse=0,handPhase=0,hudClock=0,menuAngle=0;
const attemptGhost=new AttemptGhost();
let runFrames=[],ghostFrames=[],ghostIndex=0,ghostClock=0,firstRun=true,resultRecord=null;
let ghostActor,firstPerson,hands,light,framePrevious=performance.now(),lastFocus=null,completionShown=false;
let frameAverage=16,autoResolution=1,renderedFrames=0;
let repoFrameActive=false,repoFrameQuality=null,repoFrameDpr=0;
const repoFrameBudget=createRepoScapeFrameBudget({onScale:ratio=>{if(renderer&&Math.abs(renderer.getPixelRatio()-ratio)>.001){renderer.setPixelRatio(ratio);resize();}}});
function repoScapeFrame(now,enabled){
  if(!enabled){
    if(repoFrameActive){
      repoFrameActive=false;repoFrameBudget.reset();
      const cap=opening?.compCrossing?(settings.quality==='ultra'?1.5:settings.quality==='performance'?1:1.15):(settings.quality==='ultra'?2:settings.quality==='performance'?1:1.5);
      const ratio=Math.min(devicePixelRatio||1,cap)*(opening?.compCrossing?1:autoResolution);
      if(Math.abs(renderer.getPixelRatio()-ratio)>.001){renderer.setPixelRatio(ratio);resize();}
    }
    repoAtlas?.updatePerformance(null,false);return;
  }
  if(!repoFrameActive||repoFrameQuality!==settings.quality||repoFrameDpr!==(devicePixelRatio||1)){
    repoFrameActive=true;repoFrameQuality=settings.quality;repoFrameDpr=devicePixelRatio||1;
    repoFrameBudget.configure(repoFrameQuality,repoFrameDpr);
  }
  const active=phase==='playing'&&!paused&&locked&&countdown<=0&&race?.status==='running'&&!document.hidden&&!modalOpen();
  const repoPerformance=repoFrameBudget.record(now,active);
  repoAtlas?.updatePerformance(repoPerformance,active);
}
let selectingCourse=false,lastCinematicCourse=0,cinematicStart=0;
let ending=null,endingTime=0,endingPaused=false,endingBeat='';
let opening=null,openingTime=0,openingPaused=false,openingSoundBeat='',openingView=null,runnerRoom=null;
let knifeRoom=null,loadoutTab='runners',loadoutFocus=null,knifeDrag=null,knifeAuto=false,runnerPreviewTime=0;
let runnerPreviewId=settings.runner,runnerFilter='all';
function runnerOwned(id,progress=loadProgress()){return knifeShop.ownsRunner(id)&&runnerUnlocked(id,progress,knifeShop.state.runners);}
function equippedRunner(){return runnerOwned(settings.runner)?settings.runner:RUNNERS[0].id;}
let knifeFilter='all';
function equippedKnife(){return {...settings,...normalizeKnifeSelection({knifeId:knifeDiscovered(settings.knifeId)?settings.knifeId:'wake',finishId:knifeDiscovered(settings.knifeId)&&knifeShop.owns(settings.finishId)?settings.finishId:'brushed'})};}
const knifeShop=createKnifeShop(()=>{if(hands){hands.setKnife(equippedKnife());hands.setSkinTone(selectedRunner().skin);hands.setRunnerStyle?.(selectedRunner());}runnerRoom?.setKnife(equippedKnife());if(phase==='runners'){if(loadoutTab==='knives')renderKnives();else renderRunners();}});
let brandIntro=null,menuSoundUnlocked=false;
window.REPO_GAME_REWARD_STATE=()=>({active:phase==='playing'&&!paused&&countdown<=0&&race?.status==='running',time:race?.time||0});
addEventListener('repo-game-rewards',event=>{
 const r=event.detail,node=$('repoints-note');if(!node||!r?.available)return;
 node.textContent=r.pending?'REPOINTS · SAVED, SYNCING…':`${Number(r.balance||0).toLocaleString()} REPOINTS · 20 / ACTIVE MIN`;
 const result=$('result-repoints');if(result)result.textContent=r.pending?'Your earned Repoints will sync when connected.':`${Number(r.balance||0).toLocaleString()} Repoints in your shop balance`;
});
const ghostLoader=createGhostLoader({onChange:({frames,label})=>{ghostFrames=frames;ghostIndex=0;if($('ghost-status'))text('ghost-status',label);}});
function selectGhost(){if(!course)return;if(course.climb){void ghostLoader.select({source:'off',course:course.id,mode:selectedMode,rules:'one-life'});ghostFrames=[];if(ghostActor)ghostActor.visible=false;return;}if(race?.ruleset==='practice'){ghostFrames=[];if(ghostActor)ghostActor.visible=false;return;}const rules=onlineRun?onlineRules:'one-life';void ghostLoader.select({source:(LOCAL_PREVIEW||course.onlineReady===false)&&settings.ghostMode==='world'?'personal':settings.ghostMode,course:course.id,mode:selectedMode,rules,personal:loadPersonalGhost(course.id,selectedMode,rules)});}
const selectedRunner=()=>RUNNERS.find(r=>r.id===equippedRunner())||RUNNERS[0];
const handEnvironment=()=>['house','theatre'].includes(course?.theme)||(course?.theme==='greenhouse'&&(race?.progress||0)>course.bloomHandover.s*.7)?'moonlit':'default';

function localStorageAvailable(){try{return !!window.localStorage;}catch{return false;}}
function modalOpen(){return repoAtlas?.isOpen||multiplayer?.visible||['settings','howto','unsupported'].some(id=>!$(id).classList.contains('hidden'));}
function activateModal(id){lastFocus=document.activeElement;show(id,true);$(id).querySelector('button,input,select')?.focus();}
function closeModal(id){show(id,false);lastFocus?.focus?.();}
function cssAccent(){document.documentElement.style.setProperty('--accent','#df3026');}

function createGhost(){
  const group=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:course.palette.glow||course.accent,transparent:true,opacity:.085,depthWrite:false});
  if(course.id==='on-the-menu'){const rat=createMenuRat(),old=new Set();rat.group.traverse(o=>{if(o.material){old.add(o.material);o.material=mat;}});old.forEach(m=>m.dispose());group.add(rat.group);group.userData.material=mat;group.userData.limbs=[];group.userData.animate=t=>rat.update(t,{gait:1});group.visible=false;world.scene.add(group);return group;}
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.2,.46,3,6),mat);torso.position.y=1.03;group.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.17,8,6),mat);head.position.y=1.57;group.add(head);
  const limbs=[];
  for(const side of [-1,1]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.073,.06,.65,6),mat);leg.position.set(side*.13,.43,0);group.add(leg);limbs.push(leg);
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.055,.045,.55,6),mat);arm.position.set(side*.29,1.07,0);group.add(arm);limbs.push(arm);
  }
  group.userData.material=mat;group.userData.limbs=limbs;group.visible=false;world.scene.add(group);return group;
}
function disposeGhost(){if(!ghostActor){world?.updateGhostVisuals?.(null);return;}const geos=new Set(),mats=new Set();ghostActor.traverse(m=>{if(m.geometry)geos.add(m.geometry);if(m.material)mats.add(m.material);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());ghostActor.removeFromParent();ghostActor=null;}

function setCourse(id,force=false){
  runnerSocial?.cancel();
  opening?.dispose();opening=null;openingView=null;
  if(id==='crossing-abyss')selectedMode='normal';document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===selectedMode)));abyssInterface.setCourse({climb:id==='crossing-abyss'});
  document.body.classList.toggle('menu-course',id==='on-the-menu');document.body.classList.toggle('highland-course',id==='higher-ground');
  if(world&&course?.id===id&&!force){world.reset();placeInterface.reset();reverseInterface.reset();placeRenderer.reset();return;}
  disposeGhost();if(world)world.dispose();
  hands?.setRat?.(id==='on-the-menu');selectedCourse=id;course=buildCourse(id,selectedMode);world=new GameWorld(course,settings);placeInterface.setCourse(course);reverseInterface.setCourse(course);placeRenderer.reset();cameraBlur.reset();cssAccent();attachGameplayCamera(camera,world);cinematicStart=clock;
  repoAtlas?.setCourse(course);
  ghostActor=createGhost();light=new THREE.SpotLight(0xe5efcf,0,54,.52,.65,1.4);light.position.set(.16,-.1,-.04);light.target.position.set(0,-.02,-12);camera.add(light,light.target);
  if(camera.children.filter(c=>c.isLight).length>1){const lights=camera.children.filter(c=>c.isLight&&c!==light);lights.forEach(l=>{l.target?.removeFromParent();l.dispose?.();l.removeFromParent();});}
  renderCourses();text('start-description',`${courseLabel(course.id)} · ${course.title.toUpperCase()}`);if(phase==='menu')menuMusic();
}
function courseRouteSVG(c){
  const xs=c.route.map(p=>p.x),zs=c.route.map(p=>p.z),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  const width=maxX-minX||1,depth=maxZ-minZ||1,scale=Math.min(100/width,100/depth);
  const points=c.route.map(p=>`${((p.x-minX)*scale+15).toFixed(1)},${((p.z-minZ)*scale+4).toFixed(1)}`).join(' ');
  return `<svg class="course-route" viewBox="0 0 130 110" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="9" stroke-linejoin="round" opacity=".22"/></svg>`;
}
function renderCourses(){
  const records=loadRecords(),focusedCourse=document.activeElement?.dataset?.course,scroll=$('course-grid').scrollTop;
  $('course-grid').innerHTML=COURSE_GROUPS.map(group=>`<section class="course-group course-group-${group.id}" aria-labelledby="${group.id}-heading" aria-describedby="${group.id}-description"><header class="course-group-heading"><span class="course-group-kicker">${group.kicker}</span><div><h2 id="${group.id}-heading">${group.title}</h2><span class="course-group-count">${String(group.courses.length).padStart(2,'0')} ${group.courses.length===1?'LEVEL':'LEVELS'}</span></div><p id="${group.id}-description">${group.description}</p></header><div class="course-group-list">${group.courses.map((c,i)=>{
    const selected=selectedCourse===c.id,record=records[`${c.id}:${selectedMode}`];
    return `<button class="course-choice ${selected?'selected':''}" data-course="${c.id}" aria-pressed="${selected}" aria-label="Select ${courseLabel(c.id)}, ${c.title}"><span class="number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="course-choice-copy"><h3>${c.title}</h3>${c.climb?'':`<p>${COURSE_NOTES[c.id]||c.kicker}</p>`}</span><span class="course-time">${record?'BEST <br>'+formatTime(record.time):(c.durationLabel||'')}</span></button>`;
  }).join('')}</div></section>`).join('');
  $('course-grid').scrollTop=scroll;
  text('selected-course-note',`${courseLabel(selectedCourse)} · ${COURSES.find(c=>c.id===selectedCourse).title}`);
  $('course-grid').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{audio.play('click');setCourse(b.dataset.course);}));
  abyssInterface.menu(course);
  if(focusedCourse)$('course-grid').querySelector(`[data-course="${focusedCourse}"]`)?.focus({preventScroll:true});
}
function openCourseSelect(){
  selectingCourse=true;show('menu-home',false);show('course-select',true);
  const selected=$('course-grid').querySelector(`[data-course="${selectedCourse}"]`);selected?.focus({preventScroll:true});selected?.scrollIntoView?.({block:'nearest',behavior:'instant'});
}
function renderRunners(){
  const progress=loadProgress(),current=RUNNERS.find(r=>r.id===runnerPreviewId)||selectedRunner(),unlocked=runnerOwned(current.id,progress),title=id=>COURSES.find(c=>c.id===id)?.title||id;
  const scroll=$('runner-list').scrollTop;
  const visible=RUNNERS.filter(r=>runnerFilter==='all'||runnerFilter==='owned'&&runnerOwned(r.id,progress)||runnerFilter==='earned'&&(r.unlockJourney||r.unlockSecret)||runnerFilter==='shop'&&r.paid);
  $('runner-list').innerHTML=visible.map(r=>{
   const earned=runnerOwned(r.id,progress),equipped=r.id===equippedRunner(),portrait=runnerPortraits?.get(r.id);
   return `<button data-runner="${r.id}" aria-pressed="${r.id===current.id}" aria-label="Preview ${r.name}${!earned?(r.paid?', '+r.price+' Repoints':', locked: complete '+title(r.unlockJourney)):equipped?', equipped':''}" class="runner-choice ${r.rarity==='legendary'||r.premiumAnimated?'runner-legendary':''} ${!earned?'runner-locked':''}"><img class="runner-portrait" alt="" ${portrait?'src="'+portrait+'"':''}><strong>${r.name}</strong><small>${equipped?'EQUIPPED':r.paid?(earned?'OWNED':r.price.toLocaleString()+' RP'):!earned?'LOCKED':r.rarity==='legendary'?'EARNED':'STARTER'}</small>${!earned?'<i class="runner-lock" aria-hidden="true"></i>':''}</button>`;
  }).join('');
  text('runner-count',`${RUNNERS.filter(r=>runnerOwned(r.id,progress)).length} / ${RUNNERS.length} UNLOCKED`);
  $('runner-list').scrollTop=scroll;
  $('runner-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{runnerPreviewId=b.dataset.runner;runnerRoom?.setRunner(runnerPreviewId);renderRunners();$('runner-list').querySelector(`[data-runner="${runnerPreviewId}"]`)?.focus({preventScroll:true});audio.play('click');}));
  text('runner-name',current.name);text('runner-role',current.rarity==='legendary'?'LEGENDARY RUNNER':current.role.toUpperCase());text('runner-description',current.description);text('selected-runner',selectedRunner().name.toUpperCase());
  text('runner-unlock',current.unlockSecret?(unlocked?'DISCOVERED IN COMP-CROSSING':'HIDDEN IN COMP-CROSSING'):current.paid?(unlocked?'OWNED':current.price.toLocaleString()+' REPOINTS'):current.unlockJourney?(unlocked?'EARNED IN '+title(current.unlockJourney).toUpperCase():'COMPLETE '+title(current.unlockJourney).toUpperCase()):'AVAILABLE FROM THE START');
  text('runner-unlock-note',current.effect||(current.unlockSecret&&!unlocked?'A forgotten upstairs room holds something alive.':current.unlockJourney&&!unlocked?'Finish the full level on Normal or Nightmare to unlock.':'All runners have the same movement.'));
  $('runner-identity').classList.toggle('legendary',current.rarity==='legendary');$('runner-identity').classList.toggle('locked',!unlocked);
  $('use-runner').hidden=current.paid&&!unlocked;$('use-runner').disabled=!unlocked;text('use-runner',!unlocked?'LOCKED':current.id===settings.runner?'EQUIPPED · BACK →':'EQUIP RUNNER →');
  const shop=knifeShop.state;
  $('buy-runner').hidden=!current.paid||unlocked;$('buy-runner').disabled=!shop.ready||shop.busy||shop.balance<current.price;text('buy-runner',shop.busy?'PROCESSING…':'BUY · '+(current.price||0).toLocaleString()+' REPOINTS');
  text('runner-wallet',shop.balance===null?(shop.user?'BALANCE UNAVAILABLE':'CONNECT ACCOUNT'):shop.balance.toLocaleString()+' REPOINTS');
  text('runner-shop-status',shop.error||(!unlocked&&current.paid&&shop.ready&&shop.balance<current.price?'You need '+(current.price-shop.balance).toLocaleString()+' more Repoints.':''));
  $('runner-refresh').disabled=shop.busy;text('runner-refresh',shop.user?'REFRESH':'CONNECT');
  $('runner-inspect').hidden=!current.paid;$('runner-inspect').disabled=!settings.motion;text('runner-inspect',current.premiumAnimated?'TRANSFORM':'INSPECT');
  document.querySelectorAll('[data-runner-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.runnerFilter===runnerFilter)));
  runnerRoom?.setLocked?.(!unlocked);sizeRunnerPreview();
}
function equipRunner(id){
 if(!runnerOwned(id))return false;
 settings.runner=id;hands.setSkinTone(selectedRunner().skin);hands.setRunnerStyle?.(selectedRunner());saveLoadout();text('selected-runner',selectedRunner().name.toUpperCase());return true;
}
function saveLoadout(){text('loadout-status',saveSettings(settings)?'LOADOUT SAVED':'FOR THIS SESSION');}
function renderKnives(){
  const selected=knifeRoom?.selection||settings,spec=getKnifeSpec(selected.knifeId),finish=getKnifeFinish(selected.finishId),shop=knifeShop.state;
  if(!$('knife-list').children.length)$('knife-list').innerHTML=KNIVES.map(k=>`<button class="knife-choice" data-knife="${k.id}" aria-label="${k.name}, ${k.family}" aria-pressed="false"><svg viewBox="0 0 120 40" aria-hidden="true"><path d="${k.iconPath}"/></svg><strong>${k.name}</strong><small>${k.family}</small></button>`).join('');
  const finishScroll=$('knife-finishes').scrollTop,focusedFinish=document.activeElement?.dataset?.finish;
  const finishes=KNIFE_FINISHES.filter(f=>f.id==='abyss'?selected.knifeId==='abyss':selected.knifeId!=='abyss').filter(f=>knifeFilter==='all'||knifeFilter==='owned'&&knifeShop.owns(f.id)||knifeFilter==='shop'&&f.premium);
  $('knife-finishes').innerHTML=finishes.map(f=>`<button class="knife-finish" data-finish="${f.id}" aria-label="${f.name}: ${f.description}" aria-pressed="false" title="${f.description}"><i style="--finish:${f.swatch}" aria-hidden="true"></i><span>${f.name}${f.premium?`<small>${knifeShop.owns(f.id)?'OWNED':f.price.toLocaleString()+' RP'}</small>`:''}</span></button>`).join('');
  $('knife-finishes').scrollTop=finishScroll;if(focusedFinish)$('knife-finishes').querySelector(`[data-finish="${focusedFinish}"]`)?.focus({preventScroll:true});
  $('knife-list').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.knife===spec.id)));
  $('knife-finishes').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.finish===finish.id)));
  text('knife-name',finish.premium?finish.name:spec.name);text('knife-family',(finish.premium?finish.family+' / '+spec.name:spec.family).toUpperCase());text('knife-description',finish.premium?finish.description:spec.description);text('knife-finish-name',finish.premium?'':finish.name);text('selected-knife',getKnifeSpec(settings.knifeId).name.toUpperCase());
  const discovered=knifeDiscovered(spec.id),owned=knifeShop.owns(finish.id)&&discovered;$('use-knife').hidden=!owned&&discovered;$('use-knife').disabled=!owned;text('use-knife',discovered?'EQUIP KNIFE →':'DISCOVER IN COMP-CROSSING');
  $('buy-knife').hidden=owned||!discovered;$('buy-knife').disabled=!shop.ready||shop.busy||shop.balance<finish.price;
  text('buy-knife',shop.busy?'PROCESSING…':'BUY · '+(finish.price||0).toLocaleString()+' REPOINTS');
  text('knife-wallet',shop.balance===null?(shop.user?'BALANCE UNAVAILABLE':'CONNECT ACCOUNT'):shop.balance.toLocaleString()+' REPOINTS');
  text('knife-shop-status',!discovered?'An upstairs discovery in Comp-Crossing unlocks this relic and its runner.':shop.error||(!owned&&shop.ready&&shop.balance<finish.price?'You need '+(finish.price-shop.balance).toLocaleString()+' more Repoints.':owned&&finish.premium?'Owned on all eight knives.':finish.premium?'One purchase unlocks all eight knife shapes.':''));
  text('knife-effect-copy',finish.effect||finish.description);
  $('knife-refresh').disabled=shop.busy;text('knife-refresh',shop.user?'REFRESH':'CONNECT');
  document.querySelectorAll('[data-knife-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.knifeFilter===knifeFilter)));
  $('knife-turntable').setAttribute('aria-label',`${spec.name} in ${finish.name}. Drag to rotate, or use the arrow keys.`);
  updateKnifeControls();
}
function updateKnifeControls(){
  const enabled=settings.motion&&knifeAuto;
  $('knife-auto').setAttribute('aria-pressed',String(enabled));$('knife-auto').disabled=!settings.motion;
  $('knife-auto').title=settings.motion?'Toggle automatic rotation':'Automatic rotation is disabled with reduced motion.';
  text('knife-auto',enabled?'AUTO ROTATE':'AUTO OFF');
  if(knifeRoom)knifeRoom.autoRotate=enabled;
}
function sizeRunnerPreview(){if(runnerRoom&&loadoutTab==='runners')runnerRoom.setViewport(innerWidth,innerHeight,$('runner-stage').getBoundingClientRect());}
function sizeKnifePreview(){if(knifeRoom&&loadoutTab==='knives')knifeRoom.setViewport(innerWidth,innerHeight,$('knife-stage').getBoundingClientRect());}
function disposeLoadout(){runnerRoom?.dispose();runnerRoom=null;knifeRoom?.dispose();knifeRoom=null;const stage=$('knife-turntable');if(knifeDrag&&stage.hasPointerCapture?.(knifeDrag.id))stage.releasePointerCapture(knifeDrag.id);knifeDrag=null;stage.classList.remove('dragging');}
function setLoadoutTab(tab){
  if(phase!=='runners'||!['runners','knives'].includes(tab))return;
  if(loadoutTab===tab&&(runnerRoom||knifeRoom))return;
  disposeLoadout();loadoutTab=tab;
  for(const id of ['runners','knives']){const active=id===tab;$('tab-'+id).setAttribute('aria-selected',String(active));$('tab-'+id).tabIndex=active?0:-1;}
  show('runner-panel',tab==='runners');show('knife-panel',tab==='knives');
  document.body.classList.toggle('knife-view',tab==='knives');
  if(tab==='knives'){knifeRoom=new KnifeRoom(settings,{quality:settings.quality});renderKnives();sizeKnifePreview();void knifeShop.refresh();}
  else{runnerPreviewId=settings.runner;runnerRoom=new RunnerRoom(runnerPreviewId,{quality:settings.quality,knife:equippedKnife()});runnerRoom.setPose('run');runnerPreviewTime=0;$('runner-still').setAttribute('aria-pressed','false');$('runner-run').setAttribute('aria-pressed','true');runnerPortraits||=new RunnerPortraits();renderRunners();sizeRunnerPreview();void knifeShop.refresh();}
}
function chooseKnife(value){
  const selection=normalizeKnifeSelection({...knifeRoom?.selection,...value});knifeRoom?.setKnife(selection);renderKnives();sizeKnifePreview();audio.play('click');
}
function openRunners(){loadoutFocus=document.activeElement;if(phase==='opening'&&opening?.compCrossing){crossingLoadout=true;openingPaused=true;opening.pause();cancelCapture();clearInputs();document.exitPointerLock?.();show('opening',false);show('pause',false);}disposeLoadout();phase='runners';firstPerson.visible=false;show('menu',false);show('runners',true);document.body.classList.add('runner-view');setLoadoutTab(loadoutTab);saveLoadout();$('tab-'+loadoutTab).focus();}
function closeRunners(){if(phase!=='runners')return;disposeLoadout();show('runners',false);document.body.classList.remove('runner-view','knife-view');if(crossingLoadout&&opening?.compCrossing){crossingLoadout=false;opening.setLoadout(equippedRunner(),equippedKnife());phase='opening';openingPaused=false;show('opening',true);opening.resume();crossingBudget.reset();framePrevious=performance.now();requestCapture();return;}phase='menu';show('menu',true);cinematicStart=clock;loadoutFocus?.focus?.();if(multiplayerLoadout){multiplayerLoadout=false;multiplayer.open();}}
function menuMusic(){
 if(opening?.compCrossing)return;
 if(!menuSoundUnlocked||settings.menuMusic===false||document.body.classList.contains('booting'))return;
 audio.selectCourse(course?.climb?'crossing-abyss-home':'menu',false);audio.setMusicVolume(settings.musicVolume/100);void audio.start();text('menu-music','MUSIC ON');
}
function movementSound(event){
 const names={'slide-chute':'slide','wall-run':'slide','wall-kick':'jump','unsafe-landing':'land-damage'};
 const dragonMount=event.kind==='zipline'&&course?.traversals?.some(d=>d.id===event.id&&d.rideStyle==='dragon');
 audio.play(dragonMount?'place-dragon-mount':names[event.kind]||event.kind,{intensity:event.intensity??.6,theme:world?.theme});
}
function airportMovement(events){for(const event of events){hands?.event(event);movementSound(event);}}
function crossingDepart(){returnToMenu();openCourseSelect();}
function crossingFrame(now){
 if(!opening?.compCrossing)return;const stats=crossingBudget.record(now,!document.hidden&&!openingPaused);
 if(!crossingFrameNode){crossingFrameNode=document.createElement('div');crossingFrameNode.style.cssText='position:fixed;right:28px;top:28px;z-index:35;color:#eee8d7;text-shadow:0 1px 4px #000;font:11px Arial;pointer-events:none';document.body.append(crossingFrameNode);}
 crossingFrameNode.hidden=!crossingFrames;crossingFrameNode.textContent=stats.samples?`${stats.fps} FPS · 95% ≤ ${stats.p95.toFixed(1)} ms`:'Measuring…';
 if(now-(crossingFrame.at||0)>1000){crossingFrame.at=now;const p=opening.visitor,w=opening.airport;document.body.dataset.qa=JSON.stringify({map:'comp-crossing',runtime:'comp-run/main.js',performance:stats,quality:settings.quality,resolutionScale:renderer.getPixelRatio(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,player:{x:p.x,y:p.y,z:p.z,gliding:!!p.gliding,thirdPerson:!!opening.session.thirdPerson,grounded:p.grounded,bounces:p.bounceCount,lastBounce:p.lastBounceId,support:p._supportId},nativeBounces:w.geometry.surfaces.filter(s=>s.bounce).length,routeCount:w.parkour?.routes.length,night:w.night,locked,paused:openingPaused});}
}
async function beginCrossing(){
 if(preparingWorld)return;preparingWorld=true;cancelCapture();clearInputs();opening?.dispose();opening=null;openingView=null;crossingPressure=0;crossingLoadout=false;
 const loading=document.createElement('div');loading.id='graphics-loading';loading.setAttribute('role','status');loading.style.cssText='position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:#090d10;color:#ded8c8;font:600 14px Arial;letter-spacing:.16em';loading.textContent='OPENING COMP-CROSSING';document.body.append(loading);
 try{
  await new Promise(resolve=>requestAnimationFrame(resolve));
  opening=new HollowreachOpening(world,equippedRunner(),settings,{onMovement:airportMovement,onShop:()=>{loadoutTab='knives';openRunners();},onDepart:crossingDepart,onBell:()=>audio.play('checkpoint',{intensity:.3})});
  $('crossing-destination').replaceChildren();for(const r of[{id:'square',name:'Hearth Square'},{id:'glider-loft',name:'Glider loft'},{id:'relic-loft',name:'Relic loft'},...(LOCAL_PREVIEW?[{id:'glider-flight',name:'Glider flight test (local only)'}]:[]),...(opening.airport.parkour?.routes||[])]){const o=document.createElement('option');o.value=r.id;o.textContent=r.name;$('crossing-destination').append(o);}
  hands.setRat?.(false);hands.setRunnerStyle(selectedRunner());hands.setSkinTone(selectedRunner().skin);hands.setKnife(equippedKnife());hands.setEquipment(settings.equipment,true);hands.reset();
  opening.update(0,camera);runnerSocial?.prepare(opening.scene);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,settings.quality==='ultra'?1.5:settings.quality==='performance'?1:1.15));resize();
  await prepareWorldGraphics(renderer,{scene:opening.scene},camera,status=>loading.textContent=status.replace('course','village'));
  for(const id of ['menu','result','pause','runners','hud','countdown'])show(id,false);document.body.classList.remove('runner-view','knife-view','menu-course','highland-course');document.body.classList.add('opening-view','crossing-view');
  phase='opening';openingTime=0;openingPaused=false;openingSoundBeat='village';show('opening',true);text('opening-title','COMP-CROSSING');text('opening-chapter','THE VILLAGE');text('opening-pause','PAUSE');audio.setExternalMusic(true);void audio.start();audio.setMusicVolume(0);opening.resume();crossingBudget.reset();framePrevious=performance.now();capturePrompt(true);canvas.focus();
 }catch(error){console.error('Comp-Crossing preparation failed',error);opening?.dispose();opening=null;returnToMenu();}
 finally{loading.remove();preparingWorld=false;}
}
function beginOpening(){
  opening?.dispose();opening=new (course.climb?CrossingAbyssOpening:course.id==='the-reverse'?ReverseOpening:course.id==='reposcape'?RepoScapeOpening:course.id==='no-such-place'?NoSuchPlaceOpening:course.id==='world-war-r'?WorldWarROpening:course.id==='unravel'?UnravelOpening:course.id==='castaway'?CastawayOpening:course.id==='higher-ground'?HigherGroundOpening:course.id==='on-the-menu'?MenuOpening:course.id==='rep-orca'?OrcaOpening:course.id==='last-draft'?DraftOpening:course.id==='uncrowned'?UncrownedOpening:course.id==='rupture'?RuptureOpening:course.id==='last-bloom'?LastBloomOpening:course.id==='final-curtain'?FinalCurtainOpening:course.id==='small-hours'?SmallHoursOpening:course.id==='playdate'?PlaydateOpening:OpeningSequence)(world,equippedRunner(),settings,{onMovement:airportMovement});openingTime=0;openingPaused=false;openingSoundBeat='';phase='opening';
  show('hud',false);show('opening',true);document.body.classList.add('opening-view');text('opening-pause','PAUSE');text('opening-title',course.title.toUpperCase());text('opening-chapter',courseLabel(course.id));
  $('opening-bar').style.width='0%';show('pause',false);capturePrompt(!!opening.airportLobby&&!locked);framePrevious=performance.now();canvas.focus();
}
function finishOpening(capture=false){
  if(opening?.compCrossing){crossingDepart();return;}
  if(phase!=='opening')return;opening?.dispose();opening=null;openingView=null;phase='playing';openingPaused=false;clearInputs();world.reset();gameVisualTime=0;accumulator=0;countdown=.8;lastCount=-1;
  show('opening',false);show('hud',true);show('countdown',true);document.body.classList.remove('opening-view');$('cinematic-shutter').style.opacity=0;
  lookYaw=motion.yaw;lookPitch=-.04;camera.fov=settings.fov;camera.updateProjectionMatrix();audio.selectCourse(course.id,true);audio.setMusicVolume(settings.musicVolume/100);void audio.start();
  if(course.climb){countdown=0;race.status='running';show('countdown',false);}
  paused=false;show('pause',false);framePrevious=performance.now();capturePrompt(!locked);if(capture)requestCapture();else if(locked)void protectGameKeys(true);
}
function pauseOpening(value){
 if(phase!=='opening')return;openingPaused=value;clearInputs();opening?.pause?.();
 if(value){cancelCapture();pausePanel(true);text('pause-note',opening?.airportLobby?'Take a moment. Continue when you are ready.':'The cinematic is paused.');void audio.suspend();document.exitPointerLock?.();}
 else{show('pause',false);framePrevious=performance.now();void audio.start();opening?.resume?.();crossingBudget.reset();requestCapture(!opening?.airportLobby);}
}
function bindUI(){
  if(settings.menuMusic===false)text('menu-music','MUSIC OFF');
  $('menu-music').addEventListener('click',()=>{if(!menuSoundUnlocked){menuSoundUnlocked=true;settings.menuMusic=true;}else settings.menuMusic=settings.menuMusic===false;saveSettings(settings);if(settings.menuMusic)menuMusic();else{audio.soundtrack.pause();text('menu-music','MUSIC OFF');}});
  document.addEventListener('pointerdown',e=>{if(!menuSoundUnlocked&&e.target!==$('menu-music')&&['menu','runners'].includes(phase)){menuSoundUnlocked=true;menuMusic();}},{capture:true});
  $('open-runners').addEventListener('click',openRunners);$('edit-runner').addEventListener('click',openRunners);$('close-runners').addEventListener('click',closeRunners);$('use-runner').addEventListener('click',()=>{if(equipRunner(runnerPreviewId)){audio.play('click');closeRunners();}});
  $('equip-reward').addEventListener('click',()=>{if(resultRecord?.unlockedRunnerId&&equipRunner(resultRecord.unlockedRunnerId)){text('equip-reward','EQUIPPED');$('equip-reward').disabled=true;audio.play('click');}});
  $('buy-runner').addEventListener('click',async()=>{try{await knifeShop.buyRunner(runnerPreviewId);}catch{}renderRunners();});
  $('runner-refresh').addEventListener('click',()=>{if(!knifeShop.state.user)knifeShop.connect();else void knifeShop.refresh();});
  const inspectRunner=()=>{if(!settings.motion)return;runnerRoom?.inspect();$('runner-still').setAttribute('aria-pressed','true');$('runner-run').setAttribute('aria-pressed','false');};
  $('runner-inspect').addEventListener('click',inspectRunner);
  $('runner-turntable').addEventListener('keydown',e=>{if(e.code==='KeyF'){e.preventDefault();inspectRunner();}});
  for(const b of document.querySelectorAll('[data-runner-filter]'))b.addEventListener('click',()=>{runnerFilter=b.dataset.runnerFilter;renderRunners();});
  $('runner-left').addEventListener('click',()=>runnerRoom?.turn(-Math.PI/4));$('runner-right').addEventListener('click',()=>runnerRoom?.turn(Math.PI/4));
  for(const [id,pose]of [['runner-still','idle'],['runner-run','run']])$(id).addEventListener('click',()=>{runnerRoom?.setPose(pose);$('runner-still').setAttribute('aria-pressed',String(pose==='idle'));$('runner-run').setAttribute('aria-pressed',String(pose==='run'));});
  for(const id of ['runners','knives'])$('tab-'+id).addEventListener('click',()=>setLoadoutTab(id));
  document.querySelector('.loadout-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const target=e.key==='Home'?'runners':e.key==='End'?'knives':loadoutTab==='runners'?'knives':'runners';setLoadoutTab(target);$('tab-'+target).focus();});
  $('knife-list').addEventListener('click',e=>{const b=e.target.closest('[data-knife]');if(b)chooseKnife({knifeId:b.dataset.knife});});
  $('knife-finishes').addEventListener('click',e=>{const b=e.target.closest('[data-finish]');if(b)chooseKnife({finishId:b.dataset.finish});});
  $('use-knife').addEventListener('click',()=>{const selection=knifeRoom?.selection;if(!selection||!knifeDiscovered(selection.knifeId)||!knifeShop.owns(selection.finishId))return;Object.assign(settings,selection);hands.setKnife(settings);settings.equipment=2;hands.setEquipment(2,true);saveLoadout();audio.play('click');closeRunners();});
  $('knife-inspect').addEventListener('click',()=>{knifeRoom?.inspect();});
  $('buy-knife').addEventListener('click',async()=>{const id=knifeRoom?.selection.finishId;if(!id)return;try{await knifeShop.buy(id);text('knife-shop-status','Purchased. Available on all eight knives.');}catch{}renderKnives();});
  $('knife-refresh').addEventListener('click',()=>{if(!knifeShop.state.user)knifeShop.connect();else void knifeShop.refresh();});
  for(const b of document.querySelectorAll('[data-knife-filter]'))b.addEventListener('click',()=>{knifeFilter=b.dataset.knifeFilter;renderKnives();});
  $('knife-effects').value=settings.knifeEffects||'full';$('knife-effects').addEventListener('change',()=>{settings.knifeEffects=$('knife-effects').value;saveSettings(settings);});
  const turnKnife=(amount,tilt=0)=>{knifeAuto=false;knifeRoom?.turn(amount,tilt);updateKnifeControls();};
  $('knife-left').addEventListener('click',()=>turnKnife(-Math.PI/6));$('knife-right').addEventListener('click',()=>turnKnife(Math.PI/6));
  $('knife-auto').addEventListener('click',()=>{knifeAuto=!knifeAuto;updateKnifeControls();});
  const turntable=$('knife-turntable');
  turntable.addEventListener('pointerdown',e=>{if(e.button!==0||!knifeRoom)return;e.preventDefault();turntable.focus({preventScroll:true});knifeDrag={id:e.pointerId,x:e.clientX,y:e.clientY};turntable.setPointerCapture(e.pointerId);turntable.classList.add('dragging');knifeAuto=false;updateKnifeControls();});
  turntable.addEventListener('pointermove',e=>{if(!knifeDrag||e.pointerId!==knifeDrag.id)return;knifeRoom?.turn((e.clientX-knifeDrag.x)*.008,(e.clientY-knifeDrag.y)*.005);knifeDrag.x=e.clientX;knifeDrag.y=e.clientY;});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])turntable.addEventListener(name,()=>{knifeDrag=null;turntable.classList.remove('dragging');});
  turntable.addEventListener('keydown',e=>{if(e.code==='KeyF'){e.preventDefault();knifeRoom?.inspect();return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();turnKnife(e.key==='ArrowLeft'?-.2:e.key==='ArrowRight'?.2:0,e.key==='ArrowUp'?-.08:e.key==='ArrowDown'?.08:0);});
  $('runners').addEventListener('scroll',()=>{sizeKnifePreview();sizeRunnerPreview();},{passive:true});
  const runnerStage=$('runner-turntable');let runnerDrag=null;
  runnerStage.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();runnerStage.focus({preventScroll:true});runnerDrag={id:e.pointerId,x:e.clientX};runnerStage.setPointerCapture(e.pointerId);});
  runnerStage.addEventListener('pointermove',e=>{if(runnerDrag?.id!==e.pointerId)return;runnerRoom?.turn((e.clientX-runnerDrag.x)*.008);runnerDrag.x=e.clientX;});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])runnerStage.addEventListener(event,()=>runnerDrag=null);
  runnerStage.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();runnerRoom?.turn(e.key==='ArrowLeft'?-.2:.2);});
  for(const listId of ['runner-list','knife-list','knife-finishes'])$(listId).addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const buttons=[...$(listId).querySelectorAll('button')],at=buttons.indexOf(document.activeElement);if(at<0)return;e.preventDefault();buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(at+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length].focus();});
  $('skip-opening').addEventListener('click',()=>phase==='ending'?finishEnding():opening?.options?.social?multiplayer.open():finishOpening(true));$('opening-pause').addEventListener('click',()=>phase==='ending'?pauseEnding(!endingPaused):pauseOpening(!openingPaused));$('opening-menu').addEventListener('click',returnToMenu);renderRunners();renderKnives();
  $('choose-run').addEventListener('click',()=>{openCourseSelect();audio.play('click');});
  $('crossing-playtest').hidden=!LOCAL_PREVIEW;
  $('back-home').addEventListener('click',()=>{selectingCourse=false;show('course-select',false);show('menu-home',true);cinematicStart=clock;$('choose-run').focus();});
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
    selectedMode=button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===selectedMode)));
    setCourse(selectedCourse,true);audio.play('click');
  }));
  $('start-run').addEventListener('click',()=>startRun());
  $('abyss-new-climb').addEventListener('click',()=>{clearAbyssAttempt();startRun();});
  $('fullscreen-game').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen({keyboardLock:'browser'});$('fullscreen-game').textContent='EXIT FULLSCREEN';}
    catch{$('fullscreen-game').textContent='FULLSCREEN UNAVAILABLE HERE';}
  });
  $('resume').addEventListener('click',()=>phase==='opening'?pauseOpening(false):phase==='ending'?pauseEnding(false):resumeRun());
  $('pause-skip').addEventListener('click',()=>{show('pause',false);if(phase==='ending')finishEnding();else if(opening?.options?.social)multiplayer.open();else finishOpening(true);});
  $('capture-start').addEventListener('click',()=>requestCapture());
  for(const id of ['race-camera','crossing-camera-pause'])$(id).addEventListener('click',()=>{togglePlayerView();updateViewButtons();});
  $('crossing-shop').addEventListener('click',()=>{loadoutTab='knives';openRunners();});
  $('crossing-fps').addEventListener('click',()=>{crossingFrames=!crossingFrames;text('crossing-fps','FRAME RATE · '+(crossingFrames?'ON':'OFF'));});
  document.querySelectorAll('[data-crossing-time]').forEach(b=>b.addEventListener('click',()=>{if(!opening?.compCrossing)return;opening.airport.setTime(b.dataset.crossingTime==='live'?null:Number(b.dataset.crossingTime));opening.airport.update(opening.session);crossingBudget.reset();}));
  $('crossing-warp').addEventListener('click',()=>{if(!opening?.compCrossing)return;const route=opening.airport.parkour?.routes.find(r=>r.id===$('crossing-destination').value),spot=$('crossing-destination').value==='glider-loft'?opening.airport.abyssRelic.gliderPosition:$('crossing-destination').value==='relic-loft'?opening.airport.abyssRelic.position:null,p=LOCAL_PREVIEW&&$('crossing-destination').value==='glider-flight'?{x:-20,y:150,z:30,yaw:0}:spot?{x:spot.x,y:spot.y-.9,z:spot.z+.8}:route?.start||opening.airport.layout.spawn;opening.session.respawn={...p};opening.session.reset();opening.session.player.yaw=p.yaw??0;if(LOCAL_PREVIEW&&$('crossing-destination').value==='glider-flight'){opening.session.hasGlider=true;Object.assign(opening.session.player,{grounded:false,vz:-24,gliding:true});}crossingBudget.reset();pauseOpening(false);});
  canvas.addEventListener('click',()=>{if(awaitingCapture&&!modalOpen())requestCapture();});
  $('restart').addEventListener('click',()=>retryCurrentRun());
  $('leave-run').addEventListener('click',returnToMenu);
  $('result-retry').addEventListener('click',()=>course.id==='reposcape'&&LOCAL_PREVIEW?retryCurrentRun():startRun(0,true));
  $('result-menu').addEventListener('click',returnToMenu);
  $('result-next').addEventListener('click',()=>{const next=COURSES[COURSES.findIndex(c=>c.id===selectedCourse)+1];if(next){setCourse(next.id);startRun(0);}else{returnToMenu();openCourseSelect();}});
  $('result-howto').addEventListener('click',()=>activateModal('howto'));
  $('open-settings').addEventListener('click',()=>openSettings('menu'));
  $('pause-settings').addEventListener('click',()=>openSettings('pause'));
  $('close-settings').addEventListener('click',closeSettings);$('settings-done').addEventListener('click',closeSettings);
  $('open-howto').addEventListener('click',()=>activateModal('howto'));$('close-howto').addEventListener('click',()=>closeModal('howto'));$('howto-done').addEventListener('click',()=>closeModal('howto'));
  for(const id of ['volume','musicVolume','effectsVolume','sensitivity','fov','viewFov']){$(id).value=settings[id];$(id).addEventListener('input',()=>{settings[id]=Number($(id).value);applySettings();});}
  $('quality').value=settings.quality;$('quality').addEventListener('change',()=>{settings.quality=$('quality').value;applySettings();});
  for(const id of ['motion','headBob','motionBlur','runningShake','autoSprint','invertY','controlHints','cinematicCaptions']){$(id).checked=settings[id];$(id).addEventListener('change',()=>{settings[id]=$(id).checked;applySettings();});}
  $('ghost-mode').value=settings.ghostMode;$('ghost-mode').addEventListener('change',()=>{settings.ghostMode=$('ghost-mode').value;settings.ghost=settings.ghostMode!=='off';applySettings();selectGhost();});
  applySettings();selectGhost();
}
let appliedQuality,appliedHeadBob,appliedRunningShake;
function applySettings(){
  document.body.dataset.controlHints=String(settings.controlHints);document.body.dataset.cinematicCaptions=String(settings.cinematicCaptions);if(!settings.controlHints){text('context-hint','');$('context-hint').classList.remove('visible');}
  if(appliedHeadBob!==settings.headBob||appliedRunningShake!==settings.runningShake){cameraImmersion.reset();appliedHeadBob=settings.headBob;appliedRunningShake=settings.runningShake;}
  if(!settings.motionBlur)cameraBlur.reset();
  text('volume-value',settings.volume+'%');text('sensitivity-value',settings.sensitivity.toFixed(2));text('fov-value',settings.fov+'°');text('viewFov-value',settings.viewFov+'°');text('musicVolume-value',settings.musicVolume+'%');
  text('effectsVolume-value',settings.effectsVolume+'%');audio.setEffectsVolume(settings.effectsVolume/100);
  audio.setVolume(settings.volume/100);audio.setMusicVolume(settings.musicVolume/100);if(renderer&&appliedQuality!==settings.quality){appliedQuality=settings.quality;autoResolution=1;renderer.setPixelRatio(Math.min(devicePixelRatio||1,settings.quality==='ultra'?2:settings.quality==='performance'?1:1.5));world?.setQuality(settings.quality);placeRenderer.setQuality(settings.quality);opening?.setQuality?.(settings.quality);crossingBudget.reset();resize();}
  saveSettings(settings);
}
function openSettings(from){selectGhost();settingsFrom=from;activateModal('settings');}
function closeSettings(){closeModal('settings');if(settingsFrom==='pause')$('resume').focus();}

function inputFrame(){return movementInput(keys,settings,lookYaw,lookPitch,inputs);}
function clearInputs(){runnerSocial?.cancel();keys.clear();lookBack=false;inputs={jumpSeq:0,slideSeq:0,interactSeq:0};}
function requestCapture(quiet=false){
  captureWanted=true;
  if(document.pointerLockElement===canvas){locked=true;capturePrompt(false);return;}
  if(capturePending)return;
  const generation=++captureGeneration,requestedPhase=phase;capturePending=true;
  const failed=()=>{if(generation!==captureGeneration)return;capturePending=false;
    if(LOCAL_PREVIEW&&(opening?.compCrossing||phase==='playing')&&captureWanted){dragLook=true;locked=true;capturePrompt(false);show('pause',false);if(phase==='opening'){openingPaused=false;opening.resume();opening.session.say('WASD · move   Drag · look   Esc · pause',5);}else{paused=false;toast('WASD · move   Drag · look   V · camera   Esc · pause',5);}canvas.focus();return;}
    if(!quiet&&captureWanted&&phase===requestedPhase&&(phase==='playing'||phase==='opening'&&opening?.airportLobby))capturePrompt(true);
  };
  if(!canvas.requestPointerLock){failed();return;}
  try{const result=canvas.requestPointerLock();result?.then?.(()=>{if(generation===captureGeneration)capturePending=false;},failed);}
  catch{failed();}
}
function rememberAttempt(){
 if(phase!=='playing'||!race||!motion||!course||course.climb)return;
 attemptGhost.observe(race,motion);recordAttempt(course,race.mode,race,attemptGhost.replay(runFrames));
}
addEventListener('pagehide',rememberAttempt);
addEventListener('pagehide',suspendAbyss);
async function startRun(section=0,quick=false,online=false,practice=false){
  const abyssResume=course?.climb&&!online&&!quick?loadAbyssAttempt(course):null;
  if(course?.climb&&!online&&quick)clearAbyssAttempt();
  if(multiplayer?.joined&&!online){multiplayer.open();return;}
  if(preparingWorld)return;
  // Preserve the RUN click before shader preparation consumes its user gesture.
  requestCapture(true);
  rememberAttempt();attemptGhost.reset();raceCamera.reset();
  if(runnerSocial?.prepare(world.scene))world.graphicsPrepared=false;
  if(!world.graphicsPrepared){
   preparingWorld=true;const loading=document.createElement('div');loading.id='graphics-loading';loading.setAttribute('role','status');loading.style.cssText='position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-end;padding:50px;background:#080c17eb;color:#d8d3c3;font:400 13px Arial;letter-spacing:.04em';loading.textContent='Preparing course';document.body.append(loading);
   try{await prepareWorldGraphics(renderer,world,camera,status=>loading.textContent=status);world.graphicsPrepared=true;}
   catch(error){cancelCapture();document.exitPointerLock?.();console.error('Course preparation failed',error);text('selected-course-note','Course preparation was interrupted. Select RUN to try again.');text('result-note','Course preparation was interrupted. Select RETRY to try again.');return;}
   finally{loading.remove();preparingWorld=false;framePrevious=performance.now();}
  }
  onlineRun=online;onlineClock.reset();
  ending?.dispose();ending=null;endingPaused=false;attachGameplayCamera(camera,world);
  if(!renderer||!world)return;
  opening?.dispose();opening=null;openingView=null;attachGameplayCamera(camera,world);show('opening',false);document.body.classList.remove('opening-view');
  audio.selectCourse(course.climb&&!online&&!quick&&!abyssResume?'crossing-abyss-opening':course.id==='last-draft'&&!quick&&!online?'last-draft-intro':course.id,true);void audio.start();audio.setVolume(settings.volume/100);audio.setMusicVolume(settings.musicVolume/100);
  for(const id of ['menu','result','pause','settings','howto'])show(id,false);
  show('hud',true);show('countdown',true);show('toast',false);$('section-banner').classList.remove('visible');
  world.reset(practice?section:0);placeInterface.reset();reverseInterface.reset();placeRenderer.reset();clearInputs();hands.setRunnerStyle(selectedRunner());race=createRace(course,selectedMode,section,online?onlineRules:practice?'practice':'one-life');motion=createMotionState(spawnForSection(course,practice?section:0));hands.reset();wallStride.reset();cameraImmersion.reset();cameraBlur.reset();
  lookYaw=motion.yaw;lookPitch=-.04;motion.pitch=lookPitch;phase='playing';paused=false;race.status='ready';completionShown=false;
  if(online){onlinePrevious={};onlineRestart=false;onlineEngine=new VerifiedRaceEngine(course,world,selectedMode,onlineRules);race=onlineEngine.race;motion=onlineEngine.player;lookYaw=motion.yaw;race.status='ready';}
  countdown=quick?.6:2.6;lastCount=-1;accumulator=0;cameraEye=1.63;cameraImpact=0;slidePulse=0;gameVisualTime=0;ghostClock=0;hudClock=0;
  toastUntil=0;bannerUntil=0;contextUntil=0;runFrames=[[0,motion.x,motion.y,motion.z,motion.yaw]];selectGhost();resultRecord=null;
  ghostActor.visible=false;light.intensity=torchOn?6:0;
  if(abyssResume){runFrames=[];race=abyssResume.race;motion=abyssResume.player;motion._seen={jumpSeq:0,slideSeq:0,interactSeq:0};world.theatreMechanisms.restore(abyssResume.mechanisms);race.status='running';lookYaw=motion.yaw;lookPitch=motion.pitch||0;gameVisualTime=race.time;countdown=0;show('countdown',false);}
  abyssRestartHold=0;abyssSavedAt=clock;
  text('hud-course',`${courseLabel(course.id)} · ${course.title.toUpperCase()}`);text('hud-mode',course.climb?'THE CLIMB':practice?'PRACTICE · UNRANKED':MODES[selectedMode].title.toUpperCase());
  const best=(race.ruleset==='race'?loadRaceRecords():loadRecords())[`${course.id}:${selectedMode}`];text('hud-best',best?'BEST '+formatTime(best.time):'BEST —');
  $('section-dots').innerHTML=course.sections.map((_,i)=>`<i class="${i<=race.section?'active':''}"></i>`).join('');
  framePrevious=performance.now();updateHUD(true);if(online){countdown=Math.max(.001,(onlineStartAt-multiplayer.serverNow())/1000);capturePrompt(!locked);}else if(quick||abyssResume){capturePrompt(!locked);requestCapture();}else beginOpening();
}
function retryCurrentRun(){const practice=race?.ruleset==='practice';return startRun(practice?race.checkpoint:0,true,false,practice);}
function respawnPractice(){const section=race.checkpoint,time=race.time,deaths=race.deaths+1;world.reset(section);placeInterface.reset();reverseInterface.reset();audio.reverseSounds.reset();clearInputs();race=createRace(course,selectedMode,section,'practice');race.time=time;race.deaths=deaths;race.status='running';motion=createMotionState(spawnForSection(course,section));lookYaw=motion.yaw;lookPitch=0;hands.reset();cameraImmersion.reset();runFrames=[];ghostFrames=[];toast('PRACTICE · CHECKPOINT RESPAWN',1.6);sectionBanner(section);}
function pauseRun(note='Your run and the pursuer are paused.'){
  if(phase!=='playing')return;suspendAbyss();if(course.climb)note='Your current footing is held. Continue when you are ready.';paused=true;cancelCapture();void protectGameKeys(false);keys.clear();lookBack=false;pausePanel();text('pause-note',onlineRun?'The race is still running. Resume to keep moving.':note);void audio.suspend();$('resume').focus();
}
function resumeRun(){if(phase!=='playing')return;paused=false;show('pause',false);framePrevious=performance.now();void audio.start();capturePrompt(!locked);requestCapture();}
function returnToMenu(){
  suspendAbyss();abyssInterface.hide();
  crossingLoadout=false;document.body.classList.remove('crossing-view');if(crossingFrameNode)crossingFrameNode.hidden=true;
  cancelCapture();
  rememberAttempt();
  if(multiplayer?.joined){if(race)multiplayer.finish({...race,status:'abandoned'});multiplayer.leave();return;}
  onlineRun=false;multiplayer?.hideHUD();
  ending?.dispose();ending=null;endingPaused=false;attachGameplayCamera(camera,world);
  opening?.dispose();opening=null;openingView=null;disposeLoadout();show('opening',false);show('runners',false);document.body.classList.remove('opening-view','runner-view','knife-view');
  phase='menu';paused=false;locked=false;clearInputs();wallStride.reset();document.exitPointerLock?.();
  void protectGameKeys(false);
  for(const id of ['hud','pause','result','settings'])show(id,false);show('menu',true);
  ghostActor.visible=false;world.reset();audio.stop();menuMusic();firstPerson.visible=false;light.intensity=0;renderCourses();cinematicStart=clock;
}
function toast(message,duration=2){text('toast','');show('toast',false);toastUntil=0;}
function sectionBanner(section){$('section-banner').classList.remove('visible');bannerUntil=0;}

function bindInput(){
  document.addEventListener('fullscreenchange',()=>{
    void protectGameKeys(locked&&phase==='playing'&&!paused);
    $('fullscreen-game').textContent=document.fullscreenElement?'EXIT FULLSCREEN':'FULLSCREEN';
  });
  document.addEventListener('pointerlockchange',()=>{
    const wasLocked=locked;locked=document.pointerLockElement===canvas||dragLook;capturePending=false;
    if(locked&&!captureWanted){document.exitPointerLock?.();return;}
    if(locked){capturePrompt(false);framePrevious=performance.now();
      if(phase==='playing'){paused=false;show('pause',false);void audio.start();void protectGameKeys(true);}
    }else if(wasLocked){
      clearInputs();
      if(phase==='playing'&&!completionShown&&!preparingWorld&&!multiplayer?.visible&&!repoAtlas?.isOpen)pauseRun();
      else if(phase==='opening'&&opening?.airportLobby&&!openingPaused&&!multiplayer?.visible)pauseOpening(true);
    }
  });
  document.addEventListener('pointerlockerror',()=>{capturePending=false;});
  document.addEventListener('mousemove',e=>{
    if(dragLook&&!dragHeld)return;
    if(locked&&phase==='opening'&&opening?.airportLobby&&!openingPaused){opening.look(e.movementX,e.movementY);return;}
    if(!locked||paused||phase!=='playing')return;
    lookYaw-=e.movementX*.0021*settings.sensitivity;
    lookPitch=clamp(lookPitch-e.movementY*.0021*settings.sensitivity*(settings.invertY?-1:1),-1.45,1.45);
  });
  document.addEventListener('keydown',e=>{
    if(multiplayer?.visible)return;
    if(e.code==='Escape'){
      if(!$('settings').classList.contains('hidden')){e.preventDefault();closeSettings();return;}
      if(!$('howto').classList.contains('hidden')){e.preventDefault();closeModal('howto');return;}
      if(phase==='ending'){e.preventDefault();pauseEnding(!endingPaused);return;}
      if(phase==='opening'){e.preventDefault();pauseOpening(!openingPaused);return;}
      if(phase==='runners'){e.preventDefault();closeRunners();return;}
      if(phase==='playing'&&!paused){pauseRun();document.exitPointerLock?.();return;}
      if(!$('settings').classList.contains('hidden')){e.preventDefault();closeSettings();return;}
      if(!$('howto').classList.contains('hidden')){closeModal('howto');return;}
      if(phase==='playing'&&paused&&!modalOpen()){e.preventDefault();resumeRun();return;}
      if(phase==='menu'&&selectingCourse){selectingCourse=false;show('course-select',false);show('menu-home',true);$('choose-run').focus();return;}
    }
    if(phase==='ending'){if(e.code==='Tab')trapFocus(e);if(e.code==='Space'&&!e.repeat&&!endingPaused){e.preventDefault();finishEnding();}return;}
    if(phase==='opening'&&opening?.airportLobby){if(e.code==='Tab')trapFocus(e);if(locked&&!openingPaused){keys.add(e.code);if(!e.repeat){opening.terminalKey(e.code);if(e.code==='KeyV')saveSettings(settings);}if(isGameplayShortcut(e,true))e.preventDefault();if(e.code==='KeyF'&&!e.repeat)hands.inspect();if(/^Digit[123]$/.test(e.code)){settings.equipment=Number(e.code.slice(-1))-1;hands.setEquipment(settings.equipment);saveSettings(settings);}}return;}
    if(phase==='opening'){if(e.code==='Tab')trapFocus(e);if(e.code==='Space'&&!e.repeat&&!openingPaused){e.preventDefault();finishOpening(true);}return;}
    if(e.code==='Tab'&&(modalOpen()||phase==='runners'||paused||phase==='result')){trapFocus(e);return;}
    if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
    if(e.code==='KeyR'&&!e.repeat&&(phase==='result'||phase==='playing'&&!modalOpen())){e.preventDefault();if(course.climb&&phase==='playing'){keys.add('KeyR');return;}if(onlineRun&&phase==='playing'){onlineRestart=true;return;}(course.id==='reposcape'&&LOCAL_PREVIEW?retryCurrentRun():startRun(0,true));return;}
    if(!locked||paused||phase!=='playing')return;
    if(isGameplayShortcut(e,true))e.preventDefault();
    keys.add(e.code);if(e.repeat)return;
    if(e.code==='KeyV'){togglePlayerView();return;}
    if(e.code==='Space')inputs.jumpSeq++;
    if(['KeyC','ControlLeft','ControlRight'].includes(e.code))inputs.slideSeq++;
    if(e.code==='KeyE')inputs.interactSeq++;
    if(/^Digit[123]$/.test(e.code)){
      settings.equipment=Number(e.code.slice(-1))-1;
      hands.setEquipment(settings.equipment);saveSettings(settings);
      toast(['BARE HANDS','WARDEN · UNLOADED',getKnifeSpec(settings.knifeId).name.toUpperCase()+' · KNIFE'][settings.equipment],1.2);
    }
    if(e.code==='KeyF')hands.inspect();
    if(e.code==='KeyT'){torchOn=!torchOn;light.intensity=torchOn?6:0;audio.play('click');}
    // X and Q deliberately have no action in either grounded or airborne state.
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  canvas.addEventListener('mousedown',()=>dragHeld=true);document.addEventListener('mouseup',()=>dragHeld=false);
  document.addEventListener('mousedown',e=>{if(e.button===0&&locked&&phase==='opening'&&!openingPaused)opening?.terminalPointer?.(true);if(e.button===2&&locked&&phase==='playing'&&!paused)lookBack=true;});
  document.addEventListener('mouseup',e=>{if(e.button===0)opening?.terminalPointer?.(false);if(e.button===2)lookBack=false;});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('blur',()=>{if(preparingWorld||!locked)return;if(phase==='opening'&&opening?.airportLobby&&!multiplayer?.visible)pauseOpening(true);if(phase==='playing'){pauseRun();document.exitPointerLock?.();}});
  document.addEventListener('visibilitychange',()=>{if(['opening','ending'].includes(phase)){framePrevious=performance.now();clearInputs();if(document.hidden)void audio.suspend();else if(!(phase==='opening'?openingPaused:endingPaused))void audio.start();}if(document.hidden&&phase==='playing'&&!preparingWorld&&locked){pauseRun();document.exitPointerLock?.();}if(phase==='result'){if(document.hidden)audio.soundtrack.pause();else audio.soundtrack.play();}if(['menu','runners'].includes(phase)){if(document.hidden)audio.soundtrack.pause();else menuMusic();}});
  window.addEventListener('resize',resize);
}
function trapFocus(e){const modal=['settings','howto','unsupported','pause','result','runners','opening'].map($).find(el=>!el.classList.contains('hidden'));if(!modal)return;const els=[...modal.querySelectorAll('button,a,input,select,summary,[tabindex="0"]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length),first=els[0],last=els.at(-1);if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){e.preventDefault();first?.focus();}}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer?.setSize(innerWidth,innerHeight,false);sizeKnifePreview();sizeRunnerPreview();}

function respawnRace(){
  const elapsed=Math.max(race.time,(Date.now()+onlineOffset-onlineStartAt)/1000),deaths=race.deaths+1,valid=race.validRecord;
  world.reset();placeInterface.reset();reverseInterface.reset();race=createRace(course,selectedMode,0,'race');race.time=elapsed;race.deaths=deaths;race.validRecord=valid;race.status='running';
  motion=createMotionState(spawnForSection(course,0));lookYaw=motion.yaw;lookPitch=-.04;hands.reset();wallStride.reset();cameraImmersion.reset();cameraBlur.reset();cameraEye=1.63;cameraImpact=0;slidePulse=0;chuteHeading=null;chuteBank=0;gameVisualTime=elapsed;accumulator=0;countdown=0;
  const t=+elapsed.toFixed(3);if(runFrames.at(-1)?.[0]===t)runFrames.pop();runFrames.push([t,motion.x,motion.y,motion.z,motion.yaw]);
  multiplayer?.respawn();toast('BACK TO THE START · KEEP RACING',1.5);updateHUD(true);
}
async function finishRun(){
  if(race?.status==='dead'&&race.ruleset==='practice'){respawnPractice();return;}
  audio.stopSliding();
  rememberAttempt();
  if(onlineRun&&race.ruleset==='race'&&race.status==='dead'&&race.validRecord){respawnRace();return;}
  void protectGameKeys(false);
  if(completionShown)return;cancelCapture();completionShown=true;phase='result';paused=false;clearInputs();document.exitPointerLock?.();
  show('countdown',false);show('pause',false);show('result',true);$('section-banner').classList.remove('visible');
  let won=race.status==='finished';
  if(onlineRun){const finishing=race;text('result-title','Checking race result…');text('result-note','The server is replaying the recorded movement.');text('result-time',formatTime(race.time));show('runner-reward',false);text('result-retry','RACE ROOM');
   const verified=await multiplayer.finish(race,motion);if(race!==finishing||phase!=='result')return;
   if(won&&verified.verified){race.time=race.finishTime=verified.time;race.proof=verified.proof;}
   else if(won){won=false;race.status='unverified';race.validRecord=false;race.reason=verified.reason||'This result could not be verified.';}
  }
  text('result-retry',multiplayer?.joined?'RACE ROOM':'RETRY ↗');
  show('runner-reward',false);$('equip-reward').disabled=false;
  text('result-kicker',course.title);
  text('result-title',course.climb&&won?'Home.':raceResultTitle(race,won));
  text('result-note',won?(race.ruleset==='race'?`${race.deaths} restarts · Total race time · No pursuer`:course.ending):race.reason);
  text('result-time',formatTime(race.time));text('result-progress',`${Math.min(100,Math.round(race.furthest/course.route.at(-1).s*100))}%`);text('result-embers',`${race.collected.length} / ${course.collectables.length}`);
  show('result-medal',won);text('result-medal',getMedal(course,race.time).toUpperCase()+(getMedal(course,race.time)==='finish'?'ER':' MEDAL'));
  text('record-note',won?MODES[selectedMode].title.toUpperCase()+' COMPLETE':'');
  text('result-technique',`${race.jumps} JUMPS · ${race.bounces} BOUNCES · ${(race.topSpeed||0).toFixed(1)} M/S PEAK`);
  if(won){const t=+race.finishTime.toFixed(3);if(!(course.finale&&race.ruleset!=='race'&&runFrames.at(-1)?.[0]===t)){while(runFrames.at(-1)?.[0]>=t)runFrames.pop();runFrames.push([t,+motion.x.toFixed(3),+motion.y.toFixed(3),+motion.z.toFixed(3),+motion.yaw.toFixed(3)]);}resultRecord=course.climb?recordAbyssCompletion(course,race):recordRun(course,selectedMode,race,runFrames);{if(resultRecord.practice)text('record-note','PRACTICE COMPLETE · NO RECORDS OR REWARDS');else if(!resultRecord.saved)text('record-note','Run complete. This browser could not save the record.');else if(resultRecord.isBest)text('record-note','NEW PERSONAL BEST');}
   if(resultRecord.unlockedRunnerId){const reward=RUNNERS.find(r=>r.id===resultRecord.unlockedRunnerId);text('runner-reward-name',reward.name);text('runner-reward-note',resultRecord.progressSaved?'YOURS TO KEEP · AVAILABLE IN RUNNERS & KNIVES':'UNLOCKED FOR THIS SESSION · BROWSER STORAGE UNAVAILABLE');text('equip-reward','EQUIP RUNNER →');show('runner-reward',true);}
   audio.play('finish');}
  else if(race.status==='dead'){audio.play('death');cameraImpact=.9;}
  if(course.climb){text('result-technique',`${Math.round(course.abyss.topY)} METRES CLIMBED · ${race.falls} FALLS · ${Math.round(race.largestFall)} m BIGGEST FALL`);if(won){if(!onlineRun)clearAbyssAttempt();text('record-note','THE CROSSING REACHED');text('result-medal','HOME AGAIN');}}
  const next=COURSES[COURSES.findIndex(c=>c.id===course.id)+1];
  text('result-next',next?(courseGroup(course.id).id==='tutorial'&&courseGroup(next.id).id==='campaign'?'START THE CAMPAIGN →':`NEXT ${courseGroup(next.id).id.toUpperCase()} LEVEL →`):'CHOOSE A LEVEL →');
  show('result-next',won&&!multiplayer?.joined);show('result-howto',!won);
  if(won&&race.ruleset!=='race'&&race.ruleset!=='practice'){ending=course.climb?new CrossingAbyssEnding(world,{...settings,player:motion}):createEscapeEnding(course.id,equippedRunner(),{...settings,surfaceSets,placeWorld:world});if(course.climb)audio.selectCourse('crossing-abyss-home',true);if(ending){
   phase='ending';endingTime=0;endingPaused=false;endingBeat='';show('result',false);show('hud',false);show('opening',true);document.body.classList.add('opening-view');
   text('opening-title',course.title.toUpperCase());text('opening-chapter','ESCAPED');text('opening-pause','PAUSE');framePrevious=performance.now();canvas.focus();return;
  }}
  $('result-retry').focus();
}
function finishEnding(){
 if(phase!=='ending')return;ending?.dispose();ending=null;endingPaused=false;attachGameplayCamera(camera,world);phase='result';show('pause',false);show('opening',false);show('result',true);document.body.classList.remove('opening-view');$('cinematic-shutter').style.opacity=0;audio.soundtrack.play();$('result-retry').focus();
}
function pauseEnding(value){if(phase!=='ending')return;endingPaused=value;if(value){pausePanel(true);text('pause-note','The cinematic is paused.');void audio.suspend();}else{show('pause',false);framePrevious=performance.now();void audio.start();}}
function physicsTick(dt){

  if(countdown>0){countdown=onlineRun?(onlineStartAt-multiplayer.serverNow())/1000:countdown-dt;const n=Math.ceil(countdown);if(n!==lastCount&&n>0){text('countdown-number',Number.isFinite(n)?n:'LOADING');audio.play('countdown',{number:n});lastCount=n;}if(countdown<=0){race.status='running';if(race.ruleset!=='practice'&&course.onlineReady!==false)dispatchEvent(new CustomEvent('comp-run-started',{detail:{courseId:course.id,mode:race.mode,season:(race.ruleset==='race'?'race:':'')+RECORD_SEASONS[course.id],version:runVersionForCourse(course.id)}}));show('countdown',false);sectionBanner(race.section);if(firstRun){toast('KEEP YOUR LEAD · READ THE NEXT LANDING',4);firstRun=false;}audio.play(course.climb||course.id==='the-reverse'?'checkpoint':course.id==='no-such-place'?'place-command':course.id==='world-war-r'?'battle-blast':course.id==='reposcape'?'checkpoint':'roar');}return;}
  if(onlineRun){
   const recovering=onlineClock.recovering(onlineEngine.ticks),active=!recovering&&!paused&&locked&&!modalOpen();
   const liveInput={...inputFrame(),jumpHeld:keys.has('Space'),interactHeld:keys.has('KeyE'),restart:onlineRestart};
   const input=active?liveInput:neutralRaceInput({...liveInput,yaw:motion.yaw,pitch:motion.pitch},onlinePrevious);if(active)onlineRestart=false;
   const bytes=encodeRaceFrame(input,onlinePrevious);multiplayer.frame(bytes);const step=onlineEngine.step(bytes);race=onlineEngine.race;motion=onlineEngine.player;lookYaw+=step.yawDelta;
   for(const e of step.events){if(e.kind==='reverse-shift'||e.kind==='reverse-blocked'){reverseFeedback(e);continue;}if(e.kind==='place-command'){placeInterface.onEvent(e,race.time);continue;}hands.event(e);movementSound(e);if(e.kind==='checkpoint')sectionBanner(e.section);if(e.kind==='respawn'){lookYaw=motion.yaw;lookPitch=-.04;hands.reset();cameraImmersion.reset();multiplayer.respawn();toast('BACK TO THE START',1.2);}}
   ghostClock+=dt;if(!course.climb&&ghostClock>=.05){ghostClock=0;runFrames.push([+race.time.toFixed(3),+motion.x.toFixed(3),+motion.y.toFixed(3),+motion.z.toFixed(3),+motion.yaw.toFixed(3)]);}
   if(['finished','dead'].includes(race.status))void finishRun();return;
  }
  if(race.status==='finale'){
    const before=race.finaleTime;
    const complete=advanceFinale(race,course,dt,keys.has('Space')&&race.finaleTime>.6);
    if(before<4&&race.finaleTime>=4){audio.play('collapse',{intensity:1});audio.play('roar',{intensity:1});}
    if(complete.length){Object.assign(motion,course.finale.landing,{vx:0,vy:0,vz:0,grounded:true});finishRun();}
    return;
  }
  if(race.awaitingChain&&keys.has('KeyE')&&grabFinaleChain(race,course,motion)){runFrames.push([+race.time.toFixed(3),+motion.x.toFixed(3),+motion.y.toFixed(3),+motion.z.toFixed(3),+motion.yaw.toFixed(3)]);audio.play('rope-grab');toast('THE ANCHOR FALLS · SPACE TO SKIP',4);return;}
  const mechanismEvents=world.stepMechanics(dt,motion,race);
  for(const e of mechanismEvents){
    if(course.climb&&e.encounterId){
      const d=world.creatures?.states?.find(q=>q.d.id===e.encounterId)?.d,origin=d?.anchor||d?.target||motion;
      const dx=origin.x-motion.x,dz=origin.z-motion.z,distance=Math.hypot(dx,dz),pan=clamp((dx*Math.cos(motion.yaw)-dz*Math.sin(motion.yaw))/Math.max(1,distance),-.85,.85);
      const cue=e.kind==='warning'?'abyss-creature-warning':e.kind;
      audio.play(cue,{intensity:(e.intensity??.6)*clamp(1-distance/75,.3,1),pan,creature:e.creature||d?.kind});
      if(e.kind==='abyss-creature-hit'){cameraImpact=Math.max(cameraImpact,.34);hands.event({kind:'land',intensity:.7});world.burst(motion.x,motion.y,motion.z,18);}
    }else if(e.kind==='place-command')placeInterface.onEvent(e,race.time);
    else audio.play(e.kind,{intensity:e.intensity??.6,theme:world.theme});
  }
  lookYaw+=(world.skateboard?.yawDelta||0)+(world.theatreMechanisms?.yawDelta||0);
  const frameInput=onlineRun&&(paused||!locked)?{...inputFrame(),moveX:0,moveZ:0,sprint:false}:inputFrame();
  for(const event of world.beforeMovement?.(motion,race,frameInput,dt)||[])reverseFeedback(event);
  const events=world.higherGroundMechanics?.movePlayer(motion,frameInput,dt)??world.theatreMechanisms?.movePlayer(motion,frameInput,dt)??world.skateboard?.movePlayer(motion,frameInput,dt)??stepMovement(motion,frameInput,dt,world.geometryFor(motion));
  world.skateboard?.afterMove(motion,race);world.theatreMechanisms?.afterMove(motion,race);world.ruptureEffects?.onMovement(events,motion,race);
  for(const event of events){
    hands.event(event);
    if(event.kind==='jump'){race.jumps++;audio.play('jump');}
    if(event.kind==='canopy-open')audio.play('canopy-open');if(event.kind==='tension-load'||event.kind==='tension-release')audio.play(event.kind,{intensity:event.intensity});
    if(event.kind==='branch-release')audio.play('branch-release',{intensity:.8});
    if(event.kind==='slide'){race.slides++;slidePulse=1;audio.play('slide');}
    if(event.kind==='slide-chute'){race.slides++;slidePulse=1;audio.play('slide');}
    if(event.kind==='wall-run')audio.play('slide');
    if(event.kind==='wall-kick'){race.jumps++;audio.play('jump');}
    if(event.kind==='land'){cameraImpact=Math.max(cameraImpact,event.intensity*.38);audio.play('land',{intensity:event.intensity});}
    if(event.kind==='bounce'){race.bounces++;if(event.quality==='perfect')race.perfectBounces++;cameraImpact=Math.max(cameraImpact,.18);slidePulse=.8;audio.play('bounce',{intensity:event.intensity||.8});world.burst(motion.x,motion.y,motion.z,12);toast(event.quality==='perfect'?'PERFECT REBOUND':event.quality==='weak'?'LOW REBOUND · LAND WITH MORE SPEED':'REBOUND · CARRY THE MOMENTUM',1.1);}
    if(event.kind==='rope-grab'){race.swings++;audio.play('rope-grab');}
    if(event.kind==='zipline'){race.ziplines++;movementSound(event);}
    if(event.kind==='release'){audio.play('release');if(course.traversals.find(d=>d.id===event.id)?.rideStyle==='coaster'){audio.play('collapse',{intensity:.85});cameraImpact=Math.max(cameraImpact,.75);}}
    if(event.kind==='head-hit')audio.play('head-hit',{intensity:.3});
    if(event.kind==='crushed'){race.status='dead';race.reason='The world closed around you.';finishRun();return;}
    if(event.kind==='unsafe-landing'){audio.play('land-damage');race.status='dead';race.reason=course.theme==='kitchen'?'You lost the trail. Keep to the flour-marked landings.':course.theme==='house'?'The furniture gave way. Follow the worn edges towards daylight.':course.theme==='theatre'?'You fell into the scenery. Follow the worn stage marks and warm footlights.':course.theme==='rupture'?'The structure gave way. Follow the worn safety paint and lit maintenance landings.':course.theme==='greenhouse'?'The landing gave way. Follow the worn roots, pale leaves and warm lanterns.':course.theme==='playground'?'The scenery gave way. Land on the yellow-edged pads.':'Loose masonry gave way. Stay on the marked route.';finishRun();return;}
  }
  const raceEvents=updateRace(race,course,motion,dt);
  for(const event of raceEvents){
    if(event.kind==='climb-stratum')audio.play('checkpoint',{intensity:.25});
    if(event.kind==='crown'){toast('JUMP + HOLD E · GRAB THE HANGING CHAIN',6);audio.play('roar',{intensity:.8});}
    if(event.kind==='checkpoint'){sectionBanner(event.section);audio.play('checkpoint');}
    if(event.kind==='collect'){audio.play('checkpoint',{intensity:.45});toast(`${course.id==='on-the-menu'?'CHEESE':'RELIC'} ${race.collected.length} / ${course.collectables.length}`,1.15);}
    if(event.kind==='death'&&race.ruleset==='practice'){respawnPractice();return;}if(event.kind==='finish'||event.kind==='death'){finishRun();return;}
  }
  ghostClock+=dt;
  if(ghostClock>=.05&&race.validRecord&&!course.climb){ghostClock=0;runFrames.push([+race.time.toFixed(3),+motion.x.toFixed(3),+motion.y.toFixed(3),+motion.z.toFixed(3),+motion.yaw.toFixed(3)]);}
}
function updateGhost(){
  if(!ghostActor)return;
  const visible=!course.climb&&race?.ruleset!=='practice'&&settings.ghost&&phase==='playing'&&race?.status==='running'&&ghostFrames.length>1&&race.time<=ghostFrames.at(-1)[0];
  ghostActor.visible=visible;if(!visible){world.updateGhostVisuals?.(null);return;}
  const sample=sampleGhost(ghostFrames,race.time);
  if(!sample){ghostActor.visible=false;world.updateGhostVisuals?.(null);return;}
  ghostActor.position.fromArray(sample.position);ghostActor.rotation.y=sample.yaw;
  const distance=ghostActor.position.distanceTo(new THREE.Vector3(motion.x,motion.y,motion.z));
  const opacity=.085*sample.fade*THREE.MathUtils.smoothstep(distance,1.4,6);
  ghostActor.userData.material.opacity=opacity;ghostActor.visible=opacity>.002;
  world.updateGhostVisuals?.(ghostActor.visible?{time:race.time,position:ghostActor.position,previous:sample.previous,next:sample.next,discontinuity:false}:null);
  ghostActor.userData.animate?.(race.time);ghostActor.userData.limbs.forEach((l,i)=>l.rotation.x=Math.sin(race.time*12+(i<2?0:Math.PI))*.6*(i%2?-1:1));

}
function updateCamera(dt){
  if(phase==='opening'||phase==='ending'||phase==='runners')return;
  if(phase==='menu'){
    firstPerson.visible=false;
    if(!LOCAL_PREVIEW&&!selectingCourse&&!modalOpen()&&clock-cinematicStart>51){const i=(COURSES.findIndex(c=>c.id===selectedCourse)+1)%COURSES.length;setCourse(COURSES[i].id);}
    const shot=world.cinematic(settings.motion?clock-cinematicStart:5);
    camera.position.set(shot.position.x,shot.position.y,shot.position.z);camera.lookAt(shot.target.x,shot.target.y,shot.target.z);
    camera.fov=60;camera.updateProjectionMatrix();$('cinematic-shutter').style.opacity=shot.fade*.96;return;
  }
  $('cinematic-shutter').style.opacity=0;
  if(!motion)return;
  if(race?.status==='finale'){
    const shot=finaleShot(course.finale,race.finaleTime,!settings.motion);
    camera.position.set(shot.position.x,shot.position.y,shot.position.z);camera.lookAt(shot.target.x,shot.target.y,shot.target.z);
    camera.fov=72;camera.updateProjectionMatrix();firstPerson.visible=shot.hands;
    hands.update(paused?0:dt,{time:gameVisualTime,speed:14,grounded:false,mode:race.finaleTime<2?'swing':'air',traversal:race.finaleTime<2?{type:'swing'}:null,motion:settings.motion,knifeEffects:settings.knifeEffects||'full',environment:handEnvironment()});
    return;
  }
  const speed=Math.hypot(motion.vx,motion.vz),moving=phase==='playing'&&!paused;
  const ride=motion.traversal&&course.traversals.find(d=>d.id===motion.traversal.id);
  const inChute=!!(motion.traversal&&!motion.traversal._attachment&&(motion.traversal.type==='chute'||ride?.lockedRide));
  let bankTarget=0;
  if(inChute){
    const heading=Math.atan2(-motion.vx,-motion.vz);
    if(chuteHeading!==null&&moving){
      const turn=Math.atan2(Math.sin(heading-chuteHeading),Math.cos(heading-chuteHeading));
      lookYaw+=turn; // Carry the view around the bend while preserving mouse look.
      bankTarget=clamp(-turn/Math.max(dt,.001)*.035,-.1,.1);
    }
    chuteHeading=heading;
  }else chuteHeading=null;
  chuteBank=lerp(chuteBank,settings.motion?bankTarget:0,1-Math.exp(-8*dt));
  if(moving)handPhase+=dt*speed*.9;
  cameraImpact=Math.max(0,cameraImpact-dt*1.5);slidePulse=Math.max(0,slidePulse-dt*2);
  const crouched=motion.crouch||motion.mode==='slide';cameraEye=lerp(cameraEye,crouched?.87:1.63,1-Math.exp(-14*dt));
  const wallStep=wallStride.update(moving?dt:0,{active:!!motion.wallRun,speed,wallSide:motion.wallSide||0,motion:settings.motion});
  const immersion=cameraImmersion.update(moving?dt:0,{speed,grounded:motion.grounded,active:moving&&race.status==='running'&&countdown<=0,crouched:!!crouched,traversal:!!motion.traversal,wallRun:!!motion.wallRun,headBob:settings.headBob,runningShake:settings.runningShake});
  const bob=immersion.y+wallStep.lift;
  const pursuer=sampleRoute(course,race.dragonS),physicalDistance=Math.hypot(motion.x-pursuer.x,motion.z-pursuer.z);
  const pressure=moving&&race.chase!==false&&race.pursuitActive!==false&&race.status==='running'?clamp(1-Math.max(physicalDistance,race.progress-race.dragonS)/110,0,1):0;
  const threatShake=settings.motion?pressure*pressure:0;
  const beat=gameVisualTime*(course.theme==='mine'?17:course.theme==='city'?6:9);
  const tremor=(Math.sin(beat)+Math.sin(beat*2.71)*.35)*threatShake;
  const shake=settings.motion?cameraImpact:0;
  camera.position.set(motion.x+Math.cos(lookYaw)*immersion.x,motion.y+cameraEye+bob-shake*.13+tremor*.042,motion.z-Math.sin(lookYaw)*immersion.x);
  const roll=settings.motion?(motion.wallSide||0)*.075+(keys.has('KeyA')?.009:keys.has('KeyD')?-.009:0):0;
  camera.rotation.set(lookPitch+(settings.motion?shake*.03:0)+tremor*.006+wallStep.pitch+immersion.pitch,lookYaw+(lookBack?Math.PI:0)+immersion.yaw,roll+chuteBank+tremor*.009+wallStep.roll+immersion.roll,'YXZ');
  const targetFov=settings.fov+(settings.motion?clamp((speed-6.5)/5,0,1)*4+slidePulse*2:0);camera.fov=lerp(camera.fov,targetFov,1-Math.exp(-8*dt));camera.updateProjectionMatrix();
  if(ride?.rideStyle==='coaster'&&motion.traversal.progress>.29&&motion.traversal.progress<.44){
    const t=(motion.traversal.progress-.29)/.15,blend=Math.sin(t*Math.PI),g=world.pursuer.group;
    const facing=new THREE.Vector3(g.position.x,g.position.y+39,g.position.z);
    const ahead=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).multiplyScalar(40).add(camera.position);
    camera.lookAt(ahead.lerp(facing,blend*.8));
  }
  const rideCutaway=phase==='playing'&&!settings.thirdPerson&&world.ruptureEncounters?.camera(camera,motion,settings,false);
  raceBodyVisible=false;if(phase==='playing'&&settings.thirdPerson)raceBodyVisible=raceCamera.update(camera,{...motion,yaw:lookYaw+(lookBack?Math.PI:0)},lookPitch,dt,world.cameraGeometryFor?.(motion)??world.geometry).bodyVisible;
  firstPerson.visible=phase==='playing'&&!settings.thirdPerson&&!lookBack&&!rideCutaway;
  const dragonReins=ride?.rideStyle==='dragon'?dragonReinViewTargets(world.dragonVisual,camera,settings.viewFov,dragonReinTargets,motion):undefined;
  hands.update(moving?dt:0,{time:gameVisualTime,speed,vx:motion.vx,vz:motion.vz,vy:motion.vy,grounded:motion.grounded,mode:motion.mode,sprinting:motion.sprinting,crouch:motion.crouch,pitch:lookPitch,yawRate:motion.yawRate||0,strafe:inputFrame().moveX,motion:settings.motion,knifeEffects:settings.knifeEffects||'full',traversal:motion.traversal,dragonReins,wallRun:motion.wallRun,wallSide:motion.wallSide,wallStride:wallStep,environment:handEnvironment()});
}
function updateHUD(force=false){
  if(!race||!motion)return;
  const time=formatTime(race.time).split('.');$('hud-time').innerHTML=`${time[0]}<span>.${time[1]}</span>`;
  text('hud-section',course.sections[race.section]?.name||course.title);
  $('section-dots').querySelectorAll('i').forEach((dot,i)=>dot.classList.toggle('active',i<=race.section));
  const total=course.route.at(-1).s,progress=clamp(race.progress/total,0,1),gap=race.chase===false||race.pursuitActive===false?999:Math.max(0,race.progress-race.dragonS),threat=clamp(1-gap/65,0,1);
  const speed=Math.hypot(motion.vx,motion.vz),ride=motion.traversal,rideType=ride?.type||ride?.kind;
  const menuRide=course.id==='on-the-menu'&&ride?course.traversals.find(d=>d.id===ride.id):null;
  const houseRide=course.theme==='house'&&ride?course.traversals.find(d=>d.id===ride.id):null;
  const efficiency=clamp(motion.strafeEfficiency||0,0,1);
  text('hud-speed',speed.toFixed(1));text('hud-movement',countdown>0?'GET READY':houseRide?.houseStyle?houseRide.houseStyle.replaceAll('-',' ').toUpperCase():ride?.rideStyle==='dragon'?'RIDING THE DRAGON':ride?.rideStyle==='coaster'?'LAUGHING EXPRESS':ride?.rideStyle==='bucket'?'BALL RIVER':ride?.rideStyle==='megachute'?'RAMP SLIDE':menuRide?.menuCloth?'CLOTH SCRAMBLE':menuRide?.menuBowl?'BOWL SLIDE':rideType==='chute'?(course.id==='no-such-place'?'STONE CHANNEL':course.id==='on-the-menu'?'TRAY SLIDE':course.theme==='theatre'?'CURTAIN SLIDE':course.theme==='greenhouse'?(course.traversals.find(d=>d.id===ride.id)?.bloomStyle||'PLANT SLIDE').replaceAll('-',' ').toUpperCase():'ORE CHUTE'):rideType==='swing'?'SWINGING':rideType==='zipline'?'ZIP LINE':motion.wallRun?'WALL RUN':motion.mode==='slide'?'SLIDING':motion.crouch?'CROUCHED':world.skateboard?.attached?!motion.grounded?'SKATEBOARD · AIRBORNE':'ON THE SKATEBOARD':!motion.grounded?efficiency>.12?'STRAFE JUMP':'AIRBORNE':motion.sprinting?'SPRINTING':'RUNNING');
  text('hud-progress',`${Math.floor(progress*100)}%`);text('hud-embers',`◇ ${race.collected.length} / ${course.collectables.length}`);$('progress-fill').style.width=progress*100+'%';$('dragon-marker').style.left=clamp(race.dragonS/total,0,1)*100+'%';
  document.querySelector('.chase-widget').hidden=race.chase===false||race.pursuitActive===false;
  $('dragon-marker').hidden=race.chase===false||race.pursuitActive===false;
  text('chase-label',course.theme==='greenhouse'&&race.progress<course.bloomHandover.s?'SWAMP HORDE':course.monster);text('chase-distance',Math.round(gap)+' m');text('chase-caption',gap<20?'MAKE THE NEXT JUMP':gap<45?'IT IS GETTING CLOSER':'KEEP YOUR LEAD');$('chase-fill').style.width=threat*100+'%';
  document.querySelector('.chase-widget').classList.toggle('danger',gap<25);
  $('speed-lines').style.opacity=settings.motion?clamp((speed-11)/22,0,.32):0;
  $('impact').style.opacity=settings.motion?Math.max(cameraImpact*.3,gap<22?(1-gap/22)*.22:0):0;
  $('strafe-fill').style.width=efficiency*100+'%';text('strafe-status',efficiency>.65?'IN SYNC':efficiency>.1?'BUILDING':'STRAFE SYNC');
  if(!settings.controlHints){
    const nearby=course.id==='no-such-place'&&countdown<=0?traversalPrompt(motion,world.geometry)?.descriptor:null;
    const essential=ride?.rideStyle==='dragon'?dragonRideHint(ride.progress):nearby?.rideStyle==='dragon'?DRAGON_BOARDING_HINT:'';
    text('context-hint',essential);$('context-hint').classList.toggle('visible',!!essential);return;
  }
  let hint='';
  const nearBeam=course.obstacles.find(o=>o.kind==='lowbar'&&Math.hypot(motion.x-(o.minX+o.maxX)/2,motion.z-(o.minZ+o.maxZ)/2)<11&&motion.y<o.minY+1&&motion.y>o.minY-4);
  const nearbyRide=traversalPrompt(motion,world.geometry)?.descriptor;
  const nearbyBounce=world.geometry.surfaces?.find(s=>s.solid!==false&&s.bounce&&Math.abs(motion.y-s.y)<28&&Math.hypot(motion.x-(s.minX+s.maxX)/2,motion.z-(s.minZ+s.maxZ)/2)<17);
  const nearbyWall=course.wallRuns.find(w=>motion.y>w.minY-2&&motion.y<w.maxY&&Math.hypot(motion.x-(w.minX+w.maxX)/2,motion.z-(w.minZ+w.maxZ)/2)<24);
  const transfer=motion.wallRun&&course.challenges.find(ch=>ch.kind==='wallchain'&&ch.wallIds.slice(0,-1).includes(motion.wallRun.id));
  if(motion.wallRun)hint=transfer?'SPACE · KICK + STEER TO THE OPPOSITE WALL':'WALL RUN · SPACE TO KICK AWAY';
  else if(nearbyWall)hint='JUMP ALONGSIDE THE MARKED WALL · KEEP CLOSE TO RUN IT';
  else if(rideType==='swing')hint='W / S · PUMP / BRAKE      SPACE · RELEASE AT THE FORWARD ARC';
  else if(rideType==='zipline')hint=motion.traversal.releaseOnJump===false?'E · LET GO      W · DRIVE      S · BRAKE':'W · DRIVE      S · BRAKE      E / SPACE · DROP ONTO THE LANDING';
  else if(rideType==='chute'&&course.id==='rupture')hint='FOLLOW THE CURRENT · S TO BRAKE · WATCH THE NEXT CATCH';
  else if(course.id==='on-the-menu'&&nearbyRide)hint=nearbyRide.label+' · '+(nearbyRide.kind==='chute'?'CTRL / C TO SLIDE':nearbyRide.menuCloth?'E TO GRAB · SPACE TO RELEASE':'E TO GRAB');
  else if(rideType==='chute')hint=course.theme==='greenhouse'?'FOLLOW THE SLIDE · S TO BRAKE':'SPIRAL ORE CHUTE · S TO BRAKE';
  else if(nearbyRide)hint=course.theme==='greenhouse'?nearbyRide.label:nearbyRide.autoCatch?'RUN OR JUMP UNDER THE HANDLE · AUTO GRAB':nearbyRide.kind==='chute'?'CTRL / C · DROP INTO THE ORE CHUTE':'E · GRAB '+(nearbyRide.kind==='swing'?'THE ROPE':'THE POWERED CABLE');
  else if(nearBeam&&!motion.crouch)hint='LOW TUNNEL · CTRL / C TO SLIDE';
  else if(nearbyBounce)hint=nearbyBounce.bounce.runUp?'RAMP REBOUND · HIT THE ANGLED FACE WITH SPEED':'REBOUND · LAND ON THE ANGLED FACE WITH SPEED';
  else if(race.time<9&&speed<8&&countdown<=0)hint='HOLD W + SHIFT · STEER YOUR LINE · KEEP THE JUMPS FLOWING';
  const rebound=course.challenges.find(ch=>ch.kind==='drop-bounce'&&race.routeIndex>=ch.startIndex-1&&race.routeIndex<=ch.endIndex);
  const face=rebound&&course.platforms.find(p=>p.id===rebound.viaPlatformId);
  if(face&&motion.y>face.y-2&&race.progress<face.s+face.travelLength*.6&&!motion.grounded)hint='AIM FOR THE SLOPED STONE · CARRY YOUR SPEED';
  else if(!course.climb&&motion.y<sampleRoute(course,race.progress).y-8&&!motion.grounded&&!motion.wallRun&&!rideType)hint='MISSED THE LANDING · FATAL DROP';
  const authoredHint=world.routeHint?.(motion,race);if(authoredHint&&(!rideType||['on-the-menu','castaway','unravel','world-war-r','reposcape','no-such-place'].includes(course.id))&&!motion.wallRun)hint=authoredHint;
  if(course.finale&&race.routeIndex>=course.finale.crownIndex-3)hint='REACH THE LAST LEDGE · JUMP + HOLD E FOR THE CHAIN';
  if(race.awaitingChain)hint='JUMP + HOLD E · GRAB THE HANGING CHAIN';
  const specialRide=motion.traversal&&course.traversals.find(d=>d.id===motion.traversal.id);
  if(specialRide?.rideStyle)hint=specialRide.rideStyle==='dragon'?dragonRideHint(ride.progress):specialRide.rideStyle==='coaster'?'HOLD ON · THE TRACK ENDS AHEAD':specialRide.rideStyle==='bucket'?'BALL RIVER · BRACE FOR THE FALL':'STAY LOW · THE LIP WILL LAUNCH YOU';
  if(nearbyRide?.rideStyle)hint=nearbyRide.label;
  if(course.theme==='house'){
    const wayfindingHint=getHouseWayfindingHint(course,motion,race,world.geometry),boardHint=skateboardWayfindingHint(world.skateboard,motion,race);
    if(specialRide?.houseStyle==='chandelier-tassel'&&wayfindingHint)hint=wayfindingHint;
    else if(specialRide?.houseStyle)hint=specialRide.kind==='chute'?'BANISTER SLIDE · S TO BRAKE':specialRide.kind==='swing'?'W TO PUMP THE CORD · SPACE TO RELEASE':'CHANDELIER WIRE · SPACE TO DROP TOWARDS THE LANDING';
    else if(nearbyRide?.houseStyle)hint=nearbyRide.label;
    else if(wayfindingHint)hint=wayfindingHint;
    else if(boardHint)hint=boardHint;
    else if(face&&motion.y>face.y-2&&!motion.grounded)hint='AIM FOR THE ANGLED FACE · CARRY YOUR SPEED';
    else if(course.houseSkateboard&&race.routeIndex>=course.houseSkateboard.startIndex-3&&race.routeIndex<course.houseSkateboard.startIndex)hint='JUMP ONTO THE SKATEBOARD · RUN ACROSS IT AS IT ROLLS';
    else if(!hint){const active=course.houseMechanisms.find(m=>race.progress>=(m.triggerS??0)-15&&race.progress<=(m.triggerS??0)+60);if(active)hint=active.label.toUpperCase();}
  }
  if(course.theme==='theatre'){
    const approachHint=curtainSlideHint(course,motion,race);
    if(specialRide?.theatreStyle)hint=specialRide.kind==='chute'?'CURTAIN SLIDE · RIDE TO THE END · S TO BRAKE':specialRide.kind==='swing'?'W TO PUMP THE TRAPEZE · SPACE TO RELEASE':'FLY CABLE · SPACE TO RELEASE TOWARDS THE LIT LANDING';
    else if(nearbyRide?.theatreStyle)hint=nearbyRide.label;
    else if(approachHint)hint=approachHint;
    else if(face&&motion.y>face.y-2&&!motion.grounded)hint='AIM FOR THE ANGLED CANVAS · CARRY YOUR SPEED';
    else if(world.theatreMechanisms?.attached&&!hint)hint=world.theatreMechanisms.docked?'JUMP TO THE LIT EXIT LEDGE':'KEEP JUMPING ACROSS THE MOVING SCENERY';
  }
  if(course.theme==='greenhouse'){
    const cue=bloomHint(course,motion,race,world);
    if(cue)hint=cue;
    else if(face&&motion.y>face.y-2&&!motion.grounded)hint='AIM FOR THE PALE SLOPED FACE · CARRY YOUR SPEED';
  }
  if(course.theme==='rupture'){
    if(specialRide?.ruptureStyle)hint=specialRide.kind==='chute'?(specialRide.ruptureStyle==='penstock'?'PENSTOCK CURRENT · RIDE TO THE LIT EXIT · S TO BRAKE':'SPILLWAY BANK · RIDE TO THE LIT CATCH · S TO BRAKE'):specialRide.kind==='swing'?'W TO PUMP · SPACE TO RELEASE TOWARDS THE LIT CATCH':'SPILLWAY CABLE · FOLLOW THE LIT LANDING';
    else if(nearbyRide?.ruptureStyle)hint=nearbyRide.label;
    else if(world.theatreMechanisms?.attached)hint=world.theatreMechanisms.docked?'JUMP TO THE FIXED MAINTENANCE LANDING':'KEEP CROSSING THE BRACES AS THE GATE DESCENDS';
    else if(face&&!motion.grounded&&motion.y>face.y-2)hint='LAND ON THE ANGLED PLATE · FOLLOW ITS PAINTED DIRECTION';
  }
  if(course.climb)hint=world.routeHint?.(motion,race,{nearbyRide,nearBeam,nearbyBounce})||'';
  if(race.status==='finale')hint='THE LAST ANCHOR · SPACE TO SKIP';
  text('context-hint',hint);$('context-hint').classList.toggle('visible',!!hint);
}

function animate(now){
  if(document.body.dataset.gamePhase!==phase)document.body.dataset.gamePhase=phase;
  placeInterface.update({course,race,phase,paused,settings});
  reverseInterface.update({course,race,world,player:motion,phase,paused,settings,countdown});
  repoAtlas?.update({phase,race:phase==='playing'?race:null,motion:phase==='playing'?motion:null,online:onlineRun,loadout:selectingCourse});
  if(preparingWorld){framePrevious=now;requestAnimationFrame(animate);return;}
  // Use direct matte colours only in RepoScape; keep current grading elsewhere.
  const repoColour=course?.id==='reposcape'&&phase!=='runners'&&!(phase==='opening'&&opening?.compCrossing);
  repoScapeFrame(now,repoColour);
  renderer.toneMapping=repoColour?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=repoColour?1:1.12;
  const rawDt=(now-framePrevious)/1000;
  if(phase!=='playing'||paused||modalOpen())cameraBlur.reset();
  const realDt=clamp(rawDt,0,.1);framePrevious=now;clock+=realDt;
  if(phase==='playing'&&onlineRun&&onlineEngine){
    if(countdown>0)physicsTick(0);
    if(countdown<=0){
      const plan=onlineClock.plan(multiplayer.serverNow(),onlineStartAt,onlineEngine.ticks,rawDt);
      if(plan.interrupted){race.status='interrupted';race.validRecord=false;race.reason='Connection interrupted for too long to verify this race. Return to the airport to race again.';void finishRun();}
      else for(let step=0;step<plan.steps&&phase==='playing';step++){physicsTick(1/120);attemptGhost.observe(race,motion);}
    }
    gameVisualTime=onlineEngine.ticks/120;accumulator=0;
  }else if(phase==='playing'&&!paused&&locked){
    accumulator+=realDt;gameVisualTime+=realDt;
    let steps=0;while(accumulator>=1/120&&steps<12&&phase==='playing'){physicsTick(1/120);attemptGhost.observe(race,motion);accumulator-=1/120;steps++;}
    if(steps>=12)accumulator=0;
  }else accumulator=0;
  abyssInterface.update(course,race,motion,phase==='playing'&&!paused,clock);
  if(course?.climb&&phase==='playing'&&!paused&&locked){
    if(clock-abyssSavedAt>1){suspendAbyss();abyssSavedAt=clock;}
    abyssRestartHold=keys.has('KeyR')?abyssRestartHold+realDt:0;
    if(abyssRestartHold>.15)abyssInterface.restartHold(Math.min(1,abyssRestartHold/1.5));
    if(abyssRestartHold>=1.5){abyssRestartHold=0;if(onlineRun)onlineRestart=true;else{clearAbyssAttempt();void startRun(0,true);}}
  }else abyssRestartHold=0;
  if(phase==='runners'){
    firstPerson.visible=false;
    const previewDt=document.hidden?0:realDt;
    if(knifeRoom){knifeRoom.update(previewDt,{motion:settings.motion,dragging:!!knifeDrag,effects:settings.knifeEffects||'full'});renderer.render(knifeRoom.scene,knifeRoom.camera);}
    else if(runnerRoom){if(settings.motion||runnerRoom.gait==='run')runnerPreviewTime+=previewDt;runnerPortraits?.step(renderer,(id,url)=>{const image=$('runner-list').querySelector(`[data-runner="${id}"] img`);if(image)image.src=url;});runnerRoom.update(runnerPreviewTime,{motion:settings.motion,effects:settings.knifeEffects});renderer.render(runnerRoom.scene,runnerRoom.camera);}
    requestAnimationFrame(animate);return;
  }
  if(world)world.stormState=audio.getStormState();
  if(world&&motion&&race&&['playing','result','ending'].includes(phase))multiplayer?.update(now,world.scene,motion,race);
  if(phase==='ending'){
    if(!endingPaused&&!document.hidden)endingTime=Math.min(ending.duration,endingTime+realDt);
    const view=ending.update(endingTime,camera);firstPerson.visible=false;
    if(!endingPaused)audio.soundtrack.update(realDt,{reversePhase:world.reverseState?.phase??0,reverseSection:race?.section||0,reverseRunning:false,running:false,crossingAbyssPhase:'ending',crossingAbyssSection:race?.section||0,crossingAbyssHeight:race?.height||0,crossingAbyssCourse:course,crossingAbyssFalling:false,reposcapeSection:race?.section||0,placeSection:race?.section||0,placePursuit:false,warSection:race?.section||0,unravelSection:race?.section||0,castawaySection:race?.section||0,higherGroundSection:race?.section||0,menuSection:race?.section||0,orcaSection:race?.section||0,draftSection:race?.section||0,morogueSection:race?.section||0,morogueFeature:course.platforms[race?.routeIndex||0]?.feature});
    text('opening-caption',settings.cinematicCaptions?(endingPaused?'PAUSED':view.caption):'');text('opening-time',Math.ceil(ending.duration-endingTime)+'s');$('opening-bar').style.width=(endingTime/ending.duration*100)+'%';$('cinematic-shutter').style.opacity=view.fade;
    if(view.beat!==endingBeat){endingBeat=view.beat;if(view.beat==='impact'){audio.play('collapse',{intensity:1});audio.play('roar',{theme:world.theme,intensity:.8});}}
    renderGameView(view.scene,camera,false);
    if(endingTime>=ending.duration)finishEnding();requestAnimationFrame(animate);return;
  }
  if(phase==='opening'){
    const openingDuration=opening?.duration||OPENING_DURATION;
    if(!openingPaused&&!document.hidden){if(opening?.airportLobby)opening.terminalStep(realDt,locked&&!multiplayer?.visible?keys:new Set());else openingTime=Math.min(openingDuration,openingTime+realDt);}
    if(openingTime>=25&&!course.climb&&!['playdate','small-hours','final-curtain','last-bloom','rupture','uncrowned','last-draft','rep-orca','on-the-menu','higher-ground','castaway','unravel','world-war-r','reposcape','no-such-place','the-reverse'].includes(course.id)){const p={...course.spawn,progress:0};world.update(openingPaused?0:realDt,{time:openingTime,player:p,dragonS:-18,running:false,chase:false,collected:[]});
      poseOpeningPursuer(world,openingTime);
    }
    if(opening?.options?.social)multiplayer.updateAirport(now);
    openingView=opening.update(openingTime,camera);for(const cue of openingView.cues||[])audio.play(cue.id,cue.options);if(opening.compCrossing){updateViewButtons();if(runnerSocial?.active)opening.actor.group.visible=false;}if(!openingPaused)audio.update(realDt,{time:openingTime,reversePhase:openingView.reversePhase??0,reverseSection:0,reverseRunning:false,noPursuit:!!course.climb,crossingAbyssPhase:'opening',crossingAbyssSection:0,crossingAbyssHeight:camera.position.y,crossingAbyssCourse:course,crossingAbyssFalling:!!opening.falling,crossingAbyssFallSpeed:opening.fallSpeed||0,placeSection:0,placePursuit:false,placeActivity:world.ambienceAt?.({x:camera.position.x,y:camera.position.y,z:camera.position.z,yaw:camera.rotation.y}),speed:opening.walkSpeed||0,cinematic:!opening.compCrossing,lobby:!!opening.compCrossing,surfaceMaterial:opening.compCrossing?opening.session.surfaceMaterial():'stone',sliding:opening.visitor?.mode==='slide'||opening.visitor?.traversal?.type==='chute',traversal:!!opening.visitor?.traversal,grounded:opening.grounded,running:true,threat:0,theme:opening.compCrossing?'village':world.theme});if(opening.compCrossing)audio.setMusicVolume(0);else audio.setMusicVolume(settings.musicVolume/100*(course.climb||course.id==='last-draft'?1:['castaway','unravel','world-war-r','reposcape','no-such-place','the-reverse'].includes(course.id)?(.35+.65*clamp(openingTime/3,0,1)):course.id==='on-the-menu'?(.035+.965*clamp((openingTime-16)/9,0,1)):(.08+.92*clamp((openingTime-9)/10,0,1))));firstPerson.visible=openingView.handVisible;
    if(firstPerson.visible)hands.update(openingPaused?0:realDt,{speed:opening.walkSpeed||0,grounded:opening.grounded!==false,mode:opening.visitor?.mode,crouch:opening.visitor?.crouch,sprinting:opening.visitor?.sprinting,vy:opening.visitor?.vy,gliding:opening.visitor?.gliding,handHold:opening.visitor?.handHold,traversal:opening.visitor?.traversal,motion:settings.motion,knifeEffects:settings.knifeEffects||'full',time:opening.session?.time??openingTime,environment:handEnvironment()});
    if(firstPerson.visible)opening.poseHands?.(hands);
    text('skip-opening',opening?.options?.social?'PARTY & DEPARTURES':opening?.compCrossing?'CHOOSE A RUN':opening?.airportLobby?'SKIP AIRPORT →':'SKIP · SPACE →');text('opening-caption',(opening?.compCrossing|| (opening?.airportLobby?settings.controlHints:settings.cinematicCaptions))?(openingPaused?'PAUSED':openingView.caption):'');text('opening-time',opening?.compCrossing?opening.airport.phaseName.toUpperCase():opening?.airportLobby?'DEPARTURES':Math.ceil(openingDuration-openingTime)+'s');$('opening-bar').style.width=(openingTime/openingDuration*100)+'%';$('cinematic-shutter').style.opacity=openingView.fade;
    if(!course.climb&&openingView.beat!==openingSoundBeat){openingSoundBeat=openingView.beat;if(openingSoundBeat==='ordinary')audio.play('opening-calm',{theme:world.theme,intensity:.7});if(openingSoundBeat==='omen')audio.play(course.id==='no-such-place'?'place-presence':'threat',{intensity:.5,theme:world.theme});if(openingSoundBeat==='impact'&&world.theme==='battlefield')audio.play('battle-blast',{intensity:.8});if(openingSoundBeat==='rupture'){audio.play('collapse',{intensity:1});audio.play('roar',{intensity:1,theme:world.theme});}if(openingSoundBeat==='escape')audio.play('roar',{intensity:.8,theme:world.theme});}
    cameraBlur.prepare(camera,realDt,(course.id!=='no-such-place'||openingView.scene!==world.scene)&&settings.motionBlur&&opening?.airportLobby&&!openingPaused&&firstPerson.visible);
    runnerSocial?.update(openingPaused?0:realDt,openingView.scene,camera,{allow:!!opening?.airportLobby&&!openingPaused&&!multiplayer?.visible});
    renderGameView(openingView.scene,camera,firstPerson.visible,cameraBlur);crossingFrame(now);
    if(openingTime>=openingDuration)finishOpening();requestAnimationFrame(animate);return;
  }
  updateCamera(realDt);
  const playing=phase==='playing'||phase==='result',sceneTime=playing?gameVisualTime:clock;
  const menuProgress=world.cinematic(settings.motion?clock-cinematicStart:5).progress;
  const viewPlayer=playing&&motion?{x:motion.x,y:motion.y,z:motion.z,vx:motion.vx,vz:motion.vz,progress:race.progress,grounded:motion.grounded,traversal:motion.traversal,parachuting:motion.parachuting,yaw:motion.yaw}:{...sampleRoute(course,menuProgress),progress:menuProgress};
  const dragonS=playing?race.dragonS:menuProgress+20;
  const events=world.update(phase==='playing'&&paused&&!onlineRun?0:realDt,{time:sceneTime,player:viewPlayer,dragonS,chase:playing&&race?.chase!==false&&race?.pursuitActive!==false&&MODES[selectedMode].chase,running:phase==='playing'&&(onlineRun||!paused)&&race.status==='running',collected:race&&playing?race.collected:[],motion:settings.motion,finaleProgress:playing&&course.finale?(race?.finaleTime||0)/course.finale.duration:0});
  for(const e of events){
    if(e.kind==='place-command'){placeInterface.onEvent(e,race?.time||0);continue;}
    if(e.kind==='place-glimpse'){audio.play('place-presence',{intensity:.25,theme:world.theme});continue;}
    if(e.id==='penstock-cutaway'||e.id==='cable-cutaway')toast('V · SKIP CAMERA SHOTS',4);
    const distance=Math.hypot(e.x-viewPlayer.x,e.z-viewPlayer.z),intensity=clamp(1-distance/140,.08,.8)*(/^(fault|rupture)-/.test(e.kind)?clamp(e.intensity??1,0,1):1);
    const pan=clamp(((e.x-viewPlayer.x)*Math.cos(lookYaw)-(e.z-viewPlayer.z)*Math.sin(lookYaw))/70,-.8,.8);
    const sound=e.kind==='battle-blast'?'battle-blast':e.kind==='warning'?'threat':/^(caretaker|director|bloom|swamp|fault|rupture)-/.test(e.kind)?e.kind:'collapse';
    audio.play(sound,{intensity,pan,theme:world.theme,material:e.material});
    if(e.kind==='destruction')audio.play('roar',{intensity:intensity*.65,theme:world.theme,pan});
    if(settings.motion&&playing&&distance<90)cameraImpact=Math.max(cameraImpact,(e.kind==='destruction'?.65:/^(caretaker-step|director-grip|fault-step)$/.test(e.kind)?.055:/^(caretaker|director|bloom|fault)-windup$/.test(e.kind)?.045:e.kind==='bloom-crack'?.025:e.kind==='rupture-geyser'?.08:e.kind==='rupture-pipe-strike'?.1:.18)*(1-distance/110));
  }
  if(phase==='playing'&&!paused)audio.update(realDt,{reversePhase:world.reverseState?.phase??0,reverseSection:race?.section||0,reverseSerial:world.reverseState?.serial||0,reverseBlockedSerial:world.reverseState?.blockedSerial||0,reverseRunning:course.id==='the-reverse'&&race.status==='running'&&countdown<=0,noPursuit:!!course.climb,crossingAbyssPhase:'climb',crossingAbyssSection:race?.section||0,crossingAbyssHeight:race?.height||0,crossingAbyssCourse:course,crossingAbyssFalling:!!race?.falling,crossingAbyssFallSpeed:Math.max(0,-motion.vy),reposcapeSection:race?.section||0,placeSection:race?.section||0,placePursuit:race?.pursuitActive===true,placeActivity:world.ambienceAt?.(motion),placeEncounter:world.encounterAudioAt?.(motion),placeDragon:motion.traversal?.rideStyle==='dragon',placeDragonProgress:motion.traversal?.progress,placeDragonTime:Math.max(0,race.time-(world.dragonRideState?.mountedAt??race.time)),speed:Math.hypot(motion.vx,motion.vz),grounded:motion.grounded,sliding:motion.mode==='slide'||motion.traversal?.type==='chute',traversal:!!motion.traversal,threat:race.chase!==false&&race.pursuitActive!==false&&MODES[selectedMode].chase?clamp(1-(race.progress-race.dragonS)/100,0,1):0,running:race.status==='running',theme:world.theme,surfaceMaterial:world.surfaceMaterial?.(motion)||'stone',time:race.time,progress:race.progress/course.route.at(-1).s,warSection:race?.section||0,unravelSection:race?.section||0,castawaySection:race?.section||0,higherGroundSection:race?.section||0,menuSection:race?.section||0,orcaSection:race?.section||0,draftSection:race?.section||0,morogueSection:race?.section||0,morogueFeature:course.platforms[race?.routeIndex||0]?.feature,insideBloom:course.theme==='greenhouse'&&race.progress>=course.bloomHandover.s});
  else if(phase==='result')audio.soundtrack.update(realDt,{reversePhase:world.reverseState?.phase??0,reverseSection:race?.section||0,reverseRunning:false,running:false,crossingAbyssPhase:'ending',crossingAbyssSection:race?.section||0,crossingAbyssHeight:race?.height||0,crossingAbyssCourse:course,crossingAbyssFalling:false,reposcapeSection:race?.section||0,placeSection:race?.section||0,placePursuit:false,warSection:race?.section||0,unravelSection:race?.section||0,castawaySection:race?.section||0,higherGroundSection:race?.section||0,menuSection:race?.section||0,orcaSection:race?.section||0,draftSection:race?.section||0,morogueSection:race?.section||0,morogueFeature:course.platforms[race?.routeIndex||0]?.feature,insideBloom:course.theme==='greenhouse'&&race.progress>=course.bloomHandover.s});
  updateGhost();hudClock+=realDt;if(hudClock>.06){hudClock=0;if(playing)updateHUD();}
  if(toastUntil&&clock>toastUntil){show('toast',false);toastUntil=0;}if(bannerUntil&&clock>bannerUntil){$('section-banner').classList.remove('visible');bannerUntil=0;}
  cameraBlur.prepare(camera,realDt,course.id!=='no-such-place'&&settings.motionBlur&&phase==='playing'&&!paused&&!modalOpen()&&race.status==='running'&&countdown<=0&&firstPerson.visible);
  runnerSocial?.update(paused?0:realDt,world.scene,camera,{allow:phase==='playing'&&(!paused||settings.thirdPerson)&&race?.status==='running',external:settings.thirdPerson?raceBodyVisible:!firstPerson.visible&&!lookBack&&!!motion&&camera.position.distanceTo(new THREE.Vector3(motion.x,motion.y+1,motion.z))>2});
  renderGameView(world.scene,camera,firstPerson.visible,cameraBlur);
  frameAverage=frameAverage*.985+(realDt*1000)*.015;renderedFrames++;
  if(course?.id!=='reposcape'&&renderedFrames%300===0&&frameAverage>38&&autoResolution>.7&&settings.quality!=='ultra'){
    autoResolution=Math.max(.7,autoResolution-.1);renderer.setPixelRatio(Math.min(devicePixelRatio||1,settings.quality==='performance'?1:1.5)*autoResolution);resize();
  }
  requestAnimationFrame(animate);
}

async function init(){
  try{
    brandIntro=new BrandIntro({canvas:$('brand-film'),root:$('boot'),message:$('boot-message'),skip:$('skip-brand'),target:document.querySelector('.game-logo'),reduced:!settings.motion,volume:settings.volume/100,onFinish:()=>{show('boot',false);document.body.classList.remove('booting');menuMusic();window.compRunReady=true;document.body.dataset.ready='true';$('choose-run').focus();if(new URLSearchParams(location.search).get('lobby')==='comp-crossing')void beginCrossing();}});
    await loadSurfaceTextures();
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    hands=withMenuPaws(createHands({skinTone:selectedRunner().skin,runner:selectedRunner()}));hands.setKnife(equippedKnife());hands.setEquipment(settings.equipment,true);firstPerson=hands.group;camera.add(firstPerson);setCourse(selectedCourse);bindUI();bindInput();
    const interfaceAudio=createInterfaceAudio(()=>settings);
    runnerSocial=createRunnerSocial({getPlayer:()=>phase==='opening'?opening?.visitor:motion,getRunner:equippedRunner,getLoadout:equippedKnife,getHands:()=>hands,enabled:()=>locked&&!paused&&!openingPaused&&!modalOpen()&&(phase==='playing'&&race?.status==='running'||phase==='opening'&&opening?.airportLobby),onOpen:()=>keys.clear(),onNotice:t=>toast(t,2),onSound:cue=>audio.detail(cue),onHighlight:()=>interfaceAudio.play('wheel'),settings});if(!LOCAL_PREVIEW)setupLeaderboards({courses:COURSES.filter(c=>!c.climb&&c.onlineReady!==false),records:rules=>rules==='race'?loadRaceRecords():loadRecords()});
    multiplayer=LOCAL_PREVIEW?null:setupMultiplayer({courses:COURSES.filter(c=>c.multiplayerReady===true||c.onlineReady!==false),version:VERSION,getRunVersion:runVersionForCourse,getCourseLength:()=>course.route.at(-1).s,getRunner:equippedRunner,getLoadout:equippedKnife,getPresentation:()=>runnerSocial?.snapshot(),getSettings:()=>settings,onSound:(cue,options)=>audio.detail(cue,options),onLeave:returnToMenu,onLoadout:tab=>{multiplayerLoadout=true;loadoutTab=tab;openRunners();},onResumeAirport:()=>{if(opening?.options?.social)pauseOpening(false);},onAirport:options=>{
     audio.setExternalMusic(true);audio.setMusicVolume(0);
     onlineRun=false;ending?.dispose();ending=null;opening?.dispose();disposeLoadout();clearInputs();for(const name of ['menu','result','pause','runners','hud'])show(name,false);hands.setRunnerStyle(selectedRunner());settings.equipment=2;hands.setEquipment(2);
     opening=new HollowreachOpening(world,equippedRunner(),settings,{...options,now:()=>multiplayer.serverNow(),onMovement:airportMovement,onShop:()=>{loadoutTab='knives';openRunners();},onBell:()=>audio.play('checkpoint',{intensity:.3})});opening.airport.setTime(null);opening.resume();crossingBudget.reset();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.15));resize();openingTime=0;openingPaused=false;phase='opening';document.body.classList.add('opening-view');show('opening',true);document.body.classList.add('crossing-view');text('opening-title','COMP-CROSSING');text('opening-chapter','MULTIPLAYER');text('opening-pause','EXPLORE');runnerSocial?.prepare(opening.session.airport.scene);show('pause',false);capturePrompt(!locked);framePrevious=performance.now();requestCapture();return opening.session;
    },onCountdown:startAt=>{framePrevious=performance.now();onlineClock.reset();onlineStartAt=startAt;countdown=Math.max(.001,(startAt-multiplayer.serverNow())/1000);},onStart:config=>{onlineRules=config.rules==='race'?'race':'one-life';onlineStartAt=config.startAt;selectedMode=config.mode;selectedCourse=config.course;setCourse(config.course,true);config.prepareScene?.(world.scene);return startRun(0,false,true);}});
    $('open-multiplayer').onclick=()=>multiplayer?.launch();if(LOCAL_PREVIEW){for(const id of ['open-multiplayer','open-leaderboards','offline-download']){const b=$(id);if(b){b.disabled=true;b.title='Unavailable in the separate local build';}}}
    await brandIntro.images;show('menu',true);brandIntro.setReady();framePrevious=performance.now();requestAnimationFrame(animate);
  }catch(error){brandIntro?.dispose();console.error('COMP-RUN startup failed',error);show('boot',false);document.body.classList.remove('booting');show('unsupported',true);text('unsupported-note','The game could not start its 3D renderer. Use a desktop browser with hardware acceleration and WebGL enabled, then reload.');}
}
void init();
