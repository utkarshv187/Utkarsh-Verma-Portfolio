import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0, 90)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1200);

const tx = (sel) => p.evaluate((s) => { const t = getComputedStyle(document.querySelector(s)).transform; const m = t.match(/matrix\(([^)]+)\)/); return m ? +m[1].split(',')[4] : 0; }, sel);

// ===== TESTIMONIALS =====
const ttsY = await p.evaluate(() => document.querySelector('#things-they-say').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo(0, y - 200), ttsY);
await p.waitForTimeout(600);
// auto speed (no hover): move mouse far away first
await p.mouse.move(10, 10);
await p.waitForTimeout(400);
let a = await tx('.tts__track'); await p.waitForTimeout(1500); let b2 = await tx('.tts__track');
// account for wrap: speed ~ leftward; compute delta but if it wrapped (+jump) approximate
let sp = (b2 - a) / 1.5;
console.log('TTS auto speed ~', sp.toFixed(1), 'px/s (expect ~ -48)');
// hover: move over the marquee
const box = await p.evaluate(() => { const m = document.querySelector('.tts__marquee').getBoundingClientRect(); return { x: Math.round(m.left + m.width / 2), y: Math.round(m.top + m.height / 2) }; });
await p.mouse.move(box.x, box.y);
await p.waitForTimeout(700); // let speed ease
let h1 = await tx('.tts__track'); await p.waitForTimeout(1500); let h2 = await tx('.tts__track');
console.log('TTS hover speed ~', ((h2 - h1) / 1.5).toFixed(1), 'px/s (expect ~ -24, half)');

// DRAG test: pointerdown on marquee, move right 150px, up
const before = await tx('.tts__track');
await p.mouse.move(box.x, box.y);
await p.mouse.down();
for (let i = 1; i <= 10; i++) { await p.mouse.move(box.x + i * 15, box.y); await p.waitForTimeout(10); }
const during = await tx('.tts__track');
await p.mouse.up();
console.log('TTS drag: track tx', before.toFixed(0), '->', during.toFixed(0), '(moved by drag:', (during - before).toFixed(0) + 'px, expect ~+150)');

// CLICK GUARD: after a drag, a click should NOT open a popup
const ctx = p.context();
let opened = null;
const popupP = ctx.waitForEvent('page', { timeout: 1200 }).then((pg) => { opened = pg.url(); pg.close().catch(() => {}); }).catch(() => {});
await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.mouse.move(box.x - 120, box.y, { steps: 8 }); await p.mouse.up();
await popupP;
console.log('TTS click-after-drag opened:', opened || 'NOTHING (correct — drag suppressed navigation)');

// ===== TICKER =====
const aboutY = await p.evaluate(() => document.querySelector('#more-about-me').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo(0, y + 560), aboutY);
await p.waitForTimeout(600);
let t1 = await tx('.about__track'); await p.waitForTimeout(1500); let t2 = await tx('.about__track');
console.log('\nTICKER auto speed ~', ((t2 - t1) / 1.5).toFixed(1), 'px/s (expect ~ -25)');
const tbox = await p.evaluate(() => { const m = document.querySelector('.about__marquee').getBoundingClientRect(); return { x: Math.round(m.left + m.width / 2), y: Math.round(m.top + m.height / 2) }; });
const tb = await tx('.about__track');
await p.mouse.move(tbox.x, tbox.y); await p.mouse.down();
for (let i = 1; i <= 10; i++) { await p.mouse.move(tbox.x + i * 14, tbox.y); await p.waitForTimeout(10); }
const td = await tx('.about__track');
await p.mouse.up();
console.log('TICKER drag: tx', tb.toFixed(0), '->', td.toFixed(0), '(moved', (td - tb).toFixed(0) + 'px, expect ~+140)');
// grab cursor CSS applied?
const grabCur = await p.evaluate(() => getComputedStyle(document.querySelector('.about__marquee')).cursor);
console.log('TICKER cursor:', grabCur);

console.log('\nerrors:', errs.length, errs.slice(0, 3));
await b.close();
