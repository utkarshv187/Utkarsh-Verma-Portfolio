import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });

async function grab(url) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
  await p.goto(url, { waitUntil: 'load', timeout: 90000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.evaluate(async () => { const s = innerHeight * 0.5; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
  const y = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); return Math.round(a.getBoundingClientRect().top + scrollY); });
  await p.evaluate((yy) => scrollTo(0, yy - 132), y);
  await p.waitForTimeout(700);
  const box = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); const r = a.getBoundingClientRect(); return { left: r.left + 48, top: r.top + 48, cardLeft: r.left, cardTop: r.top }; });
  const clip = { x: box.left, y: box.top, width: 524, height: 524 };
  // idle (mouse away)
  await p.mouse.move(1400, 850); await p.waitForTimeout(400);
  const idle = await p.screenshot({ clip });
  // hover at 75%
  const mx = box.left + 524 * 0.75, my = box.top + 262;
  await p.mouse.move(mx - 30, my); await p.mouse.move(mx, my, { steps: 6 }); await p.mouse.move(mx, my); await p.waitForTimeout(500);
  const hover = await p.screenshot({ clip });
  await p.close();
  return { idle, hover };
}
const mine = await grab('http://localhost:5199/');
const live = await grab('https://uxuiuv.framer.website/');
const w = 340, gap = 6;
async function cell(buf) { return sharp(buf).resize(w).toBuffer(); }
const cells = [await cell(mine.idle), await cell(live.idle), await cell(mine.hover), await cell(live.hover)];
const h = (await sharp(cells[0]).metadata()).height;
await sharp({ create: { width: w * 2 + gap, height: h * 2 + gap + 40, channels: 3, background: '#222' } })
  .composite([
    { input: Buffer.from(`<svg width="${w * 2 + gap}" height="20"><rect width="100%" height="100%" fill="#111"/><text x="6" y="15" font-family="monospace" font-size="13" fill="#fff">IDLE (ripple)  —  MINE  |  LIVE</text></svg>`), top: 0, left: 0 },
    { input: cells[0], top: 22, left: 0 }, { input: cells[1], top: 22, left: w + gap },
    { input: Buffer.from(`<svg width="${w * 2 + gap}" height="20"><rect width="100%" height="100%" fill="#111"/><text x="6" y="15" font-family="monospace" font-size="13" fill="#fff">HOVER @75% (follows mouse)  —  MINE  |  LIVE</text></svg>`), top: 22 + h + gap, left: 0 },
    { input: cells[2], top: 22 + h + gap + 20, left: 0 }, { input: cells[3], top: 22 + h + gap + 20, left: w + gap },
  ]).png().toFile(join(OUT, 'c1_verify.png'));
console.log('wrote c1_verify.png');
await b.close();
