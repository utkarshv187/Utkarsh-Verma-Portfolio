import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('ERR ' + e.message.slice(0, 90)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1200);
const y = await p.evaluate(() => document.querySelector('#not-designing').getBoundingClientRect().top + scrollY);

// FIX 3: cross-hobby overlap — measure each column's card AABB min/max x
await p.evaluate((yy) => scrollTo(0, yy - 40), y);
await p.waitForTimeout(600);
const cols = await p.evaluate(() => {
  return [...document.querySelectorAll('.hob__col')].map((col) => {
    const cards = [...col.querySelectorAll('.hob__card')].map((c) => c.getBoundingClientRect());
    const left = Math.min(...cards.map((r) => r.left)), right = Math.max(...cards.map((r) => r.right));
    return { title: col.querySelector('.hob__title').textContent, left: Math.round(left), right: Math.round(right) };
  });
});
console.log('FIX3 column card extents:');
for (const c of cols) console.log('  ', c.title, `[${c.left} - ${c.right}]`);
for (let i = 0; i < cols.length - 1; i++) { const gap = cols[i + 1].left - cols[i].right; console.log(`   gap ${cols[i].title}->${cols[i + 1].title}: ${gap}px ${gap < 0 ? 'OVERLAP!' : 'ok'}`); }

// FIX 2: stack image radius + FIX 1: last caret rotation
const rc = await p.evaluate(() => {
  const img = document.querySelector('.hob__card img');
  const caret = document.querySelector('.about__anchor--5 .about__caret');
  return { stackRadius: img ? getComputedStyle(img).borderRadius : null, lastCaretTransform: caret ? getComputedStyle(caret).transform : null };
});
console.log('\nFIX2 stack img radius:', rc.stackRadius, '| FIX1 last caret transform:', rc.lastCaretTransform);

// FIX 5: grid reveal — a lower cell should be scale<1 before view, scale 1 after
await p.evaluate((yy) => scrollTo(0, yy + 300), y); // photographing/grid entering
await p.waitForTimeout(300);
const beforeIn = await p.evaluate(() => { const cells = [...document.querySelectorAll('.hob__grid-cell')]; const c = cells[12]; const img = c.querySelector('img'); const t = getComputedStyle(img).transform; const m = t.match(/matrix\(([^)]+)\)/); return { sx: m ? +m[1].split(',')[0] : 1, op: getComputedStyle(img).opacity, inClass: c.classList.contains('hob__grid-cell--in') }; });
await p.evaluate(() => { const cells = [...document.querySelectorAll('.hob__grid-cell')]; cells[12].scrollIntoView({ block: 'center' }); });
await p.waitForTimeout(800);
const afterIn = await p.evaluate(() => { const cells = [...document.querySelectorAll('.hob__grid-cell')]; const c = cells[12]; const img = c.querySelector('img'); const t = getComputedStyle(img).transform; const m = t.match(/matrix\(([^)]+)\)/); return { sx: m ? +m[1].split(',')[0] : 1, op: getComputedStyle(img).opacity, inClass: c.classList.contains('hob__grid-cell--in') }; });
console.log('\nFIX5 grid cell#13: before-view', JSON.stringify(beforeIn), '| after-view', JSON.stringify(afterIn));

// FIX 6: click a grid cell -> lightbox overlay
await p.evaluate((yy) => scrollTo(0, yy + 500), y); await p.waitForTimeout(400);
await p.evaluate(() => { const c = [...document.querySelectorAll('.hob__grid-cell')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 50 && r.bottom < 850; }); c && c.click(); });
await p.waitForTimeout(500);
const lb1 = await p.evaluate(() => { const lb = document.querySelector('.hob__lb'); if (!lb) return null; const cs = getComputedStyle(lb); return { blur: cs.backdropFilter, bg: cs.backgroundColor, open: lb.classList.contains('hob__lb--open'), photo: !!lb.querySelector('.hob__lb-photo'), arrows: lb.querySelectorAll('.hob__lb-arrow').length }; });
console.log('\nFIX6 photo lightbox after grid click:', JSON.stringify(lb1));
// arrow next -> image changes
const img1 = await p.evaluate(() => document.querySelector('.hob__lb-photo img')?.src.split('/').pop());
await p.evaluate(() => document.querySelector('.hob__lb-arrow--next')?.click()); await p.waitForTimeout(300);
const img2 = await p.evaluate(() => document.querySelector('.hob__lb-photo img')?.src.split('/').pop());
console.log('   arrow next: ', img1, '->', img2, img1 !== img2 ? '(changed OK)' : '(no change)');
// click scrim closes
await p.evaluate(() => { const lb = document.querySelector('.hob__lb'); lb && lb.click(); }); await p.waitForTimeout(400);
console.log('   click-outside closes:', !(await p.evaluate(() => !!document.querySelector('.hob__lb'))));

// FIX 7: click a pile -> all 4
await p.evaluate((yy) => scrollTo(0, yy - 40), y); await p.waitForTimeout(400);
await p.evaluate(() => { const pile = document.querySelector('.hob__pile'); const r = pile.getBoundingClientRect(); pile.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true })); pile.dispatchEvent(new PointerEvent('pointerup', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true })); });
await p.waitForTimeout(500);
const lb2 = await p.evaluate(() => { const s = document.querySelector('.hob__lb-set'); return s ? { imgs: s.querySelectorAll('img').length, arrows: document.querySelectorAll('.hob__lb-arrow').length } : null; });
console.log('\nFIX7 hobby popup after pile tap:', JSON.stringify(lb2));
await p.keyboard.press('Escape'); await p.waitForTimeout(400);
console.log('   Esc closes:', !(await p.evaluate(() => !!document.querySelector('.hob__lb'))));

// FIX 4: swipe a pile -> order changes (front photo changes)
await p.waitForTimeout(200);
const front0 = await p.evaluate(() => { const cards = [...document.querySelectorAll('.hob__pile')][0].querySelectorAll('.hob__card'); let top = null, maxz = -1; cards.forEach((c) => { const z = +getComputedStyle(c).zIndex || 0; if (z > maxz) { maxz = z; top = c.querySelector('img').src.split('/').pop(); } }); return top; });
await p.evaluate(() => { const pile = document.querySelector('.hob__pile'); const r = pile.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; pile.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx + 80, clientY: cy, bubbles: true })); pile.dispatchEvent(new PointerEvent('pointermove', { clientX: cx - 80, clientY: cy, bubbles: true })); pile.dispatchEvent(new PointerEvent('pointerup', { clientX: cx - 80, clientY: cy, bubbles: true })); });
await p.waitForTimeout(600);
const front1 = await p.evaluate(() => { const cards = [...document.querySelectorAll('.hob__pile')][0].querySelectorAll('.hob__card'); let top = null, maxz = -1; cards.forEach((c) => { const z = +getComputedStyle(c).zIndex || 0; if (z > maxz) { maxz = z; top = c.querySelector('img').src.split('/').pop(); } }); return top; });
console.log('\nFIX4 swipe: front photo', front0, '->', front1, front0 !== front1 ? '(cycled OK)' : '(no change)');

console.log('\nerrors:', errs.length, errs.slice(0, 3));
await b.close();
