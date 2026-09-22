import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const W = 1440, H = 820;

async function capture(url, sel) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load', timeout: 90000 }).catch(() => {});
  await p.waitForTimeout(1600);
  await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
  const docTops = await p.evaluate((sel) => sel.map((s) => { const a = [...document.querySelectorAll(s.q)].find((x) => x.getBoundingClientRect().width > 100); return a ? Math.round(a.getBoundingClientRect().top + scrollY) : null; }), sel);
  const targets = [120, 136, 152];
  const shots = [];
  for (let i = 0; i < 3; i++) {
    // scroll so card i pins: scroll to docTop - target, then nudge to converge
    let y = docTops[i] - targets[i];
    p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(500);
    shots.push(await p.screenshot({ clip: { x: 0, y: 0, width: W, height: H } }));
  }
  await ctx.close();
  return shots;
}

const mineSel = [{ q: '.rw-card' }, { q: '.rw-card' }, { q: '.rw-card' }];
// live: card <a> by href
const liveSel = [
  { q: 'a[href*="auction-plp"]' },
  { q: 'a[href*="gamification-by-uv"]' },
  { q: 'a[href*="iBOEPZFnnHc4BZ3"]' },
];
// need per-index doc tops; adjust capture to pick the i-th matching selector's card
async function captureCards(url, isMine) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load', timeout: 90000 }).catch(() => {});
  await p.waitForTimeout(1600);
  await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
  const hrefs = ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'];
  const docTops = await p.evaluate(({ isMine, hrefs }) => {
    if (isMine) { return [...document.querySelectorAll('.rw-card')].map((c) => Math.round(c.getBoundingClientRect().top + scrollY)); }
    return hrefs.map((h) => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(h) && x.getBoundingClientRect().width > 100); return Math.round(a.getBoundingClientRect().top + scrollY); });
  }, { isMine, hrefs });
  const targets = [120, 136, 152];
  const shots = [];
  for (let i = 0; i < 3; i++) {
    await p.evaluate((yy) => scrollTo(0, yy), docTops[i] - targets[i]);
    await p.waitForTimeout(650);
    shots.push(await p.screenshot({ clip: { x: 0, y: 0, width: W, height: H } }));
  }
  await ctx.close();
  return shots;
}

const mine = await captureCards('http://localhost:5199/', true);
const live = await captureCards('https://uxuiuv.framer.website/', false);
// montage: 3 rows (one per card state), each row = mine | live
const sw = Math.round(W * 0.45), gap = 6;
async function pair(m, l) {
  const mm = await sharp(m).resize(sw).toBuffer();
  const ll = await sharp(l).resize(sw).toBuffer();
  const h = (await sharp(mm).metadata()).height;
  return sharp({ create: { width: sw * 2 + gap, height: h, channels: 3, background: '#000' } }).composite([{ input: mm, left: 0, top: 0 }, { input: ll, left: sw + gap, top: 0 }]).png().toBuffer();
}
const rows = [];
for (let i = 0; i < 3; i++) rows.push(await pair(mine[i], live[i]));
const rh = (await sharp(rows[0]).metadata()).height;
const rw = (await sharp(rows[0]).metadata()).width;
await sharp({ create: { width: rw, height: rh * 3 + 24, channels: 3, background: '#222' } })
  .composite(rows.map((r, i) => ({ input: r, left: 0, top: i * (rh + 12) })))
  .png().toFile(join(OUT, 'compare_stack.png'));
console.log('wrote compare_stack.png (rows: card1/card2/card3; left=MINE right=LIVE)');
await b.close();
