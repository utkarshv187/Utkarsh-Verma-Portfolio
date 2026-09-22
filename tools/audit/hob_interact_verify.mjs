import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/hob/mine2'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 80)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(600);
const y = await p.evaluate(() => document.querySelector('#not-designing').getBoundingClientRect().top + scrollY);
await p.evaluate((yy) => scrollTo(0, yy - 40), y);
await p.waitForTimeout(500);

// front photo of a pile (highest z-index card's img)
const front = () => p.evaluate((sel) => { const cards = [...document.querySelectorAll(sel + ' .hob__card')]; let top = null, mz = -1; cards.forEach((c) => { const z = +getComputedStyle(c).zIndex || 0; if (z > mz) { mz = z; top = c.querySelector('img').getAttribute('src').split('/').pop(); } }); return top; }, '.hob__pile');

// swipe helper in a direction (dx,dy) on the first pile
async function swipe(dx, dy) {
  await p.evaluate(({ dx, dy }) => {
    const pile = document.querySelector('.hob__pile'); const r = pile.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    pile.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx, clientY: cy, bubbles: true, pointerId: 1 }));
    for (let s = 1; s <= 5; s++) pile.dispatchEvent(new PointerEvent('pointermove', { clientX: cx + dx * s / 5, clientY: cy + dy * s / 5, bubbles: true, pointerId: 1 }));
    pile.dispatchEvent(new PointerEvent('pointerup', { clientX: cx + dx, clientY: cy + dy, bubbles: true, pointerId: 1 }));
  }, { dx, dy });
  await p.waitForTimeout(650);
}

const dirs = [['left', -90, 0], ['up', 0, -90], ['right', 90, 0], ['down', 0, 90]];
let prev = await front();
for (const [name, dx, dy] of dirs) { await swipe(dx, dy); const now = await front(); console.log(`swipe ${name.padEnd(6)}: ${prev} -> ${now} ${now !== prev ? 'CYCLED ✓' : 'no change ✗'}`); prev = now; }

// tap a pile (no move) -> 2x2 popup
await p.evaluate(() => { const pile = document.querySelector('.hob__pile'); const r = pile.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; pile.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx, clientY: cy, bubbles: true, pointerId: 2 })); pile.dispatchEvent(new PointerEvent('pointerup', { clientX: cx, clientY: cy, bubbles: true, pointerId: 2 })); });
await p.waitForTimeout(500);
const setInfo = await p.evaluate(() => { const s = document.querySelector('.hob__lb-set'); if (!s) return null; const cs = getComputedStyle(s); return { imgs: s.querySelectorAll('img').length, cols: cs.gridTemplateColumns.split(' ').length, blur: getComputedStyle(document.querySelector('.hob__lb')).backdropFilter }; });
console.log('\nhobby popup:', JSON.stringify(setInfo), setInfo && setInfo.imgs === 4 && setInfo.cols === 2 ? '=> 2×2 ✓' : '=> WRONG');
await p.screenshot({ path: `${dir}/popup_2x2.png` });
// click-outside closes
await p.evaluate(() => document.querySelector('.hob__lb').click()); await p.waitForTimeout(400);
console.log('click-outside closes:', !(await p.evaluate(() => !!document.querySelector('.hob__lb'))));

// grid lightbox
await p.evaluate((yy) => scrollTo(0, yy + 700), y); await p.waitForTimeout(500);
await p.evaluate(() => { const c = [...document.querySelectorAll('.hob__grid-cell')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 60 && r.bottom < 840; }); c && c.click(); });
await p.waitForTimeout(500);
const lb = await p.evaluate(() => { const el = document.querySelector('.hob__lb-photo'); return el ? { arrows: document.querySelectorAll('.hob__lb-arrow').length } : null; });
console.log('photo lightbox:', JSON.stringify(lb));
await p.screenshot({ path: `${dir}/lightbox.png` });

console.log('\nerrors:', errs.length, errs);
await b.close();
