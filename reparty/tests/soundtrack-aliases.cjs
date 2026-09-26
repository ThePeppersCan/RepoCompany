const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {setup}=require('./soundtrack.cjs');
const {call,a}=require('./game-mode.cjs');
const root=path.resolve(__dirname,'..');
async function test(){
 const pg=await setup();
 await pg.exec(fs.readFileSync(root+'/supabase/soundtrack-catalogue.sql','utf8'));
 // Reproduce the deployed pre-fix Sonic entry before applying the patch.
 await pg.exec(`update reparty_private.soundtracks set aliases='["Sonic the Hedgehog","Green Hill Zone"]' where id='game-0005'`);
 const patch=fs.readFileSync(root+'/supabase/migrations/20260927020000_reparty_soundtrack_short_names.sql','utf8');
 await pg.exec(patch);await pg.exec(patch);
 await pg.exec(`update reparty_private.soundtracks set aliases='["The Witcher 3: Wild Hunt","Wild Hunt","Witcher 3: Wild Hunt","The Fields of Ard Skellig"]' where id='game-0047'`);
 assert.equal((await pg.query("select reparty_private.soundtrack_matches('witcher',aliases) matched from reparty_private.soundtracks where id='game-0047'")).rows[0].matched,false);
 const witcherPatch=fs.readFileSync(root+'/supabase/migrations/20260927060000_reparty_witcher_answers.sql','utf8');
 await pg.exec(witcherPatch);await pg.exec(witcherPatch);
 const cases=[
  ['Sonic the Hedgehog','sonic',true],['Sonic the Hedgehog','SONIC',true],['Sonic the Hedgehog','Green Hill Zone',true],
  ['Sonic the Hedgehog','mario',false],['Sonic the Hedgehog','sonic 2',false],['Sonic the Hedgehog','son',false],
  ['Halo: Reach','halo',true],['Halo: Reach','HALO',true],['Halo: Reach','halo 3',false],
  ['Halo: Combat Evolved','halo',true],['Halo 2','halo',true],['Halo 3','halo',true],['Halo 4','halo',true],
  ['Halo 3: ODST','halo',true],['Halo 5: Guardians','halo',true],['Halo Infinite','halo',true],['Halo Wars','halo',true],
  ['The Witcher 3: Wild Hunt','witcher',true],['The Witcher 3: Wild Hunt','the witcher',true],
  ['The Witcher 3: Wild Hunt','witcher 3',true],['The Witcher 3: Wild Hunt','the witcher 3',true],
  ['The Witcher 3: Wild Hunt','witcher 2',false],['The Witcher 3: Wild Hunt','witcher ii',false],
  ['The Witcher 3: Wild Hunt','halo',false],['The Witcher 2: Assassins of Kings','witcher',true],
  ['The Witcher 2: Assassins of Kings','witcher 2',true],['The Witcher 2: Assassins of Kings','witcher 3',false],
  ['The Witcher','witcher',true],
  ['The Legend of Zelda','zelda',true],['Super Mario Bros.','mario',true],['Pokémon Red and Blue','pokemon',true],
  ['Grand Theft Auto V','gta',true],['Grand Theft Auto V','gta 5',true],['Grand Theft Auto V','gta 4',false],
  ['Call of Duty: Black Ops','cod',true],['Call of Duty: Black Ops','black ops',true],
  ['Final Fantasy VII','ff7',true],['Final Fantasy VII','ff8',false],
  ['The Legend of Zelda: Ocarina of Time','zelda',true],['The Legend of Zelda: Ocarina of Time','main theme',false],
  ['Old School RuneScape','osrs',true],['Old School RuneScape','runescape',true]
 ];
 for(const [title,guess,expected] of cases){const r=await pg.query('select reparty_private.soundtrack_matches($1,aliases) matched from reparty_private.soundtracks where title=$2',[guess,title]);assert.equal(r.rows.length,1,title);assert.equal(r.rows[0].matched,expected,`${title}: ${guess}`);}
 // Reproduce the reported answer through the actual Chill game RPC, including scoring.
 const room=(await call(pg,a,'reparty_action','create',null,{name:'Witcher scoring test'})).id;
 let g;const quiz=async(action,data={})=>{const s=await call(pg,a,'reparty_soundtrack_action',action,room,{revision:g?.revision,token:g?.token,...data});g=s.room.settings.soundtrack;return s;};
 await pg.exec("update reparty_private.soundtracks set video_id=null where id<>'game-0047'");
 await quiz('enter');await quiz('start',{mode:'chill',category:'game',seconds:15,rounds:10,difficulty:5,players:[{id:a,team:'1'}]});
 await quiz('ready');await pg.query("update reparty_private.soundtrack_sessions set state=jsonb_set(state,'{deadline}',to_jsonb((clock_timestamp()-interval '1 second')::text)) where room_id=$1",[room]);await quiz('tick');
 assert.equal((await quiz('guess',{answer:'witcher'})).quiz_feedback,'correct');await quiz('next');
 assert.equal(g.answer.title,'The Witcher 3: Wild Hunt');assert.equal(g.scores[a],1);
 console.log(`${cases.length} catalogue answer checks passed; patches are repeatable. Chill RPC awards a point for witcher.`);await pg.close();
}
test().catch(e=>{console.error(e);process.exitCode=1;});
