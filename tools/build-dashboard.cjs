const fs=require('fs'),path=require('path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const security=require('./security-preflight.cjs');
const production=process.argv.includes('--production')||process.env.CF_PAGES_BRANCH==='main';
if(!process.argv.includes('--preserve-game-integrations'))require('./build-game-achievements.cjs');
// Check the actual post-generation inputs before copying anything to the public
// bundle. Publishing a changed game/help source requires reviewing its AI facts.
require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'test-wibsworth-knowledge.cjs'),'--sources-only'],{stdio:'inherit'});
require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'test-wibsworth-game-guide.cjs')],{stdio:'inherit'});
require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'test-wibsworth-conversations.cjs')],{stdio:'inherit'});
fs.mkdirSync(dist,{recursive:true});
const includeDirs=['comp-run-preview','assets','game-integrations','original-case-assets','account-assets','audio','vendor','dragonbound-career-mode','reparty','repo-runners'];
const requiredStaticAssets=['moratales-characters.html','moratales-characters.js','moratales-characters.css','repo-character-sync.js','repo-client-download.css','repo-messaging.js','repo-messaging.css'];
for(const name of requiredStaticAssets)if(!fs.existsSync(path.join(root,name)))throw Error('Missing static page asset: '+name);
let files=0;
function copy(src,dest){
 const relative=path.relative(root,src).replaceAll('\\','/');
 if(/^reparty\/(?:game-(?:mode|player|cards)\.|soundtrack-mode\.|soundtracks(?:\/|$)|supabase(?:\/|$)|tools(?:\/|$)|reparty\.css$)/.test(relative)){const target=path.resolve(dest);if(!target.startsWith(path.resolve(dist)+path.sep))throw Error('Invalid retired asset path.');if(fs.existsSync(target))fs.rmSync(target,{recursive:true,force:true});return;}
 const stat=fs.lstatSync(src);if(stat.isSymbolicLink())throw Error('Security preflight: public symlink is not allowed: '+relative);
 if(stat.isDirectory()){if(security.forbidden(relative))throw Error('Security preflight: private directory cannot be published: '+relative);fs.mkdirSync(dest,{recursive:true});for(const name of fs.readdirSync(src))if(!['node_modules','.git','.wrangler','tests','QA','work'].includes(name))copy(path.join(src,name),path.join(dest,name));}
 else{if(/\.(sql|md|toml|map|ts|cjs)$/i.test(src))return;security.inspectFile(src,relative);fs.copyFileSync(src,dest);files++;}
}
for(const name of fs.readdirSync(root)){
 if(requiredStaticAssets.includes(name)||includeDirs.includes(name))copy(path.join(root,name),path.join(dist,name));
 else if(fs.statSync(path.join(root,name)).isFile()&&(/\.(html|css|js|png|jpg|webp|mp3|json|ico)$/i.test(name)||['_headers','_redirects'].includes(name))&&(!name.includes('test')||name==='repo-sports-quidditch-v2-test.html')&&!['package-lock.json','package.json'].includes(name))copy(path.join(root,name),path.join(dist,name));
}
require('./build-web-login.cjs')(root,dist);
require('./build-game-loader.cjs')(root,dist);
require('./build-broomflight.cjs')(root);
files+=require('./build-launcher-feed.cjs').buildLauncherFeed(root,dist);
const publicPages=require('./build-public-pages.cjs')(root,dist,{production});
if(!production){
 const headers=path.join(dist,'_headers');
 fs.writeFileSync(headers,fs.readFileSync(headers,'utf8').replace('/*','/*\n  X-Robots-Tag: noindex, nofollow'));
}
require('./build-phone-app.cjs')(root,dist);
fs.mkdirSync(path.join(dist,'account-access'),{recursive:true});
fs.copyFileSync(path.join(root,'account-access.html'),path.join(dist,'account-access/index.html'));
// The custom domain can retain assets longer than Pages' cache headers request.
// Content versions keep HTML and its scripts/styles from different releases mixing.
require('./version-reparty-assets.cjs').versionRepartyAssets(dist);
for(const html of [...publicPages,'app/index.html','account-access/index.html','reparty/index.html','repo-runners/index.html','index.html','legacy-runtime.html','avatar-studio.html','game-achievements-bridge.html','game-playtime-bridge.html','moratales-characters.html','morogue-account-bridge.html']){
const entry=path.join(dist,html);if(!fs.existsSync(entry))continue;
fs.writeFileSync(entry,fs.readFileSync(entry,'utf8').replace(/\b(src|href)="([^"?#]+\.(?:js|css))(?:\?[^"#]*)?"/g,(attribute,key,url)=>{
 if(/^(?:[a-z]+:)?\/\//i.test(url))return attribute;
 const file=url.startsWith('/')?path.resolve(dist,url.slice(1)):path.resolve(path.dirname(entry),url);
 if(!file.startsWith(dist+path.sep)||!fs.existsSync(file))return attribute;
 const version=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
 return `${key}="${url}?v=${version}"`;
}));
}
fs.writeFileSync(path.join(dist,'_routes.json'),JSON.stringify({version:1,include:['/api/*','/download/*'],exclude:[]}));
const headerLines=fs.readFileSync(path.join(dist,'_headers'),'utf8').split(/\r?\n/);
if(headerLines.filter(line=>line.startsWith('/')).length>100||headerLines.some(line=>line.length>2000))throw Error('Security preflight: static header rules exceed the hosting limit.');
const checked=security.scanPublicTree(dist);
console.log('Security preflight passed: '+checked.files+' public files, '+checked.textFiles+' readable assets.');
console.log('Staging bundle: '+files+' files. Existing runtime assets included.');
