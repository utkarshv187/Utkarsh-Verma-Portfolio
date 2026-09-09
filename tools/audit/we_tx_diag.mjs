import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);
const read = () => p.evaluate(() => {
  const g = (sel) => { const e = document.querySelector(sel); if (!e) return null; const cs = getComputedStyle(e); const m = new DOMMatrix(cs.transform); const r = e.getBoundingClientRect(); return { transform: cs.transform, matE: +m.e.toFixed(1), skew: +(Math.atan(m.c) * 180 / Math.PI).toFixed(2), origin: cs.transformOrigin, left: Math.round(r.left) }; };
  return { product: g('.hero__product'), role: g('.hero__role-shift') };
});
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150); const a = await read();
await p.evaluate(() => window.scrollTo(0, 1000)); await p.waitForTimeout(200); const c = await read();
console.log('PRODUCT @0 :', JSON.stringify(a.product));
console.log('PRODUCT @1k:', JSON.stringify(c.product), '  left shift:', c.product.left - a.product.left);
console.log('ROLE    @0 :', JSON.stringify(a.role));
console.log('ROLE    @1k:', JSON.stringify(c.role), '  left shift:', c.role.left - a.role.left);
await b.close();
