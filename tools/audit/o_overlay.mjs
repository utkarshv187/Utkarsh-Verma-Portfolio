// Overlay live's measured ring band (r=69..86 css) as guide circles on BOTH mine and live,
// counter-centred, to prove the ring radius matches regardless of spin phase.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'overify');
const DSF = 3, SIZE = 340;
const b = await chromium.launch({ headless: true });
async function grab(url, sel, dyEm) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200);
  await p.mouse.move(3, 870); await p.waitForTimeout(300);
  const g = await p.evaluate((s) => {
    let cx, cy, fs;
    if (s === 'LIVE_RING') {
      const svg = [...document.querySelectorAll('svg')].find((v) => { const t = v.querySelector('textPath'); return t && /TOGETHER/i.test(t.textContent); });
      const path = svg.querySelector('path'); const r = path.getBoundingClientRect();
      cx = r.x + r.width / 2; cy = r.y + r.height / 2;
      const oEl = [...document.querySelectorAll('span,div,p,h1,a')].find((e) => e.children.length === 0 && e.textContent.trim() === 'O');
      fs = parseFloat(getComputedStyle(oEl).fontSize);
    } else {
      const e = document.querySelector(s); const r = e.getBoundingClientRect();
      cx = r.x + r.width / 2; cy = r.y + r.height / 2; fs = parseFloat(getComputedStyle(e).fontSize);
    }
    return { cx, cy, fs };
  }, sel);
  const cy = g.cy + (dyEm || 0) * g.fs;
  const buf = await p.screenshot({ clip: { x: g.cx - SIZE / 2, y: cy - SIZE / 2, width: SIZE, height: SIZE } });
  await ctx.close();
  return { buf, fs: g.fs };
}
const mine = await grab('http://localhost:5199/', '.hero__o', -0.0165);
// live counter center: use the ring svg's parent (container). Fall back to anchor.
const live = await grab('https://uxuiuv.framer.website/', 'LIVE_RING', 0);
await b.close();
const px = SIZE * DSF; const c = px / 2;
function guide(fs) {
  const scale = DSF * (fs / 282); // css px -> device px at this O size
  const r69 = 69 * scale, r86 = 86 * scale, rPath = 88 * scale;
  return Buffer.from(
    `<svg width="${px}" height="${px}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${c}" cy="${c}" r="${r69}" fill="none" stroke="#00e5ff" stroke-width="2"/>
      <circle cx="${c}" cy="${c}" r="${r86}" fill="none" stroke="#00e5ff" stroke-width="2"/>
      <circle cx="${c}" cy="${c}" r="${rPath}" fill="none" stroke="#ff3b3b" stroke-width="1.5" stroke-dasharray="6 6"/>
      <line x1="${c}" y1="${c - 8}" x2="${c}" y2="${c + 8}" stroke="#ffd400" stroke-width="2"/>
      <line x1="${c - 8}" y1="${c}" x2="${c + 8}" y2="${c}" stroke="#ffd400" stroke-width="2"/>
    </svg>`);
}
const mImg = await sharp(mine.buf).resize(px, px).composite([{ input: guide(mine.fs) }]).png().toBuffer();
const lImg = await sharp(live.buf).resize(px, px).composite([{ input: guide(live.fs) }]).png().toBuffer();
await sharp({ create: { width: px * 2 + 24, height: px, channels: 3, background: '#111' } })
  .composite([{ input: mImg, left: 0, top: 0 }, { input: lImg, left: px + 24, top: 0 }]).png().toFile(join(OUT, 'overlay_pair.png'));
console.log('mine.fs', mine.fs, 'live.fs', live.fs, '-> overlay_pair.png (cyan=live band r69/r86, red-dash=path r88)');
