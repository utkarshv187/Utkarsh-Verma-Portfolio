import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);
console.log('errors:', errs.filter((e) => !/fetchPriority|fetchpriority/.test(e)).slice(0, 3));
const skew = () => p.evaluate(() => { const e = document.querySelector('.hero__product'); const m = new DOMMatrix(getComputedStyle(e).transform); return { ang: +(Math.atan2(m.c, m.d) * 180 / Math.PI).toFixed(1), tx: +m.e.toFixed(1) }; });

async function test(delta, label) {
  await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(700); // settle at a mid position
  const before = await skew();
  await p.evaluate((d) => window.scrollBy(0, d), delta);
  const at = [];
  for (const w of [0, 40, 90, 160, 260, 400, 650]) { await p.waitForTimeout(w - (at.length ? [0, 40, 90, 160, 260, 400, 650][at.length - 1] : 0)); at.push({ w, ...(await skew()) }); }
  console.log(`[${label}] before ${before.ang}deg`);
  at.forEach((a) => console.log('  +' + String(a.w).padStart(3) + 'ms  ang', String(a.ang).padStart(6), 'tx', a.tx));
}
await test(600, 'burst DOWN 600');
await test(-600, 'burst UP 600');
await b.close();
