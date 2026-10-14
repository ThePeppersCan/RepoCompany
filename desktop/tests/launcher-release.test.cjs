'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const release=require('../tools/publish-launcher-release.cjs');
const {signPayload,keyPath}=require('../tools/launcher-signing.cjs');
const {verifyManifest,SIGNING_CONTEXT}=require('../lib/update-manifest.cjs');
const {buildLauncherFeed}=require('../../tools/build-launcher-feed.cjs');
const pair=crypto.generateKeyPairSync('ed25519');
const config={url:'https://repocompany.uk/releases/launcher/latest.json',keyId:'repo-launcher-2026-01',publicKey:pair.publicKey.export({format:'pem',type:'spki'}),minSequence:1,publisherName:'Repo Company Update Key'};
const bytes=Buffer.from('reviewed installer fixture');
const digest={size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),sha512:crypto.createHash('sha512').update(bytes).digest('base64')};
const identity={version:'0.1.6',commit:'a'.repeat(40)};
const payload=()=>release.createPayload(identity,digest,6);
function git(repo,args){return execFileSync('git',['-C',repo,...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}).trim();}
async function fixture(t){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'repo-launcher-release-test-')),repo=path.join(root,'repo');
  t.after(async()=>{const target=await fs.realpath(root);assert.equal(path.dirname(target).toLowerCase(),(await fs.realpath(os.tmpdir())).toLowerCase());assert.ok(path.basename(target).startsWith('repo-launcher-release-test-'));await fs.rm(target,{recursive:true,force:true});});
  await fs.mkdir(path.join(repo,'desktop/lib'),{recursive:true});
  const pkg={name:'repo-company-launcher',version:'0.1.6',main:'main.cjs',dependencies:{'electron-updater':'6.6.2'}};
  await fs.writeFile(path.join(repo,'desktop/package.json'),JSON.stringify(pkg));
  await fs.writeFile(path.join(repo,'desktop/main.cjs'),"'use strict'; module.exports = 1;\n");
  await fs.writeFile(path.join(repo,'desktop/config.cjs'),'module.exports=()=>('+JSON.stringify({launcherUpdates:config})+');\n');
  await fs.writeFile(path.join(repo,'desktop/lib/runtime.cjs'),'module.exports = 2;\n');
  git(repo,['init','--quiet']);git(repo,['config','core.autocrlf','false']);git(repo,['add','desktop']);
  git(repo,['-c','user.name=Release test','-c','user.email=release-test@example.invalid','commit','--quiet','-m','Reviewed fixture']);
  const commit=git(repo,['rev-parse','HEAD']),installer=path.join(root,'installer.exe');await fs.writeFile(installer,bytes);
  return {root,repo,commit,installer,pkg};
}
test('signing uses the pinned key and exact domain separation; tampering fails',()=>{
  const envelope=signPayload(payload(),pair.privateKey);
  assert.equal(verifyManifest(envelope,config).payload.version,'0.1.6');
  assert.equal(crypto.verify(null,Buffer.concat([SIGNING_CONTEXT,Buffer.from(envelope.payload,'base64')]),pair.publicKey,Buffer.from(envelope.signature,'base64')),true);
  assert.equal(crypto.verify(null,Buffer.from(envelope.payload,'base64'),pair.publicKey,Buffer.from(envelope.signature,'base64')),false);
  assert.throws(()=>verifyManifest({...envelope,payload:Buffer.from(JSON.stringify({...payload(),sequence:99})).toString('base64')},config),/signature/);
  const other=crypto.generateKeyPairSync('ed25519');assert.throws(()=>verifyManifest(signPayload(payload(),other.privateKey),config),/signature/);
});
test('payload fixes immutable URL, dates, release identity and rejects bad sequence/lifetime',()=>{
  const result=release.createPayload(identity,digest,6,{now:0,days:366});
  assert.equal(result.issuedAt,'1970-01-01T00:00:00.000Z');assert.equal(Date.parse(result.expiresAt),366*86400000);
  assert.equal(result.installer.url,'https://github.com/ThePeppersCan/RepoCompany/releases/download/launcher-v0.1.6/Repo-Company-0.1.6-Windows-x64.exe');
  for(const sequence of [0,-1,NaN,1.5])assert.throws(()=>release.createPayload(identity,digest,sequence));
  assert.throws(()=>release.createPayload(identity,digest,6,{days:367}));
});
test('release preparation requires exact committed clean desktop source, tolerating feed-only differences',async t=>{
  const f=await fixture(t);assert.equal(release.sourceIdentity(f.commit,f.repo).version,'0.1.6');
  await fs.mkdir(path.join(f.repo,'releases/launcher'),{recursive:true});await fs.writeFile(path.join(f.repo,'releases/launcher/latest.json'),'feed');
  assert.equal(release.sourceIdentity(f.commit,f.repo).commit,f.commit);
  await fs.writeFile(path.join(f.repo,'desktop/unreviewed.cjs'),'unreviewed');assert.throws(()=>release.sourceIdentity(f.commit,f.repo),/Commit the reviewed/);
  await fs.unlink(path.join(f.repo,'desktop/unreviewed.cjs'));await fs.appendFile(path.join(f.repo,'desktop/main.cjs'),'changed');assert.throws(()=>release.sourceIdentity(f.commit,f.repo),/Commit the reviewed/);
  assert.throws(()=>release.sourceIdentity('b'.repeat(40),f.repo),/checkout/);
  await assert.rejects(keyPath(path.join(f.repo,'secret.dpapi')),/Git checkout/);
});
test('installer archive is compared to committed runtime, rejects unexpected files and mismatched package',async t=>{
  const f=await fixture(t),id=release.sourceIdentity(f.commit,f.repo),archive=path.join(f.root,'fixture.asar');await fs.writeFile(archive,'archive fixture');
  const packed={};for(const name of ['main.cjs','config.cjs','lib/runtime.cjs','package.json'])packed[name]=await fs.readFile(path.join(f.repo,'desktop',name));
  const asar={listPackage:()=>Object.keys(packed).map(name=>'/'+name),extractFile:(_,name)=>packed[name.replace(/\\/g,'/')],statFile:()=>({})};
  assert.equal((await release.verifyArchive(archive,id,config,{repo:f.repo,asar})).verifiedRuntimeFiles,3);
  git(f.repo,['config','core.autocrlf','true']);packed['main.cjs']=Buffer.from(packed['main.cjs'].toString().replace(/\n/,'\r\n'));
  assert.equal((await release.verifyArchive(archive,id,config,{repo:f.repo,asar})).verifiedRuntimeFiles,3,'Git-normalized Windows line endings preserve committed identity');
  const reviewed=packed['main.cjs'];packed['main.cjs']=Buffer.from(reviewed.toString().replace('exports = 1','exports = 999'));
  await assert.rejects(release.verifyArchive(archive,id,config,{repo:f.repo,asar}),/source differs/);packed['main.cjs']=reviewed;
  await fs.appendFile(path.join(f.repo,'desktop/main.cjs'),'uncommitted');assert.equal((await release.verifyArchive(archive,id,config,{repo:f.repo,asar})).verifiedRuntimeFiles,3,'Archive verification reads committed bytes, not mutable working bytes');
  packed['lib/unreviewed.cjs']=Buffer.from('x');await assert.rejects(release.verifyArchive(archive,id,config,{repo:f.repo,asar}),/Unexpected/);delete packed['lib/unreviewed.cjs'];
  packed['package.json']=Buffer.from(JSON.stringify({...f.pkg,version:'0.1.5'}));await assert.rejects(release.verifyArchive(archive,id,config,{repo:f.repo,asar}),/identity/);
});
test('asset verification downloads and hashes when GitHub omits its digest; never forwards token to CDN',async()=>{
  const asset={state:'uploaded',size:bytes.length,url:'https://api.github.com/repos/ThePeppersCan/RepoCompany/releases/assets/123'},calls=[];
  const fetchImpl=async(url,options)=>{calls.push({url,options});return calls.length===1?new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/fixture'}}):new Response(bytes);};
  await release.verifyRemoteAsset(asset,digest,{fetchImpl,headers:{Authorization:'Bearer fixture'}});
  assert.equal(calls.length,2);assert.equal(calls[0].options.headers.Authorization,'Bearer fixture');assert.equal(calls[1].options.headers,undefined);
  await assert.rejects(release.verifyRemoteAsset(asset,digest,{fetchImpl:async()=>new Response(Buffer.alloc(bytes.length)),headers:{}}),/differs/);
  await assert.rejects(release.verifyRemoteAsset({...asset,url:'https://evil.invalid/asset'},digest,{fetchImpl:async()=>{throw Error('Must never request');},headers:{}}),/API URL/);
  await assert.rejects(release.verifyRemoteAsset(asset,digest,{fetchImpl:async()=>new Response(null,{status:302,headers:{location:'https://evil.invalid/asset'}}),headers:{}}),/download host/);
  await assert.rejects(release.verifyRemoteAsset({...asset,digest:'sha256:'+'0'.repeat(64)},digest,{headers:{}}),/digest/);
});
test('packaged updater metadata requires its exact verification sentinel and safe cache directory',()=>{
  const id={...identity,pkg:{name:'repo-company-launcher'}},value={provider:'generic',url:'https://repocompany.uk/releases/launcher/',publisherName:[config.publisherName],updaterCacheDirName:'repo-company-launcher-updater'};
  const verify=value=>release.verifyUpdateMetadata(Buffer.from(JSON.stringify(value)),id,config,{loadYaml:JSON.parse});
  assert.match(verify(value).updateMetadataSha256,/^[a-f0-9]{64}$/);
  for(const key of Object.keys(value)){const changed={...value};delete changed[key];assert.throws(()=>verify(changed),/metadata/);}
  assert.throws(()=>verify({...value,publisherName:'Unknown publisher'}),/metadata/);
  assert.throws(()=>verify({...value,publisherName:[config.publisherName,'Other publisher']}),/metadata/);
  assert.throws(()=>verify({...value,updaterCacheDirName:'../../elsewhere'}),/metadata/);
});
test('installer extraction supports directly detected 7z and legacy nested archives without accepting incomplete metadata',async t=>{
  const f=await fixture(t);
  for(const layout of ['direct','legacy','incomplete','missing']){
    const inspect=path.join(f.root,layout);await fs.mkdir(inspect);const calls=[];
    const execute=async(_exe,args)=>{
      calls.push(args);const names=args.slice(5),from=args[4];
      if(layout==='direct'||layout==='incomplete'){
        await fs.writeFile(path.join(inspect,'app.asar'),'archive');
        if(layout==='direct')await fs.writeFile(path.join(inspect,'app-update.yml'),'metadata');
      }else if(layout==='legacy'&&names[0]==='$PLUGINSDIR/app-64.7z')await fs.writeFile(path.join(inspect,'app-64.7z'),'nested');
      else if(layout==='legacy'&&from.endsWith('app-64.7z')){await fs.writeFile(path.join(inspect,'app.asar'),'archive');await fs.writeFile(path.join(inspect,'app-update.yml'),'metadata');}
    };
    const operation=release.extractInstallerFiles(f.installer,inspect,process.execPath,{execute});
    if(layout==='direct'){assert.equal(await operation,'embedded-7z');assert.equal(calls.length,1);}
    else if(layout==='legacy'){assert.equal(await operation,'nested-7z');assert.equal(calls.length,3);}
    else {await assert.rejects(operation,/missing|required|expected/);assert.ok(calls.length<=2);}
    assert.deepEqual(calls[0].slice(5),['resources/app.asar','resources/app-update.yml']);
  }
});
test('publisher verifies both draft assets before exposing a release and checks public installer before returning',async t=>{
  const f=await fixture(t),p=payload(),manifestFile=path.join(f.root,'manifest.json');await fs.writeFile(manifestFile,JSON.stringify(signPayload(p,pair.privateKey)));
  const manifestDigest=await release.fileDigest(manifestFile),events=[];let draft=true;
  const record=()=>({id:12,tag_name:'launcher-v0.1.6',draft,prerelease:false,upload_url:'https://uploads.github.com/repos/ThePeppersCan/RepoCompany/releases/12/assets{?name,label}',html_url:'https://github.com/ThePeppersCan/RepoCompany/releases/tag/launcher-v0.1.6'});
  const fetchImpl=async(url,options={})=>{
    const method=options.method||'GET';events.push(method+' '+url);
    if(url.endsWith('/commits/'+p.sourceCommit))return Response.json({sha:p.sourceCommit});
    if(url.includes('/git/ref/')||url.includes('/releases/tags/'))return new Response('',{status:404});
    if(url.endsWith('/releases')&&method==='POST')return Response.json(record());
    if(url.endsWith('/assets?per_page=100'))return Response.json([]);
    if(url.startsWith('https://uploads.github.com/')){const name=new URL(url).searchParams.get('name'),d=name.endsWith('.exe')?digest:manifestDigest;return Response.json({name,state:'uploaded',size:d.size,digest:'sha256:'+d.sha256});}
    if(method==='PATCH'){assert.equal(events.filter(event=>event.startsWith('POST https://uploads.')).length,2);draft=false;return Response.json(record());}
    if(method==='HEAD')return new Response(null,{headers:{'content-length':String(bytes.length)}});
    throw Error('Unexpected fixture request '+url);
  };
  const result=await release.publishGithub({installer:f.installer,manifestFile,payload:p,digest},{fetchImpl,token:'fixture'});
  assert.equal(result.tag,'launcher-v0.1.6');assert.match(events.at(-1),/^HEAD https:\/\/github.com/);
});
test('failed public verification prevents feed promotion, and staged manifest supports exact retry without private key access',async t=>{
  const f=await fixture(t),options={installer:f.installer,commit:f.commit,sequence:6,output:path.join(f.root,'staged')};
  const deps={repo:f.repo,inspect:async()=>({verifiedRuntimeFiles:3}),signingKey:async()=>pair.privateKey};
  const staged=await release.prepareRelease(options,deps);assert.equal(staged.published,false);
  await assert.rejects(fs.access(path.join(f.repo,'releases/launcher/latest.json')));
  await assert.rejects(release.prepareRelease({...options,output:path.join(f.root,'failed'),manifestFile:staged.manifestFile,publish:true},{...deps,signingKey:async()=>{throw Error('Must not load a private key for retry');},publish:async()=>{throw Error('public unavailable');}}),/public unavailable/);
  await assert.rejects(fs.access(path.join(f.repo,'releases/launcher/latest.json')));
  const result=await release.prepareRelease({...options,output:path.join(f.root,'published'),manifestFile:staged.manifestFile,publish:true},{...deps,signingKey:async()=>{throw Error('Must not load a private key for retry');},publish:async()=>({tag:'fixture'})});
  assert.equal(result.published,true);assert.ok((await fs.readFile(path.join(f.repo,'releases/launcher/latest.json'))).equals(await fs.readFile(staged.manifestFile)));
  const retry=await release.prepareRelease({...options,output:path.join(f.root,'retried'),manifestFile:staged.manifestFile,publish:true},{...deps,publish:async()=>({tag:'fixture'})});assert.equal(retry.published,true);
});
test('feed promotion is monotonic, immutable and idempotent',async t=>{
  const f=await fixture(t),first=signPayload(payload(),pair.privateKey);await release.promoteFeed(first,config,{repo:f.repo});
  const latest=path.join(f.repo,'releases/launcher/latest.json'),original=await fs.readFile(latest);
  await release.promoteFeed(first,config,{repo:f.repo});assert.ok((await fs.readFile(latest)).equals(original));
  await assert.rejects(release.promoteFeed(signPayload({...payload(),sequence:7},pair.privateKey),config,{repo:f.repo}),/higher launcher version/);
  const next=release.createPayload({...identity,version:'0.1.7'},digest,6);await assert.rejects(release.promoteFeed(signPayload(next,pair.privateKey),config,{repo:f.repo}),/sequence must increase/);
  assert.ok((await fs.readFile(latest)).equals(original));
});
test('website includes only valid matching public manifests and independent latest/version cache policies',async t=>{
  const f=await fixture(t),envelope=signPayload(payload(),pair.privateKey);await release.promoteFeed(envelope,config,{repo:f.repo});
  const dist=path.join(f.root,'dist');await fs.mkdir(dist);await fs.writeFile(path.join(dist,'_headers'),'/releases/launcher/latest.json\n  Cache-Control: no-store\n');
  assert.equal(buildLauncherFeed(f.repo,dist),2);const headers=await fs.readFile(path.join(dist,'_headers'),'utf8');assert.match(headers,/latest\.json\n  Cache-Control: no-store/);assert.match(headers,/0\.1\.6\.json\n  Cache-Control: public, max-age=31536000, immutable/);
  await fs.writeFile(path.join(f.repo,'releases/launcher/private.dpapi'),'do not publish');assert.throws(()=>buildLauncherFeed(f.repo,dist),/Unexpected launcher feed file/);
});
test('CLI requires explicit publication/deployment flags and rejects incomplete options',()=>{
  const base=['--commit','a'.repeat(40),'--sequence','6','--output','C:\\fixture'];assert.equal(release.parseArgs(base).publish,undefined);
  assert.equal(release.parseArgs([...base,'--publish']).publish,true);assert.throws(()=>release.parseArgs([...base,'--unknown']));assert.throws(()=>release.parseArgs([...base,'--publish','--publish']));
});
