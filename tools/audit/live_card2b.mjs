import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(()=>{});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=innerHeight*0.4){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));} });
await p.waitForTimeout(400);
for (const y of [4650, 4850, 5050]) {
  await p.evaluate((yy)=>scrollTo(0,yy), y); await p.waitForTimeout(800);
  await p.screenshot({ path: `audit/out/card2/live_full_${y}.png`, clip: { x:0, y:0, width:760, height:900 } });
  console.log('saved live_full_'+y);
}
await b.close();
