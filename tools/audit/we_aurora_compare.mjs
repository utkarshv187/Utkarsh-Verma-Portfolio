import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const NF = 6, DT = 2200, W = 1440, H = 620;

async function grab(url, mine) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1800);
  await p.evaluate((isMine) => {
    window.scrollTo(0, 0);
    const sels = isMine
      ? ['.hero__portrait', '.hero__product', '.hero__o', '.hero__role-shift', '.hero__graffiti', '.hero__face']
      : ['img', 'h1', '[data-framer-name="Intro"] p', '[data-framer-name="Intro"] a'];
    sels.forEach((s) => document.querySelectorAll(s).forEach((e) => { e.style.visibility = 'hidden'; }));
  }, mine);
  await p.waitForTimeout(300);
  const shots = [], cents = [];
  for (let i = 0; i < NF; i++) {
    const buf = await p.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
    shots.push(buf);
    const { data, info } = await sharp(buf).resize(240, 103).raw().toBuffer({ resolveWithObject: true });
    let sx = 0, sy = 0, n = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) { const k = (y * info.width + x) * info.channels; const R = data[k], G = data[k + 1], B = data[k + 2]; if (R > 35 && B > 55 && G < R) { sx += x; sy += y; n++; } }
    cents.push({ cx: n ? Math.round(sx / n / 240 * W) : null, area: n });
    if (i < NF - 1) await p.waitForTimeout(DT);
  }
  await ctx.close();
  const xs = cents.filter((c) => c.cx != null).map((c) => c.cx);
  const areas = cents.map((c) => c.area);
  console.log((mine ? 'MINE' : 'LIVE') + ' centroid-x:', JSON.stringify(cents.map((c) => c.cx)), ' xRange:', Math.min(...xs) + '-' + Math.max(...xs), ' areaRange:', Math.min(...areas) + '-' + Math.max(...areas));
  return shots;
}
const mine = await grab('http://localhost:5199/', true);
const live = await grab('https://uxuiuv.framer.website/', false);
// montage: row of mine, row of live
const w = Math.round(W * 0.22), gap = 4;
async function row(shots) { const bufs = []; for (const s of shots) bufs.push(await sharp(s).resize(w).toBuffer()); const h = (await sharp(bufs[0]).metadata()).height; const row = await sharp({ create: { width: (w + gap) * NF - gap, height: h, channels: 3, background: '#111' } }).composite(bufs.map((buf, i) => ({ input: buf, left: i * (w + gap), top: 0 }))).png().toBuffer(); return { row, h, w: (w + gap) * NF - gap }; }
const rM = await row(mine), rL = await row(live);
await sharp({ create: { width: rM.w, height: rM.h * 2 + 12, channels: 3, background: '#000' } })
  .composite([{ input: rM.row, left: 0, top: 0 }, { input: rL.row, left: 0, top: rM.h + 12 }]).png().toFile(join(OUT, 'aurora_compare.png'));
console.log('wrote aurora_compare.png (top row MINE across ~11s, bottom row LIVE)');
await b.close();
