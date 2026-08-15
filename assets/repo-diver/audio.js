(() => {
'use strict';
if(window.RepoDiverAudio)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const S={ctx:null,master:null,sfx:null,amb:null,music:null,compressor:null,scene:'',run:null,nodes:[],timer:null,muted:false,volume:clamp(Number(localStorage.getItem('repoDiverVolume')||.58),0,1),last:{shots:0,hits:0,sonars:0,event:0,catch:0,boss:false,o2Beat:0,creak:0,restaurant:0,harbour:0,descent:1,tension:0},danger:null};
function audioCtx(){
 if(S.ctx)return S.ctx;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;const c=S.ctx=new C();
 S.master=c.createGain();S.sfx=c.createGain();S.amb=c.createGain();S.music=c.createGain();S.compressor=c.createDynamicsCompressor();
 S.master.gain.value=S.muted?0:S.volume;S.sfx.gain.value=.92;S.amb.gain.value=.62;S.music.gain.value=.34;
 S.compressor.threshold.value=-12;S.compressor.knee.value=16;S.compressor.ratio.value=4;S.compressor.attack.value=.008;S.compressor.release.value=.22;
 S.sfx.connect(S.compressor);S.amb.connect(S.compressor);S.music.connect(S.compressor);S.compressor.connect(S.master);S.master.connect(c.destination);return c;
}
function resume(){const c=audioCtx();if(c?.state==='suspended')c.resume().catch(()=>{})}
function route(kind='sfx'){audioCtx();return kind==='amb'?S.amb:kind==='music'?S.music:S.sfx}
function panNode(pan=0){const c=audioCtx();if(!c||!c.createStereoPanner)return null;const p=c.createStereoPanner();p.pan.value=clamp(pan,-1,1);return p}
function tone(freq,dur=.12,type='sine',gain=.08,opts={}){const c=audioCtx();if(!c)return;const when=Math.max(0,opts.when||0),o=c.createOscillator(),g=c.createGain(),dest=route(opts.route||'sfx'),p=panNode(opts.pan||0);o.type=type;o.frequency.setValueAtTime(Math.max(20,freq),c.currentTime+when);if(opts.to)o.frequency.exponentialRampToValueAtTime(Math.max(20,opts.to),c.currentTime+when+dur);if(opts.detune)o.detune.value=opts.detune;g.gain.setValueAtTime(.0001,c.currentTime+when);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),c.currentTime+when+.008);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+when+dur);o.connect(g);if(p){g.connect(p);p.connect(dest)}else g.connect(dest);o.start(c.currentTime+when);o.stop(c.currentTime+when+dur+.03)}
function noise(dur=.15,gain=.06,cut=1800,opts={}){const c=audioCtx();if(!c)return;const n=Math.max(1,Math.floor(c.sampleRate*dur)),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(opts.fade===false?1:(1-i/n));const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),p=panNode(opts.pan||0),dest=route(opts.route||'sfx');src.buffer=buf;f.type=opts.filter||'lowpass';f.frequency.value=cut;f.Q.value=opts.q||.4;g.gain.value=gain;src.connect(f);f.connect(g);if(p){g.connect(p);p.connect(dest)}else g.connect(dest);src.start(c.currentTime+Math.max(0,opts.when||0))}
function loopNoise(cut=500,gain=.02,filter='lowpass'){const c=audioCtx();if(!c)return null;const len=c.sampleRate*3,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=buf;src.loop=true;f.type=filter;f.frequency.value=cut;f.Q.value=.5;g.gain.value=gain;src.connect(f);f.connect(g);g.connect(S.amb);src.start();S.nodes.push(src,g,f);return {src,g,f}}
function loopTone(freq,type='sine',gain=.02,routeName='amb',detune=0){const c=audioCtx();if(!c)return null;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;o.detune.value=detune;g.gain.value=gain;o.connect(g);g.connect(route(routeName));o.start();S.nodes.push(o,g);return {o,g}}
function stopScene(){if(S.timer){clearTimeout(S.timer);S.timer=null}for(const n of S.nodes){try{n.stop?.()}catch(_){}}S.nodes=[];S.danger=null}
function scheduleRoomTone(kind){if(!['restaurant','harbour'].includes(kind))return;const tick=()=>{if(S.scene!==kind)return;if(kind==='restaurant'){noise(.035,.008,2600,{pan:Math.random()*1.4-.7});if(Math.random()<.45)tone(820+Math.random()*560,.035,'sine',.006,{pan:Math.random()*1.4-.7});}else{noise(.72,.011,360,{route:'amb',pan:Math.random()*1.5-.75});if(Math.random()<.3){tone(1220,.17,'sine',.008,{route:'amb',pan:.65,to:970});tone(1440,.13,'sine',.005,{route:'amb',pan:.7,when:.14,to:1080});}}S.timer=setTimeout(tick,(kind==='restaurant'?1200:3400)+Math.random()*(kind==='restaurant'?2600:4800));};S.timer=setTimeout(tick,kind==='restaurant'?800:2200)}
function startScene(kind,run){resume();stopScene();S.scene=kind;S.run=run||null;if(kind==='dive'){
 const b=run?.biome?.id||'karamja',deep=clamp((run?.biome?.max_depth||100)/1000,0,1);loopTone(44-deep*10,'sine',.028,'amb');loopTone(67-deep*12,'triangle',.012,'amb',-7);const wash=loopNoise(360+deep*120,.018,'lowpass');
 if(['fremennik','pale'].includes(b)){loopNoise(1300,.014,'bandpass');loopTone(152,'sine',.005,'amb',7)}
 if(['kelp','coral','karamja'].includes(b))loopNoise(820,.009,'bandpass');
 if(['abyssal','midnight','endless'].includes(b)){loopTone(31,'sine',.025,'amb');loopTone(38,'sine',.010,'music',-11)}
 if(['volcanic','blackrift'].includes(b)){loopNoise(260,.019,'lowpass');loopTone(53,'sawtooth',.009,'amb',-8)}
 if(['ruins','citadel','cathedral'].includes(b)){loopTone(96,'sine',.008,'music');loopTone(144,'sine',.004,'music',5)}
 S.danger=loopTone(55,'sawtooth',.0001,'music',-9);if(wash?.f)wash.f.frequency.value=350+deep*190;
 }else if(kind==='restaurant'){
  loopTone(82,'triangle',.008,'amb');loopTone(123,'sine',.006,'amb',4);loopNoise(1500,.004,'bandpass');
 }else{loopTone(69,'sine',.014,'amb');loopTone(104,'triangle',.005,'amb',-5);loopNoise(520,.012,'lowpass')}
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
 case 'ui':tone(360,.045,'triangle',.022,{to:460});break;
 }}
