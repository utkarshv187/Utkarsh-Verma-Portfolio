// Verify my O ring vs live: crop both at DSF3 centered on the O, measure ring geometry,
// and check centring across widths. Live values already known; this focuses on MINE + a 1440 pair.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'overify');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });

async function grabMine(w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.mouse.move(3, 870);
  await p.waitForTimeout(300);
  const geo = await p.evaluate(() => {
    const o = document.querySelector('.hero__o');
    const r = o.getBoundingClientRect();
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width, h: r.height };
  });
  const size = 340;
  const clip = { x: geo.cx - size / 2, y: geo.cy - size / 2, width: size, height: size };
  const file = join(OUT, `mine_o_${w}.png`);
  await p.screenshot({ path: file, clip });
  await ctx.close();
  return { file, geo };
}

const widths = [1920, 1440, 1280, 1024];
const results = {};
for (const w of widths) results[w] = await grabMine(w);
await b.close();

// measure ring geometry from mine_o_1440 (DSF3)
async function measure(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
  const CX = W / 2, CY = H / 2;
  const isText = (r, g, b) => Math.abs(r - 108) < 48 && Math.abs(g - 55) < 48 && Math.abs(b - 178) < 55 && b > r && r > g;
  const isWhite = (r, g, b) => r > 195 && g > 190 && b > 205;
  let tr = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, bl] = px(x, y); if (isText(r, g, bl)) { const d = Math.hypot(x - CX, y - CY); if (d < W * 0.5) tr.push(d); } }
  tr.sort((a, b2) => a - b2);
  const q = (p) => tr.length ? tr[Math.floor(p * tr.length)] : 0;
  const counterEdge = (dx, dy) => { for (let t = 3; t < W * 0.5; t++) { const [r, g, bl] = px(Math.round(CX + dx * t), Math.round(CY + dy * t)); if (isWhite(r, g, bl)) return t; } return null; };
  return {
    textInner_css: +(q(0.05) / 3).toFixed(1), textOuter_css: +(q(0.95) / 3).toFixed(1),
    counterR_css: { L: (counterEdge(-1, 0) / 3).toFixed(1), R: (counterEdge(1, 0) / 3).toFixed(1), U: (counterEdge(0, -1) / 3).toFixed(1), D: (counterEdge(0, 1) / 3).toFixed(1) },
  };
}
const mineMeasure = await measure(results[1440].file);
console.log('MINE 1440 ring:', JSON.stringify(mineMeasure));
console.log('LIVE 1440 ring: textInner~69.2 textOuter~86.4 counterR L49.3 R49.0 U46.7 D47.0');

// build a 1440 side-by-side: mine (left) vs live (right)
const livePath = join(__dirname, 'out', 'hero', 'oref', 'live_o_default.png');
const cell = 480;
const mineR = await sharp(results[1440].file).resize(cell, cell).toBuffer();
const liveR = await sharp(livePath).resize(cell, cell).toBuffer();
await sharp({ create: { width: cell * 2 + 16, height: cell, channels: 3, background: '#222' } })
  .composite([{ input: mineR, left: 0, top: 0 }, { input: liveR, left: cell + 16, top: 0 }]).png()
  .toFile(join(OUT, 'cmp_1440.png'));

// build a width grid of MINE (centring check)
const gcell = 300;
const comp = [];
widths.forEach((w, i) => { comp.push({ input: null }); });
const tiles = [];
for (let i = 0; i < widths.length; i++) {
  tiles.push(await sharp(results[widths[i]].file).resize(gcell, gcell).toBuffer());
}
const gap = 6;
const gridW = widths.length * gcell + (widths.length + 1) * gap;
const grid = tiles.map((t, i) => ({ input: t, left: gap + i * (gcell + gap), top: gap }));
await sharp({ create: { width: gridW, height: gcell + gap * 2, channels: 3, background: '#222' } })
  .composite(grid).png().toFile(join(OUT, 'mine_widths.png'));
console.log('wrote cmp_1440.png (mine|live) and mine_widths.png (1920/1440/1280/1024)');
