// Measure, on MY build, the ring-text centre and the O counter centre relative to the .hero__o
// box centre, so I can set --o-cx/--o-cy to make them concentric.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless: true });
const DSF = 3;
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
await p.waitForTimeout(1500);
await p.mouse.move(3, 870); await p.waitForTimeout(300);
const geo = await p.evaluate(() => {
  document.querySelectorAll('.hero__portrait, .hero__face, .hero__fade, .hero__graffiti, .hero__aurora, .hero__accent, .hero__o-dot').forEach((e) => (e.style.display = 'none'));
  const sec = document.querySelector('.hero'); if (sec) { sec.style.background = '#0c0c1f'; }
  document.body.style.background = '#0c0c1f';
  const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, fs: parseFloat(getComputedStyle(o).fontSize) };
});
await p.waitForTimeout(150);
const size = 320; // css
const clip = { x: geo.cx - size / 2, y: geo.cy - size / 2, width: size, height: size };
const buf = await p.screenshot({ clip });
await b.close();

const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
const isText = (r, g, bl) => Math.abs(r - 108) < 46 && Math.abs(g - 55) < 46 && Math.abs(bl - 178) < 52 && bl > r && r > g;
const isLight = (r, g, bl) => r > 175 && g > 170 && bl > 195;
// ring centroid (purple text)
let tx = 0, ty = 0, tn = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, bl] = px(x, y); if (isText(r, g, bl)) { tx += x; ty += y; tn++; } }
const ringCx = tx / tn, ringCy = ty / tn;
// ring text radial distance from box centre (= circle centre)
const bcx0 = W / 2, bcy0 = H / 2;
let rad = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, bl] = px(x, y); if (isText(r, g, bl)) rad.push(Math.hypot(x - bcx0, y - bcy0)); }
rad.sort((a, b2) => a - b2);
const rq = (pp) => +(rad[Math.floor(pp * rad.length)] / DSF).toFixed(1);
const ringRadCss = { inner: rq(0.05), med: rq(0.5), outer: rq(0.95) };
// counter centre via 4 rays from image centre to first light (O stroke inner edge)
const bcx = W / 2, bcy = H / 2;
const fl = (dx, dy) => { for (let t = 2; t < W / 2; t++) { const x = Math.round(bcx + dx * t), y = Math.round(bcy + dy * t); const [r, g, bl] = px(x, y); if (isLight(r, g, bl)) return t; } return null; };
const L = fl(-1, 0), R = fl(1, 0), U = fl(0, -1), D = fl(0, 1);
const counterCx = bcx + (R - L) / 2, counterCy = bcy + (D - U) / 2;
const em = (v) => +(v / DSF / geo.fs).toFixed(4);
console.log(JSON.stringify({
  fs: geo.fs,
  ringRad_css: ringRadCss,
  liveRad_css: { inner: 69.2, outer: 86.4 },
  ring_off_em: { dx: em(ringCx - bcx), dy: em(ringCy - bcy) },
  counter_off_em: { dx: em(counterCx - bcx), dy: em(counterCy - bcy) },
  counter_innerR_css: { L: (L / DSF).toFixed(1), R: (R / DSF).toFixed(1), U: (U / DSF).toFixed(1), D: (D / DSF).toFixed(1) },
  // to make ring land on counter, badge needs this extra offset (counter - ring):
  needed_badge_shift_em: { dx: em(counterCx - ringCx), dy: em(counterCy - ringCy) },
}, null, 2));
