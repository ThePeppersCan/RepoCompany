'use strict';
// A bounded update to the captured shared Worker. No other game routes or modules change.
function replace(source,from,to){if(!source.includes(from)||source.indexOf(from)!==source.lastIndexOf(from))throw Error('Unexpected released Worker: '+from);return source.replace(from,to);}
function patchWorker(source){
 const start=source.indexOf('// server/morogue-leaderboards.mjs'),end=source.indexOf('// server/cloudflare.mjs');if(start<0||end<=start)throw Error('Leaderboard source section missing');
 let api=source.slice(start,end);
 for(const [a,b]of [
  ['var SEASON = "first-light-1";','var SEASON = "first-light-1";\nvar SEASONS = new Set([SEASON,"first-light-insane-1"]);'],
  ['const mode = url.searchParams.get("mode")','const season=url.searchParams.get("season")||SEASON;if(!SEASONS.has(season))throw fail("Unknown difficulty.");\n        const mode = url.searchParams.get("mode")'],
  ['const bindings = [SEASON, mode]','const bindings = [season, mode]'],
  ['return json({ season: SEASON,','return json({ season,'],
  ['body.season !== SEASON','!SEASONS.has(body.season)'],
  ['Start a normal run in the current version of Morogue.','Start a non-practice run in the current version of Morogue.'],
  ['existing.mode !== body.mode','existing.season !== body.season || existing.mode !== body.mode'],
  ['.bind(body.runId, player.id, SEASON,','.bind(body.runId, player.id, body.season,'],
  ['run.season !== SEASON','!SEASONS.has(run.season)']
 ])api=replace(api,a,b);
 return source.slice(0,start)+api+source.slice(end);
}
function patchIntegration(source){return replace(source,"  '/interface/vampire-survivor/app.js':['morogue','relics-20261015/app.js'],","  '/interface/vampire-survivor/app.js':['morogue','relics-20261015/app.js'],\n  '/interface/vampire-survivor/leaderboards.js':['morogue','leaderboards.js'],");}
module.exports={patchWorker,patchIntegration};
