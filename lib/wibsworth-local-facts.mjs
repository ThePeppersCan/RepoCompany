import roster from './wibsworth-boss-roster.mjs';
import { CATALOGUE_REFERENCE } from './wibsworth-knowledge-data.mjs';

export function localReviewedReply(chat,knowledge) {
  const text=chat.question.toLowerCase();
  if(/\broguemora\b/.test(text))return {answer:'I don’t recognise Roguemora as a Repo Company game. Did you mean Morogue?',sources:[]};
  const recent=chat.history.filter(m=>m.role==='user').slice(-1)[0]?.content.toLowerCase()||'';
  const bossQuestion=/\bboss(?:es)?\b/.test(text)||/\b(?:list|name|names|them|those|all)\b/.test(text)&&/\bboss(?:es)?\b/.test(recent);
  const morogue=knowledge.products?.includes('morogue')||/\bmorogue\b/.test(text)||/\bmorogue\b/.test(recent)&&!knowledge.products?.length;
  if(morogue&&bossQuestion){
    if(chat.platform!=='web')return {answer:'I have verified the boss roster for the current web game, but haven’t checked that it matches your launcher version yet. I don’t want to give you the wrong list.',sources:[]};
    if(!chat.spoilers)return {answer:'I have the verified Morogue boss list. It includes the final adversary, so there are spoilers. Shall I show you the names?',needsSpoilerConsent:true,sources:[]};
    if(/\b(?:beat|defeat|strategy|strategies|weakness|weaknesses|health|hp|damage|attack|attacks)\b/.test(text))return {answer:'I have the verified boss names, but not a checked strategy or stats guide for them yet. I’d rather say that than send you into a fight with made-up advice.',sources:[]};
    const groups=[['Great adversaries',roster.greatAdversaries],['Demi-bosses',roster.demibosses],['Final adversary',[roster.finalAdversary]]];
    return {answer:'Here are the 23 bosses in the current web version of Morogue.\n\n'+groups.map(([title,items])=>title+'\n'+items.map(b=>'• '+b.name).join('\n')).join('\n\n'),sources:[{id:'morogue-boss-roster',title:'Morogue — current web game boss roster',url:'https://morogue.repocompany.uk/',version:'Verified 18 October 2026',status:'current'}]};
  }
  if(knowledge.intent==='catalogue' && !/\b(?:best|recommend|suggest|relax|friend|together|co.op|multiplayer|prefer)\b/.test(text)){
    return {answer:'Here’s what you can play on Repo Company:\n\nMain games\n'+CATALOGUE_REFERENCE.mainGames.map(name=>'• '+name).join('\n')+'\n\nDemos\n'+CATALOGUE_REFERENCE.demoTitles.map(name=>'• '+name).join('\n')+'\n\nOpen a game case from the collection, or choose a disc under Demos.',sources:knowledge.sources||[]};
  }
  return null;
}
