'use strict';
const assert=require('node:assert/strict');
(async()=>{
 const {retrieveKnowledge,knowledgeSources}=await import('../lib/wibsworth-knowledge.mjs');
 const {localReviewedReply}=await import('../lib/wibsworth-local-facts.mjs');
 const {GAME_GUIDE_FACTS:facts,GAME_GUIDE_SOURCES:sources}=await import('../lib/wibsworth-game-guide-data.mjs');
 const ask=(q,history=[])=>{const k=retrieveKnowledge({message:q,history}),r=localReviewedReply({question:q,history,spoilers:false},k);return {k,answer:r?.answer||''};};
 const cases=[
 ['what are the locations in moratales',/Velmora, Brindlewick, Glass Mile and Merrowby/],
 ['What places can I visit in Moratales?',/Copper Kettle Square/],
 ['Where can I go in Moratales?',/Rookwater Mere/],
 ['What shops are there in Moratales?',/Pike & Line/],
 ['Where is Fernbank Nursery in Moratales?',/Fernbank Heights.*Inez/],
 ['Where do I buy sugar in Moratales?',/6.*6 bronze.*Arthur/],
 ['Where can I get butter in Moratales?',/June and Otis/],
 ['How do I make scones in Moratales?',/2 Morning Crust flour, 1 Bellweather butter/],
 ['What is the recipe for Butter croissant in Moratales?',/3 Morning Crust flour, 3 Bellweather butter/],
 ['How long do tomatoes take to grow in Moratales?',/2 watered days/],
 ['How long does lettuce take to grow in Moratales?',/eight watered hours/],
 ['How do I refill the watering can in Moratales?',/twelve sprays/],
 ['How much rent do I pay in Moratales?',/20%.*48 in-game hours/],
 ['What happens when rent is overdue in Moratales?',/one-off late fee/],
 ['How do I get to Glass Mile in Moratales?',/seven Brindlewick milestones/],
 ['Where is Betweenways in Moratales?',/tram from Raincourt/],
 ['How do I get a fridge in Moratales?',/240 bronze/],
 ['What can I grow in Moratales?',/Farwake coffee tree/],
 ['What is the day length in Moratales?',/28 minutes/],
 ['Who is Walter Hobbs?',/Retired clock repairer/],
 ['What worlds are in Velmora Manager?',/Velmora, Kharova, Caldria and Ezuraya/],
 ['How many clubs are in Velmora Manager?',/288/],
 ['How do I start a career in Velmora Manager?',/five save slots/],
 ['Where do I see finances in Velmora Manager?',/Finances/],
 ['How does budget allocation work in Velmora Manager?',/52 weeks/],
 ['Where is the Youth Academy in Velmora Manager?',/Squad/],
 ['How do I find free agents in Velmora Manager?',/Search Players/],
 ['What is Quick Sim in Velmora Manager?',/same career fixture/],
 ['What is Kesselbruck in Velmora Manager?',/Eisenmark, Kharova/],
 ['What are the modes in Morogue?',/Mora Mode and Endless Night/],
 ['How much is House blend in Morogue?',/60, 120 and 180/],
 ['How do I refund power-ups in Morogue?',/returns the spent coins/],
 ['What are blue stars in Morogue?',/collect scattered experience/],
 ['How do I evolve in Morogue?',/level V.*level II.*01:30/],
 ['What is the Night pantry in Morogue?',/permanent bonuses/],
 ['How do rerolls work in Morogue?',/two rerolls/],
 ['What worlds are in Morogue?',/30/],
 ['List all worlds in Morogue',/Morning Without Dawn/],
 ['How do I beat a Canal Rusher in Morogue?',/marked approach/],
 ['What is Lantern Rain in Morogue?',/lit circles/],
 ['How do I post to leaderboards in Morogue?',/before starting a run/],
 ['Can I keep coins if I end run in Morogue?',/keeps the moon coins/],
 ['How do I play co-op in Moratales?',/host keeps three separate co-op saves/],
 ['What restores energy in Moratales?',/100/],
 ['How much is Lamplighter’s sabre in Morogue?',/120 moon coins/],
 ['What is the Midnight Espresso evolution in Morogue?',/Peppercorn Steak II/],
 ['Why is Play Match disabled in Velmora Manager?',/fixture date/]
 ];
 for(const [q,re]of cases){const out=ask(q);assert.match(out.answer,re,q+' '+JSON.stringify(out.k.facts.map(f=>f.id)));assert.doesNotMatch(out.answer,/web (?:build|version|career)|launcher version|send a correction|official page link/i,q);}
 const history=q=>[{role:'user',content:q}];
 assert.match(ask('And what shops are there?',history('What are the locations in Moratales?')).answer,/Pike & Line/);
 assert.match(ask('Where can I buy it?',history('Tell me about sugar in Moratales')).answer,/Arthur/);
 assert.match(ask('How long does it take to grow?',history('What is tomato in Moratales?')).answer,/2 watered days/);
 assert(!ask('What are the locations in Moratales?').answer.includes('recipe'));
 assert(!ask('Where do I buy sugar in Moratales?').answer.includes('Tomato'));
 assert.equal(ask('How do I bake a cake?').k.scope,'general','Common food words must not infer a game');
 assert.equal(ask('What is an unlisted Azure Palace in Moratales?').answer,'','Unknown named items must not get a generic overview');
 const expected={crop:44,recipe:88,ingredient:76,person:92,club:288,enemy:20,event:6};
 for(const [kind,n]of Object.entries(expected))assert.equal(facts.filter(f=>f.guideKind===kind).length,n,kind);
 assert.equal(new Set(facts.map(f=>f.id)).size,facts.length);
 for(const f of facts){assert.doesNotMatch(f.text,/undefined|NaN|\[object Object\]/);assert(f.sourceIds.every(id=>knowledgeSources.some(s=>s.id===id)),f.id);}
 // Exercise every named catalogue record, beyond the hand-written examples.
 const missing=[];
 for(const f of facts.filter(f=>f.entityTopics)){
  const game={manager:'Velmora Manager',moratales:'Moratales',morogue:'Morogue'}[f.product];
  const q=`Tell me about ${f.entityTopics[0]} in ${game}`;
  if(!retrieveKnowledge(q,{spoilers:true,limit:10}).facts.some(x=>x.id===f.id))missing.push([f.id,q]);
 }
 assert.deepEqual(missing,[],'Every named catalogue entry must be reachable');
 console.log(`Game guide checks passed: ${cases.length} question scenarios, ${facts.filter(f=>f.entityTopics).length} named records, ${sources.length} added source pins.`);
})().catch(e=>{console.error(e);process.exit(1)});
