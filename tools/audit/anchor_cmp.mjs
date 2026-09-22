import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'about');
const b = await chromium.launch({ headless: true });

async function shot(url, isLive, file) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto(url, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(isLive ? 2500 : 900);
  if (isLive) await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.55) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });
  // find bio, scroll so bio top ~ viewport 250
  const y = await p.evaluate(() => { const n = (s) => (s || '').replace(/\s+/g, ' ').trim(); const e = [...document.querySelectorAll('div,p')].find(e => /Result, impact & delight/i.test(n(e.textContent)) && parseFloat(getComputedStyle(e).fontSize) > 30); return e.getBoundingClientRect().top + scrollY; });
  await p.evaluate((yy) => scrollTo(0, yy - 250), y);
  await p.waitForTimeout(3200); // reveal
  // clip the bio region (right of portrait)
  await sharp(await p.screenshot({ clip: { x: 530, y: 210, width: 850, height: 420 } })).resize(560).toFile(join(OUT, file));
  await p.close();
}
await shot('https://uxuiuv.framer.website/', true, 'cmp_anchor_live.png');
await shot('http://localhost:5199/', false, 'cmp_anchor_mine.png');
// stack vertically
const L = await sharp(join(OUT, 'cmp_anchor_live.png')).toBuffer();
const M = await sharp(join(OUT, 'cmp_anchor_mine.png')).toBuffer();
const lh = (await sharp(L).metadata()).height;
await sharp({ create: { width: 560, height: lh * 2 + 44, channels: 3, background: '#111' } })
  .composite([
    { input: Buffer.from('<svg width="560" height="20"><rect width="100%" height="100%" fill="#111"/><text x="6" y="15" font-family="monospace" font-size="12" fill="#7CF">LIVE</text></svg>'), top: 0, left: 0 },
    { input: L, top: 22, left: 0 },
    { input: Buffer.from('<svg width="560" height="20"><rect width="100%" height="100%" fill="#111"/><text x="6" y="15" font-family="monospace" font-size="12" fill="#FC7">MINE</text></svg>'), top: lh + 22, left: 0 },
    { input: M, top: lh + 44, left: 0 },
  ]).png().toFile(join(OUT, 'cmp_anchor_both.png'));
console.log('wrote cmp_anchor_both.png');
await b.close();
