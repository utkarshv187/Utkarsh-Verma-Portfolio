// Mobile O (plain, no ring on either): crop the PRODUCT wordmark, mine vs live, stacked.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'ocmp');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
async function grab(url) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200);
  const box = await p.evaluate(() => {
    document.querySelectorAll('img,canvas,video,picture').forEach((e) => { if (e.getBoundingClientRect().height > 120) e.style.visibility = 'hidden'; });
    const s = document.querySelector('.hero'); if (s) s.style.background = '#0c0c1f'; document.body.style.background = '#0c0c1f';
    const el = [...document.querySelectorAll('h1,div,p,span')].find((e) => e.textContent.replace(/\s+/g, '').toUpperCase().startsWith('PRODUCT') && e.getBoundingClientRect().height > 30 && e.getBoundingClientRect().y < 500);
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.x), y: r.y, w: Math.min(390, r.width), h: r.height };
  });
  await p.waitForTimeout(120);
  const buf = await p.screenshot({ clip: { x: box.x, y: box.y - 6, width: box.w, height: box.h + 12 } });
  await ctx.close();
  return buf;
}
const mine = await grab('http://localhost:5199/');
const live = await grab('https://uxuiuv.framer.website/');
await b.close();
const w = 700;
const a = await sharp(mine).resize(w).toBuffer(), c = await sharp(live).resize(w).toBuffer();
const ha = (await sharp(a).metadata()).height, hc = (await sharp(c).metadata()).height;
await sharp({ create: { width: w, height: ha + hc + 14, channels: 3, background: '#111' } })
  .composite([{ input: a, left: 0, top: 0 }, { input: c, left: 0, top: ha + 14 }]).png().toFile(join(OUT, 'mobile_O.png'));
console.log('wrote mobile_O.png (mine top, live bottom)');
