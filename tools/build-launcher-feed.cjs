'use strict';
const fs=require('node:fs'),path=require('node:path');
const {verifyManifest}=require('../desktop/lib/update-manifest.cjs');
// Only signed, explicitly named metadata belongs on Pages. Installers and all
// release credentials stay outside the website bundle.
function buildLauncherFeed(root,dist,{now=Date.now()}={}){
  const source=path.join(root,'releases/launcher');if(!fs.existsSync(source))return 0;
  if(fs.lstatSync(source).isSymbolicLink())throw Error('Launcher feed must not be a symbolic link.');
  const config=require(path.join(root,'desktop/config.cjs'))(path.join(root,'desktop')).launcherUpdates;
  const names=fs.readdirSync(source),entries=[];
  for(const name of names){
    if(!/^(?:latest|(?:0|[1-9]\d{0,6})\.(?:0|[1-9]\d{0,6})\.(?:0|[1-9]\d{0,6}))\.json$/.test(name))throw Error('Unexpected launcher feed file: '+name);
    const filename=path.join(source,name),stat=fs.lstatSync(filename);
    if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65536)throw Error('Invalid launcher feed file: '+name);
    const bytes=fs.readFileSync(filename),envelope=JSON.parse(bytes),hint=JSON.parse(Buffer.from(envelope.payload,'base64').toString('utf8'));
    const verified=verifyManifest(envelope,name==='latest.json'?config:{...config,minSequence:1},{now:name==='latest.json'?now:Date.parse(hint.issuedAt)+1});
    if(name!=='latest.json'&&name!==verified.payload.version+'.json')throw Error('Launcher manifest filename disagrees with its signed version.');
    entries.push({name,bytes,version:verified.payload.version});
  }
  const latest=entries.find(item=>item.name==='latest.json');
  if(!latest||!entries.some(item=>item.name===latest.version+'.json'&&item.bytes.equals(latest.bytes)))throw Error('Latest launcher feed must match its immutable version manifest.');
  const destination=path.join(dist,'releases/launcher');fs.mkdirSync(destination,{recursive:true});
  for(const item of entries)fs.writeFileSync(path.join(destination,item.name),item.bytes);
  // One rule per numeric major keeps immutable releases cacheable without
  // consuming another Pages header rule on every update. Never match latest.
  const majors=[...new Set(entries.filter(item=>item.name!=='latest.json').map(item=>item.version.split('.')[0]))];
  const headers=majors.map(major=>'\n/releases/launcher/'+major+'.*\n  Cache-Control: public, max-age=31536000, immutable\n').join('');
  fs.appendFileSync(path.join(dist,'_headers'),headers);
  return entries.length;
}
module.exports={buildLauncherFeed};
