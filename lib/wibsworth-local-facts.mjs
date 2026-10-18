import roster from './wibsworth-boss-roster.mjs';
import { CATALOGUE_REFERENCE } from './wibsworth-knowledge-data.mjs';

function buildOption(item) {
  const s=item.stats;
  if(item.id==='finisher')return `• ${item.name}: +${s.mainFinisherIncreasePercent}% main-finisher damage and +25% on other main attacks. Costs ${item.cost.brass} brass and two relic slots. You take 20% more damage and walk 10% slower; dash distance is unchanged. These bonuses do not boost specials or relic damage.`;
  if(item.id==='echo')return `• ${item.name}: +${s.combinedIncreasePercent}% combined volley damage if the original and delayed echo both land. Requires Espresso as your main weapon and the parent transformation before its refinements. The first volley is 15% weaker; the echo arrives after ${s.echoDelaySeconds} seconds and can miss. Iced Echo slows ordinary enemies by 30% for two seconds, but bosses resist it. Uses one combat slot and both refinements.`;
  if(item.id==='crowds')return `• ${item.name}: an Espresso crowd-control option. At Skillet Capers rank II (from 5:00), each ricochet retains 75% damage; Third Cup gives up to three redirects and Long Table extends their range. Each redirect needs a fresh target, so this is not repeated damage to one boss. Your forward shot loses 10% damage. Requires the parent transformation and both refinements; uses two combat slots.`;
  if(item.id==='special')return `• ${item.name}: bank two special charges for burst damage. Requires an owned special; the extra charge starts empty and recharges one at a time. Recharge takes 1.04× its usual time (${s.perChargeSeconds}s for the example ${s.ability}), while main attacks lose 15% damage. Costs ${item.cost.brass} brass and two relic slots. This does not increase sustained casting speed.`;
  if(item.id==='survival')return `• ${item.name}: a finisher activates 15% damage reduction for two seconds, with six seconds before another finisher can trigger it. An armed Thimble then blocks up to six damage from one hit; it needs both ten hit-free seconds and twelve seconds since its last block. The timers overlap. Costs ${item.cost.brass} brass and two relic slots. Protection is conditional, not permanent.`;
  return null;
}

