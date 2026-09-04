import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'zfinal');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });

// ---------- 1) default full hero pair @1440 (O behind portrait) ----------
async function full(url) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200); await p.mouse.move(3, 860); await p.waitForTimeout(300);
  const buf = await p.screenshot({ clip: { x: 0, y: 60, width: 760, height: 480 } });
  await ctx.close(); return buf;
}
const mineFull = await full('http://localhost:5199/');
const liveFull = await full('https://uxuiuv.framer.website/');
const fw = 600;
const mf = await sharp(mineFull).resize(fw).toBuffer(), lf = await sharp(liveFull).resize(fw).toBuffer();
const fh = (await sharp(mf).metadata()).height;
await sharp({ create: { width: fw * 2 + 16, height: fh, channels: 3, background: '#222' } })
  .composite([{ input: mf, left: 0, top: 0 }, { input: lf, left: fw + 16, top: 0 }]).png().toFile(join(OUT, 'default_pair.png'));

// ---------- 2) mine hover @1440 — whatsapp+ripple in FRONT of portrait ----------
async function mineHover(w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(1400);
  const g = await p.evaluate(() => { const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect(); const fs = parseFloat(getComputedStyle(o).fontSize); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, fs }; });
  // hover the O (portrait is pointer-events:none so anywhere on the O triggers)
  await p.mouse.move(g.cx - 30, g.cy); await p.waitForTimeout(200); await p.mouse.move(g.cx, g.cy); await p.waitForTimeout(1100);
  const S = 300;
  const cyCounter = g.cy - 0.0165 * g.fs;
  const buf = await p.screenshot({ clip: { x: g.cx - S / 2, y: cyCounter - S / 2, width: S, height: S } });
  await ctx.close();
  return { buf, fs: g.fs };
}
const h1440 = await mineHover(1440);
await sharp(h1440.buf).toFile(join(OUT, 'mine_hover_1440.png'));

// ---------- 3) centering: mine hover across widths, guide cross at counter centre ----------
const widths = [1920, 1440, 1280, 1024];
const tiles = [];
for (const w of widths) {
  const h = await mineHover(w);
  const px = 300 * 3, c = px / 2;
  const guide = Buffer.from(`<svg width="${px}" height="${px}" xmlns="http://www.w3.org/2000/svg"><line x1="${c}" y1="${c - 22}" x2="${c}" y2="${c + 22}" stroke="#ffd400" stroke-width="2"/><line x1="${c - 22}" y1="${c}" x2="${c + 22}" y2="${c}" stroke="#ffd400" stroke-width="2"/></svg>`);
  const tile = await sharp(h.buf).resize(300, 300).composite([{ input: await sharp(guide).resize(300, 300).toBuffer() }]).png().toBuffer();
  tiles.push(tile);
}
const cell = 300, gap = 6;
await sharp({ create: { width: widths.length * cell + (widths.length + 1) * gap, height: cell + gap * 2, channels: 3, background: '#222' } })
  .composite(tiles.map((t, i) => ({ input: t, left: gap + i * (cell + gap), top: gap }))).png().toFile(join(OUT, 'hover_widths.png'));

await b.close();
console.log('wrote default_pair.png, mine_hover_1440.png, hover_widths.png');
