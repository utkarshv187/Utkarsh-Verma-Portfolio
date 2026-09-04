// Zoom into the ring text of mine vs live to compare baseline evenness.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'baseline');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const DSF = 4, SIZE = 300;
async function grab(url, sel, hideBehind) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200);
  await p.mouse.move(3, 860); await p.waitForTimeout(300);
  const g = await p.evaluate((s) => {
    let cx, cy, fs;
    if (s === 'LIVE') {
      const svg = [...document.querySelectorAll('svg')].find((v) => { const t = v.querySelector('textPath'); return t && /TOGETHER/i.test(t.textContent); });
      const path = svg.querySelector('path'); const r = path.getBoundingClientRect();
      cx = r.x + r.width / 2; cy = r.y + r.height / 2;
      const oEl = [...document.querySelectorAll('span,div,p,h1,a')].find((e) => e.children.length === 0 && e.textContent.trim() === 'O'); fs = parseFloat(getComputedStyle(oEl).fontSize);
      // freeze the ring rotation so both are comparable
      svg.style.animation = 'none'; svg.style.transform = 'rotate(0deg)';
    } else {
      const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect(); cx = r.x + r.width / 2; cy = r.y + r.height / 2 - 0.0165 * parseFloat(getComputedStyle(o).fontSize); fs = parseFloat(getComputedStyle(o).fontSize);
      const bs = document.querySelector('.badge__svg'); if (bs) { bs.style.animation = 'none'; bs.style.transform = 'rotate(0deg)'; }
      document.querySelectorAll('.hero__portrait,.hero__face,.hero__fade,.hero__aurora,.hero__accent').forEach((e) => (e.style.display = 'none'));
      const sec = document.querySelector('.hero'); if (sec) sec.style.background = '#0c0c1f';
    }
    return { cx, cy, fs };
  }, sel);
  await p.waitForTimeout(200);
  const buf = await p.screenshot({ clip: { x: g.cx - SIZE / 2, y: g.cy - SIZE / 2, width: SIZE, height: SIZE } });
  await ctx.close();
  return buf;
}
const mine = await grab('http://localhost:5199/', 'MINE');
const live = await grab('https://uxuiuv.framer.website/', 'LIVE');
await b.close();
const px = SIZE * DSF;
await sharp({ create: { width: px * 2 + 24, height: px, channels: 3, background: '#111' } })
  .composite([{ input: await sharp(mine).resize(px, px).toBuffer(), left: 0, top: 0 }, { input: await sharp(live).resize(px, px).toBuffer(), left: px + 24, top: 0 }])
  .png().toFile(join(OUT, 'ring_baseline.png'));
console.log('wrote ring_baseline.png (mine left | live right, rotation frozen to 0)');
