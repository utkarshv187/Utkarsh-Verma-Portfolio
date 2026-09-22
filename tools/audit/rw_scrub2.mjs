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

const rows = [];
for (let y = 2200; y <= 5600; y += 50) {
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(110);
  const s = await p.evaluate(() => ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'].map((u) => {
    const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(u) && x.getBoundingClientRect().width > 0);
    if (!a) return null; const cs = getComputedStyle(a); const m = cs.transform; let ty = 0; if (m && m !== 'none') { const q = m.match(/matrix\(([^)]+)\)/); if (q) ty = Math.round(parseFloat(q[1].split(',')[5])); } return { ty, op: +(+cs.opacity).toFixed(2), top: Math.round(a.getBoundingClientRect().top) };
  }));
  rows.push({ y, s });
}
writeFileSync(join(OUT, 'scrub2.json'), JSON.stringify(rows));
for (let ci = 0; ci < 3; ci++) {
  console.log(`\n--- CARD ${ci + 1}  (pin@${[2581, 3308, 4075][ci]}) ---`);
  let prev = null;
  for (const r of rows) { const c = r.s[ci]; if (!c) continue; const k = c.ty + '|' + c.op; if (k !== prev) { console.log(`  y=${r.y}  ty=${String(c.ty).padStart(4)}  op=${c.op}  vtop=${c.top}`); prev = k; } }
}
await b.close();
