import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out', 'we');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);
// find role viewport y at scroll 0
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150);
const roleY0 = await p.evaluate(() => { const e = document.querySelector('.hero__role-shift'); const r = e.getBoundingClientRect(); return Math.round(r.top); });
console.log('role top @0:', roleY0);
await p.evaluate(() => window.scrollTo(0, 350)); await p.waitForTimeout(200);
const info = await p.evaluate(() => { const g = (s) => { const e = document.querySelector(s); const m = new DOMMatrix(getComputedStyle(e).transform); const r = e.getBoundingClientRect(); return { skew: +(Math.atan(m.c) * 180 / Math.PI).toFixed(1), tx: +m.e.toFixed(0), cx: Math.round(r.left + r.width / 2) }; }; return { product: g('.hero__product'), role: g('.hero__role-shift') }; });
console.log('@350:', JSON.stringify(info));
await p.screenshot({ path: join(OUT, 'mine_both_350.png'), clip: { x: 0, y: 0, width: 1440, height: 720 } });
console.log('wrote mine_both_350.png');
await b.close();
