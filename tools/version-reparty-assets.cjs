'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
// An HTML entry hash alone cannot invalidate already-cached ES module imports.
// Give the whole Reparty module/style graph one deterministic release identity.
function versionRepartyAssets(dist){
 const root=path.join(dist,'reparty');if(!fs.existsSync(root))return;
 const files=fs.readdirSync(root).filter(name=>/\.(?:m?js|css)$/.test(name)).sort();
 const sources=new Map(files.map(name=>[name,fs.readFileSync(path.join(root,name),'utf8')]));
 const hash=crypto.createHash('sha256');for(const [name,source]of sources)hash.update(name+'\0'+source+'\0');
 const version=hash.digest('hex').slice(0,12);
 for(const [name,source]of sources){
  const rewritten=source.replace(/(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|@import\s+(?:url\(\s*)?)(['"])([^'"?#]+\.(?:m?js|css))(?:\?[^'"#]*)?\2/g,(match,prefix,quote,url)=>{
   if(!url.startsWith('.')&&!(name.endsWith('.css')&&!url.includes('/')))return match;
   const target=path.resolve(root,url);if(!target.startsWith(root+path.sep)||!fs.existsSync(target))return match;
   return prefix+quote+url+'?v='+version+quote;
  });fs.writeFileSync(path.join(root,name),rewritten);
 }
 return version;
}
module.exports={versionRepartyAssets};
