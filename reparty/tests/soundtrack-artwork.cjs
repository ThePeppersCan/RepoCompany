const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
async function test(){
 const {findArtwork,validArtworkUrl,onRequestGet}=await import(pathToFileURL(path.resolve(__dirname,'../../functions/api/reparty-artwork.js')));
 let requested;
 const fetcher=async url=>{requested=url;return{ok:true,json:async()=>({query:{pages:[{title:'Sonic the Hedgehog',thumbnail:{source:'https://upload.wikimedia.org/franchise.png'}},{title:'Sonic the Hedgehog (1991 video game)',thumbnail:{source:'https://upload.wikimedia.org/cover.jpg'}}]}})}};
 const result=await findArtwork('Sonic the Hedgehog','game','1991',fetcher);
 assert.equal(result.image,'https://upload.wikimedia.org/cover.jpg');assert.equal(requested.hostname,'en.wikipedia.org');assert.equal(requested.searchParams.get('pilicense'),'any');
 const redirect=await findArtwork('Interstellar (2014)','movie','2014',async()=>({ok:true,json:async()=>({query:{redirects:[{from:'Interstellar (2014 film)',to:'Interstellar (film)'}],pages:[{title:'Interstellar (film)',thumbnail:{source:'https://thumb.wikimedia.org/poster.jpg'}}]}})}));
 assert.equal(redirect.title,'Interstellar (film)');
 assert.equal(await findArtwork('Missing','game','2000',async()=>({ok:false})),null);
 assert.equal(await findArtwork('Missing','game','2000',async()=>({ok:true,json:async()=>({query:{pages:[{title:'Missing',missing:true}]}})})),null);
 assert(!validArtworkUrl('https://upload.wikimedia.org.evil.test/x'));assert(!validArtworkUrl('javascript:alert(1)'));assert(!validArtworkUrl('https://user:pass@upload.wikimedia.org/x'));
 for(const query of ['title=Sonic%7CSomething&category=game','title=Sonic&category=evil','title=Sonic&category=game&year=oops'])assert.equal((await onRequestGet({request:new Request('https://repocompany.uk/api/reparty-artwork?'+query)})).status,400);
 console.log('PASS correct cover preference, movie redirects, missing images, fixed upstream, URL validation and invalid input');
 for(const [title,category,year] of [['Sonic the Hedgehog','game','1991'],['Old School RuneScape','game','2013'],['Interstellar','movie','2014']]){
  const art=await findArtwork(title,category,year);assert(art?.image,title);console.log('LIVE METADATA',title,art.title);
 }
}
test().catch(e=>{console.error(e);process.exitCode=1;});
