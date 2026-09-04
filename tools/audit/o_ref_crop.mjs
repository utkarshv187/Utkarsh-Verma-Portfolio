// Capture a tight, high-res crop of the LIVE hero O (ring + counter) for 1:1 reference.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'oref');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
const p = await ctx.newPage();
// block heavy media so it loads fast
await p.route('**/*', (r) => {
  const t = r.request().resourceType();
  if (t === 'media') return r.abort();
  return r.continue();
});
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
await p.waitForTimeout(2500);
await p.mouse.move(3, 870);
await p.waitForTimeout(400);
// Locate the O anchor + ring
const geo = await p.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => { const tp = s.querySelector('textPath'); return tp && /TOGETHER/i.test(tp.textContent); });
  const oEl = [...document.querySelectorAll('span,div,p,h1,a')].find((e) => e.children.length === 0 && e.textContent.trim() === 'O');
  const rs = svg.getBoundingClientRect();
  const ro = oEl.getBoundingClientRect();
  return { ring: { x: rs.x, y: rs.y, w: rs.width, h: rs.height, cx: rs.x + rs.width / 2, cy: rs.y + rs.height / 2 },
           o: { x: ro.x, y: ro.y, w: ro.width, h: ro.height, cx: ro.x + ro.width / 2, cy: ro.y + ro.height / 2 } };
});
console.log('geo', JSON.stringify(geo));
// crop a square around the ring center, size = 320 css px
const cx = geo.ring.cx, cy = geo.ring.cy;
const size = 340;
const clip = { x: cx - size / 2, y: cy - size / 2, width: size, height: size };
await p.screenshot({ path: join(OUT, 'live_o_default.png'), clip });
// hover to reveal any hover state (move onto the O counter left side)
await p.mouse.move(geo.o.cx - 20, geo.o.cy);
await p.waitForTimeout(900);
await p.screenshot({ path: join(OUT, 'live_o_hover.png'), clip });
await b.close();
console.log('done');
