'use strict';
// This scans deployable content, including stale output and compressed scripts.
// Diagnostics contain paths/rule names only, never matching secret values.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const forbidden=name=>name.split(/[\\/]/).some(part=>/^(?:\.git|\.wrangler|\.ssh|node_modules|\.env(?:\..*)?|\.dev\.vars(?:\..*)?|id_(?:rsa|ed25519)|.*\.(?:pem|p12|pfx|key|sqlite|sqlite3|db|sql|bak|backup|log)|(?:.*[-_.])?(?:secrets?|credentials|service[-_]account)(?:[-_.].*)?\.(?:json|ya?ml|toml|ini))$/i.test(part));
const patterns=[
 ['private key',/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
 ['GitHub token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/],
 ['AWS access key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
 ['provider secret',/\b(?:sk_live_[A-Za-z0-9]{16,}|sk-proj-[A-Za-z0-9_-]{40,}|sb_secret_[A-Za-z0-9_-]{20,}|re_[A-Za-z0-9]{24,})\b/]
];
function inspectFile(file,relative){
 if(forbidden(relative))throw Error('Security preflight: private file cannot be published: '+relative);
 if(fs.lstatSync(file).isSymbolicLink())throw Error('Security preflight: public symlink is not allowed: '+relative);
 let bytes=fs.readFileSync(file);
 if(/\.(?:js|json|html|css)\.br$/i.test(relative))bytes=zlib.brotliDecompressSync(bytes,{maxOutputLength:32*1024*1024});
 else if(/\.(?:js|json|html|css)\.gz$/i.test(relative))bytes=zlib.gunzipSync(bytes,{maxOutputLength:32*1024*1024});
 if(bytes.subarray(0,8192).includes(0))return false;
 const text=bytes.toString('utf8');
 for(const [name,pattern]of patterns)if(pattern.test(text))throw Error('Security preflight: '+name+' detected in '+relative);
 for(const match of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)){
  let payload;try{payload=JSON.parse(Buffer.from(match[0].split('.')[1],'base64url'));}catch{continue;}
  if(payload.role==='service_role')throw Error('Security preflight: privileged JWT detected in '+relative);
 }
 return true;
}
function scanPublicTree(directory){
 let files=0,textFiles=0;
 function walk(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,entry.name),relative=path.relative(directory,file);if(forbidden(relative)||entry.isSymbolicLink())throw Error('Security preflight: private path cannot be published: '+relative);if(entry.isDirectory())walk(file);else{files++;if(inspectFile(file,relative))textFiles++;}}}
 walk(directory);return {files,textFiles};
}
module.exports={forbidden,inspectFile,scanPublicTree};
if(require.main===module){try{const result=scanPublicTree(path.resolve(process.argv[2]||path.join(__dirname,'../dist')));console.log('Security preflight passed: '+result.files+' public files, '+result.textFiles+' readable assets.');}catch(error){console.error(error.message);process.exitCode=1;}}
