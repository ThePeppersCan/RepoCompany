'use strict';
const assert=require('node:assert/strict'),{runtime}=require('./test_matchday_engine.cjs'),{opts,player}=require('./audit_player_quality.cjs'),{runtime:careerRuntime}=require('./career_test_runtime.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
(async()=>{
 const r=runtime(),q=r.q;
 assert(await r.engine.open({...opts(70,70,901),neutralVenue:true}));
 assert.equal(q.careerFinishScale('belros'),q.careerFinishScale('zafran'),'A neutral venue must give equal-quality sides identical finishing modifiers');
 q.state.simRand=()=>0;assert.equal(q.fairNoise(.2),-.1,'Zero is a valid seeded random sample; it must never fall back to Math.random');await r.engine.close();
 assert(await r.engine.open(opts(70,70,901)));assert(q.careerFinishScale('belros')>q.careerFinishScale('zafran'),'Ordinary home advantage remains');assert.equal(q.state.neutralVenue,false,'A neutral flag must not leak into the next fixture');await r.engine.close();
 const setup={...opts(60,70,903),neutralVenue:true,homeBenchData:[player('H',3,90)]};
 assert(await r.engine.open(setup));const before=q.careerFinishScale('belros');q.completePrematch();q.beginHalftime();assert(q.matchdayRequestSub('H0','H3').ok);
 assert(q.careerFinishScale('belros')>before,'The team-strength modifier must update when a better substitute enters');assert.equal(q.careerFinishScale('belros'),q.careerFinishScale('zafran'),'60 + 60 + 90 is the same average quality as three 70s');
 const beforeRed=q.careerFinishScale('belros');q.disciplineSendOff(q.entityById('H1'));assert(q.careerFinishScale('belros')<beforeRed,'Removing a weak player must not improve the short-handed team bonus');await r.engine.close();
 // Full app integration: fixture venue and role-adjusted player quality reach
 // the engine, rather than only working for a hand-written engine payload.
 const c=careerRuntime(),a=c.context.VELMORA_CLUBS[0],b=c.context.VELMORA_CLUBS[1];c.d.assignClubForTest(a);c.q.initializeCareerLifecycle();
 for(const club of [a,b])for(const p of c.q.getSquad(club)){p.ovr=70;p.stats={PAC:70,SHO:70,PAS:70,HAN:70,DEF:70,STA:70};p.playingTraits=[];p.playingTraitsVersion=2;p.injured=false;p.injuryDaysRemaining=0;p.preferredMatchRole=p.role;}
 assert.equal(c.q.v44FixtureClubStrength(a),c.q.v44FixtureClubStrength(b),'Club ownership must not add an AI-only team-strength bonus');
 const f=c.q.state().fixtures.find(f=>!f.played&&(f.homeClubId===a.id||f.awayClubId===a.id));f.neutralVenue=true;c.q.setCareerDate(f.date);let captured;
 c.context.VelmoraQuidditchEngine={open:async o=>{captured=o;return true;}};
 await c.q.v210OpenCareerMatch(f);assert(captured,'Actual Watch Match path opens the engine');assert.equal(captured.neutralVenue,true);assert(captured.homePlayerData.every(p=>Number.isFinite(p.careerMeta.performanceOverall)),'Role-adjusted quality reaches the match engine');captured.onClose();
 assert.deepEqual(plain(c.q.v24ExpectedGoals(a,b,true,f)),plain(c.q.v24ExpectedGoals(a,b,false,f)),'User and background fixtures use identical expected-score rules');
 // Fast-forward must run the same match, rather than re-roll a losing score.
 const normal=runtime(),fast=runtime(),settings={...opts(70,70,747),neutralVenue:true};assert(await normal.engine.open(settings));assert(await fast.engine.open(settings));normal.q.completePrematch();
 for(let i=0;i<70000&&normal.q.state.phase!=='fulltime';i++){if(normal.q.state.phase==='halftime')normal.q.matchdayResume();normal.q.simulateFixedStep(1/30);}
 fast.q.skipCareerToFulltime();const summarise=x=>{const z=x.q.careerResultSnapshot();return plain({h:z.homeScore,a:z.awayScore,stats:z.playerStats,goals:z.goalEvents,discipline:z.disciplineEvents});};assert.deepEqual(summarise(normal),summarise(fast),'Watching and fast-forwarding preserve the entire result');await normal.engine.close();await fast.engine.close();
 console.log(JSON.stringify({status:'PASS',checks:['Neutral venue symmetry and ordinary home advantage','No venue flag leakage','Current substitutes determine team strength','Dismissals cannot improve strength bonus','Seeded zero never falls back to unseeded randomness','No additional AI-only strength bonus','Actual career venue and player-quality integration','Identical user/background expected-score rules','Watched and fast-forwarded results identical']},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
