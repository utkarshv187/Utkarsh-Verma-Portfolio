import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const OFFSETS = [200, 600, 1000, 1200];

async function grab(url) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const shots = [];
  for (const y of OFFSETS) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(150); shots.push(await p.screenshot()); }
  await ctx.close();
  return shots;
}
const mine = await grab('http://localhost:5199/');
const live = await grab('https://uxuiuv.framer.website/');
// build a grid: rows = offsets, each row: mine | live
const scale = 0.42;
const cols = [];
for (let i = 0; i < OFFSETS.length; i++) {
  const m = await sharp(mine[i]).resize(Math.round(1440 * scale)).toBuffer();
  const l = await sharp(live[i]).resize(Math.round(1440 * scale)).toBuffer();
  const w = Math.round(1440 * scale), h = (await sharp(m).metadata()).height;
  const row = await sharp({ create: { width: w * 2 + 8, height: h, channels: 3, background: '#222' } })
    .composite([{ input: m, left: 0, top: 0 }, { input: l, left: w + 8, top: 0 }]).png().toBuffer();
  cols.push({ buf: row, h, w: w * 2 + 8 });
}
const W = cols[0].w, gap = 10;
const totalH = cols.reduce((s, c) => s + c.h, 0) + gap * (cols.length - 1);
await sharp({ create: { width: W, height: totalH, channels: 3, background: '#000' } })
  .composite(cols.map((c, i) => ({ input: c.buf, left: 0, top: cols.slice(0, i).reduce((s, x) => s + x.h + gap, 0) }))).png().toFile(join(OUT, 'pin_compare.png'));
console.log('wrote pin_compare.png (rows: scroll ' + OFFSETS.join('/') + '; each row = MINE | LIVE)');
await b.close();
