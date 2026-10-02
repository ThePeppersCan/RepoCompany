const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {setup}=require('./soundtrack.cjs'),{call,a,b}=require('./game-mode.cjs');
const root=path.resolve(__dirname,'..');
async function test(){
 const pg=await setup();let checks=0;
 const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS '+label);};
 // Upgrade the production function before applying the additive category patch.
 await pg.exec('alter table auth.users add column is_anonymous boolean default false');
 for(const file of ['20260927040000_reparty_lobby.sql','20260927050000_reparty_soundtrack_clip_starts.sql','20260927070000_reparty_guests.sql'])await pg.exec(fs.readFileSync(root+'/supabase/migrations/'+file,'utf8'));
 const patch=fs.readFileSync(root+'/supabase/migrations/20261002010000_reparty_disney_soundtracks.sql','utf8');
 const catalogue=JSON.parse(fs.readFileSync(root+'/supabase/soundtrack-catalogue.json','utf8'));
 const disney=catalogue.filter(r=>r.category==='disney');
 ok(disney.length>=600&&new Set(disney.map(r=>r.title)).size>=190,'large pool spans at least 190 films and shows');
 ok(disney.every(r=>r.video_id&&r.source_status==='metadata-checked'),'every Disney entry has checked YouTube metadata');
 ok(new Set(disney.map(r=>r.video_id)).size===disney.length,'Disney pool contains distinct recordings');
 const room=(await call(pg,a,'reparty_action','create',null,{name:'Disney QA'})).id;
 await call(pg,b,'reparty_action','join',room);
 let g;const quiz=async(user,name,data={})=>{const s=await call(pg,user,'reparty_soundtrack_action',name,room,{revision:g?.revision,token:g?.token,...data});g=s.room.settings.soundtrack;return s;};
 await quiz(a,'enter');const before=JSON.stringify(g);
 await pg.exec(patch);await pg.exec(patch);
 const snapshot=await call(pg,a,'reparty_action','snapshot',room);
 ok(JSON.stringify(snapshot.room.settings.soundtrack)===before,'repeated migration preserves an existing room');
 await pg.exec(fs.readFileSync(root+'/supabase/soundtrack-catalogue.sql','utf8'));
 const state=async()=>(await pg.query('select state from reparty_private.soundtrack_sessions where room_id=$1',[room])).rows[0].state;
 const start=(mode,category='disney',difficulty=5)=>quiz(a,'start',{mode,category,seconds:15,rounds:50,difficulty,clip_start:5,players:[{id:a,team:'1'},{id:b,team:'2'}]});
 await assert.rejects(start('versus','invalid'),/category/);checks++;
 await assert.rejects(quiz(b,'start',{mode:'versus',category:'disney'}),/host/);checks++;
 for(const mode of ['versus','teams','group','chill']){
  await start(mode);const privateState=await state();
  const tracks=(await pg.query('select * from reparty_private.soundtracks where id=any($1)',[privateState.deck])).rows;
  ok(g.phase==='loading'&&g.category==='disney'&&g.start_seconds===5,mode+' supports Disney and shared clip starts');
  ok(tracks.length===(mode==='chill'?disney.length:50)&&tracks.every(r=>r.category==='disney'),mode+' draws only the new pool');
  ok(new Set(tracks.map(r=>r.video_id)).size===tracks.length,mode+' never repeats recordings within a deck');
  ok(!g.deck&&!g.current_id&&!g.answer,'unrevealed answers stay private');
  await quiz(a,'ready');await quiz(b,'ready');
  await pg.query("update reparty_private.soundtrack_sessions set state=jsonb_set(state,'{deadline}',to_jsonb((clock_timestamp()-interval '1 second')::text)) where room_id=$1",[room]);
  await quiz(a,'tick');
  const current=tracks.find(t=>t.id===privateState.current_id);
  const result=await quiz(a,'guess',{answer:current.title});ok(result.quiz_feedback==='correct',mode+' accepts the film or show title');
  await quiz(a,'next');ok(g.phase==='reveal'&&g.answer.category==='disney'&&Object.values(g.scores)[0]===1,mode+' reveals the answer and scores once');
  if(mode==='chill'){
   const heard=new Set([g.video_id]);
   for(let i=1;i<disney.length;i++){await quiz(a,'skip');assert(!heard.has(g.video_id));heard.add(g.video_id);}
   const last=g.video_id;await quiz(a,'skip');
   ok(heard.size===disney.length&&g.video_id!==last&&g.phase==='loading','Chill exhausts the whole pool then reshuffles without a boundary repeat');
  }
  await quiz(a,'reset');
 }
 const summary=JSON.parse(fs.readFileSync(root+'/soundtracks/summary.json','utf8'));
 for(const category of ['game','movie','disney','mixed'])for(const difficulty of [1,2,3,4,5]){
  await start('chill',category,difficulty);const {deck}=await state();
  const tracks=(await pg.query('select * from reparty_private.soundtracks where id=any($1)',[deck])).rows;
  assert(tracks.every(r=>r.difficulty<=difficulty&&(category==='mixed'||r.category===category)));
  assert.equal(new Set(tracks.map(r=>r.video_id)).size,deck.length);
  assert.equal(deck.length,summary.mixes[category][difficulty]);await quiz(a,'reset');
 }
 ok(true,'all category/difficulty counts match playable server decks, including mixed overlaps');
 for(const [title,guess,expected] of [['Frozen II','Frozen 2',true],['Frozen II','Frozen 3',false],['How to Train Your Dragon 2','HTTYD 2',true],['High School Musical 3: Senior Year','High School Musical 3',true],['Mulan','Reflection',true],['Frozen','Disney',false]]){
  const row=disney.find(r=>r.title===title&&(title!=='Mulan'||r.track==='Reflection'));
  assert.equal((await pg.query('select reparty_private.soundtrack_matches($1,$2::jsonb) matched',[guess,JSON.stringify(row.aliases)])).rows[0].matched,expected,title+' / '+guess);
 }
 ok(true,'short titles and sequel aliases work without generic Disney guesses');
 await pg.exec('set role authenticated');try{await assert.rejects(pg.exec('select * from reparty_private.soundtracks'),/permission/);}finally{await pg.exec('reset role');}
 ok(true,'catalogue remains private to the server');
 await pg.close();console.log(checks+' Disney soundtrack checks passed');
}
test().catch(e=>{console.error(e);process.exitCode=1;});
