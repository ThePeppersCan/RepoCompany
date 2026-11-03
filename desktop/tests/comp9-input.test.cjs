const test=require('node:test'),assert=require('node:assert/strict');
const {canUseComp9Pointer}=require('../lib/comp9-input.cjs');
const contents={getURL:()=> 'https://repocompany.uk/Comp9',isDestroyed:()=>false};
const base={contents,portal:contents,details:{requestingUrl:'https://repocompany.uk/comp9-playtest/index.html?map=cinema',isMainFrame:false},account:{state:{status:'online'},identity:'test'},window:{isDestroyed:()=>false,isVisible:()=>true,isMinimized:()=>false,isFocused:()=>true},visible:true,blocked:false};
test('signed-in visible COMP-9 frame receives pointer input',()=>{assert.equal(canUseComp9Pointer(base),true);assert.equal(canUseComp9Pointer({...base,origin:'https://repocompany.uk'}),true);});
test('unrelated frames, origins and inactive windows never gain pointer input',()=>{
 for(const patch of [{window:{...base.window,isFocused:()=>false}},{visible:false},{blocked:true},{portal:{}},{account:{state:{status:'offline'}}},{origin:'https://foreign.example'},{details:{...base.details,isMainFrame:true}},{details:{}},{details:{...base.details,requestingUrl:'https://repocompany.uk/other/'}},{details:{...base.details,requestingUrl:'https://foreign.example/comp9-playtest/'}},{window:{...base.window,isMinimized:()=>true}},{window:{...base.window,isVisible:()=>false}}])assert.equal(canUseComp9Pointer({...base,...patch}),false);
});
