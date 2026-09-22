import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'about');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' })).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0, 80)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1200);

// FIX 1: RW -> TTS gap (scroll so TTS heading near top; measure card4 bottom to purple)
const ttsY = await p.evaluate(() => document.querySelector('#things-they-say').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo(0, y - 430), ttsY);
await p.waitForTimeout(500);
const gap = await p.evaluate(() => { const c = document.querySelector('.rw-card--beyond').getBoundingClientRect(); const tts = document.querySelector('#things-they-say').getBoundingClientRect(); return { cardBottom: Math.round(c.bottom), ttsTop: Math.round(tts.top), gap: Math.round(tts.top - c.bottom) }; });
console.log('FIX1 gap card4->TTS:', JSON.stringify(gap), '(target ~120)');
await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 760 } })).resize(560).toFile(join(OUT, 'v_gap_mine.png'));

// FIX 3/4/5: about bio — scroll in, let the full sequence play (~3s), capture final
const aboutY = await p.evaluate(() => document.querySelector('#more-about-me').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo(0, y - 60), aboutY);
await p.waitForTimeout(3400); // words + 5 inserts sequence
const caretFont = await p.evaluate(() => { const c = document.querySelector('.about__caret'); return { ff: getComputedStyle(c).fontFamily.split(',')[0], fs: getComputedStyle(c).fontSize, op: getComputedStyle(c).opacity }; });
console.log('FIX5 caret font:', JSON.stringify(caretFont));
await sharp(await p.screenshot({ clip: { x: 0, y: 120, width: 1440, height: 640 } })).resize(720).toFile(join(OUT, 'v_bio_mine.png'));

// FIX 6: ticker LEARNING badge (close-up on the Rive icon)
await p.evaluate((y) => scrollTo(0, y + 560), aboutY);
await p.waitForTimeout(700);
const learn = await p.evaluate(() => { const l = document.querySelector('.about__learning'); if (!l) return null; const r = l.getBoundingClientRect(); const icon = l.closest('.about__icon').getBoundingClientRect(); return { badgeBottom: Math.round(r.bottom), iconBottom: Math.round(icon.bottom), fullyInside: r.bottom <= icon.bottom + 1, text: l.textContent, w: Math.round(r.width), iconW: Math.round(icon.width) }; });
console.log('FIX6 LEARNING badge:', JSON.stringify(learn));
await sharp(await p.screenshot({ clip: { x: 0, y: 380, width: 1440, height: 260 } })).resize(720).toFile(join(OUT, 'v_ticker_mine.png'));

console.log('errors:', errs.length, errs.slice(0, 4));
await b.close();
console.log('done');
