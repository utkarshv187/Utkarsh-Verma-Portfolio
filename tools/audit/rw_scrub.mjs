import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 140)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
await p.evaluate(() => { window.__cards = ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'].map((u) => [...document.querySelectorAll('a[href]')].find((a) => (a.getAttribute('href') || '').includes(u) && a.getBoundingClientRect().width > 0)); });
const docY = await p.evaluate(() => window.__cards.map((a) => Math.round(a.getBoundingClientRect().top + scrollY)));
console.log('card docY:', JSON.stringify(docY), 'pins at', docY.map((d, i) => d - [132, 146, 160][i]));

const rows = [];
for (let y = 2000; y <= 5600; y += 60) {
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(90);
  const s = await p.evaluate(() => window.__cards.map((a) => { const cs = getComputedStyle(a); const m = cs.transform; let ty = 0; if (m && m !== 'none') { const p = m.match(/matrix\(([^)]+)\)/); if (p) ty = Math.round(parseFloat(p[1].split(',')[5])); } return { ty, op: +(+cs.opacity).toFixed(2), top: Math.round(a.getBoundingClientRect().top) }; }));
  rows.push({ y, s });
}
writeFileSync(join(OUT, 'scrub.json'), JSON.stringify(rows));
// print compact per-card transition points
for (let ci = 0; ci < 3; ci++) {
  console.log(`\n--- CARD ${ci + 1} (ty, op, vTop) ---`);
  let prev = null;
  for (const r of rows) { const c = r.s[ci]; const key = c.ty + '|' + c.op; if (key !== prev) { console.log(`  y=${r.y} ty=${c.ty} op=${c.op} vtop=${c.top}`); prev = key; } }
}
await b.close();
