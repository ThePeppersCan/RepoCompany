const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {setup}=require('./soundtrack.cjs'),{call,a,b,c}=require('./game-mode.cjs');
const root=path.resolve(__dirname,'..');
async function test(){
 const pg=await setup();let checks=0;
 const ok=(condition,label)=>{assert.ok(condition,label);checks++;console.log('PASS '+label);};
 const patch=fs.readFileSync(root+'/supabase/migrations/20261002020000_reparty_popular_songs.sql','utf8');
 const catalogue=JSON.parse(fs.readFileSync(root+'/supabase/soundtrack-catalogue.json','utf8')),songs=catalogue.filter(r=>r.category==='popular');
 ok(songs.length===3000,'exactly 3,000 popular songs');
 ok(new Set(songs.map(r=>r.video_id)).size===3000&&new Set(songs.map(r=>r.canonical_key)).size===3000,'no duplicated recordings or song/artist entries');
 ok(songs.every(r=>r.video_id&&r.source_status==='metadata-checked'&&r.chart_sources?.length),'every entry has checked media metadata and chart provenance');
 ok(songs.every(r=>r.year>=1996&&r.year<=2026)&&new Set(songs.map(r=>r.year)).size===31,'chart hits span 1996 through 2026');
 const room=(await call(pg,a,'reparty_action','create',null,{name:'Popular songs QA'})).id;
 await call(pg,b,'reparty_action','join',room);
 let g;const quiz=async(user,name,data={})=>{const s=await call(pg,user,'reparty_soundtrack_action',name,room,{revision:g?.revision,token:g?.token,...data});g=s.room.settings.soundtrack;return s;};
 await quiz(a,'enter');const before=JSON.stringify(g);await pg.exec(patch);await pg.exec(patch);
 ok(JSON.stringify((await call(pg,a,'reparty_action','snapshot',room)).room.settings.soundtrack)===before,'migration reruns preserve existing room state');
 await pg.exec(fs.readFileSync(root+'/supabase/soundtrack-catalogue.sql','utf8'));
 const privateState=async()=>(await pg.query('select state from reparty_private.soundtrack_sessions where room_id=$1',[room])).rows[0].state;
 const start=(mode='versus',difficulty=5,category='popular')=>quiz(a,'start',{mode,category,seconds:15,rounds:50,difficulty,players:[{id:a,team:'1'},{id:b,team:'2'}]});
 await assert.rejects(quiz(c,'enter'),/Join this room/);await assert.rejects(quiz(b,'start',{mode:'versus',category:'popular'}),/host/);checks+=2;
 for(const mode of ['versus','teams','group','chill']){
  await start(mode);let hidden=await privateState();
  const deck=(await pg.query('select * from reparty_private.soundtracks where id=any($1)',[hidden.deck])).rows;
  ok(g.category==='popular'&&g.phase==='loading'&&deck.every(r=>r.category==='popular'),mode+' uses only popular songs');
  ok(deck.length===(mode==='chill'?3000:50)&&new Set(deck.map(r=>r.video_id)).size===deck.length,mode+' draws distinct recordings');
  ok(!g.answer&&!g.current_id&&!g.deck,'song title and artist remain hidden before reveal');
  const track=deck.find(r=>r.id===hidden.current_id);
  await quiz(a,'ready');await quiz(b,'ready');
  await pg.query("update reparty_private.soundtrack_sessions set state=jsonb_set(state,'{deadline}',to_jsonb((clock_timestamp()-interval '1 second')::text)) where room_id=$1",[room]);await quiz(a,'tick');
  let response=await quiz(a,'guess',{answer:track.track});ok(response.quiz_feedback==='incorrect','artist-only guesses do not score');
  await pg.query("update reparty_private.soundtrack_sessions set state=state-'guesses' where room_id=$1",[room]);
  response=await quiz(a,'guess',{answer:track.title});ok(response.quiz_feedback==='correct','song title earns a point');
  await quiz(a,'next');ok(g.answer.title===track.title&&g.answer.track===track.track&&Object.values(g.scores)[0]===1,'reveal shows song and artist with one point');
  await quiz(b,'pause');ok(g.paused,'shared pause works with popular songs');await quiz(a,'resume');
  if(mode==='chill'){
   // The existing engine's full-cycle iteration is exercised by the Disney suite.
   // Force this larger deck to its boundary to verify its next-cycle behavior.
   await pg.query("update reparty_private.soundtrack_sessions set state=jsonb_set(state,'{deck_cursor}','3000'::jsonb) where room_id=$1",[room]);
   const last=g.video_id;await quiz(a,'skip');hidden=await privateState();
   ok(g.video_id!==last&&hidden.deck_cursor===1&&hidden.deck.length===3000&&g.total===null,'Chill reshuffles all 3,000 songs without an immediate repeat');
  }
  await quiz(a,'reset');
 }
 const summary=JSON.parse(fs.readFileSync(root+'/soundtracks/summary.json','utf8'));
 for(const category of ['game','movie','disney','popular','mixed'])for(const difficulty of [1,2,3,4,5]){
  await start('chill',difficulty,category);const {deck}=await privateState();
  const selected=(await pg.query('select * from reparty_private.soundtracks where id=any($1)',[deck])).rows;
  assert(selected.every(r=>r.difficulty<=difficulty&&(category==='mixed'||r.category===category)));assert.equal(deck.length,summary.mixes[category][difficulty]);
  assert.equal(new Set(selected.map(r=>r.video_id)).size,deck.length);await quiz(a,'reset');
 }
 ok(true,'all five category counts and difficulty levels match actual playable decks');
 const bad=await pg.query("select title from reparty_private.soundtracks where category='popular' and not reparty_private.soundtrack_matches(title,aliases)");
 ok(bad.rows.length===0,'all 3,000 canonical song titles are accepted');
 const artists=await pg.query("select title,track from reparty_private.soundtracks where category='popular' and reparty_private.soundtrack_normalize(title)<>reparty_private.soundtrack_normalize(track) and reparty_private.soundtrack_matches(track,aliases)");
 ok(artists.rows.length===0,'artist names are rejected throughout the entire pool');
 await pg.exec('set role authenticated');try{await assert.rejects(pg.exec('select * from reparty_private.soundtracks'),/permission/);}finally{await pg.exec('reset role');}
 ok(true,'private catalogue access remains denied');
 await pg.close();console.log(checks+' popular-song checks passed');
}
test().catch(e=>{console.error(e);process.exitCode=1;});
