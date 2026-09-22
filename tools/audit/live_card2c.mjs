import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(()=>{});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=innerHeight*0.4){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));} });
await p.waitForTimeout(400);
// scroll back to top then find the gamification card by scanning frames
for (const y of [3600, 3900, 4200]) {
  await p.evaluate((yy)=>scrollTo(0,yy), y); await p.waitForTimeout(800);
  const hit = await p.evaluate(() => /TIER UPGRADED|Valid till|Extend Gold/i.test(document.body.innerText));
  await p.screenshot({ path: `audit/out/card2/live_c2_${y}.png`, clip: { x:80, y:120, width:640, height:640 } });
  console.log('y='+y+' gamificationVisible='+hit);
}
await b.close();
