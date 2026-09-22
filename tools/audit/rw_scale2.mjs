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
await p.evaluate(async () => { const s = innerHeight * 0.5; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });

const SIGS = ["Spinny's car auction", 'Introduced a', 'Established the Spinny', 'Other small'];
const rows = [];
for (let y = 2400; y <= 6600; y += 80) {
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(90);
  const s = await p.evaluate((sigs) => sigs.map((sig) => {
    // the visible sticky card whose text contains sig
    const el = [...document.querySelectorAll('a,div')].find((e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.position === 'sticky' && r.width > 1000 && r.width < 1300 && r.height > 400 && r.height < 800 && (e.innerText || '').includes(sig); });
    if (!el) return null;
    const m = getComputedStyle(el).transform; let sc = 1, ty = 0;
    if (m && m !== 'none') { const q = m.match(/matrix\(([^)]+)\)/); if (q) { const a = q[1].split(',').map(parseFloat); sc = +a[0].toFixed(3); ty = Math.round(a[5]); } }
    const r = el.getBoundingClientRect();
    return { sc, ty, top: Math.round(r.top), h: Math.round(r.height) };
  }), SIGS);
  rows.push({ y, s });
}
writeFileSync(join(OUT, 'scale2.json'), JSON.stringify(rows));
for (let ci = 0; ci < 4; ci++) {
  console.log(`\n--- CARD ${ci + 1} "${SIGS[ci]}" (scale, ty, vtop, visH) ---`);
  let prev = null;
  for (const r of rows) { const c = r.s[ci]; if (!c) continue; const k = c.sc + '|' + c.ty; if (k !== prev) { console.log(`  y=${String(r.y).padStart(4)}  scale=${c.sc}  ty=${String(c.ty).padStart(5)}  vtop=${String(c.top).padStart(5)}  visH=${c.h}`); prev = k; } }
}
await b.close();
