// Rigorous O ring diff. For LIVE and MINE:
//  - ring circle centre+radius via the path's getScreenCTM (exact, spin-invariant)
//  - O counter centre+radius via pixel detection on a TIGHT isolated crop of just the O glyph
//  - concentricity offset (ring centre - counter centre) and ring/counter radius ratio
//  - a counter-centred crop of the real O+ring, for side-by-side + overlay
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

async function analyze(url, which) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200); await p.mouse.move(3, 860); await p.waitForTimeout(300);

  // ring circle centre/radius in screen px via getScreenCTM (exact), + O glyph rect
  const info = await p.evaluate(() => {
    const svg = [...document.querySelectorAll('svg')].find((s) => { const t = s.querySelector('textPath'); return t && /TOGETHER/i.test(t.textContent); });
    const path = svg.querySelector('path');
    const m = path.getScreenCTM();
    const P = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const q = pt.matrixTransform(m); return { x: q.x, y: q.y }; };
    const c = P(50, 50), left = P(0, 50), top = P(50, 0);
    const rX = Math.hypot(left.x - c.x, left.y - c.y), rY = Math.hypot(top.x - c.x, top.y - c.y);
    const oEl = document.querySelector('.hero__o') || [...document.querySelectorAll('span,div,p,h1,a')].find((e) => e.children.length === 0 && e.textContent.trim() === 'O');
    const r = oEl.getBoundingClientRect();
    return {
      ring: { cx: c.x, cy: c.y, rX, rY },
      viewBox: svg.getAttribute('viewBox'), pathD: path.getAttribute('d'),
      fontSize: getComputedStyle(svg.querySelector('textPath')).fontSize,
      letterSpacing: getComputedStyle(svg.querySelector('textPath')).letterSpacing,
      startOffset: svg.querySelector('textPath').getAttribute('startOffset'),
      oRect: { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 },
      oFS: parseFloat(getComputedStyle(oEl).fontSize),
    };
  });

  // real O+ring crop, counter-centred later; first grab a generous crop around the O centre
  const CROP = 300; // css
  const cropAt = async (cx, cy) => p.screenshot({ clip: { x: cx - CROP / 2, y: cy - CROP / 2, width: CROP, height: CROP } });

  // isolate JUST the O glyph on solid dark, tight crop, to detect the counter cleanly
  await p.evaluate((w) => {
    document.querySelectorAll('img, canvas, video, picture').forEach((e) => { if (e.getBoundingClientRect().height > 120) e.style.visibility = 'hidden'; });
    const svg = [...document.querySelectorAll('svg')].find((s) => { const t = s.querySelector('textPath'); return t && /TOGETHER/i.test(t.textContent); });
    if (svg) svg.style.visibility = 'hidden';
    if (w === 'mine') {
      document.querySelectorAll('.hero__aurora,.hero__accent,.hero__fade,.hero__o-dot,.hero__wa-layer,.hero__product,.hero__role-shift,.hero__roles-m').forEach((e) => (e.style.visibility = 'hidden'));
      const s = document.querySelector('.hero'); if (s) s.style.background = '#0c0c1f';
    }
    const bg = document.createElement('div'); bg.style.cssText = 'position:fixed;inset:0;background:#0c0c1f;z-index:-1'; document.body.prepend(bg);
    document.body.style.background = '#0c0c1f';
  }, which);
  await p.waitForTimeout(200);

  // tight crop around JUST the O glyph (narrow enough to exclude neighbouring letters R/D on live)
  const glyphSize = info.oFS * 0.72;
  const tight = { x: info.oRect.cx - glyphSize / 2, y: info.oRect.cy - glyphSize * 0.62, width: glyphSize, height: glyphSize * 1.24 };
  const oBuf = await p.screenshot({ clip: tight });
  await ctx.close();

  // detect counter (enclosed dark run per row) in oBuf; counter centre relative to tight crop -> page px
  const { data, iinfo } = await (async () => { const o = await sharp(oBuf).raw().toBuffer({ resolveWithObject: true }); return { data: o.data, iinfo: o.info }; })();
  const W = iinfo.width, H = iinfo.height, C = iinfo.channels;
  const lum = (x, y) => { const i = (y * W + x) * C; return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };
  const isLight = (x, y) => lum(x, y) > 120;
  let sx = 0, sy = 0, n = 0, minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
  for (let y = 0; y < H; y++) {
    let runs = [], inRun = false, s = 0;
    for (let x = 0; x < W; x++) { const L = isLight(x, y); if (L && !inRun) { inRun = true; s = x; } else if (!L && inRun) { inRun = false; runs.push([s, x - 1]); } }
    if (inRun) runs.push([s, W - 1]);
    if (runs.length < 2) continue;
    const le = runs[0][1], rs = runs[runs.length - 1][0];
    if (rs - le < 8 || rs - le > W * 0.85) continue;
    for (let x = le + 1; x < rs; x++) if (!isLight(x, y)) { sx += x; sy += y; n++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const counterPage = n ? { cx: tight.x + (sx / n) / DSF, cy: tight.y + (sy / n) / DSF, rx: (maxX - minX) / 2 / DSF, ry: (maxY - minY) / 2 / DSF } : null;
  return { which, info, counterPage, cropAt: null, url, CROP };
}

// analyze both (measurements), then re-open to grab real counter-centred crops
const liveA = await analyze('https://uxuiuv.framer.website/', 'live');
const mineA = await analyze('http://localhost:5199/', 'mine');

async function realCrop(url, counter, CROP) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200); await p.mouse.move(3, 860); await p.waitForTimeout(300);
  const buf = await p.screenshot({ clip: { x: counter.cx - CROP / 2, y: counter.cy - CROP / 2, width: CROP, height: CROP } });
  await ctx.close(); return buf;
}
// centre both real crops on the exact RING centre (from CTM) — clean for both sites
const liveCrop = await realCrop('https://uxuiuv.framer.website/', liveA.info.ring, liveA.CROP);
const mineCrop = await realCrop('http://localhost:5199/', mineA.info.ring, mineA.CROP);
await b.close();

