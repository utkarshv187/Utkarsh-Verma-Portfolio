import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'ofinal');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });

// ---- O counter-centred crops across widths (mine), with guide circles ----
const widths = [1920, 1440, 1280, 1024];
const tiles = [];
for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(1200); await p.mouse.move(3, 860); await p.waitForTimeout(250);
  const g = await p.evaluate(() => { const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect(); const fs = parseFloat(getComputedStyle(o).fontSize); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 - 0.0165 * fs, fs }; });
  const S = Math.round(g.fs * 0.95); // crop ~ O size
  const buf = await p.screenshot({ clip: { x: g.cx - S / 2, y: g.cy - S / 2, width: S, height: S } });
  const cell = 320;
  // guide at r=0.312em (path) scaled: crop is S css -> cell px; radius px = 0.312*fs / S * cell * 2? compute
  const scale = cell / (S * 2); // device px (dsf2) -> cell
  const rPath = 0.312 * g.fs * 2 * scale; // 0.312em in device px * scale
  const rIn = (69 / 282) * g.fs * 2 * scale, rOut = (86 / 282) * g.fs * 2 * scale;
  const c = cell / 2;
  const guide = Buffer.from(`<svg width="${cell}" height="${cell}" xmlns="http://www.w3.org/2000/svg"><circle cx="${c}" cy="${c}" r="${rIn}" fill="none" stroke="#00e5ff" stroke-width="1.5"/><circle cx="${c}" cy="${c}" r="${rOut}" fill="none" stroke="#00e5ff" stroke-width="1.5"/><line x1="${c}" y1="${c - 6}" x2="${c}" y2="${c + 6}" stroke="#ffd400" stroke-width="1.5"/><line x1="${c - 6}" y1="${c}" x2="${c + 6}" y2="${c}" stroke="#ffd400" stroke-width="1.5"/></svg>`);
  const tile = await sharp(buf).resize(cell, cell).composite([{ input: guide }]).png().toBuffer();
  tiles.push(tile);
  await ctx.close();
}
const cell = 320, gap = 6;
const gridW = widths.length * cell + (widths.length + 1) * gap;
await sharp({ create: { width: gridW, height: cell + gap * 2, channels: 3, background: '#222' } })
  .composite(tiles.map((t, i) => ({ input: t, left: gap + i * (cell + gap), top: gap }))).png().toFile(join(OUT, 'o_widths.png'));

// ---- full hero pair at 1440 (default) ----
async function full(url) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200); await p.mouse.move(3, 860); await p.waitForTimeout(300);
  const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 820 } });
  await ctx.close(); return buf;
}
const mineFull = await full('http://localhost:5199/');
const liveFull = await full('https://uxuiuv.framer.website/');
const fw = 720;
const mf = await sharp(mineFull).resize(fw).toBuffer();
const lf = await sharp(liveFull).resize(fw).toBuffer();
const fh = (await sharp(mf).metadata()).height;
await sharp({ create: { width: fw * 2 + 16, height: fh, channels: 3, background: '#222' } })
  .composite([{ input: mf, left: 0, top: 0 }, { input: lf, left: fw + 16, top: 0 }]).png().toFile(join(OUT, 'hero_1440.png'));
await b.close();
console.log('wrote o_widths.png (1920/1440/1280/1024 guides) and hero_1440.png (mine|live)');
