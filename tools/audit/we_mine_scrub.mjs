import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);
const OFFS = [0, 250, 500, 750];
const shots = [];
// also report role/product center-x to prove movement
for (const y of OFFS) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(140);
  const c = await p.evaluate(() => {
    const cx = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return Math.round(r.left + r.width / 2); };
    return { productCx: cx('.hero__product'), roleCx: cx('.hero__role-shift') };
  });
  console.log('scroll', String(y).padStart(4), 'PRODUCT centerX', c.productCx, '| ROLE centerX', c.roleCx);
  shots.push(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 600 } }));
}
const scale = 0.5, w = Math.round(1440 * scale);
const bufs = [];
for (const s of shots) bufs.push(await sharp(s).resize(w).toBuffer());
const h = (await sharp(bufs[0]).metadata()).height, gap = 8;
await sharp({ create: { width: w, height: h * bufs.length + gap * (bufs.length - 1), channels: 3, background: '#000' } })
  .composite(bufs.map((buf, i) => ({ input: buf, left: 0, top: i * (h + gap) }))).png().toFile(join(OUT, 'mine_scrub.png'));
console.log('wrote mine_scrub.png (rows: scroll ' + OFFS.join('/') + ')');
await b.close();
