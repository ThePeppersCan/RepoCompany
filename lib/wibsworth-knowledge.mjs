import {KNOWLEDGE_VERSION, PRODUCTS, SOURCE_MANIFEST, FACTS as BASE_FACTS} from './wibsworth-knowledge-data.mjs';
import {LORE_SOURCES, LORE_FACTS} from './wibsworth-lore-data.mjs';
import {retrieveMorogueFacts, MOROGUE_SOURCE_MANIFEST} from './wibsworth-morogue.mjs';
import {EXPANDED_SOURCES, EXPANDED_FACTS} from './wibsworth-expanded-data.mjs';
import {FINAL_BOSS_SOURCES, FINAL_BOSS_FACTS} from './wibsworth-final-boss-data.mjs';
import {GAME_GUIDE_SOURCES, GAME_GUIDE_FACTS} from './wibsworth-game-guide-data.mjs';

export {KNOWLEDGE_VERSION, PRODUCTS};
const ORIGIN = 'https://repocompany.uk';
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[’']s\b/g, '').replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const phrase = (text, word) => (` ${text} `).includes(` ${normalize(word)} `);
const FACTS=[...BASE_FACTS,...LORE_FACTS,...EXPANDED_FACTS,...FINAL_BOSS_FACTS,...GAME_GUIDE_FACTS];
const sourceById = new Map([...SOURCE_MANIFEST,...LORE_SOURCES,...EXPANDED_SOURCES,...FINAL_BOSS_SOURCES,...GAME_GUIDE_SOURCES].map(source => [source.id,source]));
// Compute once, rather than scanning the whole catalogue for every word hit.
const topicFrequency=new Map();
for(const fact of FACTS)for(const topic of new Set(fact.topics.map(normalize))){const key=fact.product+':'+topic;topicFrequency.set(key,(topicFrequency.get(key)||0)+1);}
const productById = new Map(PRODUCTS.map(product => [product.id,product]));
const knownIds = new Set(productById.keys());
const primary = PRODUCTS.filter(product => !['site','account'].includes(product.id));
// Be forgiving of one mistyped letter in distinctive product names. Keep this
// separate from canonicalProductId: persisted corrections still require exact IDs.
const queryNames=PRODUCTS.filter(p=>!['account','demos','seas','wibs'].includes(p.id)).map(p=>({name:normalize(p.name),compact:normalize(p.name).replace(/ /g,'')}));
function oneEdit(a,b){
  if(a===b)return true;
  if(Math.abs(a.length-b.length)>1)return false;
  let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;
  if(a.length===b.length)return a.slice(i+1)===b.slice(i+1)||a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2);
  return a.length>b.length?a.slice(i+1)===b.slice(i):a.slice(i)===b.slice(i+1);
}
function normalizeQuery(value){
  const words=normalize(String(value??'').replace(/(?:https?:\/\/)?(?:www\.)?repocompany\.uk\b/gi,'repo company')).split(' '),out=[];
  for(let i=0;i<words.length;){
    let match=null;
    for(let size=Math.min(3,words.length-i);size>=1;size--){
      const candidate=words.slice(i,i+size).join('');
      if(candidate.length<6||candidate.length>24||candidate==='morgue')continue;
      const matches=queryNames.filter(p=>(size===1||size===p.name.split(' ').length||candidate===p.compact)&&oneEdit(candidate,p.compact));
      if(matches.length===1){match={size,name:matches[0].name};break;}
    }
    if(match){out.push(match.name);i+=match.size;}else out.push(words[i++]);
  }
  return out.join(' ');
}
const genericOverview = /\b(what is|what are|tell me about|overview|describe|explain|what can|how do i play|how to play|where (is|can|do)|which games|what games|available games|help with|getting started)\b/;
const genericFollowup = /\b(it|its|that|those|this|these|them|more|also|and|what about|how about|another|which|who|won|best|better|combo|combos|build|builds|stats|statistics|why|how|cost|costs|price|prices|version|damage|dps|relics?|upgrades?|perks?|specials?|abilities|keystones?|passives?|survival|crowds|weapons?)\b/;
const generalTopics = /\b(cow|cows|lynmouth|ring of fire|weather|stock price|stock market|crypto|bitcoin|mortgage|tax return|medical diagnosis|medical advice|write (a |me )?(script|code|essay)|python script|javascript code|football world cup|fifa|premier league|politics|president|prime minister)\b/;
const internalContent = /\b(unused (sprite|sprites|assets|files|art)|unreleased|source code|system prompt|api key|api keys|private key|private keys|password|passwords|server secrets|private messages|other peoples messages|someone elses messages)\b/;
const educationalSecurityQuestion = /^(what (?:is|are)|explain|define|how (?:does|do)) (?:a |an |the )?(?:source code|system prompts?|api keys?|private keys?|passwords?|private messages)(?: mean| work| work in general| in programming| in general)?$/;
const ownPasswordHelp = /^(?:(?:how (?:do|can|should) i|how to|help me) (?:reset|change|recover|secure|choose|create|make)|i (?:forgot|have forgotten))\b.*\bpassword\b/;
const social = /^(?:(?:hi|hello|hey|hiya|greetings|good morning|good evening|good afternoon)(?: there| wibsworth)?|(?:thank you|thanks|cheers|ta)(?: very much| wibsworth)?|how are you(?: doing)?(?: wibsworth)?|who are you|tell me about yourself|what can you help (?:me )?with|what can you do|you(?:re| are) (?:cute|lovely|sweet)|(?:bye|goodbye|good night)(?: wibsworth)?)$/;
const directTopicGroups = [
  ['wibs',['screenshare','screen share','screen sharing','watch screen','voice call','voice calls','re-comp','deafen','microphone','monthly usage','game activity','wibs theme']],
  ['reparty',['suno','youtube queue','room chat','shared playlist']],
  ['account',['repoints','reposcore','slab binder','avatar frame','avatar frames','private profile','appear offline','forgot my password','reset my password','create an account']],
  ['moratales',['morabook','copper kettle','biscuit house blend','rooks small harvests']],
  ['sports',['reposports','world cup','worldcup','rovarn','talune','hrafnvik','hrafnar','winged hrafn','blackglass','saint ciro','tuli','aurelia','aurics','golden bee','talun cross','cross serpent','fourways']],
  ['morogue',['glass pepper','lead apricot','sour starter','bitter coffee','skillet capers','carom coffee','falling star cordial']]
];

