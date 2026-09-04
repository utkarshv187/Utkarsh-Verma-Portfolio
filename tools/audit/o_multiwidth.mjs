// Verify O ring/icon centring holds across widths: crop the O region (default + hover) at each width.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'omw');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const widths = [1920, 1440, 1280, 1024];
const crops = [];
for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(1000);
  const box = await p.evaluate(() => {
    const o = document.querySelector('.hero__o');
    const r = o.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  // crop a square around the O, generous
  const pad = box.w * 0.9;
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const size = box.w + pad;
  const clip = { x: Math.max(0, cx - size / 2), y: Math.max(0, cy - size / 2), width: size, height: size };
  await p.mouse.move(3, 860); await p.waitForTimeout(300);
  const def = join(OUT, `o_${w}_default.png`);
  await p.screenshot({ path: def, clip });
  // hover the O (left part of counter, avoid portrait)
  await p.mouse.move(box.x + box.w * 0.3, box.y + box.h * 0.42); await p.waitForTimeout(900);
  const hov = join(OUT, `o_${w}_hover.png`);
  await p.screenshot({ path: hov, clip });
  crops.push({ w, def, hov });
  await ctx.close();
}
await b.close();
// build a grid: rows = widths, col1 default, col2 hover
const cell = 300;
const rows = [];
for (const c of crops) {
  const d = await sharp(c.def).resize(cell, cell, { fit: 'contain', background: '#111' }).toBuffer();
  const h = await sharp(c.hov).resize(cell, cell, { fit: 'contain', background: '#111' }).toBuffer();
  rows.push({ d, h, w: c.w });
}
const gap = 8;
const W = cell * 2 + gap * 3;
const H = rows.length * (cell + gap) + gap;
const comp = [];
rows.forEach((r, i) => {
  comp.push({ input: r.d, left: gap, top: gap + i * (cell + gap) });
  comp.push({ input: r.h, left: gap * 2 + cell, top: gap + i * (cell + gap) });
});
await sharp({ create: { width: W, height: H, channels: 3, background: '#333' } }).composite(comp).png().toFile(join(OUT, 'o_grid.png'));
console.log('wrote o_grid.png (rows:', widths.join(','), '| col1 default, col2 hover)');
