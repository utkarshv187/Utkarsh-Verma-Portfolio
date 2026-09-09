import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });

async function run(url, isMine) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(isMine ? 900 : 1500);
  const skewAt = async (y) => {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(220);
    return await p.evaluate((mine) => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
      let leaf;
      if (mine) leaf = document.querySelector('.hero__product');
      else leaf = [...document.querySelectorAll('*')].find((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return /PRODUCT/i.test(norm(own)) && norm(own).length < 12 && e.getBoundingClientRect().width > 4; });
      if (!leaf) return null;
      let M = new DOMMatrix(); let n = leaf;
      for (let i = 0; i < 12 && n; i++) { const t = getComputedStyle(n).transform; if (t && t !== 'none') M = new DOMMatrix(t).multiply(M); if (n.tagName === 'SECTION' || (n.getAttribute && n.getAttribute('data-framer-name') === 'Intro')) break; n = n.parentElement; }
      return { skew: +(Math.atan2(M.c, M.d) * 180 / Math.PI).toFixed(2), tx: +M.e.toFixed(1) };
    }, isMine);
  };
  const vals = {};
  for (const y of [200, 400, 600, 800, 1000]) vals[y] = await skewAt(y);
  // screenshot hero region at scroll 500 for visual
  await p.evaluate(() => window.scrollTo(0, 500));
  await p.waitForTimeout(250);
  const shot = await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 620 } });
  await ctx.close();
  return { vals, shot };
}
const mine = await run('http://localhost:5199/', true);
const live = await run('https://uxuiuv.framer.website/', false);
console.log('scroll |  MINE skew/tx      |  LIVE skew/tx');
for (const y of [200, 400, 600, 800, 1000]) console.log(String(y).padStart(5), '|', JSON.stringify(mine.vals[y]).padEnd(24), '|', JSON.stringify(live.vals[y]));
// montage at scroll 500
const w = Math.round(1440 * 0.5);
const m = await sharp(mine.shot).resize(w).toBuffer();
const l = await sharp(live.shot).resize(w).toBuffer();
const h = (await sharp(m).metadata()).height;
await sharp({ create: { width: w, height: h * 2 + 8, channels: 3, background: '#222' } })
  .composite([{ input: m, left: 0, top: 0 }, { input: l, left: 0, top: h + 8 }]).png().toFile(join(OUT, 'skew_compare.png'));
console.log('wrote skew_compare.png (mine top / live bottom, both @ scroll 500)');
await b.close();
