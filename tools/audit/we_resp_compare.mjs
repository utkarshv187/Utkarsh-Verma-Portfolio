import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
async function grab(url, w, capH, mine) {
  const ctx = await b.newContext({ viewport: { width: w, height: capH }, deviceScaleFactor: 1, isMobile: w < 810 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < Math.min(H, 7000); y += 600) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(100); }
  const top = await p.evaluate((isMine) => {
    if (isMine) return Math.round(document.querySelector('.we').getBoundingClientRect().y + window.scrollY);
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const h = [...document.querySelectorAll('*')].find((e) => /^WORK EXPERIENCE$/i.test(norm(e.textContent)) && norm(e.textContent).length < 30 && e.getBoundingClientRect().height > 8);
    let n = h; for (let i = 0; i < 9 && n; i++) { if (/255, 183, 5/.test(getComputedStyle(n).backgroundColor)) return Math.round(n.getBoundingClientRect().y + window.scrollY); n = n.parentElement; }
    return Math.round(h.getBoundingClientRect().y + window.scrollY);
  }, mine);
  await p.evaluate((y) => window.scrollTo(0, y), top);
  await p.waitForTimeout(mine ? 1800 : 500); // let mine's count-up settle
  const buf = await p.screenshot();
  await ctx.close();
  return buf;
}
async function pair(w, capH, tag) {
  const mine = await grab('http://localhost:5199/', w, capH, true);
  const live = await grab('https://uxuiuv.framer.website/', w, capH, false);
  const rw = Math.round(w * 0.62);
  const mb = await sharp(mine).resize(rw).toBuffer(), lb = await sharp(live).resize(rw).toBuffer();
  const h = Math.max((await sharp(mb).metadata()).height, (await sharp(lb).metadata()).height);
  await sharp({ create: { width: rw * 2 + 12, height: h, channels: 3, background: '#222' } })
    .composite([{ input: mb, left: 0, top: 0 }, { input: lb, left: rw + 12, top: 0 }]).png().toFile(join(OUT, `cmp_${tag}.png`));
  console.log('wrote cmp_' + tag + '.png');
}
await pair(1024, 1050, 'tablet');
await pair(390, 1500, 'mobile');
await b.close();
