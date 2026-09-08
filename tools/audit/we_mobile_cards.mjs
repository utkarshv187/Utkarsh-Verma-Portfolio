import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });

async function grab(url, mine) {
  const w = 390;
  const ctx = await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < Math.min(H, 9000); y += 400) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(70); }
  const box = await p.evaluate(() => { const cards = [...document.querySelectorAll('div')].filter((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor)); if (!cards.length) return null; const rs = cards.map((c) => c.getBoundingClientRect()); return { top: Math.min(...rs.map((r) => r.top)) + window.scrollY }; });
  if (!box) { await ctx.close(); return null; }
  await p.evaluate((y) => window.scrollTo(0, Math.max(0, y - 150)), box.top);
  await p.waitForTimeout(2600);
  const clip = await p.evaluate(() => { const cards = [...document.querySelectorAll('div')].filter((e) => { const r = e.getBoundingClientRect(); return /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor) && r.top > -300 && r.top < 800; }); const rs = cards.map((c) => c.getBoundingClientRect()); const top = Math.min(...rs.map((r) => r.top)); const bottom = Math.max(...rs.map((r) => r.bottom)); const left = Math.min(...rs.map((r) => r.left)); const right = Math.max(...rs.map((r) => r.right)); return { x: Math.max(0, left - 6), y: Math.max(0, top - 40), width: (right - left) + 12, height: (bottom - top) + 50 }; });
  const buf = await p.screenshot({ clip });
  await ctx.close();
  return buf;
}
const mine = await grab('http://localhost:5199/', true);
const live = await grab('https://uxuiuv.framer.website/', false);
const mm = await sharp(mine).metadata(); const lm = await sharp(live).metadata();
const width = Math.max(mm.width, lm.width);
await sharp({ create: { width: width * 2 + 20, height: Math.max(mm.height, lm.height), channels: 4, background: '#222222' } })
  .composite([{ input: mine, left: 0, top: 0 }, { input: live, left: width + 20, top: 0 }]).png().toFile(join(OUT, 'cards_mobile.png'));
console.log('wrote cards_mobile.png (mine left / live right) mine', mm.width + 'x' + mm.height, 'live', lm.width + 'x' + lm.height);
await b.close();
