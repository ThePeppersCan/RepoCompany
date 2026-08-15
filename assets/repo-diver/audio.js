(() => {
'use strict';
if(window.RepoDiverAudio)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const S={ctx:null,master:null,sfx:null,amb:null,music:null,compressor:null,scene:'',run:null,nodes:[],muted:false,volume:clamp(Number(localStorage.getItem('repoDiverVolume')||.58),0,1),mix:{sfx:.92,ambience:.28,music:.24},last:{shots:0,hits:0,sonars:0,event:0,catch:0,boss:false,o2Beat:0,creak:0,restaurant:0,harbour:0,descent:1,tension:0,ecoEvent:0,whale:0},danger:null};
function audioCtx(){
 if(S.ctx)return S.ctx;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;const c=S.ctx=new C();
 S.master=c.createGain();S.sfx=c.createGain();S.amb=c.createGain();S.music=c.createGain();S.compressor=c.createDynamicsCompressor();
 S.master.gain.value=S.muted?0:S.volume;S.sfx.gain.value=S.mix.sfx;S.amb.gain.value=S.mix.ambience;S.music.gain.value=S.mix.music;
 S.compressor.threshold.value=-12;S.compressor.knee.value=16;S.compressor.ratio.value=4;S.compressor.attack.value=.008;S.compressor.release.value=.22;
 S.sfx.connect(S.compressor);S.amb.connect(S.compressor);S.music.connect(S.compressor);S.compressor.connect(S.master);S.master.connect(c.destination);return c;
}
function resume(){const c=audioCtx();if(c?.state==='suspended')c.resume().catch(()=>{})}
function route(kind='sfx'){audioCtx();return kind==='amb'?S.amb:kind==='music'?S.music:S.sfx}
function panNode(pan=0){const c=audioCtx();if(!c||!c.createStereoPanner)return null;const p=c.createStereoPanner();p.pan.value=clamp(pan,-1,1);return p}
function tone(freq,dur=.12,type='sine',gain=.08,opts={}){const c=audioCtx();if(!c)return;const when=Math.max(0,opts.when||0),o=c.createOscillator(),g=c.createGain(),dest=route(opts.route||'sfx'),p=panNode(opts.pan||0);o.type=type;o.frequency.setValueAtTime(Math.max(20,freq),c.currentTime+when);if(opts.to)o.frequency.exponentialRampToValueAtTime(Math.max(20,opts.to),c.currentTime+when+dur);if(opts.detune)o.detune.value=opts.detune;g.gain.setValueAtTime(.0001,c.currentTime+when);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),c.currentTime+when+.008);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+when+dur);o.connect(g);if(p){g.connect(p);p.connect(dest)}else g.connect(dest);o.start(c.currentTime+when);o.stop(c.currentTime+when+dur+.03)}
function noise(dur=.15,gain=.06,cut=1800,opts={}){const c=audioCtx();if(!c)return;const n=Math.max(1,Math.floor(c.sampleRate*dur)),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(opts.fade===false?1:(1-i/n));const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),p=panNode(opts.pan||0),dest=route(opts.route||'sfx');src.buffer=buf;f.type=opts.filter||'lowpass';f.frequency.value=cut;f.Q.value=opts.q||.4;g.gain.value=gain;src.connect(f);f.connect(g);if(p){g.connect(p);p.connect(dest)}else g.connect(dest);src.start(c.currentTime+Math.max(0,opts.when||0))}
function loopTone(freq,type='sine',gain=.02,routeName='amb',detune=0){const c=audioCtx();if(!c)return null;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;o.detune.value=detune;g.gain.value=gain;o.connect(g);g.connect(route(routeName));o.start();S.nodes.push(o,g);return {o,g}}
function driftTone(freq,type='sine',gain=.012,routeName='amb',driftHz=.055,driftDepth=1.2,detune=0){const c=audioCtx();if(!c)return null;const o=c.createOscillator(),g=c.createGain(),lfo=c.createOscillator(),lg=c.createGain();o.type=type;o.frequency.value=freq;o.detune.value=detune;g.gain.value=gain;lfo.type='sine';lfo.frequency.value=driftHz;lg.gain.value=driftDepth;lfo.connect(lg);lg.connect(o.frequency);o.connect(g);g.connect(route(routeName));o.start();lfo.start();S.nodes.push(o,g,lfo,lg);return {o,g,lfo,lg}}
function stopScene(){for(const n of S.nodes){try{n.stop?.()}catch(_){}}S.nodes=[];S.danger=null}
function startScene(kind,run){resume();stopScene();S.scene=kind;S.run=run||null;if(kind==='dive'){
 const b=run?.biome?.id||'karamja',deep=clamp((run?.biome?.max_depth||100)/1000,0,1);
 // V10.1: no continuously-looping noise beds. Underwater ambience is now tonal,
 // low-frequency and slowly modulated so it feels like pressure/water movement
 // without producing a constant white-noise hiss.
 driftTone(43-deep*9,'sine',.015,'amb',.045,1.1);driftTone(66-deep*11,'triangle',.006,'amb',.071,.8,-7);
 if(['fremennik','pale'].includes(b)){driftTone(151,'sine',.0035,'amb',.038,.55,7);driftTone(118,'triangle',.0025,'amb',.061,.35,-4)}
 if(['kelp','coral','karamja'].includes(b)){driftTone(91,'sine',.0032,'amb',.053,.45);driftTone(132,'triangle',.0018,'amb',.079,.3,5)}
 if(['abyssal','midnight','endless'].includes(b)){driftTone(30,'sine',.017,'amb',.031,.65);driftTone(38,'sine',.006,'music',.025,.45,-11)}
 if(['volcanic','blackrift'].includes(b)){driftTone(52,'triangle',.006,'amb',.082,1.4,-8);driftTone(77,'sine',.003,'amb',.041,.8)}
 if(['ruins','citadel','cathedral'].includes(b)){driftTone(96,'sine',.005,'music',.035,.6);driftTone(144,'sine',.0025,'music',.057,.45,5)}
 S.danger=loopTone(55,'sawtooth',.0001,'music',-9);
 }else if(kind==='restaurant'){
  driftTone(82,'triangle',.0042,'amb',.042,.35);driftTone(123,'sine',.0028,'amb',.067,.28,4);
 }else{
  driftTone(69,'sine',.0075,'amb',.038,.45);driftTone(104,'triangle',.0028,'amb',.064,.32,-5);
 }
}
function setScene(scene,run){const kind=scene==='rdDiveView'?'dive':scene==='rdRestaurantView'?'restaurant':'harbour';startScene(kind,run);if(kind==='dive'){tone(220,.33,'sine',.035,{to:118});noise(.22,.018,500,{route:'amb'})}}
function play(kind,meta={}){resume();switch(kind){
 case 'camera':noise(.035,.035,4800);tone(1100,.055,'square',.028,{to:820});tone(1760,.08,'sine',.02,{when:.055});break;
 case 'kitchen_start':noise(.045,.025,3100,{pan:-.2});tone(310,.06,'triangle',.025,{pan:-.2});break;
 case 'kitchen_hit':{const good=Number(meta.score||0)>.63;tone(good?710:230,.06,'triangle',good?.045:.03,{to:good?920:180});if(good)tone(1065,.07,'sine',.025,{when:.045});else noise(.05,.025,800);break}
 case 'serve':tone(520,.08,'triangle',.04);tone(meta.quality>=4?1040:780,.14,'sine',.035,{when:.065});if(meta.special)tone(1320,.22,'sine',.028,{when:.16,to:1760});break;
 case 'door':noise(.045,.018,1600,{pan:-.65});tone(185,.09,'triangle',.024,{pan:-.65,to:140});break;
 case 'vip_arrive':tone(392,.15,'triangle',.035);tone(587,.18,'triangle',.032,{when:.1});tone(784,.28,'sine',.035,{when:.22});break;
 case 'walkout':tone(210,.16,'triangle',.035,{to:135});tone(112,.22,'sine',.025,{when:.1});break;
 case 'craft':noise(.09,.045,2300);tone(180,.12,'triangle',.04,{to:115});tone(720,.24,'sine',.04,{when:.12,to:1080});break;
 case 'expedition_clear':tone(330,.15,'triangle',.035);tone(495,.18,'triangle',.04,{when:.1});tone(660,.35,'sine',.045,{when:.23});break;
 case 'boss_clear':noise(.35,.045,620);tone(82,.7,'sawtooth',.055,{to:55});tone(440,.18,'triangle',.04,{when:.18});tone(660,.22,'triangle',.045,{when:.32});tone(990,.6,'sine',.05,{when:.48});break;
 case 'tideboard':tone(294,.055,'triangle',.018,{to:370});tone(440,.08,'sine',.014,{when:.045});break;
 case 'tournament':tone(392,.09,'triangle',.026);tone(523,.11,'triangle',.024,{when:.075});tone(659,.17,'sine',.022,{when:.16});break;
 case 'world_record':tone(330,.11,'triangle',.03);tone(494,.13,'triangle',.028,{when:.08});tone(659,.15,'triangle',.03,{when:.17});tone(988,.28,'sine',.026,{when:.28});break;
 case 'community_complete':tone(262,.09,'triangle',.024);tone(392,.11,'triangle',.025,{when:.07});tone(523,.14,'triangle',.027,{when:.15});tone(784,.3,'sine',.024,{when:.25});break;
 case 'location_enter':{const t=String(meta.type||'ruin');if(t==='wreck'){tone(58,.62,'triangle',.018,{route:'amb',to:46});tone(116,.28,'sine',.009,{route:'amb',when:.14,to:91});}else if(t==='cave'){tone(72,.55,'sine',.014,{route:'amb',to:54});tone(143,.32,'sine',.006,{route:'amb',when:.18,to:108});}else if(t==='facility'){tone(132,.12,'triangle',.015,{route:'amb'});tone(264,.1,'sine',.011,{route:'amb',when:.16});tone(88,.5,'sine',.008,{route:'amb',when:.24,to:68});}else{tone(96,.48,'sine',.013,{route:'amb',to:76});tone(192,.3,'triangle',.007,{route:'amb',when:.16,to:151});}break}
 case 'mechanism':{const task=String(meta.task||'scan');if(task==='cut'){noise(.07,.018,1450);tone(138,.12,'triangle',.016,{to:92});}else if(task==='power'){tone(92,.18,'sine',.014,{to:184});tone(368,.14,'triangle',.012,{when:.15,to:442});}else if(task==='line'){tone(154,.1,'triangle',.012,{to:118});tone(232,.08,'sine',.009,{when:.1});}else if(task==='align'){tone(246,.16,'sine',.013,{to:328});tone(492,.22,'sine',.011,{when:.14,to:615});}else if(task==='artifact'){tone(164,.15,'triangle',.012,{to:220});}else{tone(310,.12,'sine',.01,{to:410});}break}
 case 'artifact':tone(220,.13,'triangle',.022,{to:330});tone(440,.18,'triangle',.021,{when:.09,to:554});tone(880,.32,'sine',.018,{when:.22,to:1100});break;
 case 'radio':tone(740,.028,'square',.012,{to:620});tone(980,.026,'sine',.009,{when:.035,to:760});break;
 case 'campaign_reveal':tone(110,.55,'sine',.022,{route:'music',to:82});tone(220,.34,'triangle',.018,{route:'music',when:.16,to:330});tone(660,.48,'sine',.015,{route:'music',when:.32,to:880});break;
 case 'deep_signal':tone(42,1.7,'sine',.028,{route:'music',to:34});tone(84,1.2,'triangle',.013,{route:'music',when:.22,to:61});tone(336,.7,'sine',.008,{route:'music',when:.55,to:252});break;
 case 'erebos_power':tone(72,.32,'triangle',.018,{to:144});tone(288,.2,'sine',.014,{when:.22,to:430});break;
 case 'campaign_complete':tone(110,.5,'sine',.025,{route:'music',to:165});tone(330,.34,'triangle',.028,{route:'music',when:.18,to:440});tone(550,.38,'triangle',.026,{route:'music',when:.38,to:660});tone(990,.8,'sine',.027,{route:'music',when:.64,to:1320});break;
 case 'legacy_unlock':tone(196,.12,'triangle',.02);tone(294,.16,'triangle',.022,{when:.09});tone(392,.25,'sine',.018,{when:.2});break;
 case 'renown':tone(330,.07,'triangle',.018);tone(495,.11,'sine',.016,{when:.06});break;
 case 'ui':tone(360,.045,'triangle',.022,{to:460});break;
 }}

