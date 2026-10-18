const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const {retrieveKnowledge,PRODUCTS}=await import('../lib/wibsworth-knowledge.mjs');
 const {conversationReply,serviceQuestion}=await import('../lib/wibsworth-conversation.mjs');
 const {localReviewedReply}=await import('../lib/wibsworth-local-facts.mjs');
 const {localMessages}=await import('../lib/wibsworth-local.mjs');
 const {verifySuggestion}=await import('../lib/wibsworth-learning.mjs');
 const {generalReviewedReply}=await import('../lib/wibsworth-general-facts.mjs');
 assert.match(generalReviewedReply({question:'Where is Lynmouth?'}).answer,/north coast of Devon/);
 assert.equal(generalReviewedReply({question:'What are the opening hours in Lynmouth?'}),null,'A location reference cannot establish current business hours');
 const ask=(question,extra={})=>{const chat={question,history:[],platform:'web',spoilers:false,...extra},k=retrieveKnowledge({message:question,...chat});return {k,answer:conversationReply(chat)||localReviewedReply(chat,k),chat};};
 for(const q of ['Who are you?','What is your name?','What is my website','What website are you on?','What can you do?'])assert.match(ask(q).answer.answer,/Repo Company/);
 assert.match(ask("You're the A.I on it RepoCompany.uk",{history:[{role:'assistant',content:'I do not have access to your website details.'}]}).answer.answer,/Sorry, I lost the thread/);
 assert.equal(conversationReply({question:'Who are you and what is my password?',history:[]}),null);
 for(const q of ['What is the speed limit?','Explain a limit in calculus','What is the monthly Wibs usage?'])assert.equal(serviceQuestion(q),null,q);
 assert.equal(serviceQuestion('How many messages do I have left?'),'usage');
 assert.match(ask('That is wrong').answer.answer,/Which part/);
 assert.match(ask('Remember that my favourite build is coffee').answer.answer,/preferences/);
 const cases=[
  ['How do I back up my Moratales save?',/Export my save/],
  ['How long does lettuce take to grow in Moratales?',/eight watered hours/],
  ['Can I rotate furniture in Moratales?',/R rotates/],
  ['How do I hire staff in Moratales?',/Copper Kettle/],
  ['What are staff wages in Moratales?',/25% higher/],
  ['Why will my dog not follow in Moratales?',/Go over to your dog/],
  ['Where is Silas in Moratales?',/Monday, Wednesday and Saturday/],
  ['What is MoraBook?',/village social feed/],
  ['How can I check my Merrowby investigation in Moratales?',/Casebook/],
  ['Is Intensive training always best in Velmora Manager?',/60% fitness/],
  ['How do I renew a contract in Velmora Manager?',/parent club/],
  ['What does CLOUD QUEUED mean in Velmora Manager?',/saved locally/],
  ['How do I start an online career in Velmora Manager?',/I AM READY/],
  ['When can I recall a loan in Velmora Manager?',/transfer window/],
  ['What does Last Light do in Morogue?',/surviving a hit.*Cannot revive/],
  ['What does Last-supper Soup do in Morogue?',/surviving a hit.*Cannot revive/],
  ['What does Scalding Chai do in Morogue?',/Scalding Chai/],
  ['How do I use a controller in Morogue?',/right stick aims/],
  ['How many perk slots does Morogue have?',/six combat perks/],
  ['What is the difference between RepoScore and Repoints?',/permanent achievement total/],
  ['Can pending friends see my private profile?',/pending request does not grant access/],
  ['How do I unhide my cards in Account?',/Unhide all/],
  ['If I stop watching a screen share in Wibs, does it end the call?',/separate from the hang-up/],
  ['Does Pause for me pause the Reparty room for everyone?',/personally hear/],
  ['How do I resize people in Reparty?',/horizontal divider/],
  ['How does Wibsworth remember my preferences?',/only if you enable and save/]
 ];
 for(const [q,pattern]of cases){const {answer,k}=ask(q);assert.ok(answer,q+' '+JSON.stringify(k));assert.match(answer.answer,pattern,q);assert(answer.sources.every(s=>s.url.startsWith('https://')));}
 for(const p of PRODUCTS.filter(p=>['runners','broomflight','dragonbound','diver','goblin','rooftops','seas','sports'].includes(p.id)))assert.ok(ask('What is '+p.name+'?').answer?.answer.includes(p.name),p.name);
 const unknown=ask('What is Crimson Spire in Morogue?');assert.equal(unknown.k.facts.length,0);assert.match(unknown.k.needsClarification,/Which item, place or screen/);
 const spoiled=ask('How do I beat the Kiln Sovereign in Morogue?');assert.equal(spoiled.k.needsSpoilerConsent,true);assert.equal(spoiled.answer,null);
 assert.match(ask('How do I beat the Kiln Sovereign in Morogue?',{spoilers:true}).answer.answer,/furnace/);
 assert.match(ask('How do I beat the Kiln Sovereign boss in Morogue?',{spoilers:true}).answer.answer,/furnace/);
 assert.match(ask('List all the Morogue bosses',{spoilers:true}).answer.answer,/The Salt Oracle/);
 const base=ask('What does Last Light do in Morogue?');
 const follow=ask('Does it revive me?',{history:[{role:'user',content:base.chat.question},{role:'assistant',content:base.answer.answer}]});
 assert.match(follow.answer.answer,/Cannot revive/);
 const combo=ask('What are the best combos in Morogue?');assert(combo.answer.answer.includes('62.5%'));assert(combo.answer.answer.includes('140'));
 const recommendation=ask('What games do you recommend with friends?').answer;assert.match(recommendation.answer,/Moratales/);assert.match(recommendation.answer,/Goblin Bomb Party/);assert(!recommendation.answer.includes('Glass Pepper'));
 assert.match(ask('Recommend something relaxing to play').answer.answer,/Moratales/);
 assert(!ask('Is Intensive training always best in Velmora Manager?').answer.answer.includes('recruitment suggestions'),'Specific preparation advice should not include unrelated recruitment details');
 const c={question:'Do you remember what I just said?',history:[{role:'user',content:'I like cats'},{role:'assistant',content:'Cats are lovely company.'}],platform:'web',spoilers:false};
 const messages=localMessages(c,{scope:'general',facts:[]},[],'');assert.deepEqual(messages.slice(1,3),c.history);assert.match(messages[0].content,/repocompany.uk/);
 let reads=[];
 const readPublished=async(url,options)=>{reads.push(url);assert.equal(options.redirect,'manual');const name=new URL(url).pathname.slice(1);return new Response(fs.readFileSync(path.join(__dirname,'..',name)));};
 const suggestion={product:'account',text:'Private profile limits your avatar, RepoScore and game activity to accepted friends. Pending requests do not grant access.',sourceUrl:'https://repocompany.uk/Account'};
 const checked=await verifySuggestion(suggestion,readPublished);assert.equal(checked.status,'reference-current');assert(checked.references.some(r=>r.text.includes('pending request')));assert(!checked.approved,'Reference identity cannot approve a member claim');
 const changed=await verifySuggestion(suggestion,async()=>new Response('different content'));assert.equal(changed.status,'needs-review');
 const redirect=await verifySuggestion(suggestion,async()=>new Response(null,{status:302,headers:{Location:'http://127.0.0.1/private'}}));assert.equal(redirect.status,'needs-review');
 reads=[];const untrusted=await verifySuggestion({...suggestion,sourceUrl:'https://repocompany.uk/unused-secret-file'},readPublished);assert.equal(untrusted.status,'needs-review');assert.deepEqual(reads,[]);
 const falseFact=await verifySuggestion({product:'morogue',text:'Crimson Spire is a boss and awards 999999 coins.',sourceUrl:'https://repocompany.uk/Morogue'},readPublished);assert.notEqual(falseFact.status,'approved');
 console.log('PASS: identity/context, personal usage intent, '+cases.length+' detailed guides, all eight demos, unknown facts, follow-ups, exact combo stats, spoilers and bounded official-source verification.');
})().catch(e=>{console.error(e);process.exitCode=1;});
