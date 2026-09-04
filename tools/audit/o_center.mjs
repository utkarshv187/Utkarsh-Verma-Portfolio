// Measure my rendered O's counter centre vs the .hero__o box centre (in em) to set --o-cx/--o-cy.
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
await p.mouse.move(3, 870);
await p.waitForTimeout(300);
const info = await p.evaluate(() => {
  const o = document.querySelector('.hero__o');
  const r = o.getBoundingClientRect();
  const fs = parseFloat(getComputedStyle(o).fontSize);
  // hide the badge + dot so only the O glyph remains, for clean counter detection
  return { x: r.x, y: r.y, w: r.width, h: r.height, fs };
});
// hide ring/dot/whatsapp AND everything behind the O, and set a uniform dark backdrop,
// so the O glyph is clean light-on-dark and the counter is uniformly dark for detection.
await p.evaluate(() => {
  document.querySelectorAll('.badge, .hero__o-dot, .hero__o-wa, .hero__o-fill').forEach((e) => (e.style.visibility = 'hidden'));
  document.querySelectorAll('.hero__portrait, .hero__face, .hero__fade, .hero__aurora, .hero__graffiti, .hero__role-shift, .hero__roles-m').forEach((e) => (e.style.display = 'none'));
  const sec = document.querySelector('.hero'); if (sec) sec.style.background = '#0c0c1f';
});
await p.waitForTimeout(150);
const clip = { x: info.x, y: info.y, width: info.w, height: info.h };
const buf = await p.screenshot({ clip });
await b.close();

const { data, info: im } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
const W = im.width, H = im.height, C = im.channels;
const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
const isLight = (r, g, bl) => r > 170 && g > 165 && bl > 190; // the O glyph gradient
const boxCx = W / 2, boxCy = H / 2;
// ray from box centre: first light pixel = counter->stroke inner edge in that direction
function firstLight(dx, dy) {
  for (let t = 2; t < Math.max(W, H); t++) {
    const x = Math.round(boxCx + dx * t), y = Math.round(boxCy + dy * t);
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    const [r, g, bl] = px(x, y);
    if (isLight(r, g, bl)) return t;
  }
  return null;
}
const L = firstLight(-1, 0), R = firstLight(1, 0), U = firstLight(0, -1), D = firstLight(0, 1);
const counterCx = boxCx + (R - L) / 2;
const counterCy = boxCy + (D - U) / 2;
const dxEm = (counterCx - boxCx) / DSF / info.fs;
const dyEm = (counterCy - boxCy) / DSF / info.fs;
console.log(JSON.stringify({
  fontSize_css: info.fs,
  innerEdge_css: { L: (L / DSF).toFixed(1), R: (R / DSF).toFixed(1), U: (U / DSF).toFixed(1), D: (D / DSF).toFixed(1) },
  counterR_css: { avgX: ((L + R) / 2 / DSF).toFixed(1), avgY: ((U + D) / 2 / DSF).toFixed(1) },
  offset_em_needed: { dx: +dxEm.toFixed(4), dy: +dyEm.toFixed(4) },
}, null, 2));