function ping(){resume();tone(880,.55,'sine',.095,{to:1760});tone(1320,.4,'sine',.032,{when:.08,to:690});noise(.08,.012,4200)}
function harpoon(){resume();noise(.065,.075,4300);tone(195,.12,'triangle',.052,{to:84})}
function impact(){resume();noise(.12,.095,900);tone(72,.18,'sine',.085,{to:40})}
function catchSfx(ancient=false){tone(440,.15,'triangle',.052);tone(660,.17,'triangle',.06,{when:.08});tone(880,.32,'sine',.07,{when:.17});if(ancient){noise(.5,.04,450);tone(108,.9,'sawtooth',.065,{to:54});tone(1760,.52,'sine',.05,{when:.28,to:880})}}
function warning(){tone(160,.16,'square',.04);tone(130,.20,'square',.038,{when:.19})}
function bossStinger(){noise(.85,.05,420);tone(48,1.6,'sawtooth',.085,{to:31});tone(73,1.1,'sine',.075,{when:.12,to:43});tone(146,.62,'triangle',.045,{when:.28,to:90});tone(292,.5,'sine',.025,{when:.48,to:146})}
function ui(kind='click'){if(kind==='hover')tone(520,.03,'sine',.012);else play('ui')}
function restaurantTick(dt){S.last.restaurant-=dt;if(S.last.restaurant>0)return;S.last.restaurant=1.2+Math.random()*2.7;if(Math.random()<.45){noise(.035,.009,2400,{pan:Math.random()*1.4-.7});tone(900+Math.random()*500,.025,'sine',.006,{pan:Math.random()*1.4-.7})}}
function harbourTick(dt){S.last.harbour-=dt;if(S.last.harbour>0)return;S.last.harbour=3.5+Math.random()*5;noise(.65,.012,380,{route:'amb',pan:Math.random()*1.6-.8});if(Math.random()<.28){tone(1250,.18,'sine',.009,{route:'amb',pan:.65,to:980});tone(1450,.14,'sine',.006,{route:'amb',pan:.7,when:.14,to:1100})}}
function update(run,dt){if(S.scene==='restaurant'){restaurantTick(dt);return}if(S.scene!=='dive'||!run){harbourTick(dt);return}S.run=run;const st=run.stats||{},h=run.harpoon||{};
 if(st.shots>S.last.shots){harpoon();S.last.shots=st.shots}if(st.hits>S.last.hits){impact();S.last.hits=st.hits}if(st.sonars>S.last.sonars){ping();S.last.sonars=st.sonars}
 if(run.eventBanner?.serial&&run.eventBanner.serial!==S.last.event){S.last.event=run.eventBanner.serial;if(run.eventBanner.type==='ancient')bossStinger();else if(run.eventBanner.type==='danger')warning();else if(run.eventBanner.type==='legendary')tone(220,.5,'triangle',.065,{to:440})}
 if(run.recentCatch?.serial&&run.recentCatch.serial!==S.last.catch){S.last.catch=run.recentCatch.serial;catchSfx(!!run.recentCatch.boss||run.recentCatch.rarity==='ancient')}
 if(run.boss?.activeFish&&!S.last.boss){S.last.boss=true;bossStinger()}if(!run.boss?.activeFish)S.last.boss=false;
 const danger=clamp((run.boss?.activeFish?1:0)+(run.player?.o2<28?.65:0)+(run.player?.hp<35?.5:0)+(run.mode==='descent'?Math.min(.65,(run.descent?.layer||1)*.08):0),0,1.6);if(S.danger?.g&&S.ctx)S.danger.g.gain.setTargetAtTime(.0001+danger*.018,S.ctx.currentTime,.18);
 if(h.fight){const t=clamp(h.fight.tension,0,1);S.last.tension-=dt;if(t>.76&&S.last.tension<=0){S.last.tension=.16+(.96-t)*.45;noise(.045,.011+.025*t,1800,{pan:(h.fight.fish?.x||480)/480-1});tone(95+t*45,.06,'triangle',.012+t*.02)}}else S.last.tension=0;
 if(run.player?.o2<26){S.last.o2Beat-=dt;if(S.last.o2Beat<=0){S.last.o2Beat=.62+(run.player.o2/26)*.42;tone(62,.09,'sine',.05);tone(48,.11,'sine',.04,{when:.12})}}else S.last.o2Beat=0;
 S.last.creak-=dt;if((run.biome?.max_depth>575||run.mode==='descent')&&S.last.creak<=0){S.last.creak=2.2+Math.random()*4.2;noise(.14,.012,250);tone(32+Math.random()*8,.28,'triangle',.014,{pan:Math.random()*1.2-.6})}
 if(run.mode==='descent'&&Number(run.descent?.layer||1)>S.last.descent){S.last.descent=Number(run.descent.layer);tone(70,.65,'sawtooth',.04,{to:43});tone(210,.35,'sine',.02,{when:.18,to:110})}
}
function setVolume(v){S.volume=clamp(Number(v)||0,0,1);localStorage.setItem('repoDiverVolume',String(S.volume));if(S.master&&S.ctx)S.master.gain.setTargetAtTime(S.muted?0:S.volume,S.ctx.currentTime,.04)}
function toggleMute(){S.muted=!S.muted;if(S.master&&S.ctx)S.master.gain.setTargetAtTime(S.muted?0:S.volume,S.ctx.currentTime,.04);return S.muted}
window.RepoDiverAudio={setScene,update,play,ui,ping,harpoon,hit:impact,warning,bossStinger,setVolume,toggleMute,resume,get volume(){return S.volume},get muted(){return S.muted}};
document.addEventListener('pointerdown',e=>{if(e.target?.closest?.('#repoDiverDialog'))resume()},{passive:true});
document.addEventListener('click',e=>{const b=e.target?.closest?.('#repoDiverDialog button');if(b&&!b.closest?.('.rd-canvas-wrap')&&!b.matches?.('#rdCookHit'))ui('click')},true);
})();
