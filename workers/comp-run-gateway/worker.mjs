const GAME_HOST='https://repocompany-comp-run.pages.dev';
const PORTAL_HOST='https://repocompany.pages.dev';
function rewritten(upstream,text){const h=new Headers(upstream.headers);for(const n of['content-length','content-encoding','etag'])h.delete(n);h.set('Cache-Control','no-cache');return new Response(text,{status:upstream.status,headers:h});}
export default {async fetch(request,env){
 const url=new URL(request.url),p=url.pathname;
 if(p==='/'){
  const upstream=await fetch(new Request(new URL('/'+url.search,PORTAL_HOST),request));if(!upstream.ok)return upstream;
  const html=await upstream.text();
  return rewritten(upstream,html.replace(/(src=["'][^"']*(?:game-scenes|repo-web-game)\.js(?:\?[^"']*)?)(["'])/g,(_,src,quote)=>src+(src.includes('?')?'&amp;':'?')+'launch-repair=20261029'+quote));
 }
 if(p==='/comp-run')return Response.redirect(url.origin+'/comp-run/'+url.search,308);
 if(p.startsWith('/comp-run/')){
  url.pathname=p.slice('/comp-run'.length);return serveGame(new Request(url,request));
 }
 if(p.startsWith('/comp-run-downloads/2.27.1/')){
  const target=new URL(p+url.search,GAME_HOST);return fetch(new Request(target,request));
 }
 if(p==='/game-scenes.js'){
  const target=new URL(p+url.search,PORTAL_HOST),upstream=await fetch(new Request(target,request));if(!upstream.ok)return upstream;
  const s=await upstream.text();if(!upstream.headers.get('Content-Type')?.includes('javascript'))return new Response('Launcher script unavailable',{status:502});
  // Installed launchers identify the native game by this stable catalogue URL.
  // The browser play window owns the current web URL separately below.
  return rewritten(upstream,s.replace("url:'https://repocompany.uk/comp-run/'","url:'https://comp-run.fluffy-star-4855.chatgpt.site/'"));
 }
 if(p==='/repo-web-game.js'){
  const upstream=await fetch(new Request(new URL(p+url.search,PORTAL_HOST),request));if(!upstream.ok)return upstream;
  if(!upstream.headers.get('Content-Type')?.includes('javascript'))return new Response('Game window unavailable',{status:502});
  return rewritten(upstream,(await upstream.text()).replace("'https://comp-run.fluffy-star-4855.chatgpt.site/'","'https://repocompany.uk/comp-run/'"));
 }
 if(p==='/morogue-account-bridge.js'){
  const upstream=await fetch(new Request(new URL(p+url.search,PORTAL_HOST),request));if(!upstream.ok)return upstream;
  const s=await upstream.text();
  return rewritten(upstream,s.replace('parentNonce=null,authRevision=0;','parentNonce=null,authRevision=0,authUser;').replace('db.auth.onAuthStateChange(()=>{authRevision++;',"db.auth.onAuthStateChange((event,value)=>{const next=value?.user?.id||null;if(event==='SIGNED_OUT'||authUser!==undefined&&next!==authUser)authRevision++;authUser=next;"));
 }
 if(p==='/morogue-account-bridge'||p==='/morogue-account-bridge.html'){
  const upstream=await fetch(new Request(new URL(p+url.search,PORTAL_HOST),request));
  const h=new Headers(upstream.headers),csp=h.get('Content-Security-Policy')||'';
  h.set('Content-Security-Policy',csp.replace(/frame-ancestors [^;]+/,"frame-ancestors 'self' https://www.repocompany.uk https://morogue.repocompany.uk https://moratales.repocompany.uk"));
  h.set('Cache-Control','no-store');
  return new Response(upstream.body,{status:upstream.status,headers:h});
 }
 if(p==='/game-achievements-bridge.js'){
  const upstream=await fetch(new Request(new URL(p+url.search,PORTAL_HOST),request));if(!upstream.ok)return upstream;
  const s=await upstream.text();if(!upstream.headers.get('Content-Type')?.includes('javascript'))return new Response('Account bridge unavailable',{status:502});
  return rewritten(upstream,s.includes("'https://repocompany.uk':")?s:s.replace('const origins={',"const origins={'https://repocompany.uk':['comp-run'],"));
 }
 if(p.startsWith('/api/comp-run/races-v2271/')){
  url.pathname=p.replace('/races-v2271/','/races/');return env.RACES.fetch(new Request(url,request));
 }
 return new Response('Not found',{status:404});
}};
import {createHandler} from './serve.mjs';
import files from './game-files.json' with {type:'json'};
const serveGame=createHandler(files);
