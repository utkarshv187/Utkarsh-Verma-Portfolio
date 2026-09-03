import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless:true });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil:'networkidle', timeout:30000 });
await p.waitForTimeout(500);
const clip={x:1170,y:20,width:180,height:70};
for(let i=0;i<6;i++){ await p.screenshot({path:join(__dirname,'out','interactions','compare','mybeam_'+i+'.png'),clip}); await p.waitForTimeout(300);}
// strip
const sharp=(await import('sharp')).default; const bufs=[];let W=0,H=0;
for(let i=0;i<6;i++){const bb=await sharp(join(__dirname,'out','interactions','compare','mybeam_'+i+'.png')).resize(180).toBuffer();const m=await sharp(bb).metadata();bufs.push({bb,w:m.width,h:m.height});W+=m.width+4;H=Math.max(H,m.height);}
const comp=[];let x=0;for(const im of bufs){comp.push({input:im.bb,left:x,top:0});x+=im.w+4;}
await sharp({create:{width:W,height:H,channels:3,background:'#222'}}).composite(comp).png().toFile(join(__dirname,'out','interactions','compare','mybeam_strip.png'));
console.log('beam strip done');
await b.close();
