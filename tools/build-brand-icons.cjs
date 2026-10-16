'use strict';
// Reuse the original transparent mark. Never flatten it against a site theme.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'desktop/renderer/assets/repo-company-mark.png');
async function main(){
 const png=size=>sharp(source).resize(size,size).png().toBuffer();
 const icon=await png(96),touch=await png(180),mark=await png(512);
 for(const file of ['favicon.png','assets/brand/favicon.png','assets/brand/favicon-v2.png'])fs.writeFileSync(path.join(root,file),icon);
 for(const file of ['assets/brand/apple-touch-icon.png','assets/brand/apple-touch-icon-v2.png'])fs.writeFileSync(path.join(root,file),touch);
 fs.writeFileSync(path.join(root,'assets/brand/repo-company-mark.png'),mark);
 // ICO directory with PNG entries preserves alpha at each common task/tab size.
 const sizes=[16,32,48,96],frames=await Promise.all(sizes.map(png));
 const header=Buffer.alloc(6+16*frames.length);header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);
 let offset=header.length;
 frames.forEach((frame,i)=>{const p=6+i*16;header[p]=header[p+1]=sizes[i];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(frame.length,p+8);header.writeUInt32LE(offset,p+12);offset+=frame.length;});
 const ico=Buffer.concat([header,...frames]);
 for(const file of ['favicon.ico','assets/brand/favicon-v2.ico'])fs.writeFileSync(path.join(root,file),ico);
 console.log('Transparent brand mark, PNG favicons, touch icons and four-size ICO refreshed.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
