const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../soundtrack-mode.js'),'utf8');
const sync=source.slice(source.indexOf(' function syncMedia('),source.indexOf(' function renderClock('));
let current=19,playing=1,remaining=10000,seeks=[],pauses=0;
const context={Date,Math,Number,active:true,connected:true,playerReady:true,video:'abcdefghijk',token:'round1',lastSync:0,needsGesture:false,
 state:{phase:'reveal',seconds:15,start_seconds:4,reveal_position:15,video_id:'abcdefghijk',token:'round1',paused:false},
 left:()=>remaining,ensurePlayer(){},player:{getCurrentTime:()=>current,getPlayerState:()=>playing,seekTo(t){seeks.push(t);current=t;},pauseVideo(){playing=2;pauses++;},playVideo(){playing=1;}}};
vm.createContext(context);vm.runInContext(sync,context);
context.syncMedia(true);assert.equal(current,19);assert.equal(playing,1);assert.equal(pauses,0);
remaining=6000;current=23;context.syncMedia();assert.equal(seeks.length,1);assert.equal(playing,1);
context.state.paused=true;context.syncMedia(true);assert.equal(playing,2);assert.equal(current,23);
context.state.paused=false;context.syncMedia(true);assert.equal(current,23);assert.equal(playing,1);
remaining=10000;context.state.reveal_position=3.25;current=7.25;context.syncMedia(true);assert.equal(current,7.25);assert.equal(playing,1);
remaining=0;context.syncMedia();assert.equal(current,17.25);assert.equal(playing,2);
context.state.phase='guess';remaining=15000;context.syncMedia(true);assert.equal(current,4);assert.equal(playing,1);
context.active=false;context.syncMedia();assert.equal(playing,2);
console.log('PASS audio continuity, early reveal, shared pause/resume, reveal end, new round and exit using the production sync function');
