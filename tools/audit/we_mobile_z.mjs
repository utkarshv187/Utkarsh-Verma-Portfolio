import { chromium } from 'playwright';
import sharp from 'sharp';
const b = await chromium.launch({ headless: true });
const w = 390;
const ctx = await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
const H = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < Math.min(H, 9000); y += 400) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(70); }
const card0 = await p.evaluate(() => { const cards = [...document.querySelectorAll('div')].filter((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor)); if (!cards.length) return null; cards.sort((a, bb) => a.getBoundingClientRect().top - bb.getBoundingClientRect().top); return Math.min(...cards.map((c) => c.getBoundingClientRect().top)) + window.scrollY; });
await p.evaluate((y) => window.scrollTo(0, Math.max(0, y - 120)), card0);
await p.waitForTimeout(2600);
// get card0 rect in viewport, then screenshot a generous region around it and scan for gold
const cr = await p.evaluate(() => { const cards = [...document.querySelectorAll('div')].filter((e) => { const r = e.getBoundingClientRect(); return /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor) && r.top > -100 && r.top < 700; }); cards.sort((a, bb) => a.getBoundingClientRect().top - bb.getBoundingClientRect().top); const r = cards[0].getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
const pad = 60;
const clip = { x: Math.max(0, cr.x - pad), y: Math.max(0, cr.y - pad), width: cr.w + pad * 2, height: cr.h + pad * 2 };
const buf = await p.screenshot({ clip });
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
// scan for cream gold ~ rgb(255,225,151)
let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
const yTop = Math.max(0, pad - 35);           // ~35px above card top
const yBot = Math.min(info.height, pad + cr.h + 3); // card bottom only (exclude next card)
const xMin = Math.round(pad + cr.w * 0.45);   // right ~55% only (isolate the visible upper-right Z)
for (let yy = yTop; yy < yBot; yy++) for (let xx = xMin; xx < info.width; xx++) {
  const i = (yy * info.width + xx) * info.channels; const R = data[i], G = data[i + 1], B = data[i + 2];
  if (R > 235 && G > 200 && G < 245 && B > 120 && B < 185) { if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy; }
}
// card top-left within the clip is at (pad, pad)
const zBox = { leftFromCard: minX - pad, topFromCard: minY - pad, width: maxX - minX, height: maxY - minY, rightPastCard: (maxX - pad) - cr.w };
console.log('card', JSON.stringify(cr));
console.log('goldZ', JSON.stringify(zBox));
// value: white pixels in the top-left band (exclude label lower area)
let vX0 = 1e9, vY0 = 1e9, vX1 = -1, vY1 = -1;
const vXmax = Math.round(pad + cr.w * 0.45);
const vYmax = Math.round(pad + cr.h * 0.55);
for (let yy = Math.max(0, pad - 30); yy < vYmax; yy++) for (let xx = 0; xx < vXmax; xx++) {
  const i = (yy * info.width + xx) * info.channels; const R = data[i], G = data[i + 1], B = data[i + 2];
  if (R > 240 && G > 240 && B > 240) { if (xx < vX0) vX0 = xx; if (xx > vX1) vX1 = xx; if (yy < vY0) vY0 = yy; if (yy > vY1) vY1 = yy; }
}
console.log('value', JSON.stringify({ leftFromCard: vX0 - pad, topFromCard: vY0 - pad, width: vX1 - vX0, capHeight: vY1 - vY0 }));
await b.close();
