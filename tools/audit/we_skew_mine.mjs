import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);

const readSkew = () => p.evaluate(() => { const e = document.querySelector('.hero__product'); const m = new DOMMatrix(getComputedStyle(e).transform); return { c: +m.c.toFixed(4), ang: +(Math.atan(m.c) * 180 / Math.PI).toFixed(1), tx: +m.e.toFixed(1) }; });

// sustained fast scroll driven from Node; sample skew each step
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(200);
let peak = { ang: 0 };
const curve = [];
for (let i = 0; i < 14; i++) {
  await p.evaluate(() => window.scrollBy(0, 90));
  const s = await readSkew();
  curve.push(s.ang);
  if (Math.abs(s.ang) > Math.abs(peak.ang)) peak = s;
}
console.log('DOWN peak skew:', JSON.stringify(peak), 'curve:', JSON.stringify(curve));
// screenshot near peak (scroll a burst then immediately shot)
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
await p.evaluate(() => { for (let k = 0; k < 6; k++) window.scrollBy(0, 80); });
await p.screenshot({ path: join(OUT, 'skew_mine_down.png') });
const sAfter = await readSkew();
console.log('shot skew (down burst):', JSON.stringify(sAfter));
// settled check
await p.waitForTimeout(700);
console.log('settled skew:', JSON.stringify(await readSkew()));
await b.close();
