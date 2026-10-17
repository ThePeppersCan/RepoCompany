const test=require('node:test'),assert=require('node:assert/strict'),{configureMediaPermissions}=require('../lib/media-permissions.cjs');
test('screen capture requires a signed-in main frame, user gesture and fresh source selection',async()=>{
 const handlers={},session={setPermissionCheckHandler:f=>handlers.check=f,setPermissionRequestHandler:f=>handlers.request=f,setDisplayMediaRequestHandler:f=>handlers.display=f},frame={},portal={mainFrame:frame,getURL:()=> 'https://repocompany.uk/',isDestroyed:()=>false};let identity='alice',choose=0,resolve;
 const control=configureMediaPermissions(session,{getPortal:()=>portal,getAccount:()=>({identity,state:{status:identity?'online':'signed-out'}}),getWindow:()=>({isDestroyed:()=>false}),isPortalUrl:u=>new URL(u).origin==='https://repocompany.uk',dialog:{},chooseScreen:()=>{choose++;return new Promise(r=>resolve=r);}});
 const base={frame,securityOrigin:'https://repocompany.uk',videoRequested:true,audioRequested:false,userGesture:true},capture=overrides=>new Promise(r=>handlers.display({...base,...overrides},r));
 const preflight=details=>new Promise(r=>handlers.request(portal,'media',r,{isMainFrame:true,requestingUrl:'https://repocompany.uk/',mediaTypes:[],...details}));
 assert.equal(await preflight({}),true);assert.equal(await preflight({isMainFrame:false}),false);assert.equal(await preflight({requestingUrl:'https://evil.example/'}),false);
 for(const bad of [{frame:{}},{frame:null},{securityOrigin:'https://evil.example'},{userGesture:false},{videoRequested:false},{audioRequested:true}])assert.equal(await capture(bad),null);
 assert.equal(choose,0);const first=capture({});resolve({id:'screen:0',name:'Screen'});assert.deepEqual(await first,{video:{id:'screen:0',name:'Screen'}});
 const stale=capture({});control.reset();resolve({id:'screen:0'});assert.equal(await stale,null);
 const switched=capture({});identity='bob';resolve({id:'screen:0'});assert.equal(await switched,null);
 identity=null;assert.equal(await preflight({}),false);assert.equal(await capture({}),null);control.dispose();assert.equal(await capture({}),null);
});
