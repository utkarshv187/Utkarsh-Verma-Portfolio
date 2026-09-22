import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(900);
const secTop = await p.evaluate(() => document.querySelector('#recent-work').getBoundingClientRect().top + scrollY);

// smooth incremental scroll so rAF tracks
async function scrollTo(target) { const cur = await p.evaluate(() => scrollY); for (let i = 1; i <= 24; i++) await p.evaluate((y) => scrollTo(0, y), cur + (target - cur) * i / 24); await p.waitForTimeout(120); }

// measure coverage + pan across the card-3 and card-4 windows
const rows = await (async () => {
  const out = [];
  for (let dy = 800; dy <= 3400; dy += 200) {
    await scrollTo(secTop + dy);
    const m = await p.evaluate(() => {
      const meas = (imgSel, boxSel) => { const im = document.querySelector(imgSel), bx = document.querySelector(boxSel); if (!im || !bx) return null; const ir = im.getBoundingClientRect(), br = bx.getBoundingClientRect(); const t = getComputedStyle(im).transform; let ty = 0; if (t && t !== 'none') { const q = t.match(/matrix\(([^)]+)\)/); if (q) ty = Math.round(parseFloat(q[1].split(',')[5])); } return { ty, top: Math.round(ir.top - br.top), bottom: Math.round(ir.bottom - br.top), boxH: Math.round(br.height), covered: (ir.top - br.top <= 0.6 && ir.bottom - br.top >= br.height - 0.6) }; };
      return { fig: meas('.rw-figma img', '.rw-figma'), col: meas('.rw-collage__a', '.rw-collage') };
    });
    out.push({ dy, figPan: m.fig?.ty, figCov: m.fig?.covered, colPan: m.col?.ty, colCov: m.col?.covered });
  }
  return out;
})();
console.log('dy  | figmaPan figCovered | collagePan colCovered');
for (const r of rows) console.log(`${String(r.dy).padStart(4)} | ${String(r.figPan).padStart(5)}   ${r.figCov}        | ${String(r.colPan).padStart(5)}    ${r.colCov}`);

// capture card4 at two pan states (front card) + card3
await scrollTo(secTop + 2450); await p.waitForTimeout(200);
await sharp(await p.screenshot({ clip: { x: 40, y: 60, width: 760, height: 760 } })).resize(380).toFile(join(OUT, 'v_card4_a.png'));
await scrollTo(secTop + 3050); await p.waitForTimeout(200);
await sharp(await p.screenshot({ clip: { x: 40, y: 60, width: 760, height: 760 } })).resize(380).toFile(join(OUT, 'v_card4_b.png'));
// card3 front
await scrollTo(secTop + 1750); await p.waitForTimeout(200);
await sharp(await p.screenshot({ clip: { x: 40, y: 60, width: 760, height: 760 } })).resize(380).toFile(join(OUT, 'v_card3.png'));
console.log('wrote v_card4_a/b + v_card3');
await b.close();
