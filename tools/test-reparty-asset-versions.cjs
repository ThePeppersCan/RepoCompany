const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {versionRepartyAssets}=require('./version-reparty-assets.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'reparty-assets-')),root=path.join(dir,'reparty');fs.mkdirSync(root);
try{
 const write=stage=>{fs.writeFileSync(path.join(root,'app.js'),"import {stage} from './suno-player.js';import './core.mjs';import 'https://example.com/external.js';");fs.writeFileSync(path.join(root,'suno-player.js'),"import './core.mjs';export const stage="+JSON.stringify(stage)+';');fs.writeFileSync(path.join(root,'core.mjs'),'export const value=1;');fs.writeFileSync(path.join(root,'watch.css'),"@import url('dialogs.css');");fs.writeFileSync(path.join(root,'dialogs.css'),'.modal{}');};
 write('old');const old=versionRepartyAssets(dir);const oldEntry=fs.readFileSync(path.join(root,'app.js'),'utf8');
 write('new logo');const next=versionRepartyAssets(dir),entry=fs.readFileSync(path.join(root,'app.js'),'utf8');assert.notEqual(old,next);assert.notEqual(oldEntry,entry);assert(entry.includes("./suno-player.js?v="+next));assert(entry.includes("'./core.mjs?v="+next));assert(entry.includes("'https://example.com/external.js'"));assert(fs.readFileSync(path.join(root,'suno-player.js'),'utf8').includes('./core.mjs?v='+next));assert(fs.readFileSync(path.join(root,'watch.css'),'utf8').includes('dialogs.css?v='+next));
 const withLines=newline=>{write('line endings');fs.appendFileSync(path.join(root,'app.js'),newline+'// release'+newline);return versionRepartyAssets(dir);};
 const windows=withLines('\r\n'),windowsEntry=fs.readFileSync(path.join(root,'app.js'),'utf8'),linux=withLines('\n');assert.equal(windows,linux);assert.equal(windowsEntry,fs.readFileSync(path.join(root,'app.js'),'utf8'));
 console.log('PASS: Suno changes invalidate the dependency graph; Windows and production builds produce identical release URLs and module contents.');
}finally{assert(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});}
