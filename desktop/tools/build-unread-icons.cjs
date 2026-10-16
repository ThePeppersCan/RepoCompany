'use strict';
// Fixed native taskbar artwork, rendered once with the same font/palette as Wibs.
const {chromium} = require('playwright');
const fs = require('node:fs/promises'), path = require('node:path');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage();
    const destination = path.resolve(__dirname, '../renderer/assets/unread');
    await fs.mkdir(destination, {recursive:true});
    for (const label of ['1','2','3','4','5','6','7','8','9','9+']) for (const size of [16,32]) {
      const png = await page.evaluate(({label,size}) => {
        const c=document.createElement('canvas');c.width=c.height=size;
        const x=c.getContext('2d');x.scale(size/16,size/16);
        x.beginPath();x.arc(8,8,7.5,0,Math.PI*2);x.fillStyle='#c4d6aa';x.fill();
        x.strokeStyle='#142219';x.lineWidth=1;x.stroke();
        x.font=`700 ${label.length>1?9:11}px "Segoe UI", Arial, sans-serif`;
        x.fillStyle='#142219';x.textAlign='center';x.textBaseline='alphabetic';
        const m=x.measureText(label);x.fillText(label,8,8+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2);
        return c.toDataURL('image/png').split(',')[1];
      },{label,size});
      await fs.writeFile(path.join(destination,`${label.replace('+','plus')}-${size}.png`),Buffer.from(png,'base64'));
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