function catalogueIntent(text, explicit) {
  const local = /\b(repo company|repocompany|your games|this site|this website|on here)\b/.test(text);
  if(!local && /\b(steam|xbox|playstation|nintendo|switch|game pass|epic games|piano|guitar|board games|card games)\b/.test(text))return false;
  if(explicit.some(id=>!['site','demos'].includes(id)))return false;
  return /^(?:your )?(?:games|demos|game library)$/.test(text)
    || /\b(games?|demos?|titles?)\b/.test(text)&&/\b(what|which|any|list|show|browse|recommend|suggest|available|playable|collection|catalogue?|library|have|got|offer)\b/.test(text)
    || /\bwhat (?:can|could|should) (?:i|we) play\b/.test(text)
    || /\b(something|anything)\b/.test(text)&&/\b(play|relaxing|chill|co op|coop|multiplayer|solo|friends?)\b/.test(text);
}

/** Exact product IDs/aliases only, suitable for validating reviewed corrections. */
export function canonicalProductId(value) {
  const text=normalize(value);
  return PRODUCTS.find(product => product.id===text || normalize(product.name)===text || product.aliases.some(alias=>normalize(alias)===text))?.id || null;
}
export function isKnownProduct(value) { return canonicalProductId(value)!==null; }
export function isCanonicalProduct(value) { return knownIds.has(value); }
export const knowledgeSources = Object.freeze([
  ...SOURCE_MANIFEST,
  ...LORE_SOURCES,
  ...EXPANDED_SOURCES,
  ...FINAL_BOSS_SOURCES,
  ...GAME_GUIDE_SOURCES,
  ...(MOROGUE_SOURCE_MANIFEST || []).map((source,index)=>({...source,id:source.id||`morogue-runtime-${index+1}`}))
]);

