import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1000);

// ===== FIX 5: Spinny reveal via SCROLL with a stationary cursor =====
const weTop = await p.evaluate(() => document.querySelector('#work-experience').getBoundingClientRect().top + scrollY);
// start well above WE so the cursor point is NOT over the section
await p.evaluate((y) => window.scrollTo(0, y), weTop - 1200);
await p.waitForTimeout(300);
// park the cursor ONCE around mid-viewport; never move it again
const CX = 700, CY = 500;
await p.mouse.move(CX, CY);
await p.waitForTimeout(200);
const before = await p.evaluate(() => ({ open: !!document.querySelector('.we__reveal--open'), under: (document.elementFromPoint(700, 500)?.closest('#work-experience')) ? 'WE' : 'other' }));
// now SCROLL the WE section under the stationary cursor, step by step (no mouse move)
let openedAt = null, firstUnderAt = null;
for (let dy = -1100; dy <= 200; dy += 100) {
  await p.evaluate((y) => window.scrollTo(0, y), weTop + dy);
  await p.waitForTimeout(140);
  const s = await p.evaluate(() => ({ open: !!document.querySelector('.we__reveal--open'), under: (document.elementFromPoint(700, 500)?.closest('#work-experience')) ? 'WE' : 'other' }));
  if (s.under === 'WE' && firstUnderAt === null) firstUnderAt = dy;
  if (s.open && openedAt === null) openedAt = dy;
}
console.log('FIX5 Spinny-via-scroll:');
console.log('  before scrolling into WE: reveal open =', before.open, '(under cursor:', before.under + ')');
console.log('  WE first under cursor at dy =', firstUnderAt, '| reveal opened at dy =', openedAt);
console.log('  PASS =', before.open === false && openedAt !== null && openedAt <= firstUnderAt + 100);

// ===== FIX 2: number scramble only STARTS once the stat boxes are visible =====
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
const secTop = await p.evaluate(() => document.querySelector('#recent-work').getBoundingClientRect().top + scrollY);
// approach card 1 stats slowly; capture the number text as the stats cross into view
const readNums = () => p.evaluate(() => {
  const card = document.querySelector('.rw-card--auction');
  const stats = card.querySelector('.rw-card__stats');
  const r = stats.getBoundingClientRect();
  const visible = r.top < innerHeight * 0.9 && r.bottom > innerHeight * 0.1;
  const nums = [...card.querySelectorAll('.rw-stat__num')].map((n) => n.textContent);
  const finals = ['13%', '9%', '40%', '2x'];
  const resolved = nums.every((t, i) => t === finals[i]);
  const blank = nums.every((t) => /^\s*$/.test(t));
  return { visible: Math.round(r.top), inView: visible, nums, resolved, blank };
});
console.log('\nFIX2 scramble-on-stats-visible (card 1):');
let sawBlankBefore = false, sawScrambleInView = false;
for (let dy = -200; dy <= 700; dy += 60) {
  await p.evaluate((y) => window.scrollTo(0, y), secTop + dy);
  await p.waitForTimeout(90);
  const s = await readNums();
  const scrambling = !s.blank && !s.resolved;
  if (!s.inView && s.blank) sawBlankBefore = true;
  if (s.inView && scrambling) sawScrambleInView = true;
  if (dy % 180 === -200 % 180 || scrambling) console.log(`  statsTop=${String(s.visible).padStart(4)} inView=${s.inView} blankBefore=${s.blank} scrambling=${scrambling} nums=${JSON.stringify(s.nums)}`);
}
console.log('  blank while off-screen =', sawBlankBefore, '| scrambling while in view =', sawScrambleInView);
console.log('  PASS =', sawBlankBefore && sawScrambleInView);
await b.close();
