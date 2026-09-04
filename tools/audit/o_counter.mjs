// Robustly find MY O counter centre: render the O glyph clean (light-on-dark, nothing else),
// then per row find the dark run enclosed between the two light strokes; centroid = counter centre.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const b = await chromium.launch({ headless: true });
const DSF = 3;
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
await p.waitForTimeout(1500);
await p.mouse.move(3, 870); await p.waitForTimeout(250);
const geo = await p.evaluate(() => {
  document.querySelectorAll('.hero__portrait,.hero__face,.hero__fade,.hero__graffiti,.hero__aurora,.hero__accent,.hero__o-dot,.badge,.hero__o-wa,.hero__o-fill,.hero__role-shift,.hero__roles-m,.hero__product').forEach((e) => (e.style.display = 'none'));
  const sec = document.querySelector('.hero'); if (sec) sec.style.background = '#000';
  document.body.style.background = '#000';
  const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2, fs: parseFloat(getComputedStyle(o).fontSize) };
});
await p.waitForTimeout(150);
// crop a bit larger than the box to be safe
const pad = 40;
const clip = { x: geo.x - pad, y: geo.y - pad, width: geo.w + pad * 2, height: geo.h + pad * 2 };
const buf = await p.screenshot({ clip });
await b.close();
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const lum = (x, y) => { const i = (y * W + x) * C; return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };
const isLight = (x, y) => lum(x, y) > 120;
// per-row: find light runs; counter = dark pixels between first light run end and last light run start
let sx = 0, sy = 0, n = 0, minY = 1e9, maxY = -1, minX = 1e9, maxX = -1;
for (let y = 0; y < H; y++) {
  // light run starts/ends
  let runs = [], inRun = false, s = 0;
  for (let x = 0; x < W; x++) { const L = isLight(x, y); if (L && !inRun) { inRun = true; s = x; } else if (!L && inRun) { inRun = false; runs.push([s, x - 1]); } }
  if (inRun) runs.push([s, W - 1]);
  if (runs.length < 2) continue; // need left+right stroke
  const leftStrokeEnd = runs[0][1];
  const rightStrokeStart = runs[runs.length - 1][0];
  if (rightStrokeStart - leftStrokeEnd < 6) continue;
  for (let x = leftStrokeEnd + 1; x < rightStrokeStart; x++) {
    if (!isLight(x, y)) { sx += x; sy += y; n++; if (y < minY) minY = y; if (y > maxY) maxY = y; if (x < minX) minX = x; if (x > maxX) maxX = x; }
  }
}
const counterCx = sx / n, counterCy = sy / n;
const boxCx = (geo.cx - clip.x) * DSF, boxCy = (geo.cy - clip.y) * DSF;
const em = (v) => +(v / DSF / geo.fs).toFixed(4);
console.log(JSON.stringify({
  fs: geo.fs,
  counterSize_css: { w: +((maxX - minX) / DSF).toFixed(1), h: +((maxY - minY) / DSF).toFixed(1) }, counterAreaPx: n,
  counter_off_em: { dx: em(counterCx - boxCx), dy: em(counterCy - boxCy) },
}, null, 2));