function explicitProducts(text) {
  const found=primary.filter(product => phrase(text,product.id) || product.aliases.some(alias=>phrase(text,alias))).map(product=>product.id);
  if(found.length)return [...new Set(found)];
  return PRODUCTS.filter(product => ['site','account'].includes(product.id) && product.aliases.some(alias=>phrase(text,alias))).map(product=>product.id);
}
function userQuestions(history) {
  if(!Array.isArray(history))return [];
  return history.slice(-12).filter(item=>typeof item==='string'||item?.role==='user').map(item=>String(typeof item==='string'?item:item.content||item.message||'').slice(0,12000));
}
function inferProducts(text){
  const explicit=explicitProducts(text);
  if(catalogueIntent(text,explicit))return ['site','demos'];
  if(explicit.length)return explicit;
  const topics=directTopicGroups.filter(([,topics])=>topics.some(topic=>phrase(text,topic))).map(([id])=>id);
  if(topics.length)return topics;
  return [...new Set([...EXPANDED_FACTS,...GAME_GUIDE_FACTS.filter(f=>f.inferEntity)].filter(f=>f.entityTopics?.some(name=>phrase(text,name))).map(f=>f.product))];
}
function contextFor(text,history) {
  let products=inferProducts(text),inherited=false,prior='';
  if(!products.length&&genericFollowup.test(text)){
    const followups=[];
    for(const question of userQuestions(history).reverse()){
      const candidate=normalizeQuery(question),found=inferProducts(candidate);
      if(found.length){
        const reference=/\b(it|its|that|those|this|these|them|which one|which ones|same|more)\b/.test(text)||/^(and |also )?(who won|why|how so|how much|another example|what about (?:the )?(?:cost|damage|stats|survival|crowds|cooldown))\b/.test(text);
        const topic=FACTS.filter(fact=>found.includes(fact.product)&&!fact.overview).some(fact=>fact.topics.some(word=>normalize(word).length>4&&phrase(text,word)));
        const gameplay=/\b(combos?|builds?|stats?|damage|dps|cooldown|recharge|relics?|upgrades?|weapons?)\b/.test(text);
        const clientReply=/^(?:the )?(?:web|browser|launcher)(?: version| game)?$/.test(text);
        if(reference||topic||gameplay||clientReply){products=found;inherited=true;prior=[candidate,...followups.reverse()].join('. ');}
        break;
      }
      // Never cross a user topic change into old, unrelated product context.
      if(generalTopics.test(candidate))break;
      if(genericFollowup.test(candidate))followups.push(candidate);
      else break;
    }
  }
  return {products:[...new Set(products)],inherited,prior};
}
function publicSource(fact) {
  const pins=fact.sourceIds.map(id=>sourceById.get(id));
  if(pins.some(pin=>!pin))throw new Error(`Unknown reviewed source for ${fact.id}`);
  const path=fact.url||productById.get(fact.product)?.url;
  if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//'))throw new Error(`Invalid reviewed link for ${fact.id}`);
  return {id:fact.id,title:fact.title,url:new URL(path,ORIGIN).href,version:`${KNOWLEDGE_VERSION}:${pins.map(pin=>pin.sha256.slice(0,12)).join('.')}`,status:fact.status||'current'};
}
const uniqueSources = facts => [...new Map(facts.flatMap(fact=>fact.sources||[]).map(source=>[source.id,source])).values()];
function noKnowledge(scope,products=[],extra={}) {
  return {scope,products,facts:[],sources:[],context:'',confidence:'missing',needsSpoilerConsent:false,...extra};
}

/**
 * Deliberately small deterministic retrieval, not a repository search.
 * Accepts either ({message,history,platform,gameVersion,spoilers,limit}) or
 * (question,{...options}). History is used only to resolve nearby user topics.
 */
