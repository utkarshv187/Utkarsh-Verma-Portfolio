import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const OFFS = [200, 450, 700, 950]; // ~25/45/65/90% through the hero
async function grab(url) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const shots = [];
  for (const y of OFFS) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(160); shots.push(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 620 } })); }
  await ctx.close();
  return shots;
}
const mine = await grab('http://localhost:5199/');
const live = await grab('https://uxuiuv.framer.website/');
const scale = 0.44;
const rows = [];
for (let i = 0; i < OFFS.length; i++) {
  const w = Math.round(1440 * scale);
  const m = await sharp(mine[i]).resize(w).toBuffer();
  const l = await sharp(live[i]).resize(w).toBuffer();
  const h = (await sharp(m).metadata()).height;
  const row = await sharp({ create: { width: w * 2 + 8, height: h, channels: 3, background: '#222' } }).composite([{ input: m, left: 0, top: 0 }, { input: l, left: w + 8, top: 0 }]).png().toBuffer();
  rows.push({ buf: row, h, w: w * 2 + 8 });
}
const W = rows[0].w, gap = 10;
const H = rows.reduce((s, r) => s + r.h, 0) + gap * (rows.length - 1);
await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
  .composite(rows.map((r, i) => ({ input: r.buf, left: 0, top: rows.slice(0, i).reduce((s, x) => s + x.h + gap, 0) }))).png().toFile(join(OUT, 'skew_scrub.png'));
console.log('wrote skew_scrub.png (rows: scroll ' + OFFS.join('/') + '; each row MINE | LIVE)');
await b.close();
