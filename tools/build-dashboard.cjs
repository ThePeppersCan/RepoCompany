const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const production=process.argv.includes('--production')||process.env.CF_PAGES_BRANCH==='main';
fs.mkdirSync(dist,{recursive:true});
const includeDirs=['assets','original-case-assets','account-assets','audio','vendor','dragonbound-career-mode','reparty'];
let files=0;
function copy(src,dest){
 const stat=fs.statSync(src);if(stat.isDirectory()){fs.mkdirSync(dest,{recursive:true});for(const name of fs.readdirSync(src))if(!['node_modules','.git','.wrangler','tests','QA','work'].includes(name))copy(path.join(src,name),path.join(dest,name));}
 else{if(/\.(sql|md|toml|map|ts|cjs)$/i.test(src))return;fs.copyFileSync(src,dest);files++;}
}
for(const name of fs.readdirSync(root)){
 if(includeDirs.includes(name))copy(path.join(root,name),path.join(dist,name));
 else if(fs.statSync(path.join(root,name)).isFile()&&(/\.(html|css|js|png|jpg|webp|mp3|json)$/i.test(name)||['_headers','_redirects'].includes(name))&&(!name.includes('test')||name==='repo-sports-quidditch-v2-test.html')&&!['package-lock.json','package.json'].includes(name))copy(path.join(root,name),path.join(dist,name));
}
fs.writeFileSync(path.join(dist,'robots.txt'),production?'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /legacy-runtime\n':'User-agent: *\nDisallow: /\n');
if(production){
 const index=path.join(dist,'index.html'),headers=path.join(dist,'_headers');
 fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace(/<meta name="robots"[^>]*>/g,''));
 fs.writeFileSync(headers,fs.readFileSync(headers,'utf8').replace(/^.*X-Robots-Tag:.*\r?\n/gm,''));
}
fs.writeFileSync(path.join(dist,'_routes.json'),JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
console.log('Staging bundle: '+files+' files. Existing runtime assets included.');
