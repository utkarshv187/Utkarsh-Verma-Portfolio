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
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);

// canvas details
const canv = await p.evaluate(() => {
  const c = [...document.querySelectorAll('canvas')].map((cv) => { const r = cv.getBoundingClientRect(); const cs = getComputedStyle(cv); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top), z: cs.zIndex, opacity: cs.opacity, pos: cs.position, filter: cs.filter, mix: cs.mixBlendMode, cssW: cv.width, cssH: cv.height }; });
  return c;
});
console.log('canvas:', JSON.stringify(canv));

// hide the portrait + text so we can sample the pure background, then screenshot
await p.evaluate(() => {
  [...document.querySelectorAll('img, h1, [data-framer-name="Intro"] p')].forEach((e) => { e.style.visibility = 'hidden'; });
});
await p.waitForTimeout(200);
const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 700 } });
await sharp(buf).png().toFile(join(OUT, 'aurora_live_bg.png'));
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => { const i = (y * info.width + x) * info.channels; return `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`; };
console.log('samples (x,y => color):');
const pts = [[720, 30, 'top-center'], [720, 120, 'upper-center'], [720, 300, 'mid-center'], [300, 150, 'upper-left'], [1140, 150, 'upper-right'], [100, 500, 'lower-left'], [1340, 500, 'lower-right'], [720, 650, 'bottom-center']];
for (const [x, y, label] of pts) console.log('  ', label.padEnd(14), px(x, y));
await b.close();
