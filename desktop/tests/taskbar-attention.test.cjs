'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {TaskbarAttention}=require('../lib/taskbar-attention.cjs');
const message={id:1,username:'alice',name:'Alice',text:'Hello',volume:0};
function fixture(platform='win32') {
  const overlays=[],flashes=[],images=[];
  const window=Object.assign(new EventEmitter(),{focused:false,destroyed:false,isFocused(){return this.focused;},isDestroyed(){return this.destroyed;},setOverlayIcon:(...args)=>overlays.push(args),flashFrame:v=>flashes.push(v)});
  const nativeImage={createEmpty:()=>({addRepresentation(rep){images.push(rep);}}),createFromPath:file=>({toPNG:()=>file})};
  return {window,overlays,flashes,images,attention:new TaskbarAttention({window,nativeImage,root:__dirname,platform})};
}
test('unread badge restores quietly, updates its accessible count, caps artwork, and clears on read/sign-out',()=>{
  const f=fixture(),a=f.attention;a.sync('alice',3);
  assert.equal(f.overlays.length,1);assert.match(f.overlays[0][1],/3 unread messages/);assert.deepEqual(f.flashes,[]);
  assert.equal(f.images.length,2);assert(f.images[0].buffer.endsWith('3-16.png'));assert.equal(f.images[1].scaleFactor,2);
  a.sync('alice',3);assert.equal(f.overlays.length,1);
  a.sync('alice',120);assert(f.images[2].buffer.endsWith('9plus-16.png'));assert.match(f.overlays.at(-1)[1],/120 unread/);
  a.sync('alice',121);assert.equal(f.images.length,4,'large counts reuse their artwork');
  a.sync('alice',0);assert.equal(f.overlays.at(-1)[0],null);
  a.sync('alice',1);assert.match(f.overlays.at(-1)[1],/1 unread message$/);
  a.sync(null,20);assert.equal(f.overlays.at(-1)[0],null);a.dispose();
});
test('only new background messages flash, without focusing; focus stops flashing but keeps unread badge',()=>{
  const f=fixture(),a=f.attention;a.sync('alice',1);a.notify(message);a.notify(message);
  assert.deepEqual(f.flashes,[true]);f.window.focused=true;f.window.emit('focus');
  assert.deepEqual(f.flashes,[true,false]);assert.equal(f.overlays.length,1);
  a.notify({...message,id:2});assert.equal(f.flashes.length,2);
  f.window.focused=false;a.notify({...message,id:2});assert.equal(f.flashes.length,2,'foreground messages cannot flash again on a later poll');
  a.notify({...message,id:3});assert.equal(f.flashes.at(-1),true);
  a.sync('alice',0);assert.equal(f.flashes.at(-1),false,'read in another client clears attention too');a.dispose();
});
test('account changes, invalid data, destroyed windows and unsupported platforms cannot retain attention',()=>{
  const f=fixture(),a=f.attention;a.sync('alice',2);a.notify(message);a.sync('bob',0);
  assert.equal(f.flashes.at(-1),false);assert.equal(f.overlays.at(-1)[0],null);
  a.notify({id:-1});assert.equal(f.flashes.length,2);a.sync(null,0);a.notify(message);assert.equal(f.flashes.length,2);
  f.window.destroyed=true;assert.doesNotThrow(()=>{a.sync('alice',1);a.notify(message);a.dispose();});assert.equal(f.window.listenerCount('focus'),0);
  const other=fixture('linux');other.attention.sync('alice',1);other.attention.notify(message);other.attention.dispose();assert.deepEqual(other.overlays,[]);assert.deepEqual(other.flashes,[]);
});
