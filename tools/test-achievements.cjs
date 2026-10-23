const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {games}=JSON.parse(fs.readFileSync(path.join(root,'assets/achievements/catalogue.json')));
const model=require('../achievement-model.js');
const ids=new Set(),artCells=new Set();
assert.equal(games.length,4);
assert.equal(games.reduce((n,g)=>n+g.totalRepoScore,0),10225);
for(const g of games){
  assert.equal(g.achievements.length,g.id==='comp-run'?19:100);
  assert.equal(g.totalRepoScore,g.achievements.reduce((n,a)=>n+a.repoScore,0));
  for(const a of g.achievements){
    assert(!ids.has(a.id),`Duplicate ID ${a.id}`);ids.add(a.id);
    assert(a.name&&a.description&&a.category,`Missing copy ${a.id}`);
    assert(Number.isInteger(a.repoScore)&&a.repoScore>0);
    const art=a.art,key=`${art.sheet}:${art.x}:${art.y}`;
    assert(!artCells.has(key),`Repeated badge ${a.id}`);artCells.add(key);
    assert(art.x>=0&&art.y>=0&&art.width>0&&art.height>0);
    assert(art.x+art.width<=art.sheetWidth&&art.y+art.height<=art.sheetHeight,`Crop outside sheet ${a.id}`);
    assert(fs.existsSync(path.join(root,art.sheet)),`Missing sprite ${art.sheet}`);
  }
  const sorted=model.select(g.achievements,{sort:'score-desc'});
  assert(sorted.every((a,i)=>i===0||sorted[i-1].repoScore>=a.repoScore));
  for(const a of g.achievements.filter(a=>a.secret)){
    assert(!model.select(g.achievements,{query:a.name}).some(row=>row.id===a.id),`Secret leaked in search ${a.id}`);
    assert(model.select(g.achievements,{query:a.name,revealAll:true}).some(row=>row.id===a.id));
    assert(model.select(g.achievements,{query:a.name,revealed:new Set([a.id])}).some(row=>row.id===a.id));
  }
  const secretRows=model.select(g.achievements,{category:'secret'});
  assert(secretRows.every(a=>a.secret));
  assert.equal(secretRows.length,g.achievements.filter(a=>a.secret).length);
  assert.equal(model.select(g.achievements,{query:'zxqvnoachievementhere'}).length,0);
  console.log(`${g.name}: ${g.achievements.length} valid achievements; ${g.totalRepoScore} RepoScore; ${secretRows.length} secrets protected; unique in-bounds badge crops.`);
}
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal((index.match(/class="game-achievement-link"/g)||[]).length,1);
assert(index.includes('data-open-achievements="moratales"'));
assert(!index.includes('href="/achievements"'),'The dashboard must keep achievements inside Account');
for(const script of ['avatar-renderer.js','avatar-studio.js','account-profile.js','dashboard-playtime.js','account-achievements.js'])assert(index.includes(`src="${script}"`),`Missing restored component ${script}`);
const {execFileSync}=require('node:child_process');
for(const file of ['account-profile.css','avatar-renderer.js','avatar-studio.js','avatar-studio.css','dashboard-service.js','dashboard-playtime.js','functions/api/dashboard/[[path]].js','wrangler.toml','demo-library.js','legacy-launcher.js']){
 const expected=execFileSync('git',['show',`fd6036fecead55f0dc0c43c1c0dfc6df6755034a:${file}`],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');
 assert.equal(fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n'),expected,`Restored release changed unexpectedly: ${file}`);
}
const profile=fs.readFileSync(path.join(root,'account-profile.js'),'utf8');
for(const marker of ['profile-identity','profile-friends','profile-game-banner','repoAvatar','profile-presence','data-edit-avatar','data-block-player','Mutual friends'])assert(profile.includes(marker),`Missing restored profile feature: ${marker}`);
for(const game of games)assert(fs.existsSync(path.join(root,game.id==='comp-run'?'original-case-assets/comp-run/hero-art.webp':`account-assets/${game.id}-activity-banner-v1.png`)));
assert(fs.readFileSync(path.join(root,'homepage.js'),'utf8').includes("game:id.split('/')[2]"));
console.log('PASS: restored profiles, Friends, banners, avatars, privacy API and play-time components match the previous live release.');
console.log('PASS: 319 unique achievements / 10,225 RepoScore; search, reveal, categories, sorting and asset validation.');
