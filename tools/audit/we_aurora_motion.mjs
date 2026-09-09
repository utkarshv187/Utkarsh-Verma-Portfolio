import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1800);
await p.evaluate(() => { window.scrollTo(0, 0); [...document.querySelectorAll('img, h1, [data-framer-name="Intro"] p, [data-framer-name="Intro"] a')].forEach((e) => { e.style.visibility = 'hidden'; }); });
await p.waitForTimeout(300);

// downscale factor for cheap centroid
const SW = 240, SH = 117; // ~1440x700 scaled
async function frame() {
  const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 700 } });
  const { data, info } = await sharp(buf).resize(SW, SH).raw().toBuffer({ resolveWithObject: true });
  let sx = 0, sy = 0, n = 0, brightSum = 0, maxB = 0, mx = 0, my = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels; const R = data[i], G = data[i + 1], B = data[i + 2];
    const purple = R > 35 && B > 55 && G < R; // purple-ish
    if (purple) { sx += x; sy += y; n++; brightSum += (R + B); }
    const b2 = R + B - G; if (b2 > maxB) { maxB = b2; mx = x; my = y; }
  }
  return { cx: n ? Math.round(sx / n / SW * 1440) : null, cy: n ? Math.round(sy / n / SH * 700) : null, area: n, peakX: Math.round(mx / SW * 1440), peakY: Math.round(my / SH * 700), peak: maxB };
}
const frames = [];
const T0 = Date.now();
for (let i = 0; i < 12; i++) {
  const f = await frame();
  f.t = Math.round((Date.now() - T0) / 100) / 10;
  frames.push(f);
  console.log('t=' + String(f.t).padStart(4) + 's  glowCentroid(' + f.cx + ',' + f.cy + ')  area=' + f.area + '  peak@(' + f.peakX + ',' + f.peakY + ')');
  if (i === 0 || i === 6 || i === 12) await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 700 } })).png().toFile(join(OUT, 'aurora_live_t' + i + '.png'));
  await p.waitForTimeout(1400);
}
await b.close();
