import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless:true });
const c = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
const p = await c.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil:'networkidle', timeout:120000 });
await p.waitForTimeout(1500);
// warm scroll
await p.evaluate(async()=>{const m=document.body.scrollHeight;for(let y=0;y<m;y+=800){scrollTo(0,y);await new Promise(r=>setTimeout(r,180));}scrollTo(0,0);await new Promise(r=>setTimeout(r,400));});
for (const y of [4250, 4350, 4450]) {
  await p.evaluate(yy=>scrollTo(0,yy), y);
  await p.waitForTimeout(3500); // let odometer settle
  await p.screenshot({ path: join(__dirname,'out',`card3_y${y}.png`) });
}
console.log('done');
await b.close();
