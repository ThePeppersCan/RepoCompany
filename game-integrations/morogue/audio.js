(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ROUGE_MORA_AUDIO=factory();})(globalThis,function(){
  'use strict';
  const MAX_VOICES=6;
  const scriptUrl=typeof document==='object'?document.currentScript?.src:null;
  const soundUrl=file=>scriptUrl?new URL(file,scriptUrl).href:'interface/vampire-survivor/'+file;
  const SHOOTING_STAR_SOUNDS={
    shooting_star_cast:{url:soundUrl('shooting-star-cast.wav'),gain:.62,duration:.64,fadeIn:.008,fadeOut:.06},
    shooting_star_impact:{url:soundUrl('shooting-star-impact.wav'),gain:.68,duration:.7,fadeIn:.004,fadeOut:.08}
  };
  const CARD_TURN={url:'assets/morogue/food-cards/card-turn.mp3',gain:.65,duration:.504,fadeIn:.003,fadeOut:.035};
  const SPECIAL_READY={url:'assets/morogue/special-ready-butterfly.mp3',gain:.72,duration:1.071,fadeIn:.008,fadeOut:.09};
  const PASSAGE_SOUNDS={
    passage_bite:{url:'assets/morogue/passage-sfx/mushroom-bite.mp3',gain:1,duration:.74,fadeIn:.005,fadeOut:.08},
    passage_moan:{url:'assets/morogue/passage-sfx/fever-moan.mp3',gain:1,duration:1.70,fadeIn:.10,fadeOut:.38}
  };
  const FINALE_FLOORS=['uncrowned_floor_1','uncrowned_floor_2','uncrowned_floor_3','uncrowned_floor_4'];
  const SPECIAL_CAST={steam:'lance_cast',bell:'bell_brace',garden:'briar_plant',comet:'shooting_star_cast',tide:'undertow_cast',clock:'time_field_open'};
  // Already-levelled recordings: allow for the shared compressor's makeup gain.
  // Quiet details stay below casts and boss tells, even in crowded fights.
  const BUILD_CUES={
    lance_hit:{group:'specialHit',gap:.14,volume:.55},
    briar_pulse:{group:'fieldPulse',gap:.28,volume:.55,variants:['briar_pulse','briar_pulse_02','briar_pulse_03']},
    briar_bloom:{group:'specialImpact',gap:.18,volume:.6,priority:2},
    undertow_return:{group:'specialHit',gap:.25,volume:.38,variants:['undertow_cast']},
    time_field_close:{group:'fieldClose',gap:.3,volume:.55},
    ricochet:{group:'ricochet',gap:.15,volume:.55,variants:['ricochet','ricochet_02','ricochet_03']},
    coffee_spill:{group:'spill',gap:.2,volume:.55},
    trap_detonate:{group:'trap',gap:.18,volume:.55,priority:2},
    returning_blade_throw:{group:'bladeThrow',gap:.3,volume:.5},
    returning_blade_catch:{group:'bladeCatch',gap:.2,volume:.6},
    blade_pin:{group:'pin',gap:.25,volume:.55},
    decoy:{group:'decoy',gap:.5,volume:.5},
    enemy_mark:{group:'mark',gap:.15,volume:.5}
  };
  function create(context,bank,{volume=.6,random=Math.random}={}){
    bank={...bank,...SHOOTING_STAR_SOUNDS};
    const buffers=new Map(),voices=new Set(),last=new Map(),variants=new Map(),urlBuffers=new Map();
    const passages=new WeakMap();let currentPassage=null;
    const input=context.createDynamicsCompressor(),output=context.createGain();
    input.threshold.value=-12;input.knee.value=8;input.ratio.value=8;input.attack.value=.003;input.release.value=.14;
    input.connect(output);output.connect(context.destination);
    let level=volume,muted=false,serial=0,stopEpoch=0;
    const stats={played:0,dropped:0,peakVoices:0,decoded:0,failed:[],history:[]};
    const gain=()=>{output.gain.setTargetAtTime(muted?0:level,context.currentTime,.025);};gain();
    const ready=Promise.all(Object.entries(bank||{}).map(async([id,spec])=>{
      try{let buffer;if(spec.url){if(!urlBuffers.has(spec.url))urlBuffers.set(spec.url,(async()=>{const response=await fetch(spec.url);if(!response.ok)throw Error('Missing sound');return context.decodeAudioData(await response.arrayBuffer());})());buffer=await urlBuffers.get(spec.url);}else buffer=await context.decodeAudioData(Uint8Array.from(atob(spec.data),c=>c.charCodeAt(0)).buffer);buffers.set(id,buffer);stats.decoded++;}catch{stats.failed.push(id);}
    }));
    function stopVoice(v){if(!voices.delete(v))return;const now=context.currentTime;v.gain.gain.cancelScheduledValues(now);v.gain.gain.setTargetAtTime(0,now,.003);try{v.source.stop(now+.015);}catch{}}
    function stop(combatOnly=false,keepEnding=false){if(!combatOnly)stopEpoch++;for(const v of [...voices])if((!keepEnding||v.group!=='ending')&&(!combatOnly||!['ui','warning'].includes(v.group)))stopVoice(v);}
    function choose(ids){const available=ids.filter(id=>id!==variants.get(ids.join(','))),id=available[Math.floor(random()*available.length)]||ids[0];return id;}
    function play(id,{group='attack',gap=.1,limit=2,priority=1,volume=1,pitch=1,variation=.035,duration}={}){
      if(muted||level===0||context.state==='suspended'||context.state==='closed')return false;
      const buffer=buffers.get(id),spec=bank[id],now=context.currentTime;
      if(!buffer||now-(last.get(group)??-99)<gap){stats.dropped++;return false;}
      const same=[...voices].filter(v=>v.group===group);
      if(same.length>=limit)stopVoice(same[0]);
      if(voices.size>=MAX_VOICES){const victim=[...voices].sort((a,b)=>a.priority-b.priority||a.serial-b.serial)[0];if(victim.priority>priority){stats.dropped++;return false;}stopVoice(victim);}
      // Keep warning space free without interrupting the soundtrack.
      if(group==='warning')for(const v of voices)if(v.priority<priority)v.gain.gain.setTargetAtTime(v.volume*.45,now,.015);
      const source=context.createBufferSource(),node=context.createGain(),rate=pitch*(1+(random()*2-1)*variation);
      source.buffer=buffer;source.playbackRate.value=rate;
      const offset=spec.offset||0,seconds=Math.min(duration||spec.duration,buffer.duration-offset),life=seconds/rate,amplitude=spec.gain*volume;
      const fadeIn=Math.min(spec.fadeIn??.004,life*.2),fadeOut=Math.min((spec.fadeOut??.065)/rate,life*.4);
      node.gain.setValueAtTime(0,now);node.gain.linearRampToValueAtTime(amplitude,now+fadeIn);node.gain.setValueAtTime(amplitude,now+Math.max(fadeIn,life-fadeOut));node.gain.linearRampToValueAtTime(0,now+life);
      source.connect(node);node.connect(input);const voice={source,gain:node,group,priority,serial:serial++,volume:amplitude};voices.add(voice);
      source.onended=()=>{voices.delete(voice);source.disconnect();node.disconnect();};source.start(now,offset,seconds);
      last.set(group,now);stats.played++;stats.peakVoices=Math.max(stats.peakVoices,voices.size);stats.history.push({id,group,time:now,rate,volume,life});if(stats.history.length>80)stats.history.shift();return true;
    }
    function variantCue(ids,options){ids=ids.filter(id=>bank[id]);if(!ids.length)return false;const id=choose(ids);if(play(id,options)){variants.set(ids.join(','),id);return true;}return false;}
    function entranceCue(id,options){const epoch=stopEpoch,at=context.currentTime;if(buffers.has(id))return play(id,options);ready.then(()=>{if(epoch===stopEpoch&&context.currentTime-at<1.5)play(id,options);});return true;}
    // Cross visual beats using the protected transition clock, never wall-clock timers.
    // This follows pause, loading holds and slow review playback without duplicates.
    function updatePassage(tr,active=true){
      if(currentPassage!==tr||!active){for(const v of [...voices])if(v.group==='passageBite'||v.group==='passageMoan')stopVoice(v);currentPassage=tr;}
      if(!active||!globalThis.MOROGUE_PASSAGE_ART?.supported(tr))return;
      const t=tr.age/tr.duration;let done=passages.get(tr);if(!done){done=new Set();passages.set(tr,done);}
      for(const cue of [{id:'passage_bite',at:.30,late:.08,group:'passageBite',volume:.48},{id:'passage_moan',at:.365,late:.12,group:'passageMoan',volume:.40}]){
        if(done.has(cue.id)||t<cue.at)continue;
        if(t>cue.at+cue.late||muted||level===0||context.state!=='running'){done.add(cue.id);continue;}
        if(buffers.has(cue.id)){done.add(cue.id);play(cue.id,{group:cue.group,gap:0,limit:1,volume:cue.volume,variation:0,priority:3,duration:Math.min(bank[cue.id].duration,Math.max(.05,tr.duration-tr.age-.10))});}
      }
    }
    function handle(type,event={}){
      if(['mirrorlord','huntsman','nightmayor'].includes(event.id)){
        const cues={mirrorlord:{tell:'prism_warning',swing:'sweep',impact:'prism_impact',pitch:.86},huntsman:{tell:'blade_pin',swing:'cut',impact:'compressed_shot',pitch:.76},nightmayor:{tell:'bell_brace',swing:'swing',impact:'impact',pitch:.62}},cue=cues[event.id];
        if(type==='bossTell'){play(cue.tell,{group:'warning',gap:.6,limit:1,volume:.38,pitch:cue.pitch,variation:0,priority:4});return true;}
        if(type==='bossAttack'){play(cue.swing,{group:event.id+'Swing',gap:.5,limit:1,volume:event.id==='huntsman'?.18:.25,pitch:cue.pitch,variation:.01,priority:3});return true;}
        if(type==='bossImpact'){play(cue.impact,{group:event.id+'Impact',gap:.12,limit:2,volume:.45,pitch:cue.pitch,variation:.008,priority:3});return true;}
      }
      if(['baker','groundskeeper','clockmaker'].includes(event.id)){
        const cues={baker:{tell:'sweep',swing:'swing',impact:'impact',pitch:.65},groundskeeper:{tell:'blade_pin',swing:'sweep',impact:'cut',pitch:.78},clockmaker:{tell:'bell_brace',swing:'swing',impact:'blade_pin',pitch:.68}},cue=cues[event.id];
        if(type==='bossTell'){play(cue.tell,{group:'warning',gap:.6,limit:1,volume:.34,pitch:cue.pitch,variation:0,priority:4});return true;}
        if(type==='bossAttack'){play(cue.swing,{group:event.id+'Swing',gap:.5,limit:1,volume:.27,pitch:cue.pitch,variation:.01,priority:3});return true;}
        if(type==='bossImpact'){play(cue.impact,{group:event.id+'Impact',gap:.18,limit:2,volume:.43,pitch:cue.pitch,variation:.01,priority:3});return true;}
      }
      if(event.id==='ferryman'){
        if(type==='bossTell'){play('sweep',{group:'warning',gap:.6,limit:1,volume:.27,pitch:.55,variation:0,priority:4});return true;}
        if(type==='bossAttack'){play('swing',{group:'ferrymanOar',gap:.6,limit:1,volume:.25,pitch:.55,variation:.01,priority:3});return true;}
        if(type==='bossImpact'){play('undertow_cast',{group:'ferrymanWake',gap:.6,limit:1,volume:.42,pitch:event.move==='undertow'?.7:.85,variation:.012,priority:3});return true;}
      }
      if(event.id==='bellkeeper'){
        if(type==='bossTell'){play('bell_brace',{group:'warning',gap:.6,limit:1,volume:.3,pitch:.72,variation:0,priority:4});return true;}
        if(type==='bossImpact'){play('bell_counter',{group:'bellkeeperPeal',gap:.5,limit:2,volume:.43,pitch:.64,variation:.015,priority:3});return true;}
        if(type==='bossAttack'){play('sweep',{group:'bellkeeperSwing',gap:.6,limit:1,volume:.2,pitch:.6,variation:.01,priority:3});return true;}
      }
      if(event.id==='landlord'){
        if(type==='bossTell'){play('blade_pin',{group:'warning',gap:.6,limit:1,volume:.38,pitch:.62,variation:.01,priority:4});return true;}
        if(type==='bossAttack'){play('sweep',{group:'landlordSwing',gap:.5,limit:1,volume:event.move==='stomp'?.22:.5,pitch:event.move==='stomp'?.58:.7,variation:.02,priority:3});return true;}
        if(type==='bossImpact'){play('impact',{group:'landlordImpact',gap:.5,limit:1,volume:.5,pitch:.75,variation:.01,priority:3});return true;}
      }
      if(event.id==='duchess'){
        if(type==='bossTell'){play('sweep',{group:'warning',gap:.6,limit:1,volume:.44,pitch:.72,variation:0,priority:4});return true;}
        if(type==='bossAttack'){play(event.move==='command'?'cut':'blade_pin',{group:'duchessFan',gap:.4,limit:1,volume:event.move==='command'?.42:.46,pitch:event.move==='command'?1.5:1.12,variation:.012,priority:3});return true;}
      }
      if(bank.oracle_shell_rupture){
        const oracleWarnings=['oracle_attack_roar_1','oracle_attack_roar_2','oracle_attack_roar_3','oracle_attack_hiss'];
        if(event.id==='oracle'&&['boss','bossTell','bossPhase'].includes(type)&&oracleWarnings.some(id=>bank[id])){
          // One organic warning per move, never one roar for every wave segment.
          // File gains match the recordings; the hiss deliberately sits lower.
          const options={group:'warning',gap:.75,limit:1,volume:type==='bossTell'?.38:.29,pitch:event.phase>=3?.94:1,variation:.008,priority:4};
          if(type==='boss')entranceCue('oracle_attack_roar_3',options);else variantCue(oracleWarnings,options);
          return true;
        }
        if(type==='oracleRupture'){play('oracle_shell_rupture',{group:'oracleRupture',gap:2.5,limit:1,volume:.55,pitch:.94,variation:0,priority:3});return true;}
        if(type==='oracleStrain'){play('oracle_body_creak',{group:'oracleBody',gap:3,limit:1,volume:.22,pitch:.94,variation:.018,priority:0});return true;}
        if(type==='oracleVoice'){variantCue(['oracle_voice_1','oracle_voice_2','oracle_voice_3'],{group:'oracleVoice',gap:event.transform?3:6.5,limit:1,volume:event.transform?.32:.24,pitch:event.phase===3?.90:1,variation:.012,priority:1});return true;}
        if(type==='bossImpact'&&event.id==='oracle'){if(!event.summon)play('oracle_tidal_impact',{group:'oracleTide',gap:.75,limit:1,volume:.46,variation:0,priority:2});return true;}
        if(type==='bossLanding'&&event.id==='oracle'){play('oracle_tidal_impact',{group:'oracleTide',gap:.75,limit:1,volume:.49,pitch:.94,variation:0,priority:2});return true;}
        if(type==='banished'&&event.foe?.bossType==='oracle'){stop();variantCue(['oracle_voice_1','oracle_voice_2','oracle_voice_3'],{group:'ending',gap:0,limit:1,volume:.32,pitch:.82,variation:0,priority:5});return true;}
      }
      if(type==='oracleRupture'){play('oracle_break',{group:'oracleRupture',gap:2.5,limit:1,volume:.36,pitch:.82,variation:0,priority:3});return true;}
      if(bank.railmaster_jaw){
        if(type==='boss'&&event.id==='railmaster'){entranceCue('railmaster_arrival',{group:'warning',gap:8,limit:1,volume:.38,variation:0,priority:4});return true;}
        if((type==='bossTell'||type==='bossPhase')&&event.id==='railmaster'){variantCue(['railmaster_hooks','railmaster_pressure','railmaster_track'],{group:'warning',gap:.7,limit:1,volume:.60,variation:.025,priority:4});return true;}
        const carriageCues={railHunger:['eating',.72],railTwitch:['twitch',.18],railGape:['gape',.18],railSwallow:['swallow',.24],railInside:['inside',.38],railGlass:['glass',.55],railValve:['shutter',.6],railHooks:['hooks',.53],railPressure:['pressure',.58],railFurnace:['furnace',.57],railGullet:['gullet',.55],railVent:['steam',.4],railIntruder:[event.flying?'wings':'intruder',.34]};
        if(carriageCues[type]){const [id,volume]=carriageCues[type];if(type==='railHunger')stop(true);play('railmaster_'+id,{group:type==='railHunger'?'railEating':type==='railIntruder'?'railCreature':'railCinema',gap:type==='railIntruder'?.9:.12,limit:2,volume,variation:.018,priority:type==='railIntruder'?1:4});return true;}
        if(type==='railRoll'){play('railmaster_rod',{group:'railRod',gap:.7,limit:1,volume:.13,variation:.035,priority:0});return true;}
        if(type==='railStrain'){play('railmaster_strain',{group:'railStrain',gap:1.4,limit:1,volume:.22,variation:0,priority:1});return true;}
        if(type==='railSurge'||type==='railCrossing'){variantCue(['railmaster_track','railmaster_pressure','railmaster_brake'],{group:'railPass',gap:.85,limit:1,volume:type==='railSurge'?.4:.32,variation:.03,priority:2});return true;}
        if(type==='railBrake'){play('railmaster_brake',{group:'railBrake',gap:.5,limit:1,volume:.32,variation:0,priority:2});return true;}
        if(type==='railBite'){play('railmaster_jaw',{group:'railJaw',gap:.38,limit:1,volume:.39,variation:0,priority:3});return true;}
        if(type==='railSteam'){play('railmaster_steam',{group:'railSteam',gap:.30,limit:1,volume:.36,variation:0,priority:2});return true;}
        if(type==='railTrack'){play('railmaster_rod',{group:'railTrack',gap:.30,limit:1,volume:.36,variation:0,priority:2});return true;}
        if(type==='railWindowTap'){play('railmaster_glass',{group:'railWindow',gap:1,limit:1,volume:.17,pitch:.8,duration:.16,variation:.035,priority:1});return true;}
        if(type==='bossImpact'&&event.id==='railmaster'&&event.railInterior){const cue={piston:'shutter',hook:'rod',steam:'steam',furnace:'furnace',jaw:'jaw'}[event.railKind]||'rod';play('railmaster_'+cue,{group:'railImpact',gap:.26,limit:1,volume:.36,variation:.025,priority:3});return true;}
        if(['bossImpact','bossLanding','bossMotion'].includes(type)&&event.id==='railmaster')return true;
        if((type==='ritualBreak'||type==='bossCounterplay')&&event.id==='railmaster'){for(const v of [...voices])if(v.group==='railPass'||v.group==='railStrain')stopVoice(v);play('railmaster_rod',{group:'railSwitch',gap:.2,limit:1,volume:.44,variation:0,priority:3});return true;}
        if(type==='banished'&&event.foe?.bossType==='railmaster'){stop();play('railmaster_brake',{group:'ending',gap:.1,limit:2,volume:.38,pitch:.82,variation:0,priority:5});play('railmaster_steam',{group:'ending',gap:0,limit:2,volume:.32,pitch:.86,variation:0,priority:5});return true;}
      }
      if(['inkEasel','inkGrab','inkThrow','inkTear','inkShatter','inkOpening'].includes(type)){const cue={inkEasel:['magistrate_break',.28,.8],inkGrab:['magistrate_brush_claw',.36,.7],inkThrow:['magistrate_brush_sweep_02',.4,.7],inkTear:['magistrate_brush_scrape',.38,.75],inkShatter:['magistrate_break',.45,.6],inkOpening:['magistrate_warning',.12,1.2]}[type];play(cue[0],{group:'ink:'+type,gap:.3,limit:1,volume:cue[1],pitch:cue[2],variation:.015,priority:3});return true;}
      if(type==='inkEnter'||type==='inkCanvas'){play('magistrate_break',{group:'inkScene',gap:1,limit:1,volume:.35,pitch:type==='inkEnter'?.62:.88,variation:0,priority:4});return true;}
      if(type==='inkPaint'){variantCue(['magistrate_brush_scrape'],{group:'ink:paint',gap:.25,limit:1,volume:.26,pitch:.9,variation:.04,priority:3});return true;}
      if(type==='bossImpact'&&event.pattern==='livingCanvas')return true;
      if(type==='magistrateUnfold'){play('magistrate_break',{group:'magistrateMaterial',gap:2.8,limit:1,volume:.12,pitch:.68,duration:.32,variation:0,priority:0});return true;}
      if(type==='magistrateStroke')return true;
      if(type==='bossLanding'&&event.id==='magistrate'&&bank.magistrate_brush_sweep)return true;
      if(type==='bossImpact'&&event.id==='magistrate'&&bank.magistrate_brush_sweep){
        if(event.summon)return true;
        const rapid=event.pattern==='examination',heavy=event.pattern==='verdict',scrape=event.pattern==='redaction';
        const ids=scrape?['magistrate_brush_scrape','magistrate_brush_sweep_02','magistrate_brush_sweep']:rapid||heavy?['magistrate_brush_claw','magistrate_brush_claw_02']:['magistrate_brush_sweep','magistrate_brush_sweep_02'];
        variantCue(ids,{group:'magistrateBrush',gap:rapid?.12:.22,limit:1,volume:rapid?.23:heavy?.35:.31,variation:.012,duration:rapid?.24:undefined,priority:2});return true;
      }
      if(['beeUnravel','beeUnbind','beeForm','beeRupture','beeCatch','beeCollapse','beeHeart'].includes(type)){
        if(['beeUnravel','beeCollapse','beeHeart','beeCatch'].includes(type))for(const v of [...voices])if(v.group.startsWith('beeChase'))stopVoice(v);
        const cue={beeUnravel:['bee_tension',.40,.83],beeUnbind:['bee_tear',.43,.86],beeForm:['bee_wings',.42,.7],beeRupture:['bee_tear',.48,.64],beeCatch:['bee_tear',.5,.73],beeCollapse:['bee_collapse',.56,1],beeHeart:['bee_tension',.17,.6]}[type];
        play(cue[0],{group:'beeChaseScene',gap:.15,limit:2,volume:cue[1],pitch:cue[2],variation:0,priority:4});return true;
      }
      if(type==='beeWallGather'){play('bee_wings',{group:'beeChaseScene',gap:.1,limit:2,volume:.28,pitch:1.1,variation:0,priority:3});return true;}
      if(type==='beeWallBreak'){play('bee_collapse',{group:'beeChaseWall',gap:1,limit:1,volume:.46,pitch:1.06,variation:0,priority:4});return true;}
      if(type==='beeTunnelRun'){play('bee_swing',{group:'beeChaseTunnel',gap:1,limit:1,volume:.14,pitch:.6,variation:0,priority:1});return true;}
      if(type==='beeChaseCrush'){play('bee_crumble',{group:'beeChaseDestruction',gap:1.6,limit:1,volume:.21,pitch:.68,variation:.04,priority:2});return true;}
      if(type==='beePursuit'){play('bee_wings',{group:'beeChasePursuit',gap:5.8,limit:1,volume:event.close?.25:.13,pitch:.86,variation:.02,priority:0});return true;}
      if(type==='beeSwingTell'){play('bee_swing',{group:'beeChaseTell',gap:.6,limit:1,volume:.30,variation:.025,priority:3});return true;}
      if(type==='beeFallTell'){play('bee_crumble',{group:'beeChaseStone',gap:1.6,limit:1,volume:.24,pitch:1.16,variation:.015,priority:3});return true;}
      if(type==='beeBarrier'||type==='beeImpact'){play(type==='beeBarrier'?'bee_tear':'bee_crumble',{group:'beeChaseBreak',gap:.2,limit:2,volume:event.small?.22:.38,variation:.025,priority:3});return true;}
      if(type==='bossImpact'&&event.id==='beekeeper'&&event.pattern==='beeChase'){play('bee_crumble',{group:'beeChaseStoneHit',gap:.25,limit:2,volume:.32,pitch:.78,variation:.02,priority:3});return true;}
      if(type==='beekeeperSeize'){play('beekeeper_swarm',{group:'beekeeperSwarm',gap:3.2,limit:1,volume:.34,variation:0,priority:1});return true;}
      if(type==='beekeeperBreath'){variantCue(['beekeeper_breath','beekeeper_breath_02','beekeeper_breath_03'],{group:'beekeeperVoice',gap:6.5,limit:1,volume:.28,variation:0,priority:0});return true;}
      if((type==='ritualBreak'||type==='bossCounterplay')&&event.id==='beekeeper')for(const v of [...voices])if(v.group==='beekeeperSwarm')stopVoice(v);
      if(type==='beekeeperTension'){play('beekeeper_break',{group:'beekeeperStrain',gap:1.5,limit:1,volume:.10,pitch:.76,duration:.28,variation:0,priority:0});return true;}
      if(type==='boss'&&event.id==='duelist'&&bank.duelist_laugh){entranceCue('duelist_laugh',{group:'duelistVoice',gap:16,limit:1,volume:.38,variation:0,priority:2});return true;}
      // The transformation keeps its porcelain and flesh sounds, without the metallic draw chime.
      if(type==='bossTell'&&event.id==='duelist'||type==='duelistUnfold'||type==='duelistRetract')return true;
      if(type==='duelistLaugh'){play('duelist_laugh_short',{group:'duelistVoice',gap:16,limit:1,volume:.30,variation:0,priority:0});return true;}
      if(type==='duelistShell'){variantCue(['duelist_ceramic_01','duelist_ceramic_02','duelist_ceramic_03'],{group:'duelistCeramic',gap:.55,limit:1,volume:.28,variation:.008,priority:1});return true;}
      if(type==='duelistFaceTurn'){for(const v of [...voices])if(v.group==='duelistVoice')stopVoice(v);variantCue(['duelist_skin','duelist_skin_02'],{group:'duelistSkin',gap:1,limit:1,volume:.26,variation:.008,priority:0});return true;}
      if(type==='duelistFold'){if(bank.duelist_ceramic_01)variantCue(['duelist_ceramic_01','duelist_ceramic_02','duelist_ceramic_03'],{group:'duelistCeramic',gap:.55,limit:1,volume:.20,variation:.008,priority:0});else play('duelist_break',{group:'duelistHinge',gap:.55,limit:1,volume:.10,pitch:.91,variation:.01,priority:0});return true;}
      if((type==='ritualBreak'||type==='bossCounterplay')&&event.id==='duelist'&&bank.duelist_ceramic_01){variantCue(['duelist_ceramic_01','duelist_ceramic_02','duelist_ceramic_03'],{group:'duelistBreak',gap:.18,limit:1,volume:.39,variation:.008,priority:3});return true;}
      if(type==='banished'&&event.foe?.bossType==='duelist'&&bank.duelist_ceramic_01){stop();play('duelist_ceramic_03',{group:'ending',gap:1,limit:1,volume:.46,pitch:.88,variation:0,priority:5});return true;}
      if(type==='boss'&&event.id==='cantor'&&bank.cantor_arrival){entranceCue('cantor_arrival',{group:'warning',gap:1.8,limit:1,volume:.48,variation:0,priority:4});return true;}
      if(type==='cantorRoof'||type==='cantorCrash'){play('cantor_break',{group:'cantorCollapse',gap:1.5,limit:1,volume:.32,pitch:.82,variation:0,priority:4});play('cantor_rope',{group:'cantorRope',gap:2,limit:1,volume:.27,variation:0,priority:2});return true;}
      if(['cantorReturn','cantorBellFall','cantorReturnHit','cantorStrike'].includes(type)){if(type==='cantorBellFall')play('cantor_break',{group:'cantorFracture',gap:1,limit:1,volume:.27,pitch:.9,variation:0,priority:3});variantCue(['cantor_bell','cantor_bell_02'],{group:'cantorCounterBell',gap:.65,limit:1,volume:type==='cantorBellFall'?.38:.3,pitch:type==='cantorBellFall'?.82:1,variation:.005,priority:3});return true;}
      if(type==='cantorBait'||type==='cantorLower'){play('cantor_rope',{group:'cantorRope',gap:2,limit:1,volume:.24,variation:0,priority:1});return true;}
      if(type==='cantorStrain'){play('cantor_rope',{group:'cantorRope',gap:2.5,limit:1,volume:.32,variation:.008,priority:0});return true;}
      if(type==='cantorChoir'||type==='bossPhase'&&event.id==='cantor'&&bank.cantor_choir){variantCue(['cantor_choir','cantor_choir_02'],{group:'cantorChoir',gap:4.5,limit:1,volume:.32,variation:0,priority:1});return true;}
      if(type==='cantorQuiet'||type==='bossCounterplay'&&event.id==='cantor'){for(const v of [...voices])if(v.group==='cantorChoir'||v.group==='cantorRope')stopVoice(v);return true;}
      if(type==='bossLanding'&&event.id==='cantor'&&bank.cantor_bell){variantCue(['cantor_bell','cantor_bell_02'],{group:'cantorBell',gap:.8,limit:1,volume:.4,variation:.006,priority:3});return true;}
      if(type==='bossImpact'&&event.id==='cantor'&&bank.cantor_bell){
        if(event.pattern==='refrain'&&event.shape==='circle')return true;
        if(event.shape==='line'){play('cantor_impact',{group:'bossImpact',gap:.42,limit:1,volume:.3,variation:0,priority:3});return true;}
        variantCue(['cantor_bell','cantor_bell_02'],{group:'cantorBell',gap:.8,limit:1,volume:.36,variation:.006,priority:3});return true;
      }
      if(type==='banished'&&event.foe?.bossType==='cantor'&&bank.cantor_bell){stop();play('cantor_bell',{group:'ending',gap:1,limit:1,volume:.32,pitch:.86,variation:0,priority:5});return true;}
      if(type==='boss'&&event.id==='star'&&bank.star_tendon){entranceCue('star_tendon',{group:'starTendon',gap:2.8,limit:1,volume:.25,variation:.008,priority:1});return true;}
      if(type==='cantorFracture'){play('cantor_break',{group:'cantorFracture',gap:2,limit:1,volume:.25,variation:.01,priority:2});return true;}
      if(['starUnfold','starPlatformBreak','starLand'].includes(type)){variantCue(['star_core_slam','star_core_slam_02'],{group:'starSlam',gap:.4,limit:1,volume:type==='starLand'?.14:.4,variation:.008,priority:2});return true;}
      if(type==='starPlatformWarning'){play('star_crust_crack',{group:'starBreak',gap:1,limit:1,volume:.24,variation:0,priority:2});return true;}
      if(type==='starStrain'||type==='starCoreDrift'){variantCue(['star_tendon','star_tendon_02','star_tendon_03'],{group:'starTendon',gap:2.8,limit:1,volume:.25,variation:.008,priority:0});return true;}
      if(type==='starGravity'){play('star_gravity_rumble',{group:'starGravity',gap:3.5,limit:1,volume:.28,variation:0,priority:0});return true;}
      if(type==='starGravityEnd'){for(const v of [...voices])if(v.group==='starGravity')stopVoice(v);return true;}
      if(type==='bossLanding'&&event.id==='star'&&bank.star_core_slam){variantCue(['star_core_slam','star_core_slam_02'],{group:'starSlam',gap:.55,limit:1,volume:.46,variation:.008,priority:3});return true;}
      if(type==='bossImpact'&&event.id==='star'&&bank.star_core_slam){
        if(event.pattern==='periapsis'&&event.shape==='circle')return true;
        const slam=event.shape==='circle'&&['horizon','eclipse','ritual'].includes(event.pattern);
        variantCue(slam?['star_core_slam','star_core_slam_02']:['star_crust_crack','star_crust_crack_02','star_crust_crack_03','star_crust_crack_04'],{group:slam?'starSlam':'bossImpact',gap:slam?.55:.42,limit:1,volume:slam?.43:.26,variation:.008,priority:slam?3:2});return true;
      }
      if((type==='ritualBreak'||type==='bossCounterplay')&&event.id==='star'&&bank.star_crust_crack){if(type==='bossCounterplay'&&event.key==='tether')for(const v of [...voices])if(v.group==='starGravity')stopVoice(v);variantCue(['star_crust_crack','star_crust_crack_02','star_crust_crack_03','star_crust_crack_04'],{group:'starBreak',gap:.18,limit:1,volume:.42,variation:.008,priority:3});return true;}
      if(type==='banished'&&event.foe?.bossType==='star'&&bank.star_core_slam){stop();play('star_core_slam',{group:'ending',gap:1,limit:1,volume:.40,pitch:.88,variation:0,priority:5});return true;}
      if(type==='banished'&&event.foe?.bossType==='clock'&&bank.clock_cuckoo_short){stop();play('clock_cuckoo_short',{group:'ending',gap:1,limit:1,volume:.34,pitch:.87,variation:0,priority:5});return true;}
      if(type==='banished'&&event.foe?.bossType==='prism'&&bank.prism_falling_shards){stop();play('prism_falling_shards',{group:'ending',gap:1,limit:1,volume:.52,variation:0,priority:5});return true;}
      if(type==='boss'&&event.id==='clock'&&bank.clock_cuckoo){entranceCue('clock_cuckoo',{group:'clockVoice',gap:9,limit:1,volume:.44,variation:0,priority:3});return true;}
      if(type==='boss'&&event.id==='prism'&&bank.prism_breath){entranceCue('prism_breath',{group:'prismBreath',gap:11,limit:1,volume:.35,variation:0,priority:1});return true;}
      if(type==='bossTell'&&event.id==='clock'&&bank.clock_wind){play('clock_wind',{group:'warning',gap:.45,limit:1,volume:.52,variation:0,priority:4});return true;}
      if(type==='bossTell'&&event.id==='prism'&&bank.prism_glass_scrape){variantCue(['prism_glass_scrape','prism_glass_scrape_02','prism_glass_scrape_03'],{group:'warning',gap:.6,limit:1,volume:.45,variation:.008,priority:4});return true;}
      if(['clockHandDeploy','clockUnfold'].includes(type)){play('clock_wood_slide',{group:'clockMechanism',gap:2,limit:1,volume:type==='clockUnfold'?.35:.27,variation:0,priority:2});play('clock_wind',{group:'clockWinding',gap:2,limit:1,volume:.26,variation:0,priority:2});return true;}
      if(type==='clockStalkTell'){play('clock_wind',{group:'clockWinding',gap:1,limit:1,volume:.22,variation:0,priority:3});return true;}
      if(type==='clockRefugeTell'){play('clock_wind',{group:'clockWinding',gap:1,limit:1,volume:.24,pitch:.86,variation:0,priority:3});return true;}
      if(type==='clockHandWarning'||type==='clockHandBreak'){play(type==='clockHandWarning'?'clock_wind':'clock_wood_slide',{group:'clockFail',gap:1.5,limit:1,volume:type==='clockHandWarning'?.23:.29,variation:0,priority:2});return true;}
      if(type==='clockBoard'){play('clock_beak_close',{group:'clockBoard',gap:1,limit:1,volume:.1,pitch:.73,variation:0,priority:0});return true;}
      if(type==='clockKeyBreak'||type==='clockPeckImpact'){play('clock_beak_close',{group:'clockBeak',gap:.45,limit:1,volume:type==='clockKeyBreak'?.32:.27,variation:.008,priority:2});if(type==='clockKeyBreak')play('clock_cuckoo_short',{group:'clockVoice',gap:7,limit:1,volume:.24,pitch:.86,variation:0,priority:2});return true;}
      if(type==='clockMouth'){play(event.open?'clock_beak_open':'clock_beak_close',{group:'clockBeak',gap:.4,limit:1,volume:event.open?.29:.36,variation:.008,priority:1});return true;}
      if(type==='bossImpact'&&event.id==='clock'&&['clockCrossing','clockPeck','clockGearPulse','clockHandStrike','clockRefugeSweep'].includes(event.pattern)){const beak=['clockPeck','clockHandStrike'].includes(event.pattern);play(beak?'clock_beak_close':'clock_wind',{group:'clockField',gap:.65,limit:1,volume:beak?.3:.22,variation:0,priority:2});return true;}
      if(type==='clockWoodSlide'){play('clock_wood_slide',{group:'clockMechanism',gap:.8,limit:1,volume:.32,variation:0,priority:1});return true;}
      if(type==='clockCuckoo'){play('clock_cuckoo_short',{group:'clockVoice',gap:9,limit:1,volume:.32,variation:0,priority:2});return true;}
      if(type==='clockScream'){play('clock_scream',{group:'clockScream',gap:16,limit:1,volume:.23,variation:0,priority:1});return true;}
      if(['prismVanish','prismArrival','prismMirrorOpen','prismTransit','prismGiantTell'].includes(type)){variantCue(['prism_glass_scrape','prism_glass_scrape_02','prism_glass_scrape_03'],{group:'prismMirror',gap:.7,limit:1,volume:type==='prismGiantTell'?.32:.22,variation:.008,priority:2});return true;}
      if(['prismHandImpact','prismGiantImpact','prismJointBreak','prismExpose'].includes(type)){variantCue(['prism_sharp_crack','prism_sharp_crack_02'],{group:'prismFracture',gap:.35,limit:1,volume:type==='prismGiantImpact'?.40:.28,variation:.01,priority:3});return true;}
      if(type==='prismRupture'){play('prism_falling_shards',{group:'prismRupture',gap:5,limit:1,volume:.48,variation:0,priority:4});play('prism_breath_02',{group:'prismBreath',gap:11,limit:1,volume:.26,variation:0,priority:1});return true;}
      if(type==='prismBreath'){variantCue(['prism_breath','prism_breath_02'],{group:'prismBreath',gap:11,limit:1,volume:.24,variation:0,priority:0});return true;}
      if(type==='bossPhase'&&event.id==='clock'&&bank.clock_wind){play('clock_wind',{group:'warning',gap:.5,limit:1,volume:.48,variation:0,priority:4});return true;}
      if((type==='bossPhase'||type==='bossMotion')&&event.id==='prism'&&bank.prism_glass_scrape){variantCue(['prism_glass_scrape','prism_glass_scrape_02','prism_glass_scrape_03'],{group:'prismMaterial',gap:1.5,limit:1,volume:type==='bossPhase'?.38:.24,variation:.01,priority:1});return true;}
      if(type==='bossImpact'&&event.id==='prism'&&bank.prism_sharp_crack){variantCue(['prism_sharp_crack','prism_sharp_crack_02'],{group:'bossImpact',gap:.5,limit:1,volume:.44,variation:.012,priority:3});return true;}
      if((type==='ritualBreak'||type==='bossCounterplay')&&event.id==='prism'&&bank.prism_falling_shards){play('prism_falling_shards',{group:'prismBreak',gap:.25,limit:1,volume:type==='ritualBreak'?.46:.34,variation:.008,priority:3});return true;}
      if(type==='banished'&&event.foe?.bossType==='briar'&&bank.briar_death_voice){stop();play('briar_death_voice',{group:'ending',gap:1,limit:1,volume:.55,variation:0,priority:5});return true;}
      if(type==='boss'&&event.id==='briar'&&bank.briar_entrance_voice){const epoch=stopEpoch,at=context.currentTime,cue=()=>play('briar_entrance_voice',{group:'briarVoice',gap:2,limit:1,volume:.58,variation:0,priority:4});if(buffers.has('briar_entrance_voice'))cue();else ready.then(()=>{if(epoch===stopEpoch&&context.currentTime-at<1.5)cue();});return true;}
      if(type==='cardTurn'){play('card_turn',{group:'ui',gap:.12,limit:1,volume:.45,variation:0,priority:3});return true;}
      // Finale sounds follow actual mechanics. Animation landing and crossing
      // rewards must not double the impact or the quiet player landing.
      if(type==='finaleImpact'){play('uncrowned_slam',{group:'finaleImpact',gap:.08,limit:2,volume:event.kind==='demolition'?.5:.62,pitch:event.kind==='crown'?.96:1,variation:.015,priority:3});return true;}
      if(type==='finaleCollapse'){play('uncrowned_collapse',{group:'ending',gap:.5,limit:2,volume:.7,variation:0,priority:5});return true;}
      if(type==='finaleChainRelease'){play('uncrowned_reach',{group:'chainRelease',gap:.5,limit:1,volume:.34,pitch:.85,variation:0,priority:2});return true;}
      if(type==='finaleFloorCollapse'||type==='bossPhase'&&event.id==='uncrowned'&&event.phase===2){
        const id=choose(FINALE_FLOORS);if(play(id,{group:'floor',gap:.22,limit:1,volume:event.cinematic?.23:.9,variation:.025,priority:3}))variants.set(FINALE_FLOORS.join(','),id);return true;
      }
      if(type==='finaleFloorCrack'){play('uncrowned_crack',{group:'floorCrack',gap:.4,limit:1,volume:.55,variation:.02,priority:3});return true;}
      if(type==='finaleLand'){play('uncrowned_land',{group:'landing',gap:.2,limit:1,volume:.48,variation:.02,priority:2});return true;}
      if(type==='finaleVolley'){play('steam',{group:'crown',gap:1.2,limit:1,volume:.24,pitch:.8,variation:0,priority:2});return true;}
      if(type==='finaleBeam'){play('charge',{group:'beam',gap:1.4,limit:1,volume:.36,pitch:.75,variation:0,priority:4});return true;}
      if(type==='dash'&&event.leap){play('uncrowned_leap',{group:'dash',gap:.17,limit:1,volume:.58,variation:0,priority:2});return true;}
      if(type==='perfectDodge'&&event.source==='crossing')return true;
      if(type==='finaleDown'){stop();play('uncrowned_death',{group:'ending',gap:1,limit:1,volume:.62,variation:0,priority:5});return true;}
      if(event.id==='uncrowned'){
        if(type==='bossTell'){if(event.pattern==='reach'||event.pattern==='double')play('uncrowned_reach',{group:'warning',gap:.45,limit:1,volume:.65,variation:0,priority:4});else if(event.pattern==='sweep')play('uncrowned_leap',{group:'warning',gap:.8,limit:1,volume:.36,pitch:.7,variation:0,priority:4});return true;}
        if(type==='bossImpact'){if(['reach','pursuit'].includes(event.pattern))return true;const beam=event.pattern==='gaze',sweep=event.pattern==='sweep';play(beam?'steam':sweep?'admiral_sweep':'uncrowned_impact',{group:'bossImpact',gap:.3,limit:1,volume:beam?.28:sweep?.35:.6,pitch:beam?.7:1,variation:.015,priority:3});return true;}
        if(type==='bossLanding')return true;
        if(type==='majorCounter'&&['heart','crown'].includes(event.kind)){play('uncrowned_heart',{group:'heart',gap:1.5,limit:1,volume:.58,variation:0,priority:3});return true;}
        if(type==='boss'||type==='bossPhase'){
          const cue=()=>play('uncrowned_awakening',{group:'warning',gap:1.8,limit:1,volume:type==='boss'?.65:.43,variation:0,priority:4});
          if(type==='boss'&&!buffers.has('uncrowned_awakening')){const epoch=stopEpoch,at=context.currentTime;ready.then(()=>{if(epoch===stopEpoch&&context.currentTime-at<1.5)cue();});}else cue();return true;
        }
      }
      // Keep repeated weapon sounds below the warning and special cues.
      const weaponVolume=.8;
      if(type==='fire'){
        const main=event.main===true,group=main?'attack':'support',volume=(main?.58:.19)*weaponVolume,gap=main?.085:.7;
        if(event.weapon==='baguette'){const ids=event.heavy||event.whirl?['cut','slash']:['swing','sweep','slash'],id=choose(ids);if(play(id,{group,gap,volume,pitch:event.step===2?1.04:1}))variants.set(ids.join(','),id);}
        else if(event.weapon==='espresso')play(main&&event.compressed?'compressed_shot':'steam',{group,gap,volume:(main?(event.compressed?.6:.75):.2)*weaponVolume,pitch:event.heavy?.93:1});
      }else if(type==='attackImpact'){
        if(!event.heavy)play('impact',{group:'impact',gap:.12,volume:(event.weapon==='baguette'?.78:.34)*weaponVolume,pitch:event.weapon==='espresso'?1.18:1});
      }else if(type==='finisher'){
        // A short pressure release rewards the combo without repeating the long explosion.
        if(event.hits>0)play(event.weapon==='espresso'?'steam':'cut',{group:'finisher',gap:.4,limit:1,volume:(event.weapon==='espresso'?.44:.61)*weaponVolume,pitch:event.weapon==='espresso'?.78:.96,priority:2});
      }else if(type==='specialCast'){
        if(SPECIAL_CAST[event.id])play(SPECIAL_CAST[event.id],{group:'specialCast',gap:.2,limit:1,volume:.65,variation:.01,priority:2});
      }else if(type==='specialReady')play('special_ready',{group:'specialReady',gap:1,limit:1,volume:.65,variation:0,priority:2});
      else if(type==='specialBlock')play('bell_counter',{group:'specialImpact',gap:.2,limit:1,volume:.65,variation:.01,priority:3});
      else if(type==='specialImpact')play(event.id==='bell'?'bell_counter':'shooting_star_impact',{group:'specialImpact',gap:.14,limit:2,volume:event.secondary?.35:.65,variation:.01,priority:2});
      else if(type==='relicWarning')play('comet_mark',{group:'relicWarning',gap:2,limit:1,volume:.48,pitch:.7,priority:3});
      else if(type==='relicImpact')play(event.id==='echopearl'?'impact':'comet_impact',{group:'relicImpact',gap:.2,limit:2,volume:event.id==='meteor'?.6:.3,pitch:event.id==='meteor'?.72:1,priority:2});
      else if(type==='buildCue'){
        const spec=BUILD_CUES[event.id];if(!spec)return false;
        const id=spec.variants?choose(spec.variants):event.id;
        if(play(id,{limit:1,variation:.015,...spec})&&spec.variants)variants.set(spec.variants.join(','),id);
      }else if(type==='parry')play('sweep',{group:'parry',gap:.24,volume:.36,pitch:1.45,duration:.2,priority:2});
      else if(type==='dash')play('dash',{group:'dash',gap:.17,volume:.56});
      else if(type==='perfectDodge')play('dodge',{group:'reward',gap:.65,volume:.7,variation:.01,priority:3});
      else if(type==='level'){stop(true);play('upgrade',{group:'ui',gap:.4,volume:.5,variation:0,priority:3});}
      else if(type==='evolution'||type==='weaponUpgrade')play('evolve',{group:'ui',gap:.35,volume:.53,variation:0,priority:3});
      else if(type==='bossTell')play(bank[event.id+'_warning']?event.id+'_warning':'charge',{group:'warning',gap:.45,volume:event.id==='kiln'?.435:.58,variation:0,priority:4});
      // All joints share one budget: a planted claw must not stack a second
      // crack on its footfall. The old blast is reserved for damaging attacks.
      else if(['kilnFootstep','kilnClawPlant','kilnJoint'].includes(type))variantCue(['kiln_bone_01','kiln_bone_02','kiln_bone_03','kiln_bone_04','kiln_bone_05','kiln_bone_06','kiln_bone_07'],{group:'kilnJoint',gap:1.05,limit:1,volume:type==='kilnJoint'?.24:type==='kilnClawPlant'?.20:.16,pitch:.96,variation:.025,priority:0});
      else if(type==='kilnCoalDrag')variantCue(['kiln_coal_01','kiln_coal_02'],{group:'kilnCoal',gap:2.4,limit:1,volume:.21,variation:.015,priority:0});
      else if(type==='kilnBreath')play('kiln_breath',{group:'kilnBreath',gap:6.5,limit:1,volume:.255,variation:0,priority:0});
      else if(type==='admiralStep'||type==='admiralCrack'){
        const cracks=['admiral_joint_snap','admiral_joint_crack','admiral_shell_crack'],id=cracks[(event.variant||0)%cracks.length];
        play(id,{group:'admiralJoint',gap:.8,limit:1,volume:type==='admiralCrack'?.25:.14,pitch:1,variation:.015,priority:1});
      }
      else if(type==='admiralChain')play('admiral_anchor_drag',{group:'admiralDrag',gap:2.5,limit:1,volume:.16,variation:0,priority:0});
      else if(['admiralSnag','admiralMount','admiralDismount'].includes(type))play('admiral_chain_pull',{group:'admiralCounter',gap:.4,limit:1,volume:type==='admiralSnag'?.24:.16,variation:.015,priority:2});
      else if(type==='admiralJointHit'||type==='admiralLegBreak')play(type==='admiralLegBreak'?'admiral_shell_crack':'admiral_joint_snap',{group:'admiralBreak',gap:.3,limit:1,volume:type==='admiralLegBreak'?.32:.22,variation:.015,priority:3});
      else if(type==='admiralHaul'){
        play('admiral_chain_pull',{group:'admiralHaul',gap:.6,limit:1,volume:.22,variation:0,priority:2});
      }
      else if(type==='admiralBreath')play('admiral_breath',{group:'admiralBreath',gap:5,limit:1,volume:.24,pitch:1,variation:0,priority:0});
      else if(['briarHunt','briarCathedral','briarFold','briarBurrow'].includes(type))play('briar_wood_strain_02',{group:'briarArchitecture',gap:1.8,limit:1,volume:type==='briarCathedral'?.29:.18,variation:.01,priority:2});
      else if(type==='briarHeadRise'||type==='briarSever')play(type==='briarSever'?'briar_root_pull_03':'briar_root_pull_02',{group:'briarRoots',gap:.65,limit:1,volume:type==='briarSever'?.3:.22,variation:.015,priority:2});
      else if(type==='bossImpact'&&event.id==='briar'&&['hunt','cathedral'].includes(event.pattern))play('briar_root_pull_03',{group:'briarRoots',gap:.65,limit:1,volume:.26,variation:.01,priority:2});
      else if(type==='briarGrip'){
        const ids=['briar_root_pull','briar_root_pull_02','briar_root_pull_03'].filter(id=>bank[id]),id=ids.length?choose(ids):'briar_plant';
        if(play(id,{group:'briarGrip',gap:1.8,limit:1,volume:ids.length?.3:.10,pitch:ids.length?1:.88,variation:.015,priority:0})&&ids.length)variants.set(ids.join(','),id);
      }
      else if(type==='briarStrain'){const ids=['briar_wood_strain','briar_wood_strain_02'].filter(id=>bank[id]);if(!ids.length)return false;const id=choose(ids);if(play(id,{group:'briarStrain',gap:3,limit:1,volume:.3,variation:.012,priority:1}))variants.set(ids.join(','),id);}
      else if(type==='briarBreath')play('briar_choked_breath',{group:'briarBreath',gap:8,limit:1,volume:.28,variation:0,priority:0});
      else if(type==='bossImpact'||type==='bossLanding'||type==='bossMotion'){
        // Movement sounds belong to the move itself, not every animation frame.
        let cue=null;
        if(type==='bossMotion'){
          if(event.id==='prism'&&event.pattern==='traverse')cue='prism_glide';
          if(event.id==='clock'&&event.pattern==='escapement')cue='clock_tick';
          if(!cue)return false;
        }else if(type==='bossLanding'){
          if(event.id==='kiln'&&event.heavy)cue='kiln_landing';
          if(event.id==='uncrowned')cue='kiln_landing';
          if(event.id==='briar'&&event.pattern==='rootpounce')cue='briar_eruption';
        }else if(event.id==='uncrowned')cue='kiln_landing';
        else if(event.id==='uncrownedWave')cue='admiral_sweep';
        else if(event.id==='kiln'&&['crownfall','moltenmarch'].includes(event.pattern)&&event.shape==='circle')cue='kiln_landing';
        else if(event.id==='briar'&&event.pattern==='rootpounce'&&event.shape==='circle')cue='briar_eruption';
        else if(event.id==='admiral'&&event.pattern==='reaping'&&event.shape==='line')cue='admiral_sweep';
        else if(event.id==='clock'&&event.pattern==='missingbeat'&&event.shape==='arc')cue='clock_tick';
        cue=cue&&bank[cue]?cue:bank[event.id+'_impact']?event.id+'_impact':'steam';
        play(cue,{group:'bossImpact',gap:.42,limit:1,volume:type==='bossMotion'?.3:event.id==='uncrowned'?.32:cue==='kiln_impact'?.285:.38,pitch:event.id==='uncrowned'?.8:cue==='steam'?.7:1,variation:0,priority:3});
      }
      else if(type==='ritualBreak')play(bank[event.id+'_break']?event.id+'_break':'cut',{group:'ritualBreak',gap:.12,limit:2,volume:.58,variation:.015,priority:3});
      else if(type==='majorCounter'||type==='majorStagger')play('dodge',{group:'reward',gap:.65,volume:.48,pitch:.9,variation:0,priority:3});
      else if(type==='boss'||type==='bossPhase')play('boss',{group:'warning',gap:1.8,volume:.56,variation:0,priority:4});
      // Echoes and dash-combo bookkeeping must not stack another whoosh on the real strike.
      else if(type!=='slash'&&type!=='dashCombo')return false;
      return true;
    }
    return {ready,input,output,handle,play,stop,updatePassage,setVolume(value){level=Math.max(0,Math.min(1,Number(value)||0));gain();if(!level)stop();},setMuted(value){muted=!!value;gain();if(muted)stop();},get state(){return{...stats,failed:[...stats.failed],history:[...stats.history],active:voices.size,volume:level,muted};}};
  }
  return {create,MAX_VOICES,CARD_TURN,SPECIAL_READY,PASSAGE_SOUNDS,SHOOTING_STAR_SOUNDS};
});
