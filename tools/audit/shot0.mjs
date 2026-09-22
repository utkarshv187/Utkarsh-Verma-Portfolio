import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const W of [430, 600]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(()=>{});
  await p.waitForTimeout(2400);
  await p.evaluate(async()=>{for(let y=0;y<3000;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}scrollTo(0,0);await new Promise(r=>setTimeout(r,300));});
  await p.screenshot({ path: `audit/out/mobile/live_wide_${W}.png` });
  await ctx.close();
}
await b.close();
