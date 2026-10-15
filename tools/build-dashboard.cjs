const fs=require('fs'),path=require('path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const production=process.argv.includes('--production')||process.env.CF_PAGES_BRANCH==='main';
if(!process.argv.includes('--preserve-game-integrations'))require('./build-game-achievements.cjs');
fs.mkdirSync(dist,{recursive:true});
const includeDirs=['assets','game-integrations','original-case-assets','account-assets','audio','vendor','dragonbound-career-mode','reparty'];
const requiredStaticAssets=['moratales-characters.html','moratales-characters.js','moratales-characters.css','repo-character-sync.js','repo-client-download.css','repo-messaging.js','repo-messaging.css'];
for(const name of requiredStaticAssets)if(!fs.existsSync(path.join(root,name)))throw Error('Missing static page asset: '+name);
let files=0;
function copy(src,dest){
 const stat=fs.statSync(src);if(stat.isDirectory()){fs.mkdirSync(dest,{recursive:true});for(const name of fs.readdirSync(src))if(!['node_modules','.git','.wrangler','tests','QA','work'].includes(name))copy(path.join(src,name),path.join(dest,name));}
 else{if(/\.(sql|md|toml|map|ts|cjs)$/i.test(src))return;fs.copyFileSync(src,dest);files++;}
}
for(const name of fs.readdirSync(root)){
 if(requiredStaticAssets.includes(name)||includeDirs.includes(name))copy(path.join(root,name),path.join(dist,name));
 else if(fs.statSync(path.join(root,name)).isFile()&&(/\.(html|css|js|png|jpg|webp|mp3|json)$/i.test(name)||['_headers','_redirects'].includes(name))&&(!name.includes('test')||name==='repo-sports-quidditch-v2-test.html')&&!['package-lock.json','package.json'].includes(name))copy(path.join(root,name),path.join(dist,name));
}
require('./build-web-login.cjs')(root,dist);
files+=require('./build-launcher-feed.cjs').buildLauncherFeed(root,dist);
fs.writeFileSync(path.join(dist,'robots.txt'),production?'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /legacy-runtime\n':'User-agent: *\nDisallow: /\n');
if(production){
 const index=path.join(dist,'index.html'),headers=path.join(dist,'_headers');
 fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace(/<meta name="robots"[^>]*>/g,''));
 fs.writeFileSync(headers,fs.readFileSync(headers,'utf8').replace(/^.*X-Robots-Tag:.*\r?\n/gm,''));
}
// The custom domain can retain assets longer than Pages' cache headers request.
// Content versions keep HTML and its scripts/styles from different releases mixing.
for(const html of ['index.html','legacy-runtime.html','avatar-studio.html','game-achievements-bridge.html','game-playtime-bridge.html','moratales-characters.html','morogue-account-bridge.html']){
const entry=path.join(dist,html);if(!fs.existsSync(entry))continue;
fs.writeFileSync(entry,fs.readFileSync(entry,'utf8').replace(/\b(src|href)="([^"?#]+\.(?:js|css))(?:\?[^"#]*)?"/g,(attribute,key,url)=>{
 if(/^(?:[a-z]+:)?\/\//i.test(url))return attribute;
 const file=path.resolve(dist,url.replace(/^\//,''));
 if(!file.startsWith(dist+path.sep)||!fs.existsSync(file))return attribute;
 const version=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
 return `${key}="${url}?v=${version}"`;
}));
}
fs.writeFileSync(path.join(dist,'_routes.json'),JSON.stringify({version:1,include:['/api/*','/download/*'],exclude:[]}));
console.log('Staging bundle: '+files+' files. Existing runtime assets included.');
