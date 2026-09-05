// Pixel-only truth: isolate mine's O + ring, detect counter centre (dark hole) and ring centre
// (purple text), compare. No getScreenCTM (unreliable with ancestor CSS transforms).
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
await p.waitForTimeout(1400); await p.mouse.move(3, 860); await p.waitForTimeout(200);
const geo = await p.evaluate(() => {
  document.querySelectorAll('.hero__portrait,.hero__face,.hero__fade,.hero__aurora,.hero__accent,.hero__o-dot,.hero__wa-layer,.hero__product,.hero__role-shift,.hero__roles-m').forEach((e) => (e.style.visibility = 'hidden'));
  const s = document.querySelector('.hero'); if (s) s.style.background = '#0c0c1f'; document.body.style.background = '#0c0c1f';
  const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, fs: parseFloat(getComputedStyle(o).fontSize) };
});
await p.waitForTimeout(150);
const pad = 30;
const clip = { x: geo.x - pad, y: geo.y - pad, width: geo.w + pad * 2, height: geo.h + pad * 2 };
const buf = await p.screenshot({ clip });
await b.close();
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
const lum = (x, y) => { const [r, g, bl] = px(x, y); return 0.299 * r + 0.587 * g + 0.114 * bl; };
const isLight = (x, y) => lum(x, y) > 120;
const isPurple = (x, y) => { const [r, g, bl] = px(x, y); return bl > 90 && bl < 210 && r > 55 && r < 165 && g < r - 10 && g < bl - 25; };
// counter: per-row enclosed dark run
let csx = 0, csy = 0, cn = 0;
for (let y = 0; y < H; y++) { let runs = [], inR = false, s = 0; for (let x = 0; x < W; x++) { const L = isLight(x, y); if (L && !inR) { inR = true; s = x; } else if (!L && inR) { inR = false; runs.push([s, x - 1]); } } if (inR) runs.push([s, W - 1]); if (runs.length < 2) continue; const le = runs[0][1], rs = runs[runs.length - 1][0]; if (rs - le < 8 || rs - le > W * 0.85) continue; for (let x = le + 1; x < rs; x++) if (!isLight(x, y)) { csx += x; csy += y; cn++; } }
// ring: purple text centroid
let rsx = 0, rsy = 0, rn = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isPurple(x, y)) { rsx += x; rsy += y; rn++; }
const boxCx = W / 2, boxCy = H / 2; // crop is box + pad, so box centre = crop centre
const em = (v) => +(v / DSF / geo.fs).toFixed(4);
const counter = { cx: csx / cn, cy: csy / cn };
const ring = { cx: rsx / rn, cy: rsy / rn };
console.log(JSON.stringify({
  fs: geo.fs,
  counter_offset_from_boxcentre_em: { dx: em(counter.cx - boxCx), dy: em(counter.cy - boxCy) },
  ring_offset_from_boxcentre_em: { dx: em(ring.cx - boxCx), dy: em(ring.cy - boxCy) },
  ring_minus_counter_px: { dx: +((ring.cx - counter.cx) / DSF).toFixed(1), dy: +((ring.cy - counter.cy) / DSF).toFixed(1) },
  counterPixels: cn, ringPixels: rn,
}, null, 2));
