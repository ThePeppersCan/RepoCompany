const fs=require('fs'),vm=require('vm');
global.window=global;global.localStorage={getItem(){return null},setItem(){}};
vm.runInThisContext(fs.readFileSync(__dirname+'/assets/repo-diver/data.js','utf8'),{filename:'data.js'});
vm.runInThisContext(fs.readFileSync(__dirname+'/assets/repo-diver/engine.js','utf8'),{filename:'engine.js'});
const D=global.RepoDiverData,E=global.RepoDiverEngine;
let pass=0,fail=0;function t(name,fn){try{if(fn()===false)throw Error('false');console.log('PASS',name);pass++}catch(e){console.log('FAIL',name,e.message);fail++}}
const eq={tank:4,cargo:4,harpoon:4,suit:4,boost:3,sonar:4,lure:3,fins:3,salvage:3,pressure:3};
function run(b='kelp',extra={}){return E.createRun({biome:b,level:35,equipment:eq,boat:{sonar:3,crane:2},weather:'clear',timeOfDay:'day',crafted:{research_dart:true},graphics:'high',...extra})}
t('V13 ecology definitions exist',()=>D.ECOLOGY_PERSONALITIES.length===5&&Object.keys(D.ECOLOGY_ZONES).length===18);
t('Run has living-ocean state',()=>{const r=run();return !!r.ecology?.personality&&r.ecology.zones.length===3&&typeof r.ecology.noise==='number'});
t('Habitat-aware fish fields',()=>{const r=run();return r.fish.every(f=>f.habitat&&f.awareness&&typeof f.protected==='boolean')});
t('Protected species flagged',()=>{const f=E.spawnFish('fremennik',40,4,{source:D.fishById('glacier_skate')});return f.protected===true});
t('Juveniles cannot be guaranteed but field exists',()=>{const f=E.spawnFish('karamja',1,1,{source:D.fishById('sunscale_sardine')});return typeof f.juvenile==='boolean'});
t('Migration personality makes denser water',()=>{const r=run('endless',{modifier:'migration'});return r.ecology.personality.id==='migration'&&r.fish.length>=15});
t('Predator personality can be forced by modifier',()=>run('blackrift',{modifier:'predator_territory'}).ecology.personality.id==='predator');
t('Sonar raises ecology noise',()=>{const r=run();r.ecology.noise=0;E.useSonar(r,eq);return r.ecology.noise>=.75});
t('Harpoon raises ecology noise',()=>{const r=run();r.ecology.noise=0;E.harpoon(r,{x:400,y:200},eq);return r.ecology.noise>=.9});
t('Living director event school pass changes world',()=>{const r=run();const before=r.fish.length;E.triggerLivingEvent(r,'school_pass');return r.fish.length>before&&r.ecology.history[0]==='school_pass'});
t('Living director supports mega fauna',()=>{const r=run();E.triggerLivingEvent(r,'mega_fauna');return r.ecology.megaFauna.length===1});
t('Current shift updates current vector',()=>{const r=run();const before=r.ecology.current.strength;E.triggerLivingEvent(r,'current_shift');return r.ecology.current.strength>=.48&&r.ecology.current.strength<=.92});
t('Tagged animal may return without breaking run',()=>{let got=false;for(let i=0;i<40;i++){const r=run('kelp',{taggedSpecimen:{tag_id:7,tag_code:'MR-007',fish_id:'kelp_sprat',biome:'kelp'}});if(r.ecology.tagReturn){got=r.ecology.tagReturn.tagged&&r.ecology.tagReturn.tagCode==='MR-007';break}}return got});
t('Protected harpoon is non-lethal',()=>{const r=run('fremennik');const f=E.spawnFish('fremennik',35,4,{source:D.fishById('glacier_skate'),x:200,y:200});r.fish=[f];r.player.x=100;r.player.y=200;E.harpoon(r,{x:200,y:200},eq);for(let i=0;i<30;i++)E.update(r,.016,{},eq);return r.catches.length===0&&f.hp===f.maxHp});
t('School cohesion update remains finite',()=>{const r=run('kelp',{modifier:'migration'});for(let i=0;i<300;i++)E.update(r,.016,{right:i<50},eq);return r.fish.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&f.x>=34&&f.x<=926)});
t('Quiet dive still progresses without forced spam',()=>{const r=run();r.ecology.personality=D.ECOLOGY_PERSONALITIES.find(x=>x.id==='silence');r.ecology.quiet=30;r.ecology.directorTimer=0;const before=r.stats.ecologyEvents;for(let i=0;i<100;i++)E.update(r,.016,{},eq);return r.stats.ecologyEvents===before});
t('Director eventually fires after quiet window',()=>{const r=run();r.ecology.quiet=0;r.ecology.directorTimer=.01;E.update(r,.05,{},eq);return r.stats.ecologyEvents>=1});
t('Predator/prey simulation does not create catch rewards',()=>{const r=run('kelp');E.triggerLivingEvent(r,'predator_hunt');const c=r.catches.length;for(let i=0;i<1000;i++)E.update(r,.016,{},eq);return r.catches.length===c});
t('Balanced graphics run caps initial density',()=>{const r=E.createRun({biome:'endless',level:40,equipment:eq,boat:{sonar:6},modifier:'migration',weather:'clear',timeOfDay:'day',graphics:'balanced'});return r.fish.length<40});
t('No ecology event overwrites existing server-facing catch shape',()=>{const r=run();const f=r.fish.find(x=>!x.protected&&!x.juvenile&&D.RARITY[x.rarity].rank<3);if(!f)return true;f.x=r.player.x+30;f.y=r.player.y;f.hp=1;E.harpoon(r,{x:f.x,y:f.y},eq);for(let i=0;i<80;i++)E.update(r,.016,{},eq);return !r.catches.length||['id','q','kind','name','rarity','weight'].every(k=>k in r.catches[0])});
console.log(`RESULT ${pass} passed, ${fail} failed`);process.exitCode=fail?1:0;
