import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'about');
const b = await chromium.launch({ headless: true });

async function measure(url, isLive) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto(url, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(isLive ? 2500 : 1000);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.55) { scrollTo(0, y); await new Promise(r => setTimeout(r, 140)); } });
  // find the purple TTS section top (doc) and the light RW bottom (doc)
  const b2 = await p.evaluate(() => {
    const purple = [...document.querySelectorAll('div,section')].map(e => ({ e, r: e.getBoundingClientRect(), bg: getComputedStyle(e).backgroundColor })).find(o => o.bg === 'rgb(155, 80, 255)' && o.r.width >= 1440);
    const light = [...document.querySelectorAll('div,section')].map(e => ({ e, r: e.getBoundingClientRect(), bg: getComputedStyle(e).backgroundColor })).find(o => o.bg === 'rgb(236, 236, 245)' && o.r.width >= 1440);
    return { ttsTop: purple ? Math.round(purple.r.top + scrollY) : null, rwBottom: light ? Math.round(light.r.bottom + scrollY) : null };
  });
  // scroll so TTS top is at viewport y=430, then find the lowest RW card bottom in viewport
  await p.evaluate((y) => scrollTo(0, y - 430), b2.ttsTop);
  await p.waitForTimeout(500);
  const cardBottom = await p.evaluate(() => {
    // the RW cards are rounded 24px boxes with dark/purple bg; find the lowest one above the purple
    const sel = document.querySelector('.rw-card--beyond') || null;
    if (sel) { const r = sel.getBoundingClientRect(); return { via: 'mine', bottomVp: Math.round(r.bottom), topVp: Math.round(r.top) }; }
    // live: find big rounded cards
    const cards = [...document.querySelectorAll('div')].map(e => ({ r: e.getBoundingClientRect(), br: getComputedStyle(e).borderRadius })).filter(o => o.r.width > 900 && o.r.width < 1250 && o.r.height > 400 && parseFloat(o.br) >= 20 && o.r.top < 430);
    const low = cards.sort((a, b) => b.r.bottom - a.r.bottom)[0];
    return low ? { via: 'live', bottomVp: Math.round(low.r.bottom), topVp: Math.round(low.r.top) } : null;
  });
  await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 760 } })).resize(560).toFile(join(OUT, isLive ? 'gap_live.png' : 'gap_mine.png'));
  await p.close();
  const purpleVp = 430; // we placed TTS top at 430
  const whitespace = cardBottom ? purpleVp - cardBottom.bottomVp : null;
  console.log((isLive ? 'LIVE' : 'MINE'), 'ttsTopDoc=', b2.ttsTop, 'rwBottomDoc=', b2.rwBottom, '| lastCard', JSON.stringify(cardBottom), '=> whitespace card-bottom->purple =', whitespace, 'px');
}
await measure('https://uxuiuv.framer.website/', true);
await measure('http://localhost:5199/', false);
await b.close();
console.log('done');
