const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {setup}=require('./soundtrack.cjs');
const root=path.resolve(__dirname,'..');
async function test(){
 const pg=await setup();
 await pg.exec(fs.readFileSync(root+'/supabase/soundtrack-catalogue.sql','utf8'));
 // Reproduce the deployed pre-fix Sonic entry before applying the patch.
 await pg.exec(`update reparty_private.soundtracks set aliases='["Sonic the Hedgehog","Green Hill Zone"]' where id='game-0005'`);
 const patch=fs.readFileSync(root+'/supabase/migrations/20260927020000_reparty_soundtrack_short_names.sql','utf8');
 await pg.exec(patch);await pg.exec(patch);
 const cases=[
  ['Sonic the Hedgehog','sonic',true],['Sonic the Hedgehog','SONIC',true],['Sonic the Hedgehog','Green Hill Zone',true],
  ['Sonic the Hedgehog','mario',false],['Sonic the Hedgehog','sonic 2',false],['Sonic the Hedgehog','son',false],
  ['The Legend of Zelda','zelda',true],['Super Mario Bros.','mario',true],['Pokémon Red and Blue','pokemon',true],
  ['Grand Theft Auto V','gta',true],['Grand Theft Auto V','gta 5',true],['Grand Theft Auto V','gta 4',false],
  ['Call of Duty: Black Ops','cod',true],['Call of Duty: Black Ops','black ops',true],
  ['Final Fantasy VII','ff7',true],['Final Fantasy VII','ff8',false],
  ['The Legend of Zelda: Ocarina of Time','zelda',true],['The Legend of Zelda: Ocarina of Time','main theme',false],
  ['Old School RuneScape','osrs',true],['Old School RuneScape','runescape',true]
 ];
 for(const [title,guess,expected] of cases){const r=await pg.query('select reparty_private.soundtrack_matches($1,aliases) matched from reparty_private.soundtracks where title=$2',[guess,title]);assert.equal(r.rows.length,1,title);assert.equal(r.rows[0].matched,expected,`${title}: ${guess}`);}
 console.log(`${cases.length} catalogue answer checks passed; alias patch is repeatable.`);await pg.close();
}
test().catch(e=>{console.error(e);process.exitCode=1;});
