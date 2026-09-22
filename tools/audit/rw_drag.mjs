import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
const cardDocY = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); return Math.round(a.getBoundingClientRect().top + scrollY); });
await p.evaluate((y) => scrollTo(0, y - 132), cardDocY);
await p.waitForTimeout(1500);
const shot = (n) => p.screenshot({ path: join(OUT, `drag_${n}.png`), clip: { x: 120, y: 130, width: 600, height: 630 } });
// handle roughly at card-x ~310 => viewport x ~ 120+310=430, y center ~ 130+ (region 630/2)=445
const hx = 423, hy = 445;
await shot('a_before');
// drag handle far LEFT
await p.mouse.move(hx, hy); await p.mouse.down(); await p.mouse.move(hx - 140, hy, { steps: 12 }); await p.mouse.up();
await p.waitForTimeout(700); await shot('b_dragL');
// drag handle far RIGHT
await p.mouse.move(hx - 140, hy); await p.mouse.down(); await p.mouse.move(hx + 150, hy, { steps: 16 }); await p.mouse.up();
await p.waitForTimeout(700); await shot('c_dragR');
await b.close();
console.log('done');
