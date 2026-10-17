'use strict';
// Import an extracted Unity Web build without shipping debug files or oversized assets.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('Pass the extracted Unity Web build directory.');
const build=path.join(source,'Build'),files=fs.readdirSync(build);
const find=suffix=>{const found=files.filter(name=>name.endsWith(suffix));if(found.length!==1)throw Error('Expected one '+suffix+' file.');return fs.readFileSync(path.join(build,found[0]));};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const destination=path.join(root,'assets/repo-runners/build');fs.mkdirSync(destination,{recursive:true});
function save(label,extension,bytes){
 if(bytes.length>25*1024*1024)throw Error('Asset exceeds Pages limit: '+label);
 const name=label+'.'+hash(bytes).slice(0,16)+extension;fs.writeFileSync(path.join(destination,name),bytes);
 return '/assets/repo-runners/build/'+name;
}
const data=zlib.brotliDecompressSync(find('.data.br'));
if(data.subarray(0,16).toString()!=='UnityWebData1.0\0')throw Error('Unrecognized Unity data archive.');
const parts=[];
for(let offset=0;offset<data.length;offset+=20*1024*1024){
 const bytes=data.subarray(offset,Math.min(offset+20*1024*1024,data.length));
 const compressed=zlib.brotliCompressSync(bytes,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:5}});
 parts.push({url:save('data-'+String(parts.length+1).padStart(2,'0'),'.bin.br',compressed),size:bytes.length,sha256:hash(bytes),downloadSize:compressed.length});
}
const html=fs.readFileSync(path.join(source,'index.html'),'utf8');
const manifest={name:'Repo Runners',version:html.match(/productVersion:\s*"([^"]+)"/)?.[1]||'1.0',loader:save('unity','.loader.js',find('.loader.js')),framework:save('unity','.framework.js.br',find('.framework.js.br')),code:save('unity','.wasm.br',find('.wasm.br')),data:{size:data.length,sha256:hash(data),parts}};
fs.mkdirSync(path.join(root,'repo-runners'),{recursive:true});
fs.writeFileSync(path.join(root,'repo-runners/build.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Imported Repo Runners '+manifest.version+': '+parts.length+' data parts; '+Math.round(parts.reduce((sum,p)=>sum+p.downloadSize,0)/1e6)+' MB compressed data.');
