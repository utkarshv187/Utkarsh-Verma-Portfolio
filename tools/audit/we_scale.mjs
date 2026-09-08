import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const W of [1920, 1440, 1280]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1200);
  for (let y = 0; y < 3000; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(100); }
  const d = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const h = [...document.querySelectorAll('*')].find((e) => /^WORK EXPERIENCE$/i.test(norm(e.textContent)) && norm(e.textContent).length < 30 && e.getBoundingClientRect().height > 8);
    const sub = [...document.querySelectorAll('*')].find((e) => /BASED IN DELHI NCR/i.test(norm(e.textContent)) && norm(e.textContent).length < 60);
    const card = [...document.querySelectorAll('div')].find((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor));
    const g = (e) => e ? { fs: getComputedStyle(e).fontSize, x: Math.round(e.getBoundingClientRect().x), w: Math.round(e.getBoundingClientRect().width) } : null;
    return { heading: g(h), subtitle: sub ? { fs: getComputedStyle(sub).fontSize } : null, card: card ? { x: Math.round(card.getBoundingClientRect().x), w: Math.round(card.getBoundingClientRect().width) } : null };
  });
  console.log('W', W, JSON.stringify(d));
  await ctx.close();
}
await b.close();