function report(A) {
  if (!A.counterPage) return { which: A.which, err: 'no counter' };
  const ring = A.info.ring, c = A.counterPage;
  const cR = (c.rx + c.ry) / 2, rR = (ring.rX + ring.rY) / 2;
  return {
    which: A.which, viewBox: A.info.viewBox, pathD: A.info.pathD,
    fontSize: A.info.fontSize, letterSpacing: A.info.letterSpacing, startOffset: A.info.startOffset, oFontSize: Math.round(A.info.oFS),
    ringRadius_css: +rR.toFixed(1), ringIsCircle: Math.abs(ring.rX - ring.rY) < 1.5,
    counterRadius_css: { rx: +c.rx.toFixed(1), ry: +c.ry.toFixed(1) },
    ratio_ring_over_counter: +(rR / cR).toFixed(3),
    concentricity_offset_css: { dx: +(ring.cx - c.cx).toFixed(1), dy: +(ring.cy - c.cy).toFixed(1) },
  };
}
console.log('LIVE', JSON.stringify(report(liveA), null, 2));
console.log('MINE', JSON.stringify(report(mineA), null, 2));

// side-by-side + overlay
if (liveCrop && mineCrop) {
  const px = liveA.CROP * DSF;
  const m = await sharp(mineCrop).resize(px, px).toBuffer();
  const l = await sharp(liveCrop).resize(px, px).toBuffer();
  await sharp({ create: { width: px * 2 + 20, height: px, channels: 3, background: '#111' } })
    .composite([{ input: m, left: 0, top: 0 }, { input: l, left: px + 20, top: 0 }]).png().toFile(join(OUT, 'sidebyside.png'));
  // overlay: live as base, mine tinted red at 55% on top
  const mineTint = await sharp(mineCrop).resize(px, px).ensureAlpha().tint({ r: 255, g: 40, b: 40 }).composite([{ input: Buffer.from([255, 255, 255, 140]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' }]).toBuffer();
  await sharp(liveCrop).resize(px, px).composite([{ input: mineTint, blend: 'over' }]).png().toFile(join(OUT, 'overlay.png'));
  console.log('wrote sidebyside.png (mine|live) and overlay.png (live base, mine tinted red)');
}
