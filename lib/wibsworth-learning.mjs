import {FACTS,PRODUCTS,SOURCE_MANIFEST} from './wibsworth-knowledge-data.mjs';
import {LORE_FACTS,LORE_SOURCES} from './wibsworth-lore-data.mjs';
import {EXPANDED_FACTS,EXPANDED_SOURCES} from './wibsworth-expanded-data.mjs';

const facts=[...FACTS,...LORE_FACTS,...EXPANDED_FACTS];
const sources=new Map([...SOURCE_MANIFEST,...LORE_SOURCES,...EXPANDED_SOURCES].map(s=>[s.id,s]));
const ignored=new Set('about after before company could does have information please question really should that their there these this with would what which where moratales morogue manager velmora wibs wibsworth reparty'.split(' '));
const words=text=>new Set((String(text).normalize('NFKC').toLowerCase().match(/[\p{L}]{4,}/gu)||[]).filter(w=>!ignored.has(w)));
const publicOrigins=new Set(['https://repocompany.uk','https://moratales.repocompany.uk','https://manager.repocompany.uk','https://morogue.repocompany.uk']);
const pageKey=value=>{try{const u=new URL(value,'https://repocompany.uk');return u.origin+u.pathname.replace(/\/$/,'');}catch{return '';}};
function sourceUrl(s){
  const url=s.url||(s.path&&!/^(?:lib|ops|tools|desktop)\//.test(s.path)?'https://repocompany.uk/'+s.path:null);
  if(!url)return null;
  const u=new URL(url);return publicOrigins.has(u.origin)&&!u.username&&!u.password?u.href:null;
}
async function currentSource(s,fetcher){
  const url=sourceUrl(s);if(!url)return {id:s.id,status:'manual-review'};
  try{
    const r=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(8000)});
    if(!r.ok||!r.body||Number(r.headers.get('Content-Length'))>4*1024*1024)return {id:s.id,status:'unavailable'};
    const reader=r.body.getReader(),parts=[];let length=0;
    for(;;){const v=await reader.read();if(v.done)break;length+=v.value.length;if(length>4*1024*1024){await reader.cancel();return {id:s.id,status:'too-large'};}parts.push(v.value);}
    let data=new Uint8Array(length),offset=0;for(const part of parts){data.set(part,offset);offset+=part.length;}
    if(s.encoding!=='binary'){
      let text=new TextDecoder().decode(data).replace(/\r\n/g,'\n');
      for(const cache of s.cacheVersions||[]){
        const escaped=cache.url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const re=new RegExp(escaped+'\\?v=[a-f0-9]{12}(?=[\x27\x22`])','g');
        if((text.match(re)||[]).length!==1)return {id:s.id,status:'changed'};
        text=text.replace(re,cache.url+'?v='+cache.version);
      }
      data=new TextEncoder().encode(text);
    }
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(b=>b.toString(16).padStart(2,'0')).join('');
    return {id:s.id,status:digest===s.sha256?'current':'changed'};
  }catch{return {id:s.id,status:'unavailable'};}
}

// This checks evidence, not the truth of arbitrary prose. User text is never
// fetched, executed, used as a URL target or allowed to approve itself.
export async function verifySuggestion({product,text,sourceUrl:link},fetcher=fetch){
  const query=words(text),ranked=facts.filter(f=>f.product===product).map(f=>({f,score:[...words(f.text)].filter(w=>query.has(w)).length})).filter(v=>v.score>=2).sort((a,b)=>b.score-a.score).slice(0,2);
  const canonical=PRODUCTS.find(p=>p.id===product),key=pageKey(link);
  const linked=ranked.filter(({f})=>key===pageKey(canonical?.url)||key===pageKey(f.url)||f.sourceIds.some(id=>{const s=sources.get(id);return s&&sourceUrl(s)&&pageKey(sourceUrl(s))===key;}));
  if(!linked.length)return {status:'needs-review',summary:'This claim is not established by the reviewed references for that page. It stays pending until a developer checks the official source.',checkedAt:Date.now(),references:[]};
  const pins=[...new Set(linked.flatMap(({f})=>f.sourceIds))].map(id=>sources.get(id)).filter(Boolean);
  const checks=await Promise.all(pins.slice(0,6).map(s=>currentSource(s,fetcher)));
  const current=pins.length<=6&&checks.length>0&&checks.every(c=>c.status==='current');
  return {status:current?'reference-current':'needs-review',checkedAt:Date.now(),
    summary:current?'Related official references still match the reviewed version. A developer must compare your claim with the evidence before approving it.':'Some reference material needs a fresh check. The suggestion stays pending; it has not changed shared knowledge.',
    checks,references:linked.map(({f})=>({title:f.title,text:f.text.slice(0,2200),url:new URL(f.url||canonical.url,'https://repocompany.uk').href,spoiler:!!f.spoiler}))};
}
