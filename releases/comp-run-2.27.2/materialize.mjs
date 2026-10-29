import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('.',import.meta.url)),game=path.join(root,'game');
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json')));
const sha=b=>createHash('sha256').update(b).digest('hex');
for(let i=0;i<manifest.files.length;i+=8){
 await Promise.all(manifest.files.slice(i,i+8).map(async file=>{
  const target=path.resolve(game,file.path);
  if(!target.startsWith(game+path.sep)||file.url!=='https://repo-company-games.pages.dev/blobs/'+file.sha256+'.bin')throw Error('Invalid release path');
  let data=await fs.readFile(target).catch(e=>{if(e.code!=='ENOENT')throw e;return null;});
  if(data){if(data.length!==file.size||sha(data)!==file.sha256)throw Error('Local file differs; preserve or move it before restoring: '+file.path);return;}
  const response=await fetch(file.url);if(!response.ok)throw Error('Asset unavailable: '+file.path);
  data=Buffer.from(await response.arrayBuffer());if(data.length!==file.size||sha(data)!==file.sha256)throw Error('Asset checksum mismatch: '+file.path);
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,data,{flag:'wx'});
 }));
}
console.log('Verified '+manifest.files.length+' game files for '+manifest.version);
