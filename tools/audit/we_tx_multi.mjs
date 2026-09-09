import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);
for (const y of [0, 150, 300, 500, 800, 1000]) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(180);
  const r = await p.evaluate(() => {
    const pick = (sel) => { const e = document.querySelector(sel); if (!e) return 'MISSING'; const cs = getComputedStyle(e); return { t: cs.transform === 'none' ? 'none' : cs.transform.slice(0, 40), tr: cs.translate, inline: (e.style.transform || '').slice(0, 40) }; };
    return { sy: Math.round(window.scrollY), product: pick('.hero__product'), role: pick('.hero__role-shift') };
  });
  console.log('scroll', String(y).padStart(4), 'sy', r.sy, '| PRODUCT', JSON.stringify(r.product), '| ROLE', JSON.stringify(r.role));
}
await b.close();
