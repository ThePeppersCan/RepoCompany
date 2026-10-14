'use strict';
const fs = require('node:fs/promises'), path = require('node:path'), crypto = require('node:crypto');
const {execFileSync, execFile} = require('node:child_process');
const {promisify} = require('node:util');
const {plainPath,loadPrivateKey,signPayload} = require('./launcher-signing.cjs');
const {validateConfig,verifyManifest,compareVersions} = require('../lib/update-manifest.cjs');
const REPO = path.resolve(__dirname,'../..');
const GITHUB = 'https://api.github.com/repos/ThePeppersCan/RepoCompany';
const run = promisify(execFile);
function check(value,message) { if (!value) throw Error(message); }
function git(args,repo=REPO) { return execFileSync('git',['-C',repo,...args],{encoding:'utf8',windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']}).replace(/\r?\n$/,''); }
function committedFile(commit,name,repo) { return execFileSync('git',['-C',repo,'show',commit+':desktop/'+name],{windowsHide:true,shell:false,stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024}); }
function matchesCommitted(packed,commit,name,repo) {
  if(packed.equals(committedFile(commit,name,repo)))return true;
  // Apply Git's own per-path clean filters to these exact packaged bytes. This
  // handles Windows LF/CRLF (including a mixed-ending checkout) without treating
  // binary assets as text or trusting an arbitrary mutable working file.
  const hash=execFileSync('git',['-C',repo,'hash-object','--path=desktop/'+name,'--stdin'],{input:packed,encoding:'utf8',windowsHide:true,shell:false,stdio:['pipe','pipe','pipe']}).trim();
  return hash===git(['rev-parse',commit+':desktop/'+name],repo);
}
function sourceIdentity(commit,repo=REPO) {
  check(/^[a-f0-9]{40}$/.test(commit),'Provide the exact reviewed 40-character source commit.');
  if(git(['rev-parse','HEAD'],repo)!==commit){
    let feedOnly=false;
    try{
      git(['merge-base','--is-ancestor',commit,'HEAD'],repo);
      const changes=git(['diff','--name-only',commit,'HEAD'],repo).split('\n').filter(Boolean);
      feedOnly=changes.length>0&&changes.every(name=>/^releases\/launcher\/(?:latest|\d+\.\d+\.\d+)\.json$/.test(name));
    }catch{/* Unknown commits or changed runtime cannot be retried as this source. */}
    check(feedOnly,'Release commit must match this checkout, apart from its promoted launcher feed.');
  }
  check(!git(['status','--porcelain=v1','--untracked-files=all','--','desktop'],repo),'Commit the reviewed desktop source before preparing a release.');
  const pkg=JSON.parse(require('node:fs').readFileSync(path.join(repo,'desktop/package.json'),'utf8'));
  check(/^(0|[1-9]\d{0,6})\.(0|[1-9]\d{0,6})\.(0|[1-9]\d{0,6})$/.test(pkg.version),'Use a strict three-part launcher version.');
  return {commit,version:pkg.version,pkg};
}
async function fileDigest(filename) {
  await plainPath(filename); const stat=await fs.stat(filename);
  check(stat.isFile()&&stat.size>0&&stat.size<=1024*1024*1024,'Installer must be a regular file no larger than 1 GiB.');
  const sha256=crypto.createHash('sha256'),sha512=crypto.createHash('sha512'); let size=0;
  for await(const bytes of require('node:fs').createReadStream(filename)){size+=bytes.length;sha256.update(bytes);sha512.update(bytes);}
  const after=await fs.stat(filename);check(size===stat.size&&after.size===stat.size&&after.mtimeMs===stat.mtimeMs&&after.ino===stat.ino&&after.dev===stat.dev,'Installer changed while hashing.');
  return {size,sha256:sha256.digest('hex'),sha512:sha512.digest('base64')};
}
function runtimePath(name) { return /^(?:main|preload|portal-preload|game-preload|config)\.cjs$/.test(name)||/^(?:lib|renderer|game)\//.test(name); }
async function verifyArchive(archive,identity,config,{repo=REPO,asar=require('@electron/asar')}={}) {
  const tracked=git(['ls-tree','-r','--name-only',identity.commit,'--','desktop'],repo).split('\n').map(p=>p.slice(8)).filter(runtimePath);
  const actual=asar.listPackage(archive).map(p=>p.replace(/\\/g,'/').replace(/^\//,''));
  for(const name of tracked) {
    const packed=asar.extractFile(archive,path.normalize(name));
    check(matchesCommitted(packed,identity.commit,name,repo),'Installer source differs from the reviewed checkout: '+name);
  }
  for(const name of actual.filter(runtimePath)) {
    const stat=asar.statFile(archive,path.normalize(name));
    if(stat.files)continue;
    check(!stat.link&&!stat.unpacked&&tracked.includes(name),'Unexpected or external runtime file in installer: '+name);
  }
  const pkg=JSON.parse(asar.extractFile(archive,'package.json'));
  check(pkg.version===identity.version&&pkg.main===identity.pkg.main&&pkg.name===identity.pkg.name,'Installer package identity differs from the reviewed source.');
  check(JSON.stringify(pkg.dependencies||{})===JSON.stringify(identity.pkg.dependencies||{}),'Installer dependencies differ from the reviewed package.');
  check(matchesCommitted(asar.extractFile(archive,'config.cjs'),identity.commit,'config.cjs',repo),'Installer update trust configuration differs.');
  validateConfig(config);
  return {verifiedRuntimeFiles:tracked.length,archiveSha256:crypto.createHash('sha256').update(await fs.readFile(archive)).digest('hex')};
}
function verifyUpdateMetadata(bytes,identity,config,{loadYaml=require('js-yaml').load}={}) {
  check(bytes.length>0&&bytes.length<=8192,'Installer update metadata is missing or too large.');
  const metadata=loadYaml(bytes.toString('utf8'));
  check(metadata&&typeof metadata==='object'&&!Array.isArray(metadata)&&Object.keys(metadata).length===4&&metadata.provider==='generic'&&metadata.url==='https://repocompany.uk/releases/launcher/'&&Array.isArray(metadata.publisherName)&&metadata.publisherName.length===1&&metadata.publisherName[0]===config.publisherName&&metadata.updaterCacheDirName===identity.pkg.name+'-updater','Installer update verification metadata does not match the reviewed launcher.');
  return {updateMetadataSha256:crypto.createHash('sha256').update(bytes).digest('hex')};
}
async function verifyInstallerArchive(installer,identity,config,output,{sevenZip,repo=REPO}={}) {
  const inspect=path.join(output,'inspection'); await fs.mkdir(inspect,{recursive:false});
  const seven=sevenZip||await require('app-builder-lib/out/toolsets/7zip').getPath7za();
  check(path.isAbsolute(seven),'The archive verifier must use an absolute executable path.'); await plainPath(seven);
  const nested=path.join(inspect,'app-64.7z'),archive=path.join(inspect,'app.asar'),metadata=path.join(inspect,'app-update.yml');
  try {
    const layout=await extractInstallerFiles(installer,inspect,seven);
    return {installerArchiveLayout:layout,...await verifyArchive(archive,identity,config,{repo}),...verifyUpdateMetadata(await fs.readFile(metadata),identity,config)};
  } finally {
    // Delete only these exact verifier-created files; never recursively clean a
    // build, release, user profile or caller-provided directory.
    for(const file of [archive,nested,metadata])await fs.unlink(file).catch(error=>{if(error.code!=='ENOENT')throw error;});
    await fs.rmdir(inspect).catch(error=>{if(!['ENOENT','ENOTEMPTY'].includes(error.code))throw error;});
  }
}
async function extractInstallerFiles(installer,inspect,seven,{execute=run}={}) {
  const nested=path.join(inspect,'app-64.7z'),archive=path.join(inspect,'app.asar'),metadata=path.join(inspect,'app-update.yml');
  const extract=(from,names)=>execute(seven,['e','-y','-bd','-o'+inspect,from,...names],{windowsHide:true,shell:false,timeout:180000,maxBuffer:1024*1024});
  const exists=async file=>{try{const stat=await fs.lstat(file);check(stat.isFile()&&!stat.isSymbolicLink(),'Installer extraction produced a non-regular file.');return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}};
  // Current 7za detects the embedded 7z stream directly inside NSIS executables.
  // Older toolsets expose the NSIS container and its nested application archive.
  await extract(installer,['resources/app.asar','resources/app-update.yml']);
  const directArchive=await exists(archive),directMetadata=await exists(metadata);
  if(directArchive||directMetadata){check(directArchive&&directMetadata,'Installer is missing required application or update verification metadata.');return 'embedded-7z';}
  await extract(installer,['$PLUGINSDIR/app-64.7z']);
  check(await exists(nested),'Installer does not contain the expected Windows x64 application.');
  await extract(nested,['resources/app.asar','resources/app-update.yml']);
  check(await exists(archive)&&await exists(metadata),'Installer is missing required application or update verification metadata.');
  return 'nested-7z';
}
function createPayload(identity,digest,sequence,{now=Date.now(),days=365}={}) {
  check(Number.isSafeInteger(sequence)&&sequence>0,'Provide a positive release sequence.');
  check(Number.isInteger(days)&&days>=1&&days<=366,'Manifest lifetime must be 1–366 days.');
  return {schemaVersion:1,appId:'uk.repocompany.launcher',channel:'stable',platform:'win32',arch:'x64',version:identity.version,sequence,issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+days*86400000).toISOString(),sourceCommit:identity.commit,installer:{url:`https://github.com/ThePeppersCan/RepoCompany/releases/download/launcher-v${identity.version}/Repo-Company-${identity.version}-Windows-x64.exe`,size:digest.size,sha512:digest.sha512}};
}
async function readPrevious(config,repo=REPO) {
  let envelope; try{envelope=JSON.parse(await fs.readFile(path.join(repo,'releases/launcher/latest.json'),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}
  // A publisher can replace an expired feed; the old signature and identity
  // still have to verify before its monotonic version/sequence are trusted.
  const hint=JSON.parse(Buffer.from(envelope.payload,'base64').toString('utf8'));
  return verifyManifest(envelope,{...config,minSequence:1},{now:Date.parse(hint.issuedAt)+1});
}
function newer(payload,previous) {
  if(!previous)return;
  check(compareVersions(payload.version,previous.payload.version)>0,'Publish a higher launcher version; existing versions are immutable.');
  check(payload.sequence>previous.payload.sequence,'The release sequence must increase.');
}
function githubToken() {
  if(process.env.GH_TOKEN)return process.env.GH_TOKEN;
  let result;try{result=execFileSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',windowsHide:true,stdio:['pipe','pipe','pipe']});}catch{throw Error('GitHub publishing access is unavailable.');}
  const token=result.split(/\r?\n/).find(line=>line.startsWith('password='))?.slice(9);check(token,'GitHub publishing access is unavailable.');return token;
}
async function verifyRemoteAsset(asset,digest,{fetchImpl=fetch,headers}) {
  check(asset.state==='uploaded'&&asset.size===digest.size,'Uploaded asset has the wrong size or state.');
  if(asset.digest) { check(asset.digest==='sha256:'+digest.sha256,'Uploaded asset digest differs from the reviewed bytes.'); return; }
  check(new RegExp('^'+GITHUB.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'/releases/assets/[0-9]+$').test(asset.url),'Unexpected release asset API URL.');
  let response=await fetchImpl(asset.url,{headers:{...headers,Accept:'application/octet-stream'},redirect:'manual',signal:AbortSignal.timeout(600000)});
  if([301,302,303,307,308].includes(response.status)) {
    const target=new URL(response.headers.get('location'));
    check(target.protocol==='https:'&&['release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(target.hostname)&&!target.username&&!target.password,'Unexpected release download host.');
    response=await fetchImpl(target.href,{redirect:'error',signal:AbortSignal.timeout(600000)});
  }
  check(response.ok&&response.body,'Could not verify the uploaded release asset.');
  const sha256=crypto.createHash('sha256'),sha512=crypto.createHash('sha512');let size=0;
  for await(const bytes of response.body){size+=bytes.length;check(size<=digest.size,'Uploaded asset exceeded its expected size.');sha256.update(bytes);sha512.update(bytes);}
  check(size===digest.size&&sha256.digest('hex')===digest.sha256&&sha512.digest('base64')===digest.sha512,'Downloaded release asset differs from the reviewed bytes.');
}
async function publishGithub({installer,manifestFile,payload,digest,notes},{fetchImpl=fetch,token=githubToken()}={}) {
  const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  const request=async(url,options={},optional=false)=>{
    check(new URL(url).origin==='https://api.github.com'||new URL(url).origin==='https://uploads.github.com','Unexpected GitHub API host.');
    const response=await fetchImpl(url,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(600000)});
    if(optional&&response.status===404)return null;
    check(response.ok,'GitHub release request failed ('+response.status+').');return response.json();
  };
  const commit=await request(GITHUB+'/commits/'+payload.sourceCommit);check(commit.sha===payload.sourceCommit,'Source commit is not published on the repository.');
  const tag='launcher-v'+payload.version, existingTag=await request(GITHUB+'/git/ref/tags/'+tag,{},true);
  if(existingTag){let target=existingTag.object;if(target.type==='tag')target=(await request(GITHUB+'/git/tags/'+target.sha)).object;check(target.type==='commit'&&target.sha===payload.sourceCommit,'Existing release tag points to a different source commit.');}
  let release=await request(GITHUB+'/releases/tags/'+tag,{},true);
  if(!release)release=await request(GITHUB+'/releases',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tag_name:tag,target_commitish:payload.sourceCommit,name:'Repo Company for Windows '+payload.version,draft:true,prerelease:false,make_latest:'false',body:notes||'Repo Company for Windows '+payload.version+'.\n\nIncludes authenticated automatic launcher updates. Game downloads and account data are retained. Windows may still show an unknown-publisher warning because the installer has no commercial Authenticode certificate.'})});
  check(release.tag_name===tag,'GitHub returned a different release.');
  const files=[{file:installer,name:path.basename(new URL(payload.installer.url).pathname),digest},{file:manifestFile,name:'launcher-update.json',digest:await fileDigest(manifestFile)}];
  const assets=await request(GITHUB+'/releases/'+release.id+'/assets?per_page=100');
  for(const item of files){
    let asset=assets.find(a=>a.name===item.name);
    if(!asset){
      check(release.draft,'A published release is immutable. Use a new version.');
      const upload=release.upload_url.replace(/\{.*$/,'')+'?name='+encodeURIComponent(item.name);
      asset=await request(upload,{method:'POST',headers:{'Content-Type':item.name.endsWith('.exe')?'application/vnd.microsoft.portable-executable':'application/json','Content-Length':String(item.digest.size)},body:require('node:fs').createReadStream(item.file),duplex:'half'});
    }
    check(asset.name===item.name,'GitHub changed the expected asset name.');
    await verifyRemoteAsset(asset,item.digest,{request,fetchImpl,headers});
  }
  if(release.draft)release=await request(GITHUB+'/releases/'+release.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:false,prerelease:false,make_latest:'false'})});
  check(!release.draft&&!release.prerelease,'The verified launcher release is not publicly published.');
  // Verify the now-public installer URL too. The signed feed must never point
  // at an asset which is available only to the publisher.
  const published=await fetchImpl(payload.installer.url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(60000)});
  check(published.ok&&Number(published.headers.get('content-length'))===digest.size,'The published installer is not publicly available at its signed URL.');
  return {url:release.html_url,id:release.id,tag};
}
async function promoteFeed(envelope,config,{repo=REPO}={}) {
  const release=verifyManifest(envelope,config),previous=await readPrevious(config,repo);
  if(previous?.payloadSha256===release.payloadSha256)return;
  newer(release.payload,previous);
  const directory=path.join(repo,'releases/launcher');await plainPath(directory);await fs.mkdir(directory,{recursive:true});
  const bytes=Buffer.from(JSON.stringify(envelope,null,2)+'\n'),immutable=path.join(directory,release.payload.version+'.json');
  try {await fs.writeFile(immutable,bytes,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;check((await fs.readFile(immutable)).equals(bytes),'An immutable release manifest already has different contents.');}
  const temporary=path.join(directory,'.latest-'+crypto.randomUUID()+'.tmp');
  await fs.writeFile(temporary,bytes,{flag:'wx'});await fs.rename(temporary,path.join(directory,'latest.json'));
}
async function deployWebsite({repo,version},{gitImpl=git,runImpl=run,verify=verifyPublishedFeed}={}) {
  const allowed=new Set(['releases/launcher/latest.json','releases/launcher/'+version+'.json']);
  const dirty=gitImpl(['status','--porcelain=v1','--untracked-files=all'],repo).split('\n').filter(Boolean);
  check(dirty.every(line=>allowed.has(line.slice(3))||(line.startsWith('?? ')&&line.slice(3).startsWith('QA/'))),'Website deployment refused: unrelated uncommitted source exists.');
  await runImpl(process.execPath,['tools/verify-deploy-base.cjs'],{cwd:repo,windowsHide:true,shell:false,maxBuffer:1024*1024});
  await runImpl(process.execPath,['tools/build-dashboard.cjs','--production','--preserve-game-integrations'],{cwd:repo,windowsHide:true,shell:false,maxBuffer:1024*1024});
  const bundle=path.join(repo,'dist/releases/launcher/latest.json'),source=path.join(repo,'releases/launcher/latest.json');
  check((await fs.readFile(bundle)).equals(await fs.readFile(source)),'Website build omitted or changed the update feed.');
  // Pages already builds GitHub main. A second manual deployment can be
  // overwritten by an older pending Git build. Publish the feed through Git
  // once, then only observe the single existing deployment route.
  const paths=[...allowed];
  if(dirty.some(line=>allowed.has(line.slice(3)))){
    gitImpl(['add','--',...paths],repo);
    gitImpl(['commit','-m','Publish launcher '+version+' automatic update','--',...paths],repo);
  }
  gitImpl(['push','origin','HEAD:main'],repo);
  await verify(await fs.readFile(source),{timeoutMs:900000,intervalMs:10000});
}
async function verifyPublishedFeed(expected,{fetchImpl=fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=Date.now,timeoutMs=60000,intervalMs=5000}={}) {
  check(Buffer.isBuffer(expected)&&expected.length>0&&expected.length<=65536,'Expected signed feed bytes are invalid.');
  check(Number.isSafeInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=900000&&Number.isSafeInteger(intervalMs)&&intervalMs>0,'Invalid feed verification retry bounds.');
  const deadline=now()+timeoutMs;let attempts=0;
  while(now()<deadline){
    attempts++;
    try{
      const remaining=Math.max(1,Math.floor(deadline-now()));
      const response=await fetchImpl('https://repocompany.uk/releases/launcher/latest.json',{method:'GET',cache:'no-store',signal:AbortSignal.timeout(Math.min(10000,remaining))});
      if(response.ok&&Number(response.headers.get('content-length')||0)<=65536&&Buffer.from(await response.arrayBuffer()).equals(expected))return {attempts};
    }catch(_){/* Pages edges can briefly serve the previous deployment or fail during propagation. */}
    const remaining=deadline-now();if(remaining<=0)break;
    await sleep(Math.min(intervalMs,remaining));
  }
  throw Error('The signed feed could not be confirmed before the verification deadline. Check the GitHub-triggered website deployment before retrying; publication and deployment were not repeated.');
}
async function prepareRelease(options,{repo=REPO,inspect=verifyInstallerArchive,signingKey=loadPrivateKey,publish=publishGithub,deploy=deployWebsite}={}) {
  const identity=sourceIdentity(options.commit,repo),desktop=path.join(repo,'desktop'),config=require(path.join(desktop,'config.cjs'))(desktop).launcherUpdates;
  validateConfig(config);check(!options.deploy||options.publish,'--deploy requires --publish.');
  const output=path.resolve(options.output),installer=path.resolve(options.installer||path.join(desktop,'build',`Repo-Company-${identity.version}-Windows-x64.exe`));
  await plainPath(output);check(!require('node:fs').existsSync(output),'Use a fresh release output directory.');
  const relative=path.relative(repo,output);check(relative.startsWith('..'+path.sep)||path.isAbsolute(relative),'Release evidence must be outside the repository.');
  if(options.build){
    const npm=process.env.npm_execpath||path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
    check(require('node:fs').existsSync(npm),'Run with an installed Node/npm distribution to build a release.');
    for(const args of [['ci'],['test']])await run(process.execPath,[npm,...args],{cwd:desktop,windowsHide:true,shell:false,timeout:1200000,maxBuffer:16*1024*1024});
    await run(process.execPath,[path.join(desktop,'node_modules/electron-builder/out/cli/cli.js'),'--win','nsis','--x64','--publish','never'],{cwd:desktop,windowsHide:true,shell:false,timeout:1200000,maxBuffer:16*1024*1024});
  }
  sourceIdentity(options.commit,repo);await fs.mkdir(output,{recursive:true});
  const digest=await fileDigest(installer),inspection=await inspect(installer,identity,config,output,{sevenZip:options.sevenZip,repo});
  check(JSON.stringify(await fileDigest(installer))===JSON.stringify(digest),'Installer changed during archive verification.');
  let envelope,payload;
  if(options.manifestFile){
    envelope=JSON.parse(await fs.readFile(options.manifestFile,'utf8'));payload=verifyManifest(envelope,config).payload;
    check(payload.version===identity.version&&payload.sourceCommit===identity.commit&&payload.sequence===Number(options.sequence)&&payload.installer.size===digest.size&&payload.installer.sha512===digest.sha512,'The staged manifest does not describe this reviewed installer and release.');
  }else{
    payload=createPayload(identity,digest,Number(options.sequence),{days:options.days===undefined?365:Number(options.days)});
    const key=await signingKey(options.keyFile);envelope=signPayload(payload,key,config.keyId);
  }
  const verified=verifyManifest(envelope,config),previous=await readPrevious(config,repo);
  if(previous?.payloadSha256!==verified.payloadSha256)newer(payload,previous);
  sourceIdentity(options.commit,repo);
  const manifestFile=path.join(output,'launcher-update.json');await fs.writeFile(manifestFile,JSON.stringify(envelope,null,2)+'\n',{flag:'wx'});
  const report={schemaVersion:1,version:payload.version,sourceCommit:payload.sourceCommit,sequence:payload.sequence,installer,manifestFile,...digest,...inspection,published:false,deployed:false};
  await fs.writeFile(path.join(output,'verification.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  if(options.publish){
    sourceIdentity(options.commit,repo);check(JSON.stringify(await fileDigest(installer))===JSON.stringify(digest),'Installer changed after verification.');
    report.release=await publish({installer,manifestFile,payload,digest,notes:options.notes});report.published=true;
    await promoteFeed(envelope,config,{repo});
    await fs.writeFile(path.join(output,'publication.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    if(options.deploy){await deploy({repo,version:payload.version});report.deployed=true;await fs.writeFile(path.join(output,'deployment.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});}
  }
  return report;
}
function parseArgs(args) {
  const options={},names={'--installer':'installer','--commit':'commit','--sequence':'sequence','--output':'output','--key-file':'keyFile','--seven-zip':'sevenZip','--days':'days','--notes-file':'notesFile','--manifest':'manifestFile'};
  for(let i=0;i<args.length;i++){
    const flag=args[i];if(['--publish','--deploy','--build'].includes(flag)){check(!options[flag.slice(2)],'Duplicate '+flag);options[flag.slice(2)]=true;continue;}
    check(names[flag]&&args[i+1]&&!args[i+1].startsWith('--')&&!options[names[flag]],'Unknown, duplicate or incomplete release option: '+flag);options[names[flag]]=args[++i];
  }
  check(options.commit&&options.sequence&&options.output,'Provide --commit SHA --sequence NUMBER --output NEW_DIRECTORY.');return options;
}
if(require.main===module)(async()=>{const options=parseArgs(process.argv.slice(2));if(options.notesFile)options.notes=await fs.readFile(options.notesFile,'utf8');const result=await prepareRelease(options);console.log(JSON.stringify(result));})().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={sourceIdentity,fileDigest,verifyArchive,verifyUpdateMetadata,verifyInstallerArchive,extractInstallerFiles,createPayload,readPrevious,newer,verifyRemoteAsset,publishGithub,promoteFeed,deployWebsite,verifyPublishedFeed,prepareRelease,parseArgs};
