// Confirm mine's ring stays concentric with the counter across widths (dy should be ~0),
// and produce a mobile O side-by-side (mine vs live; neither has the ring on mobile).
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'odiff');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const DSF = 3;

async function mineConcentricity(w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(1300); await p.mouse.move(3, 860); await p.waitForTimeout(200);
  const info = await p.evaluate(() => {
    const svg = document.querySelector('.badge__svg'); const path = svg.querySelector('path');
    const m = path.getScreenCTM(); const P = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const q = pt.matrixTransform(m); return { x: q.x, y: q.y }; };
    const c = P(50, 50); const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect();
    return { ringCx: c.x, ringCy: c.y, oCx: r.x + r.width / 2, oCy: r.y + r.height / 2, oFS: parseFloat(getComputedStyle(o).fontSize) };
  });
  // isolate O, detect counter centre
  await p.evaluate(() => {
    document.querySelectorAll('img,canvas,video,picture').forEach((e) => { if (e.getBoundingClientRect().height > 120) e.style.visibility = 'hidden'; });
    document.querySelectorAll('.hero__aurora,.hero__accent,.hero__fade,.hero__o-dot,.hero__wa-layer,.hero__product,.hero__role-shift,.hero__roles-m,.badge__svg').forEach((e) => (e.style.visibility = 'hidden'));
    const s = document.querySelector('.hero'); if (s) s.style.background = '#0c0c1f'; document.body.style.background = '#0c0c1f';
  });
  await p.waitForTimeout(150);
  const g = info.oFS * 0.72;
  const tight = { x: info.oCx - g / 2, y: info.oCy - g * 0.62, width: g, height: g * 1.24 };
  const buf = await p.screenshot({ clip: tight });
  await ctx.close();
  const { data, info: im } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const W = im.width, H = im.height, C = im.channels;
  const lum = (x, y) => { const i = (y * W + x) * C; return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };
  const isLight = (x, y) => lum(x, y) > 120;
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < H; y++) { let runs = [], inR = false, s = 0; for (let x = 0; x < W; x++) { const L = isLight(x, y); if (L && !inR) { inR = true; s = x; } else if (!L && inR) { inR = false; runs.push([s, x - 1]); } } if (inR) runs.push([s, W - 1]); if (runs.length < 2) continue; const le = runs[0][1], rs = runs[runs.length - 1][0]; if (rs - le < 8 || rs - le > W * 0.85) continue; for (let x = le + 1; x < rs; x++) if (!isLight(x, y)) { sx += x; sy += y; n++; } }
  const counterCx = tight.x + (sx / n) / DSF, counterCy = tight.y + (sy / n) / DSF;
  return { w, dx: +(info.ringCx - counterCx).toFixed(1), dy: +(info.ringCy - counterCy).toFixed(1) };
}
for (const w of [1920, 1440, 1280, 1024]) console.log('MINE concentricity @' + w, JSON.stringify(await mineConcentricity(w)));

// mobile O pair (plain O; no ring on mobile for either)
async function mobileO(url) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200);
  // find the O in PRODUCT
  const box = await p.evaluate(() => {
    const el = [...document.querySelectorAll('h1,div,p,span')].find((e) => e.textContent.replace(/\s+/g, '').toUpperCase().startsWith('PRODUCT') && e.getBoundingClientRect().height > 30 && e.getBoundingClientRect().y < 500);
    const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const buf = await p.screenshot({ clip: { x: box.x, y: box.y - 10, width: box.w, height: box.h + 20 } });
  await ctx.close(); return buf;
}
const mM = await mobileO('http://localhost:5199/');
const lM = await mobileO('https://uxuiuv.framer.website/');
await b.close();
const w = 560;
const a = await sharp(mM).resize(w).toBuffer(), c = await sharp(lM).resize(w).toBuffer();
const h = Math.max((await sharp(a).metadata()).height, (await sharp(c).metadata()).height);
await sharp({ create: { width: w, height: h * 2 + 12, channels: 3, background: '#222' } })
  .composite([{ input: a, left: 0, top: 0 }, { input: c, left: 0, top: h + 12 }]).png().toFile(join(OUT, 'mobile_pair.png'));
console.log('wrote mobile_pair.png (mine top, live bottom)');
