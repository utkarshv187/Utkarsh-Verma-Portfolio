import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/card2'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(800);
const c2top = await p.evaluate(() => [...document.querySelectorAll('.rw-card')][1].getBoundingClientRect().top + (window.scrollY || document.body.scrollTop));
// several scroll offsets relative to card2 pin: entering(spin~0) -> pinned(spin~1)
const offsets = { enter: -560, mid: -300, pin: -20 };
for (const [name, off] of Object.entries(offsets)) {
  await p.evaluate((y) => { window.scrollTo(0, y); document.documentElement.scrollTop = y; document.body.scrollTop = y; }, c2top + off);
  await p.waitForTimeout(800);
  const d = await p.evaluate(() => {
    const card = [...document.querySelectorAll('.rw-card')][1];
    const media = card.querySelector('.rw-card__media').getBoundingClientRect();
    const big = card.querySelector('.rw-gamify__b').getBoundingClientRect();
    const small = card.querySelector('.rw-gamify__a').getBoundingClientRect();
    const rel = (r) => ({ top: +(r.top - media.top).toFixed(0), bottom: +(r.bottom - media.top).toFixed(0), left: +(r.left - media.left).toFixed(0), right: +(r.right - media.left).toFixed(0) });
    return { mediaH: Math.round(media.height), mediaW: Math.round(media.width), big: rel(big), small: rel(small), bigBottomGap: +(media.height - (big.bottom - media.top)).toFixed(0), inView: media.top > 0 && media.top < 700 };
  });
  console.log(`[${name}] `, JSON.stringify(d));
  // clip to media box
  const clip = await p.evaluate(() => { const m = document.querySelectorAll('.rw-card')[1].querySelector('.rw-card__media').getBoundingClientRect(); return { x: Math.max(0, Math.round(m.left)), y: Math.max(0, Math.round(m.top)), w: Math.round(m.width), h: Math.round(m.height) }; });
  if (clip.y >= 0 && clip.y < 850) await p.screenshot({ path: `${dir}/mine_spin_${name}.png`, clip: { x: clip.x, y: clip.y, width: Math.min(1440 - clip.x, clip.w), height: Math.min(900 - clip.y, clip.h) } });
}
await b.close();
