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

const shot = (n) => p.screenshot({ path: join(OUT, `carousel_${n}.png`), clip: { x: 120, y: 130, width: 600, height: 630 } });
await shot('0_initial');

// find the '>' arrow and click it a few times
const findArrow = (txt) => p.evaluate((t) => { const e = [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && x.textContent.trim() === t && x.getBoundingClientRect().top > 100 && x.getBoundingClientRect().top < 800 && x.getBoundingClientRect().left < 720); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, txt);

for (let i = 1; i <= 3; i++) {
  const arrow = await findArrow('>');
  if (!arrow) { console.log('no > arrow at step', i); break; }
  await p.mouse.click(arrow.x, arrow.y);
  await p.waitForTimeout(900);
  await shot(i + '_next');
}
// also check for auto-advance without clicking
await p.waitForTimeout(3000);
await shot('4_after3swait');
console.log('done; arrow present:', !!(await findArrow('>')));
await b.close();
