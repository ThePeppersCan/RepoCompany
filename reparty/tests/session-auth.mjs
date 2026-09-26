import assert from 'node:assert/strict';
import {createRepartyAuth} from '../session-auth.mjs';
const member={user:{id:'member'},access_token:'member-token'},guest={user:{id:'guest',is_anonymous:true},access_token:'guest-token'};
function fixture(initial=[null,null]){
 const clients=[],seen=[],calls=[];
 const auth=createRepartyAuth({config:{url:'url',key:'key',authDomain:'example.test'},onSession:async(c,s)=>{seen.push([clients.indexOf(c),s]);},onError:e=>{throw e;},createClient:(url,key,options)=>{
  const i=clients.length,c={options,emit(s){c.callback('SIGNED_IN',s);},auth:{
   onAuthStateChange(fn){c.callback=fn;},async getSession(){return {data:{session:initial[i]}};},
   async signInAnonymously(args){calls.push(['guest',args]);c.emit(guest);return {data:{session:guest}};},
   async signInWithPassword(args){calls.push(['signin',args]);c.emit(member);return {data:{session:member}};},
   async signUp(args){calls.push(['signup',args]);c.emit(member);return {data:{session:member}};}
  }};clients.push(c);return c;
 }});
 return {auth,clients,seen,calls};
}
const settle=()=>new Promise(r=>setTimeout(r,20));
let f=fixture();await f.auth.start();assert.equal(f.calls.length,0);assert.equal(f.seen.at(-1)[1],null);
assert.equal(f.clients[0].options,undefined);assert.equal(f.clients[1].options.auth.storageKey,'reparty-guest-session');
await assert.rejects(f.auth.continueAsGuest('x'),/2–24/);assert.equal(f.calls.length,0);
await f.auth.continueAsGuest('  Forest   Friend ');assert.equal(f.calls[0][1].options.data.reparty_name,'Forest Friend');assert.equal(f.seen.at(-1)[0],1);
await f.auth.continueAsGuest('Forest Friend');assert.equal(f.calls.length,1);
await f.auth.signIn(' ExistingUser ','password');await settle();assert.equal(f.calls.at(-1)[1].email,'existinguser@example.test');assert.equal(f.seen.at(-1)[0],0);
f.clients[1].emit({...guest,access_token:'refreshed'});await settle();assert.equal(f.seen.at(-1)[1].user.id,'member');
f=fixture([null,guest]);await f.auth.start();assert.equal(f.seen.at(-1)[0],1);assert.equal(f.calls.length,0);
await assert.rejects(f.auth.signUp('bad name','abcdef'),/3–16/);await assert.rejects(f.auth.signUp('NewUser','short'),/6 characters/);
await f.auth.signUp('NewUser','abcdef');assert.deepEqual(f.calls[0],['signup',{email:'newuser@example.test',password:'abcdef',options:{data:{username:'NewUser'}}}]);assert.equal(f.seen.at(-1)[0],0);
f=fixture([member,guest]);await f.auth.start();assert.equal(f.seen.at(-1)[0],0);await settle();
console.log('Guest session restore, isolation, validation, sign in, sign up and account precedence passed');
