import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const W = 1440, H = 820;

async function shots(url, isMine) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load', timeout: 90000 }).catch(() => {});
  await p.waitForTimeout(1600);
  await p.evaluate(async () => { const s = innerHeight * 0.5; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
  // find pin scrollY of card3 and card4 (front-of-stack states)
  const pins = await p.evaluate((isMine) => {
    const sig = (s) => {
      if (isMine) { const map = { c3: '.rw-card--designsystem', c4: '.rw-card--beyond' }; const el = document.querySelector(map[s]); return el; }
      const t = { c3: 'Established the Spinny', c4: 'Other small' }[s];
      return [...document.querySelectorAll('div,a')].find((e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.position === 'sticky' && r.width > 1000 && r.width < 1300 && (e.innerText || '').includes(t); });
    };
    const container = isMine ? document.querySelector('.rw__cards') : null;
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    const st = (el) => parseFloat(getComputedStyle(el).top) || 0;
    const c3 = sig('c3'), c4 = sig('c4');
    return { c3: top(c3) - st(c3), c4: top(c4) - st(c4) };
  }, isMine);
  const out = [];
  for (const key of ['c3', 'c4']) {
    await p.evaluate((y) => scrollTo(0, y + 30), pins[key]);
    await p.waitForTimeout(700);
    out.push(await p.screenshot({ clip: { x: 0, y: 0, width: W, height: H } }));
  }
  await ctx.close();
  return out;
}
const mine = await shots('http://localhost:5199/', true);
const live = await shots('https://uxuiuv.framer.website/', false);
const sw = Math.round(W * 0.45), gap = 6;
async function pair(m, l) {
  const mm = await sharp(m).resize(sw).toBuffer(); const ll = await sharp(l).resize(sw).toBuffer();
  const h = (await sharp(mm).metadata()).height;
  return sharp({ create: { width: sw * 2 + gap, height: h, channels: 3, background: '#000' } }).composite([{ input: mm, left: 0, top: 0 }, { input: ll, left: sw + gap, top: 0 }]).png().toBuffer();
}
const rows = [await pair(mine[0], live[0]), await pair(mine[1], live[1])];
const rh = (await sharp(rows[0]).metadata()).height, rwid = (await sharp(rows[0]).metadata()).width;
await sharp({ create: { width: rwid, height: rh * 2 + 12, channels: 3, background: '#222' } })
  .composite(rows.map((r, i) => ({ input: r, left: 0, top: i * (rh + 12) }))).png().toFile(join(OUT, 'compare4.png'));
console.log('wrote compare4.png (row1: card3-front, row2: card4-front; left=MINE right=LIVE)');
await b.close();
