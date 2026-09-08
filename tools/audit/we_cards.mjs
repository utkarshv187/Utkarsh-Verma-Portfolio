import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
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
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);

const info = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const inWE = (e) => { const r = e.getBoundingClientRect(); const ay = r.y + window.scrollY; return ay > 1300 && ay < 2360; };
  // purple cards
  const cards = [...document.querySelectorAll('div')].filter((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); const m = c.backgroundColor.match(/rgba?\((\d+), (\d+), (\d+)/); if (!m) return false; const [_, R, G, B] = m.map(Number); const purple = B > 90 && R > 40 && R < 130 && G < 90 && B > R; return purple && r.width > 200 && r.height > 100 && inWE(e); }).map((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { bg: c.backgroundColor, radius: c.borderRadius, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y + window.scrollY), pad: c.padding, cls: (e.className || '').toString().slice(0, 24) }; });
  // dedupe by x
  const seen = new Set(); const uCards = cards.filter((c) => { const k = c.x + ':' + c.w; if (seen.has(k)) return false; seen.add(k); return true; });
  // counter value big text: white, big font, in WE
  const vals = [...document.querySelectorAll('*')].filter((e) => { if (e.children.length) return false; const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return inWE(e) && r.height > 40 && parseFloat(c.fontSize) > 40 && /255, 255, 255/.test(c.color); }).map((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { t: norm(e.textContent), fs: c.fontSize, fw: c.fontWeight, fam: c.fontFamily.split(',')[0].replace(/"/g, ''), x: Math.round(r.x), y: Math.round(r.y + window.scrollY), h: Math.round(r.height) }; });
  // Spinny logo
  const logos = [...document.querySelectorAll('img,svg')].filter((e) => inWE(e) && e.getBoundingClientRect().x < 450).map((e) => { const r = e.getBoundingClientRect(); return { tag: e.tagName, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y + window.scrollY), src: (e.getAttribute && (e.getAttribute('src') || '')) || '', alt: e.getAttribute && e.getAttribute('alt') }; });
  // dividers: thin lines in WE
  const divs = [...document.querySelectorAll('div')].filter((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return inWE(e) && r.width > 500 && r.height > 0 && r.height <= 3 && c.backgroundColor !== 'rgba(0, 0, 0, 0)'; }).map((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { y: Math.round(r.y + window.scrollY), x: Math.round(r.x), w: Math.round(r.width), h: r.height, bg: c.backgroundColor }; });
  return { cards: uCards, counterValues: vals, logos, dividers: divs };
});
await writeFile(join(OUT, 'we_cards.json'), JSON.stringify(info, null, 2));
console.log(JSON.stringify(info, null, 2));

// pixel-sample colors from the full screenshot
const shot = join(OUT, 'we_desktop_full.png');
const { data, info: im } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
const W = im.width, C = im.channels; const px = (x, y) => { const i = (y * W + x) * C; return `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`; };
console.log('PIXEL samples (image 2x):');
console.log('  yellow bg   ', px(2000, 900));
console.log('  card purple ', px(700, 2000));
console.log('  Z motif tan ', px(950, 1810));
console.log('  divider     ', px(1400, 870));
await b.close();
