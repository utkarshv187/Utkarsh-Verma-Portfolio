import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });

// desktop: card4 at two scroll positions to show the listing pan + the light bg
const dp = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await dp.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await dp.waitForTimeout(1000);
const secTop = await dp.evaluate(() => document.querySelector('#recent-work').getBoundingClientRect().top + scrollY);
const frames = [];
for (const dy of [1950, 2350]) { await dp.evaluate((y) => scrollTo(0, y), secTop + dy); await dp.waitForTimeout(500); frames.push(await dp.screenshot({ clip: { x: 40, y: 60, width: 760, height: 760 } })); }
const w = 380, gap = 6;
const cells = [await sharp(frames[0]).resize(w).toBuffer(), await sharp(frames[1]).resize(w).toBuffer()];
const h = (await sharp(cells[0]).metadata()).height;
await sharp({ create: { width: w * 2 + gap, height: h + 22, channels: 3, background: '#111' } })
  .composite([{ input: Buffer.from(`<svg width="${w * 2 + gap}" height="20"><rect width="100%" height="100%" fill="#111"/><text x="6" y="15" font-family="monospace" font-size="12" fill="#fff">CARD 4: listing pans as you scroll (+ #ECECF5 panel behind the collage)</text></svg>`), top: 0, left: 0 }, { input: cells[0], top: 22, left: 0 }, { input: cells[1], top: 22, left: w + gap }])
  .png().toFile(join(OUT, 'card4_pan.png'));
await dp.close();

// mobile card4
const mp = await (await b.newContext({ viewport: { width: 390, height: 840 }, deviceScaleFactor: 2, isMobile: true })).newPage();
await mp.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await mp.waitForTimeout(1200);
await mp.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 300)); });
await mp.evaluate(() => { const c = document.querySelector('.rw-card--beyond'); scrollTo(0, c.getBoundingClientRect().top + scrollY - 60); });
await mp.waitForTimeout(500);
await sharp(await mp.screenshot({ clip: { x: 0, y: 0, width: 390, height: 760 } })).toFile(join(OUT, 'card4_mobile.png'));
await mp.close();

// pills montage
const ps = await sharp(join(OUT, 'pill_spinny.png')).resize(320).toBuffer();
const pv = await sharp(join(OUT, 'pill_view.png')).resize(320).toBuffer();
const ph = (await sharp(ps).metadata()).height;
await sharp({ create: { width: 320 * 2 + 6, height: ph + 22, channels: 3, background: '#333' } })
  .composite([{ input: Buffer.from(`<svg width="646" height="20"><rect width="100%" height="100%" fill="#111"/><text x="6" y="15" font-family="monospace" font-size="12" fill="#fff">Highlights/at Spinny  |  View  — same stadium shape</text></svg>`), top: 0, left: 0 }, { input: ps, top: 22, left: 0 }, { input: pv, top: 22, left: 326 }])
  .png().toFile(join(OUT, 'pills_both.png'));
console.log('wrote card4_pan.png, card4_mobile.png, pills_both.png');
await b.close();
