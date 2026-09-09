import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const w of [1280, 1024, 810]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1, isMobile: w < 810 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1400);
  const sticky = await p.evaluate(() => {
    const els = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return getComputedStyle(e).position === 'sticky' && r.height > 300 && r.width > 300; });
    return els.map((e) => ({ h: Math.round(e.getBoundingClientRect().height), top: getComputedStyle(e).top, dfn: e.getAttribute('data-framer-name') }));
  });
  console.log('LIVE w' + w, 'sticky big els:', JSON.stringify(sticky));
  await ctx.close();
}
await b.close();
