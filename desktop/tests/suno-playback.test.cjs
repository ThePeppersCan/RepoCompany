const test=require('node:test'),assert=require('node:assert/strict');
const {isSunoFrame,syncState}=require('../lib/suno-playback.cjs');
const id='c72dcf81-5611-4c75-9a62-07a9c9e51fa8',origin='https://repocompany.uk';
function frame(url='https://suno.com/embed/'+id){const top={url:origin+'/'},parent={url:origin+'/reparty/',parent:top};return {url,parent,top};}
test('Suno controls are limited to the current track inside the portal Reparty frame',()=>{
 assert.equal(isSunoFrame(frame(),origin,id),true);
 for(const url of ['https://evil.suno.com/embed/'+id,'http://suno.com/embed/'+id,'https://suno.com:444/embed/'+id,'https://suno.com/song/'+id,'https://suno.com/embed/11111111-1111-1111-1111-111111111111','https://x@suno.com/embed/'+id])assert.equal(isSunoFrame(frame(url),origin,id),false);
 const direct=frame();direct.parent=direct.top;assert.equal(isSunoFrame(direct,origin,id),false);
 const game=frame();game.parent.url=origin+'/games/';assert.equal(isSunoFrame(game,origin,id),false);
 const foreign=frame();foreign.top.url='https://untrusted.example/';assert.equal(isSunoFrame(foreign,origin,id),false);
 assert.equal(isSunoFrame({},origin,id),false);
});
test('sync state carries only bounded playback data, never source URLs or code',()=>{
 const safe=syncState({id,position:999999,sampledAt:1,playing:true,token:'secret',url:'https://untrusted.example'});
 assert.deepEqual(safe,{id,position:86400,sampledAt:1,playing:true});
 for(const input of [null,{}, {id:'bad',position:2,sampledAt:1},{id,position:NaN,sampledAt:1},{id,position:2,sampledAt:Infinity}])assert.equal(syncState(input),null);
});
