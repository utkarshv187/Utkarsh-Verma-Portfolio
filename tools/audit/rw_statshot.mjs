import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
const cardDoc = await p.evaluate(() => ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'].map((u) => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(u) && x.getBoundingClientRect().width > 0); return Math.round(a.getBoundingClientRect().top + scrollY); }));
// card1 fully visible a touch before pin; card3 fully visible pinned
for (const [name, y, clipY] of [['card1', cardDoc[0] - 150, 480], ['card3', cardDoc[2] - 160, 505]]) {
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(3600);
  await p.screenshot({ path: join(OUT, `num_${name}.png`), clip: { x: 735, y: clipY, width: 600, height: 260 } });
}
await b.close();
console.log('done');
