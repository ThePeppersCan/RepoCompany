import {KNOWLEDGE_VERSION, PRODUCTS, SOURCE_MANIFEST, FACTS as BASE_FACTS} from './wibsworth-knowledge-data.mjs';
import {LORE_SOURCES, LORE_FACTS} from './wibsworth-lore-data.mjs';
import {retrieveMorogueFacts, MOROGUE_SOURCE_MANIFEST} from './wibsworth-morogue.mjs';

export {KNOWLEDGE_VERSION, PRODUCTS};
const ORIGIN = 'https://repocompany.uk';
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[’']s\b/g, '').replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const phrase = (text, word) => (` ${text} `).includes(` ${normalize(word)} `);
const FACTS=[...BASE_FACTS,...LORE_FACTS];
const sourceById = new Map([...SOURCE_MANIFEST,...LORE_SOURCES].map(source => [source.id,source]));
const productById = new Map(PRODUCTS.map(product => [product.id,product]));
const knownIds = new Set(productById.keys());
const primary = PRODUCTS.filter(product => !['site','account'].includes(product.id));
const genericOverview = /\b(what is|what are|tell me about|overview|describe|explain|what can|how do i play|how to play|where (is|can|do)|which games|what games|available games|help with|getting started)\b/;
const genericFollowup = /\b(it|its|that|those|this|these|them|more|also|and|what about|how about|another|which|who|won|best|better|combo|combos|build|builds|stats|statistics|why|how|cost|costs|price|prices|version)\b/;
const generalTopics = /\b(cow|cows|lynmouth|ring of fire|weather|stock price|stock market|crypto|bitcoin|mortgage|tax return|medical diagnosis|medical advice|write (a |me )?(script|code|essay)|python script|javascript code|football world cup|fifa|premier league|politics|president|prime minister)\b/;
const internalContent = /\b(unused (sprite|sprites|assets|files|art)|unreleased|source code|system prompt|api key|api keys|private key|private keys|password|passwords|server secrets|private messages|other peoples messages|someone elses messages)\b/;
const educationalSecurityQuestion = /^(what (?:is|are)|explain|define|how (?:does|do)) (?:a |an |the )?(?:source code|system prompts?|api keys?|private keys?|passwords?|private messages)(?: mean| work| work in general| in programming| in general)?$/;
const ownPasswordHelp = /^(?:(?:how (?:do|can|should) i|how to|help me) (?:reset|change|recover|secure|choose|create|make)|i (?:forgot|have forgotten))\b.*\bpassword\b/;
const social = /^(?:(?:hi|hello|hey|hiya|greetings|good morning|good evening|good afternoon)(?: there| wibsworth)?|(?:thank you|thanks|cheers|ta)(?: very much| wibsworth)?|how are you(?: doing)?(?: wibsworth)?|who are you|tell me about yourself|what can you help (?:me )?with|what can you do|you(?:re| are) (?:cute|lovely|sweet)|(?:bye|goodbye|good night)(?: wibsworth)?)$/;
const directTopicGroups = [
  ['wibs',['screenshare','screen share','screen sharing','watch screen','voice call','voice calls','re-comp','deafen','microphone','monthly usage','game activity','wibs theme']],
  ['reparty',['suno','youtube queue','room chat','shared playlist']],
  ['account',['repoints','slab binder','avatar frame','avatar frames']],
  ['sports',['reposports','world cup','worldcup','rovarn','talune','hrafnvik','hrafnar','winged hrafn','blackglass','saint ciro','tuli','aurelia','aurics','golden bee','talun cross','cross serpent','fourways']],
  ['morogue',['glass pepper','lead apricot','sour starter','bitter coffee','skillet capers','carom coffee','falling star cordial']]
];

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
  return explicit.length?explicit:directTopicGroups.filter(([,topics])=>topics.some(topic=>phrase(text,topic))).map(([id])=>id);
}
function contextFor(text,history) {
  let products=inferProducts(text),inherited=false,prior='';
  if(!products.length&&genericFollowup.test(text)){
    for(const question of userQuestions(history).reverse()){
      const candidate=normalize(question),found=inferProducts(candidate);
      if(found.length){
        const reference=/\b(it|its|that|those|this|these|them|which one|which ones|same|more)\b/.test(text)||/^(and |also )?(who won|why|how so|how much|another example|what about (?:the )?(?:cost|damage|stats|survival|crowds|cooldown))\b/.test(text);
        const topic=FACTS.filter(fact=>found.includes(fact.product)&&!fact.overview).some(fact=>fact.topics.some(word=>normalize(word).length>4&&phrase(text,word)));
        if(reference||topic||/\b(combos?|builds?|stats?|damage|dps|cooldown|recharge)\b/.test(text)){products=found;inherited=true;prior=candidate;}
        break;
      }
      // Never cross a user topic change into old, unrelated product context.
      if(generalTopics.test(candidate))break;
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
  const message=String(args.message||'').slice(0,12000),text=normalize(message);
  if(!text)return noKnowledge('unknown');
  const educationalSecurity=educationalSecurityQuestion.test(text)||ownPasswordHelp.test(text)&&!/\b(?:someone else|another person|other people|their|his|her|admin|developer)\b/.test(text);
  if(internalContent.test(text)&&!educationalSecurity)return noKnowledge('restricted',inferProducts(text),{reason:'Wibsworth cannot access private information, secrets, unused assets or unreleased content.'});
  if(generalTopics.test(text)&&!explicitProducts(text).length)return noKnowledge('general');
  const {products,inherited,prior}=contextFor(text,args.history);
  if(social.test(text))products.splice(0,products.length,'wibsworth');
  if(!products.length)return noKnowledge('general');
  const limit=Number.isInteger(args.limit)?Math.max(1,Math.min(10,args.limit)):6;
  const spoilers=args.spoilers===true;
  const numericQuery=/\b(best|better|strongest|combo|combos|combination|combinations|build|builds|stats|statistics|damage|dps|crit|critical|cooldown|recharge|relic|relics|perk|perks|weapon|weapons|special|specials|refinement|refinements|finisher|finishers|synergy|synergies|calculate|calculation|percent|percentage)\b/.test(text);
  const overview=!numericQuery&&(genericOverview.test(text)||products.some(id=>canonicalProductId(text)===id));
  const worldCup=/\b(world cup|worldcup|rovarn|talune|tuli|frey|kassi|maro|saffi)\b/.test(text)||(inherited&&/\b(world cup|worldcup)\b/.test(prior));
  const historyFocus=worldCup||/\b(history|historical|lore|past|archive|archives)\b/.test(text);
  let candidates=[],platformLimited=false;
  for(const fact of FACTS){
    if(!products.includes(fact.product))continue;
    const entityContext=`${text} ${inherited?prior:''}`;
    if(fact.entityTopics&&!fact.entityTopics.some(topic=>phrase(entityContext,topic)))continue;
    if(fact.requiredTopics&&!fact.requiredTopics.some(topic=>phrase(text,topic)))continue;
    const topicHits=fact.topics.reduce((n,word)=>n+Number(phrase(text,word)),0);
    if(fact.platforms&&!fact.platforms.includes(args.platform||'web')){if(topicHits)platformLimited=true;continue;}
    if(fact.overview&&!overview){
      // General introductions are not answers to specific numerical/gameplay questions.
      if(numericQuery||/\b(why|how many|how much|exact|recipe|recipes|unlock|unlocks|probability|chance|rate|rates|boss|bosses)\b/.test(text))continue;
    }
    if(fact.id.startsWith('sports-world-cup-')){
      if(!worldCup)continue;
      if(fact.id.endsWith('-result')&&!/\b(winner|winners|won|champion|champions|rovarn|talune|final|result|results)\b/.test(text))continue;
      if(fact.id.endsWith('-honours')&&!/\b(honours|awards|tuli|frey|kassi|maro|saffi|players player|fan favourite|top goalscorer|fan villain)\b/.test(text))continue;
    }
    if(fact.id==='sports-clubs'&&worldCup&&!/\b(club|clubs|archive|archives)\b/.test(text))continue;
    if(fact.id==='sports-live-data'&&historyFocus)continue;
    if(fact.id==='sports-overview'&&worldCup&&!overview)continue;
    let score=topicHits*3+(fact.overview&&overview?7:0)+(fact.id==='wibsworth-personality'&&social.test(text)?20:0);
    if(fact.entityTopics)score+=6;
    if(!score)continue;
    if(fact.status==='historical'&&worldCup)score+=5;
    candidates.push({...fact,score});
  }
  const detailedProducts=new Set(candidates.filter(fact=>!fact.overview).map(fact=>fact.product));
  const namedEntities=new Set(candidates.filter(fact=>fact.entityTopics).map(fact=>fact.product));
  candidates=candidates.filter(fact=>!(fact.overview&&detailedProducts.has(fact.product))&&!(fact.id==='sports-clubs'&&namedEntities.has('sports')));
  candidates.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  let needsSpoilerConsent=candidates.some(fact=>fact.spoiler&&!spoilers);
  let facts=candidates.filter(fact=>!fact.spoiler||spoilers).slice(0,limit).map(fact=>({id:fact.id,product:fact.product,text:fact.text,status:fact.status||'current',spoiler:!!fact.spoiler,sources:[publicSource(fact)]}));
  let evidence=[],caveat=null;
  if(products.includes('morogue')){
    const newGoal=/\b(surviv\w*|safe\w*|defen[cs]\w*|crowds?|groups?|mobs?|aoe|specials?|spells?|cooldowns?|recharge)\b/.test(text);
    const contextualMessage=`Morogue. ${message}${inherited&&!newGoal?` Previous question: ${prior}`:''}`;
    const detail=retrieveMorogueFacts({message:contextualMessage,platform:args.platform||'web',gameVersion:args.gameVersion,spoilers});
    if(detail?.facts?.length){
      const verified=detail.facts.filter(fact=>fact.product==='morogue'&&typeof fact.text==='string'&&(!fact.spoiler||spoilers));
      facts=[...verified,...facts.filter(fact=>fact.id!=='morogue-overview')].slice(0,limit);
    }
    needsSpoilerConsent ||= detail?.needsSpoilerConsent===true;
    evidence=detail?.evidence||[];
    caveat=detail?.caveat||null;
  }
  if(!facts.length)return noKnowledge('unknown',products,{needsSpoilerConsent,...(caveat?{caveat}:{}),needsClarification:needsSpoilerConsent?'That answer contains story or result spoilers. Would you like to see them?':caveat||(platformLimited?'Those gameplay details are verified for the current web build, but not your installed version yet.':'I do not have verified information for that specific question yet.')});
  const sources=uniqueSources(facts);
  const context=facts.map(fact=>`[${fact.id}; ${fact.product}; ${fact.status}${fact.spoiler?'; spoiler consent granted':''}]\n${fact.text}\nSources: ${fact.sources.map(source=>source.id).join(', ')}`).join('\n\n');
  return {scope:'repo-company',products,facts,sources,context,confidence:'grounded',needsSpoilerConsent,evidence};
}
