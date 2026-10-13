/* Earned supplies. This module never restores health merely because time passes. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MOROGUE_RECOVERY=factory();})(globalThis,function(){
 'use strict';
 const regular=boss=>!!boss?.major&&!boss.finalBoss&&boss.hp>0;
 // Apply the 15% boss-fight buff once, including earned recovery portions.
 const scale=boss=>boss?.hp>0?(regular(boss)?.575:1.15):1;
 function heal(state,amount){const p=state.player;if(p.hp<=0)return 0;const restored=Math.min(Math.max(0,amount)*scale(state.boss),Math.max(0,p.maxHp-p.hp));p.hp+=restored;return restored;}
 function begin(boss,maxHp){boss.recovery={portion:Math.max(0,maxHp)*.11*scale(boss),scale:scale(boss),earned:[],recovered:0};}
 function earn(boss,key){
  const r=boss?.recovery;
  if(!r||boss.hp<=0||r.earned.length>=3||r.earned.includes(key))return 0;
  r.earned.push(key);return r.portion;
 }
 function collect(drop,player){
  if(player.hp<=0||player.hp>=player.maxHp||!(drop.amount>0))return 0;
  const amount=Math.min(drop.amount,player.maxHp-player.hp);
  player.hp+=amount;drop.amount-=amount;drop.dead=drop.amount<.001;
  return amount;
 }
 return{begin,earn,collect,heal,scale};
});
