'use strict';
const path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');
const code=esbuild.buildSync({stdin:{contents:"export * from './hazards';export * from './physics';export {Vector3} from 'three';",resolveDir:path.join(root,'game-projects/broomflight/src')},bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const m=new Module(__filename);m.paths=module.paths;m._compile(code,__filename+'.bundle');
const {createHazards,touchesHazard,fallingRock,createRiderState,updatePhysics,Vector3}=m.exports;
const hazards=createHazards(2310,()=>7.6),point=(s,x,y)=>({s,x,y});
function sweep(h,x,y,t=0,dt=1/60){return touchesHazard(h,point(h.s-4,x,y),point(h.s+4,x,y),t,dt);}
const thorn=hazards.find(h=>h.kind==='thorns'),branch=hazards.find(h=>h.kind==='branches'),pillar=hazards.find(h=>h.kind==='pillars'),fall=hazards.find(h=>h.kind==='rockfall');
assert(sweep(thorn,0,2.6));assert(!sweep(thorn,0,8.5),'Climb clears the thorns');
assert(!sweep(branch,0,2.6));assert(sweep(branch,0,8.5),'High flight cannot bypass the canopy');
assert(sweep(pillar,3,2.6));assert(sweep(pillar,3,10.5));assert(!sweep(pillar,-3,2.6),'Open side clears pillars at full boost speed');
const hitTimes=[],clearTimes=[];
for(let time=0;time<10.5;time+=.05){const h={...fall,s:100,offset:0};(sweep(h,0,2.6,time)?hitTimes:clearTimes).push(time);}
assert(hitTimes.length>0&&clearTimes.length>0,'Changing arrival time changes rockfall outcome');
const h={...fall,s:100,offset:0};
assert(fallingRock(h,0,.5).warning&&!fallingRock(h,0,.5).active,'Warning precedes damage');
assert.deepEqual(fallingRock(h,1,5),fallingRock(h,1,5),'Clock does not depend on wall time');
assert(Math.abs(fallingRock(h,1,1).y-fallingRock(h,1,11.5).y)<1e-8,'Reset cycle is deterministic');
// A falling rock can strike a stationary broom; swept motion must include both objects.
const b=fallingRock(h,1,3.9);assert(touchesHazard(h,point(100,b.x,b.y),point(100,b.x,b.y),3.9,.025));
const input={steer:0,pedal:true,brake:false,crouch:false,hop:false,boost:false,manual:false,trick:0};
const world={length:500,hazards:[{...thorn,s:100}],sample:s=>({position:new Vector3(0,0,-s),tangent:new Vector3(0,0,-1),right:new Vector3(1,0,0),width:7.6,curvature:0,jump:0,slope:0})};
function run(climb){const p=createRiderState(0,'test',0);p.s=35;p.speed=30;let time=0,min=30;for(;p.s<130&&time<20;time+=1/120){updatePhysics(p,{...input,crouch:climb},world,1/120,time);min=Math.min(min,p.speed);}return {p,min,time};}
const collision=run(false),clean=run(true);
assert.equal(collision.p.hits,1);assert.equal(collision.p.cleanPasses,0);assert(collision.min<12);assert.equal(collision.p.crash,0);assert(collision.p.s>100,'A hit recovers without resetting position');
assert.equal(clean.p.hits,0);assert.equal(clean.p.cleanPasses,1);assert.equal(clean.p.score,50);assert(clean.time<collision.time,'A clean line is faster');
assert(hazards.filter(h=>h.s>2310*.4).length===13);assert(hazards.at(-1).s>2310*.95);
console.log('PASS: climb/duck/dodge hitboxes, swept boosted collisions, rockfall timing and moving collisions, warning safety, deterministic clock, speed-loss recovery, clean-pass rewards and late-course coverage.');