function ecologyCue(kind,run){const pan=clamp(((run?.player?.x||480)-480)/480,-.75,.75);switch(kind){
 case 'whale_song':tone(82,1.6,'sine',.018,{route:'amb',pan:-.55,to:58});tone(123,1.2,'sine',.009,{route:'amb',pan:-.48,when:.35,to:91});break;
 case 'predator_hunt':tone(54,.42,'triangle',.02,{route:'amb',pan,to:42});tone(108,.18,'sine',.009,{route:'amb',pan,when:.18,to:76});break;
 case 'current_shift':tone(96,.8,'sine',.008,{route:'amb',pan,to:71});tone(141,.55,'triangle',.004,{route:'amb',pan:-pan,when:.16,to:110});break;
 case 'bloom':tone(410,.36,'sine',.01,{route:'amb',pan:-.25,to:620});tone(690,.42,'sine',.008,{route:'amb',pan:.3,when:.18,to:930});break;
 case 'mega_fauna':tone(37,1.3,'sine',.021,{route:'amb',pan:.45,to:31});tone(61,.8,'triangle',.007,{route:'amb',pan:.25,when:.22,to:46});break;
 case 'migration_surge':tone(176,.3,'triangle',.008,{route:'amb',pan:-.35,to:222});tone(264,.33,'sine',.006,{route:'amb',pan:.35,when:.12,to:330});break;
 case 'wreck_exposed':tone(118,.32,'triangle',.009,{route:'amb',pan:.2,to:86});tone(244,.12,'sine',.006,{route:'amb',pan:.25,when:.22});break;
 case 'sediment':tone(49,.5,'sine',.007,{route:'amb',pan,to:39});break;
 }}

