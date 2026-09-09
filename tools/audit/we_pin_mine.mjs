import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);
console.log('console errors:', errs.length ? JSON.stringify(errs.slice(0, 5)) : 'none');
const info = () => p.evaluate(() => {
  const g = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { top: Math.round(r.top), pos: cs.position, z: cs.zIndex }; };
  return { hero: g('.hero'), we: g('.we') };
});
console.log('static:', JSON.stringify(await info()));
for (let y = 0; y <= 1400; y += 200) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(70);
  const s = await info();
  console.log(String(y).padStart(4), 'HERO', JSON.stringify(s.hero), 'WE', JSON.stringify(s.we));
}
await b.close();
