import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const [w, mob] of [[1280,false],[1024,false],[390,true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(800);
  const s = async () => p.evaluate(() => { const h = document.querySelector('.hero'); const cs = getComputedStyle(h); return { pos: cs.position, top: cs.top, rectTop: Math.round(h.getBoundingClientRect().top) }; });
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(60); const a = await s();
  await p.evaluate(() => window.scrollTo(0, 400)); await p.waitForTimeout(80); const c = await s();
  console.log('w' + w, 'pos', a.pos, 'top', a.top, '| rectTop @0:', a.rectTop, '@400:', c.rectTop, (a.pos === 'sticky' && c.rectTop === a.rectTop) ? '=> PINNED' : (c.rectTop < a.rectTop ? '=> scrolls (not pinned)' : ''));
  await ctx.close();
}
await b.close();
