// Preserve each live game's HTML, assets, save storage and original Worker routes.
// Only named scripts are replaced with the same published source plus observations.
export function withAchievements(response, request, manifest) {
 if(response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const base='https://repocompany.uk/',url=new URL(request.url);let inserted=false;
 const source=(game,file)=>{const name=`game-integrations/${game}/${file}`;if(!manifest.hashes[name])throw Error('Missing release asset: '+name);return base+name+'?v='+manifest.hashes[name];};
 const replacements={
  '/interface/vampire-survivor/recovery.js':['morogue','recovery.js'],
  '/interface/vampire-survivor/game.js':['morogue','game.js'],
  '/interface/vampire-survivor/food-card-ui.js':['morogue','food-card-ui.js'],
  '/interface/town-cafe-day.js':['moratales','town-cafe-day.js'],
  '/interface/town-cafe-service.js':['moratales','town-cafe-service.js'],
  '/interface/town-kitchen.js':['moratales','town-kitchen.js'],
  '/interface/town-roastery.js':['moratales','town-roastery.js'],
  '/interface/town-pleasure.js':['moratales','town-pleasure.js'],
  '/career-expansion.js':['manager','career-expansion.js'],
  '/career-bootstrap.js':['manager','career-bootstrap.js']
 };
 const before={'/interface/town-explorer.js':'moratales','/interface/vampire-survivor/app.js':'morogue','/career-bootstrap.js':'manager'};
 const rewritten=new HTMLRewriter().on('script[src]',{element(el){
  const src=new URL(el.getAttribute('src'),url);if(src.origin!==url.origin)return;
  const game=before[src.pathname];if(game&&!inserted){inserted=true;el.before(`<script ${el.hasAttribute('defer')?'defer ':''}src="${source(game,'achievement-runtime.js')}" data-game="${game}" data-bundled="true"></script>`,{html:true});}
  const replacement=replacements[src.pathname];if(replacement)el.setAttribute('src',source(...replacement));
 }}).transform(response);
 const headers=new Headers(rewritten.headers);headers.set('Cache-Control','no-cache');headers.set('X-Repo-Achievements','1');headers.delete('ETag');headers.delete('Content-Length');
 return new Response(rewritten.body,{status:rewritten.status,statusText:rewritten.statusText,headers});
}
