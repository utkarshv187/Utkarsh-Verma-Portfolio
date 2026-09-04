import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'overify');
const b = await chromium.launch({ headless: true });
const DSF = 3, SIZE = 340;
async function grab(url, sel, dyEm) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200);
  await p.mouse.move(3, 870); await p.waitForTimeout(300);
  const g = await p.evaluate((s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, fs: parseFloat(getComputedStyle(e).fontSize) }; }, sel);
  const cy = g.cy + (dyEm || 0) * g.fs;
  const buf = await p.screenshot({ clip: { x: g.cx - SIZE / 2, y: cy - SIZE / 2, width: SIZE, height: SIZE } });
  await ctx.close();
  return buf;
}
const mine = await grab('http://localhost:5199/', '.hero__o', 0.0242);
await b.close();
const px = SIZE * DSF;
const m = await sharp(mine).resize(px, px).png().toBuffer();
const l = await sharp(join(OUT, '..', 'oref', 'live_o_default.png')).resize(px, px).png().toBuffer();
await sharp({ create: { width: px * 2 + 24, height: px, channels: 3, background: '#151515' } })
  .composite([{ input: m, left: 0, top: 0 }, { input: l, left: px + 24, top: 0 }]).png().toFile(join(OUT, 'pair_clean.png'));
console.log('wrote pair_clean.png (mine left | live right), both counter-centred, 340css@3x');
