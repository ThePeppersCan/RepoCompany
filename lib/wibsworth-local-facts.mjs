import roster from './wibsworth-boss-roster.mjs';
import { CATALOGUE_REFERENCE } from './wibsworth-knowledge-data.mjs';

export function localReviewedReply(chat,knowledge,corrections=[]) {
  const text=chat.question.toLowerCase();
  if(corrections.length&&(!knowledge.needsSpoilerConsent||chat.spoilers))return {answer:corrections.map(c=>c.text).join('\n\n'),sources:corrections.map(c=>({id:c.id,title:'Reviewed '+c.product+' correction',url:c.sourceUrl,version:'Developer reviewed',status:'current'}))};
  if(/\broguemora\b/.test(text))return {answer:'I don’t recognise Roguemora as a Repo Company game. Did you mean Morogue?',sources:[]};
  const recent=chat.history.filter(m=>m.role==='user').slice(-1)[0]?.content.toLowerCase()||'';
  const bossQuestion=/\bboss(?:es)?\b/.test(text)||/\b(?:list|name|names|them|those|all)\b/.test(text)&&/\bboss(?:es)?\b/.test(recent);
  const morogue=knowledge.products?.includes('morogue')||/\bmorogue\b/.test(text)||/\bmorogue\b/.test(recent)&&!knowledge.products?.length;
  if(morogue&&bossQuestion){
    if(chat.platform!=='web')return {answer:'I have verified the boss roster for the current web game, but haven’t checked that it matches your launcher version yet. I don’t want to give you the wrong list.',sources:[]};
    if(!chat.spoilers)return {answer:'I have the verified Morogue boss list. It includes the final adversary, so there are spoilers. Shall I show you the names?',needsSpoilerConsent:true,sources:[]};
    const guide=knowledge.facts?.find(f=>f.id.startsWith('morogue-boss-guide-'));
    if(guide&&!/\b(?:list all|all (?:the )?boss|boss names|boss list)\b/.test(text))return {answer:guide.text,sources:guide.sources||[]};
    if(/\b(?:beat|defeat|strategy|strategies|weakness|weaknesses|health|hp|damage|attack|attacks)\b/.test(text)){
      return {answer:'Which boss are you facing? I have the web game’s checked guides for the twelve great adversaries. Tell me its name and the move you’re having trouble with; I won’t guess unverified health or damage numbers.',sources:[]};
    }
    const groups=[['Great adversaries',roster.greatAdversaries],['Demi-bosses',roster.demibosses],['Final adversary',[roster.finalAdversary]]];
    return {answer:'Here are the 23 bosses in the current web version of Morogue.\n\n'+groups.map(([title,items])=>title+'\n'+items.map(b=>'• '+b.name).join('\n')).join('\n\n'),sources:[{id:'morogue-boss-roster',title:'Morogue — current web game boss roster',url:'https://morogue.repocompany.uk/',version:'Verified 18 October 2026',status:'current'}]};
  }
  if(knowledge.intent==='catalogue' && /\b(?:best|recommend|suggest|relax\w*|chill|friends?|together|co.op|multiplayer|prefer)\b/.test(text)){
    const withFriends=/\b(?:friends?|together|co.op|multiplayer|online|two player)\b/.test(text);
    const names=withFriends?['Moratales','Goblin Bomb Party']:/\b(?:relax\w*|chill|farm\w*|cafe|story)\b/.test(text)?['Moratales']:/\b(?:manag\w*|tactics|club)\b/.test(text)?['Velmora Manager']:/\b(?:action|roguelite|combat|build)\b/.test(text)?['Morogue']:CATALOGUE_REFERENCE.mainGames;
    const lines=knowledge.facts.find(f=>f.id==='site-game-options')?.text.split('\n')||[];
    const options=names.map(name=>lines.find(line=>line.startsWith(name+' is '))).filter(Boolean).map(line=>line.match(/[^.!?]+[.!?]+/g)?.slice(0,2).join('').trim()||line);
    if(options.length)return {answer:(withFriends?'For playing together, I’d look at these:':'I’d start here:')+'\n\n'+options.map(line=>'• '+line).join('\n\n')+(names.length>1&&!withFriends?'\n\nDo you fancy a story, building a strong character, or running a club?':''),sources:knowledge.sources||[]};
  }
  if(knowledge.intent==='catalogue'){
    return {answer:'Here’s what you can play on Repo Company:\n\nMain games\n'+CATALOGUE_REFERENCE.mainGames.map(name=>'• '+name).join('\n')+'\n\nDemos\n'+CATALOGUE_REFERENCE.demoTitles.map(name=>'• '+name).join('\n')+'\n\nOpen a game case from the collection, or choose a disc under Demos.',sources:knowledge.sources||[]};
  }
  // Exact build calculations deserve exact numbers, not a small model's
  // re-calculation. The reviewed prose includes costs and drawbacks.
  if(knowledge.evidence?.length && /\b(?:best|strongest|combo|combos|combination|combinations|build|builds|compare)\b/.test(text)){
    const facts=knowledge.facts.filter(f=>f.id.startsWith('morogue-combo-'));
    if(facts.length)return {answer:'There isn’t one best build for every fight. Here are the checked options for your version; choose around your weapon and what you need most.\n\n'+facts.map(f=>f.text).join('\n\n')+'\n\nWhich weapon are you using, and are you struggling more with bosses, crowds or staying alive?',sources:knowledge.sources||[]};
  }
  // The small local model can invert a clear yes/no fact or drop a condition.
  // Use the reviewed guide itself for product answers; keep generation for
  // open conversation and general knowledge. Retrieval chooses the relevant
  // passages, so this covers the whole maintained library, not a few FAQs.
  if(knowledge.scope==='repo-company'&&knowledge.intent!=='catalogue'&&(!knowledge.needsSpoilerConsent||chat.spoilers)){
    const facts=(knowledge.facts||[]).filter(f=>f.id!=='wibsworth-personality'&&f.id!=='morogue-reviewed-rules').slice(0,3);
    if(facts.length)return {answer:facts.map(f=>f.text).join('\n\n'),sources:[...new Map(facts.flatMap(f=>f.sources||[]).map(s=>[s.id,s])).values()]};
  }
  return null;
}
