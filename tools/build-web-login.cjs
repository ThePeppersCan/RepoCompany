'use strict';
// Share the launcher's actual presentation instead of maintaining a second skin.
const fs=require('node:fs'),path=require('node:path');
module.exports=function buildWebLogin(root,dist){
 const source=path.join(root,'desktop/renderer'),html=fs.readFileSync(path.join(source,'index.html'),'utf8');
 const logo=html.match(/<div class="brand-loader"[\s\S]*?<\/svg>\s*<\/div>/)?.[0];
 const form=html.match(/<form id="sign-in-form"[\s\S]*?<\/form>/)?.[0];
 if(!logo||!form)throw Error('Launcher login markup changed; update the shared web login build.');
 const css=fs.readFileSync(path.join(source,'styles.css'),'utf8')+'\n:host{display:block;color:#eceade;font-family:"Segoe UI Variable Text","Segoe UI",sans-serif;color-scheme:dark;-webkit-font-smoothing:antialiased}.website-fallback{position:relative;inset:auto;min-height:100dvh;padding:30px;box-sizing:border-box}.connection-card{margin:auto}.website-fallback button{padding-left:14px;padding-right:14px}.website-fallback #connection-title{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(max-width:480px){.sign-in-form input{font-size:16px}}';
 const markup='<style>'+css+'</style><main class="website-fallback" data-phase="loading" aria-labelledby="connection-title"><div class="entry-atmosphere" aria-hidden="true"></div><div class="connection-card">'+logo.replaceAll('assets/repo-company-mark.png','/assets/launcher-login-mark.png')+'<h1 id="connection-title">Log in to Repo Company</h1>'+form+'</div></main>';
 const motion=fs.readFileSync(path.join(source,'brand-motion.js'),'utf8').replace("document.querySelector('.brand-motion')","host.shadowRoot.querySelector('.brand-motion')");
 fs.writeFileSync(path.join(dist,'repo-login-template.js'),'window.mountRepoLogin = function(host) { host.attachShadow({mode:"open"}).innerHTML='+JSON.stringify(markup)+';\n'+motion+'\n};\n');
 fs.mkdirSync(path.join(dist,'assets'),{recursive:true});fs.copyFileSync(path.join(source,'assets/repo-company-mark.png'),path.join(dist,'assets/launcher-login-mark.png'));
};
