import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const CAP = 1260;
async function grab(url, mine) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: CAP }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1600);
  for (let y = 0; y < 3200; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
  // find yellow section top (page y)
  const topY = await p.evaluate((isMine) => {
    if (isMine) { const s = document.querySelector('.we'); return Math.round(s.getBoundingClientRect().y + window.scrollY); }
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const h = [...document.querySelectorAll('*')].find((e) => /^WORK EXPERIENCE$/i.test(norm(e.textContent)) && norm(e.textContent).length < 30 && e.getBoundingClientRect().height > 8);
    let n = h; for (let i = 0; i < 9 && n; i++) { if (/255, 183, 5/.test(getComputedStyle(n).backgroundColor)) return Math.round(n.getBoundingClientRect().y + window.scrollY); n = n.parentElement; }
    return Math.round(h.getBoundingClientRect().y + window.scrollY) - 208;
  }, mine);
  await p.evaluate((y) => window.scrollTo(0, y), topY);
  await p.waitForTimeout(500);
  const buf = await p.screenshot();
  await ctx.close();
  return buf;
}
const mine = await grab('http://localhost:5199/', true);
const live = await grab('https://uxuiuv.framer.website/', false);
await b.close();
const w = 700;
const mb = await sharp(mine).resize(w).toBuffer(), lb = await sharp(live).resize(w).toBuffer();
const h = Math.max((await sharp(mb).metadata()).height, (await sharp(lb).metadata()).height);
await sharp({ create: { width: w * 2 + 16, height: h, channels: 3, background: '#222' } })
  .composite([{ input: mb, left: 0, top: 0 }, { input: lb, left: w + 16, top: 0 }]).png().toFile(join(OUT, 'cmp_desktop.png'));
console.log('wrote cmp_desktop.png (mine | live)');