export function retrieveKnowledge(request, options={}) {
  const args=typeof request==='string'?{...options,message:request}:{...(request||{})};
  const message=String(args.message||'').slice(0,12000),text=normalizeQuery(message);
  if(!text)return noKnowledge('unknown');
  const educationalSecurity=educationalSecurityQuestion.test(text)||ownPasswordHelp.test(text)&&!/\b(?:someone else|another person|other people|their|his|her|admin|developer)\b/.test(text);
  if(internalContent.test(text)&&!educationalSecurity)return noKnowledge('restricted',inferProducts(text),{reason:'Wibsworth cannot access private information, secrets, unused assets or unreleased content.'});
  if(generalTopics.test(text)&&!explicitProducts(text).length)return noKnowledge('general');
  const {products,inherited,prior}=contextFor(text,args.history);
  if(social.test(text))products.splice(0,products.length,'wibsworth');
  if(!products.length)return noKnowledge('general');
  if(products.includes('site')&&products.includes('demos')){
    const reviewed=FACTS.filter(f=>['site-overview','demos-overview'].includes(f.id));
    const withFriends=/\b(friends?|together|co op|coop|multiplayer|online|two player)\b/.test(text);
    const options=FACTS.filter(f=>f.overview&&(withFriends?['moratales','goblin'].includes(f.product):!['site','account','demos','wibs','wibsworth','reparty'].includes(f.product)));
    const facts=reviewed.map(f=>({id:f.id,product:f.product,text:f.text,status:'current',spoiler:false,sources:[publicSource(f)]}));
    facts.push({id:'site-game-options',product:'site',status:'current',spoiler:false,text:options.map(f=>f.text).join('\n'),sources:facts.flatMap(f=>f.sources)});
    return {scope:'repo-company',intent:'catalogue',products,facts,sources:uniqueSources(facts),context:facts.map(f=>f.text).join('\n\n'),confidence:'grounded',needsSpoilerConsent:false,evidence:[]};
  }
  const limit=Number.isInteger(args.limit)?Math.max(1,Math.min(10,args.limit)):6;
  const spoilers=args.spoilers===true;
  const numericQuery=/\b(best|better|strongest|combo|combos|combination|combinations|build|builds|stats|statistics|damage|dps|crit|critical|cooldown|recharge|relic|relics|perk|perks|weapon|weapons|special|specials|refinement|refinements|finisher|finishers|synergy|synergies|calculate|calculation|percent|percentage)\b/.test(text);
  const namedOverview=products.some(id=>{
    const p=productById.get(id);
    return [p.name,...p.aliases].some(name=>{
      const n=normalize(name),rest=text.replace(n,'').trim()
        .replace(/^(?:(?:so|okay|ok|well|right|but|and|good|great|nice|thanks|thank you|alright|all right|sure)\s+)+/,'')
        .replace(/(?:\s+(?:then|please|exactly|actually|again))+$/,'')
        .replace(/^whats\b/,'what is');
      return text.includes(n)&&/^(?:(?:(?:can|could|would) you (?:please )?)?(?:please )?(?:what is|what are|tell me (?:a (?:bit|little) )?(?:more )?about|overview of|describe|explain|what can i do in|how do i play|how to play|help with|getting started with)(?: the)?)?$/.test(rest);
    });
  });
  // An unknown named item must not be answered using the whole-game overview.
  const overview=!numericQuery&&namedOverview;
  const browseRequest=/\b(?:what|which|list|show|available|types|kinds|tell me about|explain|how many)\b/.test(text)&&!/\b(?:best|better|recommend|strongest|damage|dps|combo|combos|build|builds|compare|versus|cost|costs|price|prices|unlock|refund|how much|slots?|ranks?|maximum|controls?)\b/.test(text);
  const browseCategory=browseRequest?(/\b(?:permanent|pantry)\b/.test(text)?null:/\b(?:specials?|abilities|spells?)\b/.test(text)?'special':/\bkeystones?\b/.test(text)?'keystone':/\bperks?\b/.test(text)?'perk':/\brelics?\b/.test(text)?'relic':/\bpassives?\b/.test(text)?'passive':/\bweapons?\b/.test(text)?'weapon':/\b(?:upgrades?|power ups|powerups)\b/.test(text)?'upgrade':null):null;
  const namedMorogueItem=FACTS.some(f=>f.product==='morogue'&&f.entityTopics?.some(name=>phrase(text,name)||inherited&&/\b(it|its|that|those|these|them|same|this)\b/.test(text)&&phrase(prior,name)));
  const worldCup=/\b(world cup|worldcup|rovarn|talune|tuli|frey|kassi|maro|saffi)\b/.test(text)||(inherited&&/\b(world cup|worldcup)\b/.test(prior));
  const historyFocus=worldCup||/\b(history|historical|lore|past|archive|archives)\b/.test(text);
  let candidates=[],platformLimited=false;
  const referToEntity=inherited&&/\b(it|its|that|those|these|them|same|this)\b/.test(text);
  for(const fact of FACTS){
    if(!products.includes(fact.product))continue;
    if(fact.browseCategory&&(fact.browseCategory!==browseCategory||namedMorogueItem))continue;
    const entityText=fact.guide&&fact.product==='manager'?text.replace(/\bvelmora manager\b/g,'manager'):text;
    const entityPrior=fact.guide&&fact.product==='manager'?prior.replace(/\bvelmora manager\b/g,'manager'):prior;
    const entityContext=`${entityText} ${(fact.guide?referToEntity:inherited)?entityPrior:''}`;
    if(fact.entityTopics&&!fact.entityTopics.some(topic=>phrase(entityContext,topic)))continue;
    if(fact.requiredTopics&&!fact.requiredTopics.some(topic=>phrase(text,topic)||fact.id==='morogue-boss-guide-uncrowned'&&inherited&&phrase(prior,topic)))continue;
    const topicHits=fact.topics.reduce((n,word)=>n+Number(phrase(text,word)),0);
    const topicScore=fact.topics.reduce((n,word)=>{
      if(!phrase(text,word))return n;
      const frequency=topicFrequency.get(fact.product+':'+normalize(word))||1;
      return n+5/Math.max(1,frequency)+2*(normalize(word).split(' ').length-1);
    },0);
    if(fact.platforms&&!fact.platforms.includes(args.platform||'web')){if(topicHits)platformLimited=true;continue;}
    // An introduction is only an answer to an introduction request, never a
    // substitute for a missing mechanic, item, location or follow-up answer.
    if(fact.overview&&!overview&&!(fact.id==='wibsworth-personality'&&social.test(text)))continue;
    if(fact.id.startsWith('sports-world-cup-')){
      if(!worldCup)continue;
      if(fact.id.endsWith('-result')&&!/\b(winner|winners|won|champion|champions|rovarn|talune|final|result|results)\b/.test(text))continue;
      if(fact.id.endsWith('-honours')&&!/\b(honours|awards|tuli|frey|kassi|maro|saffi|players player|fan favourite|top goalscorer|fan villain)\b/.test(text))continue;
    }
    if(fact.id==='sports-clubs'&&worldCup&&!/\b(club|clubs|archive|archives)\b/.test(text))continue;
    if(fact.id==='sports-live-data'&&historyFocus)continue;
    if(fact.id==='sports-overview'&&worldCup&&!overview)continue;
    let score=topicScore+(fact.overview&&overview?7:0)+(fact.id==='wibsworth-personality'&&social.test(text)?20:0);
    if(fact.browseCategory)score+=50;
    if(fact.entityTopics)score+=6;
    if(fact.guide&&fact.entityTopics){
      // A full dish or place name outranks a shorter ingredient inside it.
      const matched=fact.entityTopics.filter(t=>phrase(entityContext,t));
      const specificity=Math.max(...matched.map(t=>normalize(t).split(' ').length));
      score+=specificity*5;
      if(fact.guideKind==='crop'&&/\b(grow|growing|plant|planting|seed|seeds|harvest|regrow|watered)\b/.test(text))score+=20;
      if(fact.guideKind==='ingredient'&&/\b(buy|purchase|shop|supplier|supplies|ingredient|ingredients|get|find)\b/.test(text))score+=20;
      if(fact.guideKind==='recipe'&&/\b(make|cook|bake|prepare|recipe|ingredients)\b/.test(text))score+=12;
    }
    if(!score)continue;
    if(fact.status==='historical'&&worldCup)score+=5;
    candidates.push({...fact,score});
  }
  const detailedProducts=new Set(candidates.filter(fact=>!fact.overview).map(fact=>fact.product));
  const namedEntities=new Set(candidates.filter(fact=>fact.entityTopics).map(fact=>fact.product));
  candidates=candidates.filter(fact=>!(fact.overview&&detailedProducts.has(fact.product))&&!(fact.id==='sports-clubs'&&namedEntities.has('sports')));
  if(namedEntities.has('manager'))candidates=candidates.filter(fact=>fact.id!=='manager-guide-screens');
  candidates.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  // A specific control or named mechanic should not collect unrelated generic
  // guides merely because both contain a broad word such as "room" or "training".
  if(candidates.length)candidates=candidates.filter(f=>f.score>=candidates[0].score*.55);
  let needsSpoilerConsent=candidates.some(fact=>fact.spoiler&&!spoilers);
  let facts=candidates.filter(fact=>!fact.spoiler||spoilers).slice(0,limit).map(fact=>({id:fact.id,product:fact.product,text:fact.text,status:fact.status||'current',spoiler:!!fact.spoiler,sources:[publicSource(fact)]}));
  let evidence=[],caveat=null;
  if(products.includes('morogue')){
    const newGoal=/\b(surviv\w*|safe\w*|defen[cs]\w*|crowds?|groups?|mobs?|aoe|specials?|spells?|cooldowns?|recharge)\b/.test(text);
    const contextualMessage=`Morogue. ${message}${inherited&&!newGoal?` Previous question: ${prior}`:''}`;
    const exactGuide=facts.some(f=>/^morogue-(?:perk|relic|special|keystone|boss-guide|guide)-/.test(f.id));
    const comparison=/\b(?:combos?|combinations?|builds?|synerg\w*|together|stack|compare|versus|with)\b/.test(text)||text.includes(' and ');
    const guideOnly=facts.length&&(!numericQuery||/\b(?:slots?|controls?|keyboard|controller|journal|practice|save|import|export)\b/.test(text)||exactGuide&&!comparison);
    const detail=guideOnly?null:retrieveMorogueFacts({message:contextualMessage,platform:args.platform||'web',gameVersion:args.gameVersion,spoilers});
    if(detail?.facts?.length){
      const verified=detail.facts.filter(fact=>fact.product==='morogue'&&typeof fact.text==='string'&&(!fact.spoiler||spoilers));
      facts=[...verified,...facts.filter(fact=>fact.id!=='morogue-overview')].slice(0,limit);
    }
    needsSpoilerConsent ||= detail?.needsSpoilerConsent===true;
    evidence=detail?.evidence||[];
    caveat=detail?.caveat||null;
  }
  if(!facts.length)return noKnowledge('unknown',products,{needsSpoilerConsent,...(caveat?{caveat}:{}),needsClarification:needsSpoilerConsent?'That answer contains story or result spoilers. Would you like to see them?':caveat||'I don’t have a reliable answer for that detail in '+products.map(id=>productById.get(id)?.name).filter(Boolean).join(' or ')+'. Which item, place or screen do you mean?'});
  const sources=uniqueSources(facts);
  const context=facts.map(fact=>`[${fact.id}; ${fact.product}; ${fact.status}${fact.spoiler?'; spoiler consent granted':''}]\n${fact.text}\nSources: ${fact.sources.map(source=>source.id).join(', ')}`).join('\n\n');
  return {scope:'repo-company',products,facts,sources,context,confidence:'grounded',needsSpoilerConsent,evidence};
}