function ping(){resume();tone(880,.55,'sine',.095,{to:1760});tone(1320,.4,'sine',.032,{when:.08,to:690});noise(.08,.012,4200)}
function harpoon(){resume();noise(.065,.075,4300);tone(195,.12,'triangle',.052,{to:84})}
function impact(){resume();noise(.12,.095,900);tone(72,.18,'sine',.085,{to:40})}
function catchSfx(ancient=false){tone(440,.15,'triangle',.052);tone(660,.17,'triangle',.06,{when:.08});tone(880,.32,'sine',.07,{when:.17});if(ancient){noise(.5,.04,450);tone(108,.9,'sawtooth',.065,{to:54});tone(1760,.52,'sine',.05,{when:.28,to:880})}}
function warning(){tone(160,.16,'square',.04);tone(130,.20,'square',.038,{when:.19})}
function bossStinger(){noise(.85,.05,420);tone(48,1.6,'sawtooth',.085,{to:31});tone(73,1.1,'sine',.075,{when:.12,to:43});tone(146,.62,'triangle',.045,{when:.28,to:90});tone(292,.5,'sine',.025,{when:.48,to:146})}
function ui(kind='click'){if(kind==='hover')tone(520,.03,'sine',.012);else play('ui')}
function restaurantTick(dt){S.last.restaurant-=dt;if(S.last.restaurant>0)return;S.last.restaurant=2.0+Math.random()*4.2;if(Math.random()<.52){const pan=Math.random()*1.4-.7;tone(860+Math.random()*280,.025,'sine',.0045,{pan});if(Math.random()<.34)tone(1320+Math.random()*240,.018,'sine',.0032,{pan,when:.045})}}
function harbourTick(dt){S.last.harbour-=dt;if(S.last.harbour>0)return;S.last.harbour=4.2+Math.random()*6.5;const pan=Math.random()*1.2-.6;tone(76,.52,'sine',.0065,{route:'amb',pan,to:58});tone(112,.38,'triangle',.0024,{route:'amb',pan,when:.08,to:86});if(Math.random()<.22){tone(1250,.18,'sine',.0065,{route:'amb',pan:.65,to:980});tone(1450,.14,'sine',.0045,{route:'amb',pan:.7,when:.14,to:1100})}}
function update(run,dt){if(S.scene==='restaurant'){restaurantTick(dt);return}if(S.scene!=='dive'||!run){harbourTick(dt);return}S.run=run;const st=run.stats||{},h=run.harpoon||{};
 if(st.shots>S.last.shots){harpoon();S.last.shots=st.shots}if(st.hits>S.last.hits){impact();S.last.hits=st.hits}if(st.sonars>S.last.sonars){ping();S.last.sonars=st.sonars}
 if(run.eventBanner?.serial&&run.eventBanner.serial!==S.last.event){S.last.event=run.eventBanner.serial;if(run.eventBanner.type==='ancient')bossStinger();else if(run.eventBanner.type==='danger')warning();else if(run.eventBanner.type==='legendary')tone(220,.5,'triangle',.065,{to:440})}
 if(run.recentCatch?.serial&&run.recentCatch.serial!==S.last.catch){S.last.catch=run.recentCatch.serial;catchSfx(!!run.recentCatch.boss||run.recentCatch.rarity==='ancient')}
 if(run.boss?.activeFish&&!S.last.boss){S.last.boss=true;bossStinger()}if(!run.boss?.activeFish)S.last.boss=false;
 const danger=clamp((run.boss?.activeFish?1:0)+(run.player?.o2<28?.65:0)+(run.player?.hp<35?.5:0)+(run.mode==='descent'?Math.min(.65,(run.descent?.layer||1)*.08):0),0,1.6);if(S.danger?.g&&S.ctx)S.danger.g.gain.setTargetAtTime(.0001+danger*.018,S.ctx.currentTime,.18);if(S.ctx){const duck=run.boss?.activeFish?.72:run.player?.o2<18?.80:1;S.amb?.gain.setTargetAtTime(clamp(S.mix.ambience*duck,0,.8),S.ctx.currentTime,.25);S.music?.gain.setTargetAtTime(clamp(S.mix.music*(run.boss?.activeFish?1.08:1),0,.8),S.ctx.currentTime,.25)}
 if(h.fight){const t=clamp(h.fight.tension,0,1);S.last.tension-=dt;if(t>.76&&S.last.tension<=0){S.last.tension=.16+(.96-t)*.45;noise(.045,.011+.025*t,1800,{pan:(h.fight.fish?.x||480)/480-1});tone(95+t*45,.06,'triangle',.012+t*.02)}}else S.last.tension=0;
 if(run.player?.o2<26){S.last.o2Beat-=dt;if(S.last.o2Beat<=0){S.last.o2Beat=.62+(run.player.o2/26)*.42;tone(62,.09,'sine',.05);tone(48,.11,'sine',.04,{when:.12})}}else S.last.o2Beat=0;
 S.last.creak-=dt;if((run.biome?.max_depth>575||run.mode==='descent')&&S.last.creak<=0){S.last.creak=2.2+Math.random()*4.2;tone(32+Math.random()*8,.28,'triangle',.011,{pan:Math.random()*1.2-.6,to:28+Math.random()*5})}
 if(run.mode==='descent'&&Number(run.descent?.layer||1)>S.last.descent){S.last.descent=Number(run.descent.layer);tone(70,.65,'sawtooth',.04,{to:43});tone(210,.35,'sine',.02,{when:.18,to:110})}
 const ecoCount=Number(run.stats?.ecologyEvents||0);if(ecoCount>S.last.ecoEvent){S.last.ecoEvent=ecoCount;ecologyCue(run.ecology?.history?.[0],run)}
}
function setMix(mix={}){S.mix={...S.mix,...mix};if(S.ctx){S.sfx?.gain.setTargetAtTime(clamp(Number(S.mix.sfx)||0,0,1.25),S.ctx.currentTime,.08);S.amb?.gain.setTargetAtTime(clamp(Number(S.mix.ambience)||0,0,.8),S.ctx.currentTime,.18);S.music?.gain.setTargetAtTime(clamp(Number(S.mix.music)||0,0,.8),S.ctx.currentTime,.18)}}
function setVolume(v){S.volume=clamp(Number(v)||0,0,1);localStorage.setItem('repoDiverVolume',String(S.volume));if(S.master&&S.ctx)S.master.gain.setTargetAtTime(S.muted?0:S.volume,S.ctx.currentTime,.04)}
function toggleMute(){S.muted=!S.muted;if(S.master&&S.ctx)S.master.gain.setTargetAtTime(S.muted?0:S.volume,S.ctx.currentTime,.04);return S.muted}
window.RepoDiverAudio={setScene,update,play,ui,ping,harpoon,hit:impact,warning,bossStinger,setVolume,setMix,toggleMute,resume,get volume(){return S.volume},get muted(){return S.muted},get mix(){return {...S.mix}}};
document.addEventListener('pointerdown',e=>{if(e.target?.closest?.('#repoDiverDialog'))resume()},{passive:true});
document.addEventListener('click',e=>{const b=e.target?.closest?.('#repoDiverDialog button');if(b&&!b.closest?.('.rd-canvas-wrap')&&!b.matches?.('#rdCookHit'))ui('click')},true);
})();
