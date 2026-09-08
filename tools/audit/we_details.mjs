import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1320 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
for (let y = 0; y < 3200; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 1120)); await p.waitForTimeout(500);

// counter value font: any text inside the card group with big font
const vals = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const cards = [...document.querySelectorAll('div')].filter((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor));
  const res = [];
  for (const card of cards.slice(0, 3)) {
    const grp = card.parentElement; // value likely a sibling overflowing the card
    [...grp.querySelectorAll('*')].forEach((e) => { if (e.children.length) return; const c = getComputedStyle(e); const r = e.getBoundingClientRect(); if (parseFloat(c.fontSize) > 45 && norm(e.textContent)) res.push({ t: norm(e.textContent), fs: c.fontSize, fw: c.fontWeight, fam: c.fontFamily.split(',')[0].replace(/"/g, ''), color: c.color, lh: c.lineHeight }); });
  }
  return res;
});
console.log('counter values:', JSON.stringify(vals, null, 2));

// scan for divider color between Spinny row and TLC row
const buf = await p.screenshot();
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels; const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
// yellow is (255,183,5). find rows where a horizontal band differs from yellow across x=800..2000 (image px), y range for dividers
let found = [];
for (let y = 0; y < H; y++) { let diff = 0; for (let x = 800; x < 2000; x += 40) { const [r, g, bl] = px(x, y); if (Math.abs(r - 255) + Math.abs(g - 183) + Math.abs(bl - 5) > 60) diff++; } if (diff > 20) found.push(y); }
// group consecutive
const bands = []; let s = null, prev = null; for (const y of found) { if (s === null) { s = y; } else if (y - prev > 3) { bands.push([s, prev]); s = y; } prev = y; } if (s !== null) bands.push([s, prev]);
console.log('non-yellow horizontal bands (image y, thin ones are dividers):');
bands.forEach(([a, c2]) => { if (c2 - a <= 6) { const [r, g, bl] = px(1400, Math.round((a + c2) / 2)); console.log(`  y ${a}-${c2} (h${c2 - a + 1})  color rgb(${r},${g},${bl})`); } });
// Z motif color: sample around the Z on card1 (overflowing top-right of card1). card1 body y2095 page -> viewport 975 -> image 1950. Z above, right side.
console.log('Z samples:');
for (const [x, y] of [[880, 1870], [900, 1850], [860, 1900], [820, 1860]]) { const [r, g, bl] = px(x, y); console.log(`  (${x},${y}) rgb(${r},${g},${bl})`); }
await b.close();
