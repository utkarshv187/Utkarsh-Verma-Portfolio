import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0, 90)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1200);

// ===== FIX 1: WE stat scramble — no layout shift, never blank =====
const weY = await p.evaluate(() => document.querySelector('#work-experience').getBoundingClientRect().top + scrollY);
// approach the stats from ABOVE view: park with stats just below viewport
await p.evaluate((y) => scrollTo(0, y - 600), weY);
await p.waitForTimeout(400);
// measure the value box + text BEFORE the stats are in view (should already be scrambling, sized)
const before = await p.evaluate(() => {
  const v = document.querySelector('.we-card__value');
  const live = document.querySelector('.we-card__value-live');
  const ghost = document.querySelector('.we-card__value-ghost');
  const r = v.getBoundingClientRect();
  return { boxW: Math.round(r.width), boxH: Math.round(r.height), liveText: live.textContent, ghostText: ghost.textContent, blank: /^\s*$/.test(live.textContent) };
});
// now scroll the stats fully into view and sample the box during the resolve
await p.evaluate(() => { const s = document.querySelector('.we__stats'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 300); });
const during = [];
for (let i = 0; i < 8; i++) {
  const m = await p.evaluate(() => { const v = document.querySelector('.we-card__value'); const live = document.querySelector('.we-card__value-live'); const r = v.getBoundingClientRect(); return { w: Math.round(r.width), left: Math.round(r.left), top: Math.round(r.top), t: live.textContent }; });
  during.push(m);
  await p.waitForTimeout(150);
}
console.log('FIX1 WE scramble:');
console.log('  before-view:', JSON.stringify(before));
const widths = during.map((d) => d.w), lefts = during.map((d) => d.left), tops = during.map((d) => d.top);
console.log('  during resolve box widths:', JSON.stringify(widths), '| lefts:', JSON.stringify([...new Set(lefts)]), '| tops:', JSON.stringify([...new Set(tops)]));
console.log('  texts:', JSON.stringify(during.map((d) => d.t)));
const noShift = new Set(widths).size === 1 && new Set(lefts).size === 1 && new Set(tops).size === 1;
console.log('  ZERO layout shift (constant box):', noShift, '| never blank before view:', !before.blank);

// ===== FIX 2/4: ticker speed 50 auto, 25 hover =====
const aboutY = await p.evaluate(() => document.querySelector('#more-about-me').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo(0, y + 560), aboutY);
await p.mouse.move(10, 10); await p.waitForTimeout(500);
const tx = () => p.evaluate(() => { const t = getComputedStyle(document.querySelector('.about__track')).transform; const m = t.match(/matrix\(([^)]+)\)/); return m ? +m[1].split(',')[4] : 0; });
let a1 = await tx(); await p.waitForTimeout(1500); let a2 = await tx();
console.log('\nFIX2 ticker auto speed ~', ((a2 - a1) / 1.5).toFixed(1), 'px/s (expect ~ -50)');
const box = await p.evaluate(() => { const m = document.querySelector('.about__marquee').getBoundingClientRect(); return { x: Math.round(m.left + m.width / 2), y: Math.round(m.top + m.height / 2) }; });
await p.mouse.move(box.x, box.y); await p.waitForTimeout(700);
let h1 = await tx(); await p.waitForTimeout(1500); let h2 = await tx();
console.log('FIX4 ticker hover speed ~', ((h2 - h1) / 1.5).toFixed(1), 'px/s (expect ~ -25, half)');

// ===== FIX 3: no grab/pointer cursor on the ticker =====
const cur = await p.evaluate(() => getComputedStyle(document.querySelector('.about__marquee')).cursor);
console.log('FIX3 ticker cursor:', cur, '(expect none — site custom cursor, not grab/pointer)');

console.log('\nerrors:', errs.length, errs.slice(0, 3));
await b.close();
