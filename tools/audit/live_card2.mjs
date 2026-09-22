import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/card2'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
// slow scroll through the whole page
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.4) { scrollTo(0, y); await new Promise(r => setTimeout(r, 130)); } });
await p.waitForTimeout(500);
// find the gamification GIFs (200x438 & 253x552 per audit) — animated phone screenshots
const info = await p.evaluate(() => {
  const gifs = [...document.querySelectorAll('img')].filter((im) => { const s = (im.currentSrc || im.src); return /\.gif/i.test(s); }).map((im) => { const r = im.getBoundingClientRect(); return { src: (im.currentSrc || im.src).split('/').pop().slice(0, 16), w: Math.round(r.width), h: Math.round(r.height), topAbs: Math.round(r.top + scrollY) }; });
  return gifs;
});
console.log('GIFs on page:', JSON.stringify(info, null, 1));
// the gamification pair are the two tall gifs near each other; scroll to them
const pair = info.filter((g) => g.h > 200 && g.h < 700);
if (pair.length) {
  const targetY = Math.min(...pair.map((g) => g.topAbs)) - 120;
  await p.evaluate((y) => scrollTo(0, y), targetY); await p.waitForTimeout(900);
  // find the enclosing card (purple bg) and clip
  const box = await p.evaluate(() => {
    const gifs = [...document.querySelectorAll('img')].filter((im) => /\.gif/i.test(im.currentSrc || im.src) && im.getBoundingClientRect().height > 200);
    if (!gifs.length) return null;
    // climb to a purple-bg ancestor (the card)
    let node = gifs[0];
    for (let k = 0; k < 12 && node; k++) { const bg = getComputedStyle(node).backgroundColor; if (/86, 35, 154|56, 35|purple/i.test(bg) || (node.getBoundingClientRect().width > 900)) break; node = node.parentElement; }
    const r = (node || gifs[0]).getBoundingClientRect();
    return { x: Math.max(0, Math.round(r.left)), y: Math.max(0, Math.round(r.top)), w: Math.round(r.width), h: Math.round(r.height) };
  });
  if (box) { await p.screenshot({ path: `${dir}/live_card2_full.png`, clip: { x: box.x, y: box.y, width: Math.min(1440 - box.x, box.w), height: Math.min(1100 - box.y, box.h) } }); console.log('saved live_card2_full.png', JSON.stringify(box)); }
  // also a tight clip of just the media (left third)
  const mb = await p.evaluate(() => {
    const gifs = [...document.querySelectorAll('img')].filter((im) => /\.gif/i.test(im.currentSrc || im.src) && im.getBoundingClientRect().height > 200).map((im) => im.getBoundingClientRect());
    const l = Math.min(...gifs.map((r) => r.left)), t = Math.min(...gifs.map((r) => r.top)), rt = Math.max(...gifs.map((r) => r.right)), bt = Math.max(...gifs.map((r) => r.bottom));
    return { gifTop: Math.round(t), gifBottom: Math.round(bt), gifLeft: Math.round(l), gifRight: Math.round(rt) };
  });
  console.log('live gif bounds (viewport):', JSON.stringify(mb));
}
await b.close();
