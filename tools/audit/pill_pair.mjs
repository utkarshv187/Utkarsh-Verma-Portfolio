import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'pill');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });

async function grab(url, findGraffiti) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200);
  const g = await p.evaluate(findGraffiti);
  if (!g) { await ctx.close(); return null; }
  // move in steps to the graffiti centre, with jitter to keep the (Framer) cursor alive
  const steps = 14;
  for (let i = 1; i <= steps; i++) { await p.mouse.move(g.cx - 120 + (120 * i) / steps, g.cy - 60 + (60 * i) / steps); await p.waitForTimeout(30); }
  for (let i = 0; i < 8; i++) { await p.mouse.move(g.cx + (i % 2 ? 1 : -1), g.cy + (i % 2 ? -1 : 1)); await p.waitForTimeout(60); }
  await p.mouse.move(g.cx, g.cy);
  await p.waitForTimeout(500); // let mine's spring settle
  const S = 150;
  const buf = await p.screenshot({ clip: { x: g.cx - S / 2, y: g.cy - S / 2, width: S, height: S } });
  await ctx.close();
  return buf;
}

const mine = await grab('http://localhost:5199/', () => { const e = document.querySelector('.hero__graffiti'); const r = e.getBoundingClientRect(); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; });
const live = await grab('https://uxuiuv.framer.website/', () => {
  const im = [...document.querySelectorAll('img')].find((i) => /30\.png/.test(i.currentSrc || i.src || '')) || [...document.querySelectorAll('img')].find((i) => { const r = i.getBoundingClientRect(); return r.y > 550 && r.y < 850 && r.width > 100 && r.width < 320; });
  if (!im) return null; const r = im.getBoundingClientRect(); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
await b.close();
const px = 150 * 3;
const parts = [];
if (mine) parts.push({ input: await sharp(mine).resize(px, px).toBuffer(), left: 0, top: 0 });
if (live) parts.push({ input: await sharp(live).resize(px, px).toBuffer(), left: px + 20, top: 0 });
await sharp({ create: { width: px * 2 + 20, height: px, channels: 3, background: '#333' } }).composite(parts).png().toFile(join(OUT, 'pill_pair.png'));
console.log('mine', !!mine, 'live', !!live, '-> pill_pair.png (mine left | live right)');
