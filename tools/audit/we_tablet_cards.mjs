import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });

async function grabCards(url, w, mine) {
  const ctx = await b.newContext({ viewport: { width: w, height: 1000 }, deviceScaleFactor: 2, isMobile: w < 810 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < Math.min(H, 7000); y += 500) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(80); }
  // find the purple card container and scroll it fully into view, near viewport centre
  const box = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('div')].filter((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor));
    if (!cards.length) return null;
    const rects = cards.map((c) => c.getBoundingClientRect());
    const top = Math.min(...rects.map((r) => r.top)) + window.scrollY;
    const bottom = Math.max(...rects.map((r) => r.bottom)) + window.scrollY;
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    return { top, bottom, left, right };
  });
  if (!box) { await ctx.close(); return null; }
  // put the card block roughly centred so count-up triggers and stays visible
  await p.evaluate((y) => window.scrollTo(0, y), Math.max(0, box.top - 350));
  await p.waitForTimeout(2600); // let count-up settle fully
  // recompute clip in viewport coords (value overflows above the card, so pad top 60)
  const clip = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('div')].filter((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor));
    const rects = cards.map((c) => c.getBoundingClientRect());
    const top = Math.min(...rects.map((r) => r.top));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    return { x: Math.max(0, left - 8), y: Math.max(0, top - 66), width: (right - left) + 16, height: (bottom - top) + 74 };
  });
  const buf = await p.screenshot({ clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height } });
  await ctx.close();
  return buf;
}

for (const w of [1024]) {
  const live = await grabCards('https://uxuiuv.framer.website/', w, false);
  const mine = await grabCards('http://localhost:5199/', w, true);
  if (!live || !mine) { console.log('missing', w); continue; }
  const lm = await sharp(live).metadata();
  const mm = await sharp(mine).metadata();
  const width = Math.max(lm.width, mm.width);
  const gap = 20;
  // stack mine (top) over live (bottom), labelled implicitly by order
  await sharp({ create: { width, height: mm.height + gap + lm.height, channels: 4, background: '#222222' } })
    .composite([
      { input: mine, left: 0, top: 0 },
      { input: live, left: 0, top: mm.height + gap },
    ]).png().toFile(join(OUT, `cards_tablet_${w}.png`));
  console.log('wrote cards_tablet_' + w + '.png  (mine top / live bottom)  mine', mm.width + 'x' + mm.height, 'live', lm.width + 'x' + lm.height);
}
await b.close();