export function localReviewedReply(chat,knowledge,corrections=[]) {
  const text=chat.question.toLowerCase();
  if(corrections.length&&(!knowledge.needsSpoilerConsent||chat.spoilers))return {answer:corrections.map(c=>c.text).join('\n\n'),sources:corrections.map(c=>({id:c.id,title:'Reviewed '+c.product+' correction',url:c.sourceUrl,version:'Developer reviewed',status:'current'}))};
  if(knowledge.intent==='expansion-complete')return {answer:'We’ve covered the main features. I can go deeper into a particular game, controls, progression, Wibs or Reparty—which interests you?',sources:[]};
  if(/\broguemora\b/.test(text))return {answer:'I don’t recognise Roguemora as a Repo Company game. Did you mean Morogue?',sources:[]};
  const recent=chat.history.filter(m=>m.role==='user').slice(-1)[0]?.content.toLowerCase()||'';
  const bossQuestion=/\bboss(?:es)?\b/.test(text)||/\b(?:list|name|names|them|those|all)\b/.test(text)&&/\bboss(?:es)?\b/.test(recent);
  const morogue=knowledge.products?.includes('morogue')||/\bmorogue\b/.test(text)||/\bmorogue\b/.test(recent)&&!knowledge.products?.length;
  if(morogue&&bossQuestion){
    if(!chat.spoilers)return {answer:'I have the verified Morogue boss list. It includes the final adversary, so there are spoilers. Shall I show you the names?',needsSpoilerConsent:true,sources:[]};
    const guide=knowledge.facts?.find(f=>f.id.startsWith('morogue-boss-guide-'));
    if(guide&&!/\b(?:list all|all (?:the )?boss|boss names|boss list)\b/.test(text))return {answer:guide.text,sources:guide.sources||[]};
    if(/\b(?:beat|defeat|strategy|strategies|weakness|weaknesses|health|hp|damage|attack|attacks)\b/.test(text)){
      return {answer:'Which boss are you facing? I have checked guides for the twelve great adversaries. Tell me its name and the move you’re having trouble with.',sources:[]};
    }
    const groups=[['Great adversaries',roster.greatAdversaries],['Demi-bosses',roster.demibosses],['Final adversary',[roster.finalAdversary]]];
    return {answer:'Here are Morogue’s 23 bosses.\n\n'+groups.map(([title,items])=>title+'\n'+items.map(b=>'• '+b.name).join('\n')).join('\n\n'),sources:[{id:'morogue-boss-roster',title:'Morogue — boss roster',url:'https://morogue.repocompany.uk/',version:'Verified 18 October 2026',status:'current'}]};
  }
  if(knowledge.intent==='catalogue' && /\b(?:best|recommend|suggest|relax\w*|chill|friends?|together|co.op|multiplayer|prefer)\b/.test(text)){
    const withFriends=/\b(?:friends?|together|co.op|multiplayer|online|two player)\b/.test(text);
    const names=withFriends?['Moratales','Goblin Bomb Party']:/\b(?:relax\w*|chill|farm\w*|cafe|story)\b/.test(text)?['Moratales']:/\b(?:manag\w*|tactics|club)\b/.test(text)?['Velmora Manager']:/\b(?:action|roguelite|combat|build)\b/.test(text)?['Morogue']:CATALOGUE_REFERENCE.mainGames;
    const lines=knowledge.facts.find(f=>f.id==='site-game-options')?.text.split('\n')||[];
    const options=names.map(name=>lines.find(line=>line.startsWith(name+' is '))).filter(Boolean).map(line=>line.match(/[^.!?]+[.!?]+/g)?.slice(0,2).join('').trim()||line);
    if(options.length)return {answer:(withFriends?'For playing together, I’d look at these:':'I’d start here:')+'\n\n'+options.map(line=>'• '+line).join('\n\n')+(names.length>1&&!withFriends?'\n\nDo you fancy a story, building a strong character, or running a club?':''),sources:knowledge.sources||[]};
  }
  if(knowledge.intent==='catalogue'){
    const descriptions=(knowledge.facts.find(f=>f.id==='site-game-options')?.text||'').split('\n');
    const main=CATALOGUE_REFERENCE.mainGames.map(name=>'• '+(descriptions.find(line=>line.startsWith(name+' is '))||name));
    return {answer:'Here’s what you can play on Repo Company:\n\nMain games\n'+main.join('\n\n')+'\n\nDemos\n'+CATALOGUE_REFERENCE.demoTitles.map(name=>'• '+name).join('\n')+'\n\nOpen a game case from the collection, or choose a disc under Demos.',sources:knowledge.sources||[]};
  }
  // Exact build calculations deserve exact numbers, not a small model's
  // re-calculation. The reviewed prose includes costs and drawbacks.
  if(knowledge.evidence?.length){
    const items=knowledge.evidence;
    const focused=items.length<=2;
    const lines=items.map(buildOption).filter(Boolean);
    if(lines.length)return {answer:(focused?'I’d consider these options:':'Here are some useful directions for a Morogue build:')+'\n\n'+lines.join('\n\n')+'\n\nChoose around the upgrades you’re actually offered. '+(/\b(?:espresso|sourdough|sabre)\b/.test(text+' '+recent)?'Tell me what you already have and I can narrow it down.':'Which main weapon are you using?'),sources:[...new Map(items.flatMap(item=>item.sources||[]).map(source=>[source.id,source])).values()]};
  }
  // The small local model can invert a clear yes/no fact or drop a condition.
  // Use the reviewed guide itself for product answers; keep generation for
  // open conversation and general knowledge. Retrieval chooses the relevant
  // passages, so this covers the whole maintained library, not a few FAQs.
  if(knowledge.scope==='repo-company'&&knowledge.intent!=='catalogue'&&(!knowledge.needsSpoilerConsent||chat.spoilers)){
    const facts=(knowledge.facts||[]).filter(f=>f.id!=='wibsworth-personality'&&f.id!=='morogue-reviewed-rules').slice(0,3);
    if(facts.length){
      const labelSections=knowledge.intent==='expand'&&new Set(facts.map(f=>f.product)).size>1;
      return {answer:facts.map(f=>(labelSections?f.sources[0].title+'\n':'')+f.text).join('\n\n'),sources:[...new Map(facts.flatMap(f=>f.sources||[]).map(s=>[s.id,s])).values()]};
    }
  }
  return null;
}
