import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/card2'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 2600 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
// full slow scroll to load everything
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } scrollTo(0, 0); });
await p.waitForTimeout(600);
// neutralize sticky so cards lay out in normal flow
await p.evaluate(() => { for (const el of document.querySelectorAll('*')) { const cs = getComputedStyle(el); if (cs.position === 'sticky') el.style.position = 'relative'; } });
await p.waitForTimeout(300);
// find the gamification GIFs (the two tall phone gifs) and their media container
const data = await p.evaluate(() => {
  const gifs = [...document.querySelectorAll('img')].filter((im) => /\.gif/i.test(im.currentSrc || im.src)).map((im) => ({ im, r: im.getBoundingClientRect(), src: (im.currentSrc || im.src).split('/').pop().slice(0, 12) }));
  // gamification pair: two gifs with heights 380-560 that are near each other (overlapping x)
  const tall = gifs.filter((g) => g.r.height > 350 && g.r.height < 620);
  if (tall.length < 1) return { none: true, gifs: gifs.map((g) => ({ src: g.src, w: Math.round(g.r.width), h: Math.round(g.r.height) })) };
  // the bigger of the pair
  tall.sort((a, b) => b.r.height - a.r.height);
  const big = tall[0];
  // its media container = nearest ancestor that's a clipped box (overflow hidden) ~square
  let node = big.im, media = null;
  for (let k = 0; k < 8 && node; k++) { const cs = getComputedStyle(node); const r = node.getBoundingClientRect(); if ((cs.overflow === 'hidden' || cs.overflowY === 'hidden') && r.width > 300 && r.height > 300) { media = node; break; } node = node.parentElement; }
  const mr = media ? media.getBoundingClientRect() : null;
  const abs = (r) => ({ top: Math.round(r.top + scrollY), left: Math.round(r.left) });
  return {
    bigGif: { src: big.src, w: Math.round(big.r.width), h: Math.round(big.r.height), topAbs: Math.round(big.r.top + scrollY) },
    media: mr ? { w: Math.round(mr.width), h: Math.round(mr.height), topAbs: Math.round(mr.top + scrollY), radius: getComputedStyle(media).borderRadius } : null,
    bigTopRelMedia: mr ? Math.round(big.r.top - mr.top) : null,
    bigBottomRelMedia: mr ? Math.round(big.r.bottom - mr.top) : null,
    allTall: tall.map((g) => ({ src: g.src, w: Math.round(g.r.width), h: Math.round(g.r.height), topRelMedia: mr ? Math.round(g.r.top - mr.top) : null, bottomRelMedia: mr ? Math.round(g.r.bottom - mr.top) : null })),
  };
});
console.log(JSON.stringify(data, null, 1));
// screenshot the media region
if (data.media) {
  const y = data.media.topAbs;
  await p.evaluate((yy) => scrollTo(0, yy - 40), y); await p.waitForTimeout(500);
  const clip = await p.evaluate(() => {
    const gifs = [...document.querySelectorAll('img')].filter((im) => /\.gif/i.test(im.currentSrc || im.src) && im.getBoundingClientRect().height > 350);
    let node = gifs[0]; let media = null;
    for (let k = 0; k < 8 && node; k++) { const cs = getComputedStyle(node); const r = node.getBoundingClientRect(); if ((cs.overflow === 'hidden' || cs.overflowY === 'hidden') && r.width > 300 && r.height > 300) { media = node; break; } node = node.parentElement; }
    const r = media.getBoundingClientRect();
    return { x: Math.max(0, Math.round(r.left) - 8), y: Math.max(0, Math.round(r.top) - 8), w: Math.round(r.width) + 16, h: Math.round(r.height) + 16 };
  });
  await p.screenshot({ path: `${dir}/live_media_clean.png`, clip: { x: clip.x, y: clip.y, width: Math.min(1440 - clip.x, clip.w), height: clip.h } });
  console.log('saved live_media_clean.png', JSON.stringify(clip));
}
await b.close();
