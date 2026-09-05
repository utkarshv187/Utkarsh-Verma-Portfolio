// Measure LIVE's O hover from pixels: hover the O's exposed left stroke, then find the green
// whatsapp icon (bbox -> size + centre) and test whether the counter fills solid (default vs hover).
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'ohover');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const DSF = 3;
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF, hasTouch: false });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
await p.waitForTimeout(2200);
await p.mouse.move(3, 860); await p.waitForTimeout(300);

const geo = await p.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => { const t = s.querySelector('textPath'); return t && /TOGETHER/i.test(t.textContent); });
  const path = svg.querySelector('path'); const m = path.getScreenCTM();
  const P = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const q = pt.matrixTransform(m); return { x: q.x, y: q.y }; };
  const c = P(50, 50), l = P(0, 50);
  return { cx: c.x, cy: c.y, r: Math.hypot(l.x - c.x, l.y - c.y) };
});

const S = 260; // css crop around ring centre
const clip = { x: geo.cx - S / 2, y: geo.cy - S / 2, width: S, height: S };
async function sample() {
  const buf = await p.screenshot({ clip });
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
  // green whatsapp pixels
  const isGreen = (r, g, bl) => g > 120 && g > r + 40 && g > bl + 20 && r < 160;
  let gx0 = 1e9, gx1 = -1, gy0 = 1e9, gy1 = -1, gn = 0, gsx = 0, gsy = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, bl] = px(x, y); if (isGreen(r, g, bl)) { gn++; gsx += x; gsy += y; if (x < gx0) gx0 = x; if (x > gx1) gx1 = x; if (y < gy0) gy0 = y; if (y > gy1) gy1 = y; } }
  // "fill" test: sample counter interior points (in css offsets from centre, within the counter r~48)
  const cxp = W / 2, cyp = H / 2;
  const at = (ddx, ddy) => px(Math.round(cxp + ddx * DSF), Math.round(cyp + ddy * DSF));
  return {
    buf, green: gn > 30 ? { w: Math.round((gx1 - gx0) / DSF), h: Math.round((gy1 - gy0) / DSF), cdx: +(((gx0 + gx1) / 2 - cxp) / DSF).toFixed(1), cdy: +(((gy0 + gy1) / 2 - cyp) / DSF).toFixed(1) } : null,
    counterPts: { up: at(0, -30), down: at(0, 30), left: at(-30, 0), right: at(30, 0), c: at(0, 0) },
  };
}

const before = await sample();
await sharp(before.buf).png().toFile(join(OUT, 'live_default.png'));

// hover the WhatsApp anchor directly at a left (exposed) offset, forced
let after = null;
try {
  const a = p.locator('a[href*="whatsapp"]').first();
  await a.hover({ position: { x: 90, y: 100 }, force: true });
  await p.waitForTimeout(600);
  after = await sample();
  if (!after.green) { await a.hover({ position: { x: 140, y: 100 }, force: true }); await p.waitForTimeout(600); after = await sample(); }
} catch (e) { console.log('hover err', e.message); }
if (!after) after = await sample();
await sharp(after.buf).png().toFile(join(OUT, 'live_hover.png'));
await p.screenshot({ clip: { x: geo.cx - 160, y: geo.cy - 160, width: 320, height: 320 }, path: join(OUT, 'live_hover_wide.png') });
await b.close();

console.log('ring', { cx: Math.round(geo.cx), cy: Math.round(geo.cy), r: Math.round(geo.r) }, '| counter r~48 (canvas)');
console.log('WHATSAPP green bbox on hover:', JSON.stringify(after.green), '=> size ratio icon/counter(96):', after.green ? (after.green.w / 96).toFixed(2) : 'n/a', 'icon/O(282):', after.green ? (after.green.w / 282).toFixed(3) : 'n/a');
console.log('counter pts DEFAULT:', JSON.stringify(before.counterPts));
console.log('counter pts HOVER  :', JSON.stringify(after.counterPts));
