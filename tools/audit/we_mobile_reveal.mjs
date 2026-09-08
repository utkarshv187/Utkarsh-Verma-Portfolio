import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const w of [390, 1024]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1, isMobile: w < 810, hasTouch: w < 810 });
  const p = await ctx.newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < Math.min(H, 8000); y += 500) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(80); }
  // check for the bento image anywhere, and whether it's visible (no hover performed)
  const info = await p.evaluate(() => {
    const im = [...document.querySelectorAll('img')].find((i) => /9nOKk7/.test(i.src));
    if (!im) return { present: false };
    const r = im.getBoundingClientRect();
    const cs = getComputedStyle(im);
    return { present: true, w: Math.round(r.width), h: Math.round(r.height), display: cs.display, visibility: cs.visibility, opacity: cs.opacity, inFlow: r.width > 2 && r.height > 2 };
  });
  console.log('W' + w, JSON.stringify(info));
  await ctx.close();
}
await b.close();
