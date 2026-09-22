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

const cardDoc = await p.evaluate(() => {
  const urls = ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'];
  return urls.map((u) => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(u) && x.getBoundingClientRect().width > 0); return Math.round(a.getBoundingClientRect().top + scrollY); });
});
const stickyTop = [132, 146, 160];
// settle each card fully in view and screenshot the stats (right) region
for (let i = 0; i < 3; i++) {
  await p.evaluate((y) => scrollTo(0, y), cardDoc[i] - stickyTop[i]);
  await p.waitForTimeout(3200);
  // right half stats region in viewport: card top ~ stickyTop[i], height 620
  await p.screenshot({ path: join(OUT, `stats_card${i + 1}.png`), clip: { x: 730, y: Math.max(0, stickyTop[i] + 200), width: 620, height: 380 } });
}

// carousel + hover probe on card 1
await p.evaluate((y) => scrollTo(0, y), cardDoc[0] - stickyTop[0]);
await p.waitForTimeout(1500);
const probe = await p.evaluate(() => {
  const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp'));
  // find the < > control siblings
  const arrows = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && ['<', '>'].includes((e.textContent || '').trim()) && e.getBoundingClientRect().top > 0 && e.getBoundingClientRect().top < 900);
  const arrowInfo = arrows.map((e) => { const par = e.closest('[data-framer-name]'); const r = e.getBoundingClientRect(); return { text: e.textContent.trim(), parentName: par ? par.getAttribute('data-framer-name') : null, x: Math.round(r.x), y: Math.round(r.y) }; });
  // the card's own data-framer-name + parent structure of the left media
  const cardName = a.getAttribute('data-framer-name');
  // count imgs inside the card <a> vs siblings
  const inA = [...a.querySelectorAll('img')].length;
  return { cardName, arrowInfo, imgsInsideAnchor: inA, anchorHref: a.getAttribute('href') };
});
console.log('PROBE:', JSON.stringify(probe, null, 2));
await b.close();
console.log('wrote stats_card1/2/3.png');
