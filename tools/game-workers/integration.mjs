// Preserve each live game's HTML, assets, save storage and original Worker routes.
// Only named scripts and styles are replaced with reviewed release assets.
export function withAchievements(response, request, manifest) {
 if(response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const base='https://repocompany.uk/',url=new URL(request.url);let inserted=false,documentBase=url,baseSeen=false;
 const source=(game,file)=>{const name=`game-integrations/${game}/${file}`;if(!manifest.hashes[name])throw Error('Missing release asset: '+name);return base+name+'?v='+manifest.hashes[name];};
 const replacements={
  '/interface/vampire-survivor/app.js':['morogue','app.js'],
  '/interface/vampire-survivor/art.js':['morogue','art.js'],
  '/interface/vampire-survivor/magistrate-encounter.js':['morogue','magistrate-encounter.js'],
  '/interface/vampire-survivor/builds.js':['morogue','builds.js'],
  '/interface/vampire-survivor/build-art.js':['morogue','build-art.js'],
  '/interface/vampire-survivor/game.js':['morogue','game.js'],
  '/interface/vampire-survivor/recovery.js':['morogue','recovery.js'],
  '/interface/vampire-survivor/star-mechanics.js':['morogue','star-mechanics.js'],
  '/interface/vampire-survivor/major-bosses.js':['morogue','major-bosses.js'],
  '/interface/vampire-survivor/audio.js':['morogue','audio.js'],
  '/interface/vampire-survivor/food-cards.js':['morogue','food-cards.js'],
  '/interface/vampire-survivor/food-card-ui.js':['morogue','food-card-ui.js'],
  '/interface/vampire-survivor/food-cards.css':['morogue','food-cards.css'],
  '/interface/town-cafe-day.js':['moratales','town-cafe-day.js'],
  '/interface/town-cafe-service.js':['moratales','town-cafe-service.js'],
  '/interface/town-kitchen.js':['moratales','town-kitchen.js'],
  '/interface/town-roastery.js':['moratales','town-roastery.js'],
  '/interface/town-pleasure.js':['moratales','town-pleasure.js'],
  '/career-expansion.js':['manager','career-expansion.js'],
  '/career-bootstrap.js':['manager','career-bootstrap.js']
 };
 const before={'/interface/town-explorer.js':'moratales','/interface/vampire-survivor/app.js':'morogue','/career-bootstrap.js':'manager'};
 const rewritten=new HTMLRewriter().on('base[href]',{element(el){
  if(baseSeen)return;baseSeen=true;try{documentBase=new URL(el.getAttribute('href'),url);}catch{}
 }}).on('link[rel="stylesheet"][href]',{element(el){
  const src=new URL(el.getAttribute('href'),documentBase);if(src.origin!==url.origin)return;
  const replacement=replacements[src.pathname];if(replacement)el.setAttribute('href',source(...replacement));
 }}).on('script[src]',{element(el){
  const src=new URL(el.getAttribute('src'),documentBase);if(src.origin!==url.origin)return;
  if(src.pathname==='/interface/vampire-survivor/app.js'){
   el.before('<link rel="stylesheet" href="'+source('morogue','grove.css')+'">'+['grove-rig.js','grove-audio.js','grove-encores.js','grove.js'].map(file=>'<script defer src="'+source('morogue',file)+'"></script>').join(''),{html:true});
  }
  const game=before[src.pathname];if(game&&!inserted){inserted=true;el.before(`<script ${el.hasAttribute('defer')?'defer ':''}src="${source(game,'achievement-runtime.js')}" data-game="${game}" data-bundled="true"></script>`,{html:true});}
  const replacement=replacements[src.pathname];if(replacement)el.setAttribute('src',source(...replacement));
 }}).transform(response);
 const headers=new Headers(rewritten.headers);headers.set('Cache-Control','no-cache');headers.set('X-Repo-Achievements','1');headers.delete('ETag');headers.delete('Content-Length');
 return new Response(rewritten.body,{status:rewritten.status,statusText:rewritten.statusText,headers});
}
