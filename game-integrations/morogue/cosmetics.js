/* Appearance only. No combat values belong in this catalogue. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MOROGUE_COSMETICS=factory();})(globalThis,function(){
 'use strict';
 const categories={espresso:'Espresso pistols',baguette:'Blades',cape:'Capes',trail:'Dash trails',strike:'Attack effects'};
 const items=[
  ['roast','espresso','Copper roast',0,'Twin steel pistols with brass fittings and glass espresso chambers.'],
  ['porcelain','espresso','Blue willow',90,'Ivory slides, blue steel and pale coffee chambers.'],
  ['witchbrew','espresso','Witching brew',160,'Black plum pistols with violet steam rising from their chambers.'],
  ['stormcup','espresso','Storm in a chamber',0,'The Cantor’s silver pistols. A tiny storm follows every shot.','cantor'],
  ['crust','baguette','Baguette Ronin',0,'Fresh crust. Familiar cuts.'],
  ['sabre','baguette','Lamplighter’s sabre',120,'A curved steel blade with a copper basket guard.'],
  ['ribbon','baguette','Briar lash',220,'A thorn-tipped ribbon whip that unfurls through each cut. Same reach as your blade.'],
  ['giltlash','baguette','Duelist’s chain',0,'Articulated gold links. A rose-coloured point. Earned in a real duel.','duelist'],
  ['bare','cape','No cape',0,'Travel light.'],
  ['courier','cape','Night courier',100,'A short indigo cape, stitched with a pale moon.'],
  ['cinder','cape','Cinder tails',180,'A split scarlet mantle with an ember-gold lining.'],
  ['uncrowned','cape','The fallen crown',0,'A heavy royal mantle with an uneven, torn hem and a broken crown embroidered in gold.','uncrowned'],
  ['plaintrail','trail','Quiet steps',0,'The familiar dash silhouette.'],
  ['firefly','trail','Lanternflies',110,'A short wake of warm, wandering sparks.'],
  ['moonwake','trail','Moonwake',180,'Silver-blue fragments drift behind your dash.'],
  ['plainstrike','strike','Clean cut',0,'The familiar strike.'],
  ['sparks','strike','Copper sparks',120,'A little fireworks display at the edge of each attack.'],
  ['constellation','strike','Starlit flourish',240,'Tiny constellations trace your cuts and coffee shots.']
 ].map(([id,slot,name,price,description,boss])=>Object.freeze({id,slot,name,price,description,boss}));
 const catalog=Object.freeze(Object.fromEntries(items.map(i=>[i.id,i]))),defaults={espresso:'roast',baguette:'crust',cape:'bare',trail:'plaintrail',strike:'plainstrike'},bosses={cantor:'The Storm Cantor',duelist:'The Gilded Duelist',uncrowned:'The Uncrowned'};
 const coins=data=>Math.min(1e9,Math.max(0,Math.floor(Number(data.coins)||0)));
 function read(data={}){
  const defeated=Array.isArray(data.defeatedBosses)?data.defeatedBosses.filter(id=>Object.hasOwn(bosses,id)):[];
  if(Number(data.moraClears)>0)defeated.push('uncrowned');
  const purchased=new Set(Array.isArray(data.cosmetics?.owned)?data.cosmetics.owned:[]);
  const owned=items.filter(i=>!i.price&&!i.boss||i.boss&&defeated.includes(i.boss)||i.price>0&&purchased.has(i.id)).map(i=>i.id);
  const equipped={...defaults};for(const slot of Object.keys(defaults)){const id=data.cosmetics?.equipped?.[slot];if(owned.includes(id)&&catalog[id]?.slot===slot)equipped[slot]=id;}
  return{owned,equipped};
 }
 function transact(data,id,action){
  const item=Object.hasOwn(catalog,id)?catalog[id]:null,cosmetics=read(data);if(!item)return{ok:false,reason:'Unknown item.'};
  if(action==='buy'&&!cosmetics.owned.includes(id)){
   if(item.boss)return{ok:false,reason:'Defeat '+bosses[item.boss]+' outside practice.'};
   if(coins(data)<item.price)return{ok:false,reason:'Not enough moon coins.'};
   cosmetics.owned.push(id);cosmetics.equipped[item.slot]=id;return{ok:true,update:{coins:coins(data)-item.price,cosmetics}};
  }
  if(!cosmetics.owned.includes(id))return{ok:false,reason:'You do not own this look yet.'};
  cosmetics.equipped[item.slot]=id;return{ok:true,update:{cosmetics}};
 }
 function defeat(data,id,practice=false){
  if(practice||!Object.hasOwn(bosses,id))return null;
  const defeatedBosses=[...new Set([...(Array.isArray(data.defeatedBosses)?data.defeatedBosses:[]).filter(b=>Object.hasOwn(bosses,b)),id])];
  if(data.defeatedBosses?.includes(id))return null;
  return{defeatedBosses};
 }
 return{items,catalog,categories,defaults,bosses,read,transact,defeat,coins};
});
