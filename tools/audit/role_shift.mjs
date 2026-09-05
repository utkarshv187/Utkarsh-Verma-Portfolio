// Verify the role-cycler + graffiti group moved up; compare mine vs live at 1440.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'roleshift');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
async function grab(url) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200); await p.mouse.move(3, 860); await p.waitForTimeout(300);
  // measure role + graffiti tops relative to the PRODUCT wordmark
  const m = await p.evaluate(() => {
    const pick = (sels) => { for (const s of sels) { const e = document.querySelector(s); if (e) { const r = e.getBoundingClientRect(); if (r.height) return { top: Math.round(r.y), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2) }; } } return null; };
    // PRODUCT wordmark
    const product = (() => { const h = [...document.querySelectorAll('h1,div,p')].find((e) => e.textContent.replace(/\s+/g, '').toUpperCase().startsWith('PRODUCT') && e.getBoundingClientRect().height > 80 && e.getBoundingClientRect().y < 500); return h ? Math.round(h.getBoundingClientRect().y) : null; })();
    const role = pick(['.hero__role-shift', '.role']);
    // graffiti: my class, or live's 30.png image
    let graf = pick(['.hero__graffiti']);
    if (!graf) { const im = [...document.querySelectorAll('img')].find((i) => /30\.png/.test(i.currentSrc || i.src || '')) || [...document.querySelectorAll('img')].find((i) => { const r = i.getBoundingClientRect(); return r.y > 500 && r.y < 850 && r.width > 100 && r.width < 320; }); if (im) { const r = im.getBoundingClientRect(); graf = { top: Math.round(r.y), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2) }; } }
    return { productTop: product, role, graf };
  });
  const buf = await p.screenshot({ clip: { x: 0, y: 60, width: 900, height: 720 } });
  await ctx.close();
  return { buf, m };
}
const mine = await grab('http://localhost:5199/');
const live = await grab('https://uxuiuv.framer.website/');
await b.close();
console.log('MINE', JSON.stringify(mine.m));
console.log('LIVE', JSON.stringify(live.m));
if (mine.m.role && mine.m.productTop) console.log('MINE role top - product top =', mine.m.role.top - mine.m.productTop, '| graffiti top - product top =', mine.m.graf ? mine.m.graf.top - mine.m.productTop : 'n/a');
if (live.m.role && live.m.productTop) console.log('LIVE role top - product top =', live.m.role.top - live.m.productTop, '| graffiti top - product top =', live.m.graf ? live.m.graf.top - live.m.productTop : 'n/a');
const w = 640;
const mb = await sharp(mine.buf).resize(w).toBuffer(), lb = await sharp(live.buf).resize(w).toBuffer();
const h = Math.max((await sharp(mb).metadata()).height, (await sharp(lb).metadata()).height);
await sharp({ create: { width: w * 2 + 16, height: h, channels: 3, background: '#222' } })
  .composite([{ input: mb, left: 0, top: 0 }, { input: lb, left: w + 16, top: 0 }]).png().toFile(join(OUT, 'pair.png'));
console.log('wrote pair.png (mine | live)');
