const {chromium}=require('playwright'),assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage();
  await page.goto((process.env.DASHBOARD_TEST_URL||'http://127.0.0.1:8788')+'/avatar-studio.html');
  await page.waitForFunction(()=>window.repoAvatar?.catalog);
  const result=await page.evaluate(async()=>{
   const cat=repoAvatar.catalog,c=document.createElement('canvas');c.width=c.height=320;
   const ctx=c.getContext('2d',{willReadFrequently:true}),failures=[];let combinations=0,features=0,outfits=0,seams=0;
   const render=async v=>{await repoAvatar.draw(c,{...cat.defaults,hair:'none',beard:'none',...v});return new Uint32Array(ctx.getImageData(0,0,320,320).data.buffer);};
   const check=(pass,message)=>{if(!pass&&failures.length<20)failures.push(message);};
   const same=(a,b,indices)=>indices.every(i=>a[i]===b[i]);
   const upper=Array.from({length:320*190},(_,i)=>i);
   function outsideHead(pixels){
    const mask=new Uint8Array(pixels.length),queue=[];
    const visit=i=>{if(i<0||i>=pixels.length||mask[i])return;const p=pixels[i],r=p&255,g=p>>8&255,b=p>>16&255;if(r>g&&g>b&&(g-b)/(r-b)>.51){mask[i]=1;queue.push(i);}};
    for(let x=0;x<320;x++)visit(x);for(let y=0;y<280;y++){visit(y*320);visit(y*320+319);}
    for(let n=0;n<queue.length;n++){const i=queue[n],x=i%320;if(x)visit(i-1);if(x<319)visit(i+1);visit(i-320);visit(i+320);}
    return Array.from({length:320*250},(_,i)=>i).filter(i=>mask[i]);
   }
   for(const body of ['male','female']){
    const bald=await render({body,face:'classic'});
    for(const hair of cat.parts.hair.filter(p=>p.rect)){
     const portrait=await render({body,hair:hair.id,face:'classic'}),exposed=new Uint8Array(320*320),seen=new Uint8Array(320*320),skin=new Uint8Array(320*320);
     for(let i=0;i<exposed.length;i++){const p=bald[i],r=p&255,g=p>>8&255,b=p>>16&255;exposed[i]=portrait[i]===p?1:0;skin[i]=r>150&&r>g*1.12&&r>b*1.1&&(g-b)/(r-b)<.5?1:0;}
     for(let start=0;start<115*320;start++)if(exposed[start]&&skin[start]&&!seen[start]){
      const queue=[start];seen[start]=1;for(let n=0;n<queue.length;n++){const i=queue[n],x=i%320;for(const j of [x?i-1:-1,x<319?i+1:-1,i-320,i+320])if(j>=0&&j<seen.length&&!seen[j]&&exposed[j]){seen[j]=1;queue.push(j);}}
      check(queue.length>64,`${body}/${hair.id}: isolated scalp fleck above the face at ${start%320},${Math.floor(start/320)} (${queue.length} pixels)`);
     }
     seams++;
    }
    // A new jaw must not move the skull, hairline, eye line or nose. This
    // catches the incompatible full-head sprites responsible for the defect.
    for(const hair of cat.parts.hair){
     const original=await render({body,hair:hair.id,face:'classic'});
     for(const face of cat.parts.face){const next=await render({body,hair:hair.id,face:face.id});check(same(original,next,upper),`${body}/${face.id}/${hair.id}: upper head moved`);combinations++;}
    }
    for(const face of cat.parts.face){
     const original=await render({body,face:face.id}),outside=outsideHead(original);
     for(const kind of ['eyes','nose','mouth'])for(const part of cat.parts[kind]){
      const next=await render({body,face:face.id,[kind]:part.id});check(same(original,next,outside),`${body}/${face.id}/${kind}/${part.id}: feature changed the head silhouette`);features++;
     }
     // Exposed skin on the cheek, chin and neck must survive every wardrobe
     // choice. The previous high collars painted directly over those pixels.
     const skin=[];
     for(let y=155;y<270;y++)for(let x=85;x<225;x++){const i=y*320+x,p=original[i],r=p&255,g=p>>8&255,b=p>>16&255;if(r>180&&r>g*1.12&&r>b*1.1&&b>g*.8&&(g-b)/(r-b)<.5)skin.push(i);}
     for(const clothing of cat.clothing.filter(p=>p.file)){
      const next=await render({body,face:face.id,clothing:clothing.id});check(same(original,next,skin),`${body}/${face.id}/${clothing.id}: clothes covered exposed skin`);outfits++;
     }
    }
   }
   // Slow asset loads must not let an older selection replace the latest one.
   const first=repoAvatar.draw(c,{hair:'36',face:'broad'}),last=repoAvatar.draw(c,{hair:'27',face:'soft'});await Promise.all([first,last]);
   const actual=new Uint32Array(ctx.getImageData(0,0,320,320).data.buffer);await repoAvatar.draw(c,{hair:'27',face:'soft'});const expected=new Uint32Array(ctx.getImageData(0,0,320,320).data.buffer);
   check(same(actual,expected,Array.from({length:320*320},(_,i)=>i)),'An old render replaced the latest selection');
   return {combinations,features,outfits,seams,failures};
  });
  assert.deepEqual(result.failures,[]);
  console.log(`PASS: ${result.combinations} hair/head registrations, ${result.seams} scalp seam checks, ${result.features} feature silhouette checks, ${result.outfits} exposed-skin wardrobe checks, and latest selection wins.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
