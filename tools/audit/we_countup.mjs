import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
// find cards page-y
const cardY = await p.evaluate(() => { const c = [...document.querySelectorAll('div')].find((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor)); return c ? Math.round(c.getBoundingClientRect().y + window.scrollY) : 2095; });
// position cards well below the viewport so scrolling triggers the count-up fresh
await p.evaluate((cy) => window.scrollTo(0, Math.max(0, cy - 1400)), cardY);
await p.waitForTimeout(600);
// reveal: put the value row (~80px above card top) into the capture band
const region = { x: 100, y: 360, width: 1050, height: 210 };
const frames = [];
await p.evaluate((cy) => window.scrollTo(0, cy - 440), cardY); // card top at vp 440, values at ~360
for (let i = 0; i < 18; i++) { frames.push(await p.screenshot({ clip: region })); await p.waitForTimeout(75); }
// value font after settle
await p.waitForTimeout(600);
const font = await p.evaluate((cy) => {
  const card = [...document.querySelectorAll('div')].find((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor));
  const r = card.getBoundingClientRect();
  const el = document.elementFromPoint(r.x + 40, r.y - 10); // value overflows above card top
  if (!el) return null; const c = getComputedStyle(el); return { t: (el.textContent || '').trim().slice(0, 8), fs: c.fontSize, fw: c.fontWeight, fam: c.fontFamily.split(',')[0].replace(/"/g, ''), color: c.color, lh: c.lineHeight, cls: (el.className || '').toString().slice(0, 20) };
}, cardY);
console.log('value font (elementFromPoint above card):', JSON.stringify(font));
await b.close();
// montage frames
const cw = 320, ch = Math.round(320 * region.height / region.width), gap = 4;
const cols = 4, rows = Math.ceil(frames.length / cols);
const comp = [];
for (let i = 0; i < frames.length; i++) { const rr = Math.floor(i / cols), cc = i % cols; comp.push({ input: await sharp(frames[i]).resize(cw).toBuffer(), left: gap + cc * (cw + gap), top: gap + rr * (ch + gap) }); }
await sharp({ create: { width: cols * (cw + gap) + gap, height: rows * (ch + gap) + gap, channels: 3, background: '#333' } }).composite(comp).png().toFile(join(OUT, 'countup.png'));
console.log('wrote countup.png', frames.length, 'frames @ ~90ms');
