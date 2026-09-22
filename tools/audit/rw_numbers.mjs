import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');

const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
const cardDoc = await p.evaluate(() => ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'].map((u) => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(u) && x.getBoundingClientRect().width > 0); return Math.round(a.getBoundingClientRect().top + scrollY); }));
const stickyTop = [132, 146, 160];

const readTiles = () => p.evaluate(() => {
  const tint = (c) => c.startsWith('rgba(37, 197, 179') || c.startsWith('rgba(255, 182, 1');
  const tiles = [...document.querySelectorAll('div,a')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return tint(cs.backgroundColor) && r.width > 200 && r.width < 320 && r.height > 70 && r.height < 110 && r.top > 100 && r.bottom < 860 && r.left > 700; });
  return tiles.map((t) => { const r = t.getBoundingClientRect(); const numEl = [...t.querySelectorAll('*')].find((e) => e.children.length === 0 && /[0-9]/.test(e.textContent)); const cs = numEl ? getComputedStyle(numEl) : null; return { it: t.innerText.replace(/\n/g, ' / '), x: Math.round(r.left), y: Math.round(r.top), num: numEl ? numEl.textContent.trim() : null, numFs: cs ? cs.fontSize : null, numFw: cs ? cs.fontWeight : null, numColor: cs ? cs.color : null }; }).sort((a, c) => a.y - c.y || a.x - c.x);
});

for (let i = 0; i < 3; i++) {
  await p.evaluate((y) => scrollTo(0, y), cardDoc[i] - stickyTop[i]);
  await p.waitForTimeout(500);
  const early = await readTiles();
  await p.waitForTimeout(3000);
  const late = await readTiles();
  console.log(`\n===== CARD ${i + 1} =====`);
  console.log(' EARLY (0.5s):', JSON.stringify(early.map((t) => t.num)));
  console.log(' LATE (3.5s): ', JSON.stringify(late.map((t) => t.num)));
  console.log(' TILES settled:');
  for (const t of late) console.log(`   "${t.it}"  | num="${t.num}" ${t.numFs}/${t.numFw} ${t.numColor}`);
}
await b.close();
