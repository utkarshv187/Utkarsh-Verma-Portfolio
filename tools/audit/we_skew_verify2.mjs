import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on('console', (m) => { if (m.type() === 'error' && !/fetchPriority|fetchpriority/i.test(m.text())) errs.push(m.text().slice(0, 90)); });
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);
console.log('errors:', errs.slice(0, 3));
const read = () => p.evaluate(() => {
  const g = (sel) => { const e = document.querySelector(sel); if (!e) return null; const m = new DOMMatrix(getComputedStyle(e).transform); return { skew: +(Math.atan(m.c) * 180 / Math.PI).toFixed(2), tx: +m.e.toFixed(1) }; };
  return { product: g('.hero__product'), role: g('.hero__role-shift') };
});
const at = async (y) => { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); return read(); };
console.log('LIVE targets: PRODUCT skew 2.34/4.68/7.01/9.35 tx -6.1/-12.3/-18.4/-24.5 | ROLE skew -1.46/-2.92/-4.38/-5.84 tx 17.5/35.1/52.6/70.1');
for (const y of [250, 500, 750, 1000]) console.log('scroll', String(y).padStart(4), JSON.stringify(await at(y)));
// HOLD check: stop at 500, wait 1.2s, re-read (must be unchanged)
await p.evaluate(() => window.scrollTo(0, 500)); await p.waitForTimeout(150); const h1 = await read();
await p.waitForTimeout(1200); const h2 = await read();
console.log('HOLD @500: t0', JSON.stringify(h1), '=> +1.2s', JSON.stringify(h2), JSON.stringify(h1) === JSON.stringify(h2) ? 'HELD (no spring-back)' : 'CHANGED');
// UP-scroll returns to default
console.log('back to 0:', JSON.stringify(await at(0)));
await b.close();
