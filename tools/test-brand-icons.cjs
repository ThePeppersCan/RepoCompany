'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require('sharp');
const dist=path.resolve(__dirname,'../dist');
async function transparent(input,size){const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,size);assert.equal(info.height,size);for(const p of [0,size-1,(size-1)*size,size*size-1])assert.equal(data[p*4+3],0,'The icon corners must be transparent');let clear=0,coverage=0;for(let i=3;i<data.length;i+=4){if(data[i]===0)clear++;coverage+=data[i]/255;}assert(clear>size*size*.15&&coverage>size*size*.3&&coverage<size*size*.6,'Keep the logo visible and its surrounding space transparent, including antialiased small sizes');}
(async()=>{
 for(const file of ['favicon.png','assets/brand/favicon.png','assets/brand/favicon-v2.png'])await transparent(path.join(dist,file),96);
 for(const file of ['favicon.ico','assets/brand/favicon-v2.ico']){const b=fs.readFileSync(path.join(dist,file));assert.equal(b.readUInt16LE(2),1);assert.equal(b.readUInt16LE(4),4);for(let i=0;i<4;i++){const p=6+i*16,size=b[p],length=b.readUInt32LE(p+8),offset=b.readUInt32LE(p+12);await transparent(b.subarray(offset,offset+length),size);}}
 for(const file of ['index.html','broomflight/index.html','legacy-runtime.html','moratales-characters.html'])assert(fs.readFileSync(path.join(dist,file),'utf8').includes('/assets/brand/favicon-v2.png'),file+' uses refreshed icon');
 console.log('PASS: transparent PNGs and every ICO size, visible logo, default crawler paths and updated browser icon links.');
})().catch(e=>{console.error(e);process.exitCode=1;});
