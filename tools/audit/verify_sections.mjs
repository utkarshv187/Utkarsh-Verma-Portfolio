import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'about');
const b = await chromium.launch({ headless: true });

// ---------- desktop: motion + reveal ----------
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1000);
const ttsY = await p.evaluate(() => document.querySelector('#things-they-say').getBoundingClientRect().top + scrollY);
const aboutY = await p.evaluate(() => document.querySelector('#more-about-me').getBoundingClientRect().top + scrollY);

// tts marquee moving?
await p.evaluate((y) => scrollTo(0, y), ttsY - 40);
await p.waitForTimeout(500);
const trackTx = (sel) => p.evaluate((s) => { const t = getComputedStyle(document.querySelector(s)).transform; const m = t.match(/matrix\(([^)]+)\)/); return m ? +m[1].split(',')[4] : 0; }, sel);
const t0 = await trackTx('.tts__track'); await p.waitForTimeout(1200); const t1 = await trackTx('.tts__track');
console.log('TTS marquee: tx', t0.toFixed(1), '->', t1.toFixed(1), '=>', Math.abs(t1 - t0) > 2 ? 'MOVES ' + ((t1 - t0) / 1.2).toFixed(0) + 'px/s' : 'static');

// reveal: check inserts start hidden (fresh approach) then reveal
await p.evaluate(() => scrollTo(0, 0));
await p.waitForTimeout(300);
await p.evaluate((y) => scrollTo(0, y - 950), aboutY); // about below viewport
await p.waitForTimeout(400);
const before = await p.evaluate(() => { const e = document.querySelector('.about__ins--5 .about__ins-text'); return { op: +getComputedStyle(e).opacity, inClass: document.querySelector('.about__bio').classList.contains('about__bio--in') }; });
await p.evaluate((y) => scrollTo(0, y + 250), aboutY); // bring bio into view
await p.waitForTimeout(200);
const mid = await p.evaluate(() => +getComputedStyle(document.querySelector('.about__ins--5 .about__ins-text')).opacity);
await p.waitForTimeout(900);
const after = await p.evaluate(() => +getComputedStyle(document.querySelector('.about__ins--5 .about__ins-text')).opacity);
console.log('REVEAL: before(op)=', before.op, 'inClass=', before.inClass, '| just-in=', mid.toFixed(2), '| settled=', after.toFixed(2), '=>', before.op < 0.1 && after > 0.9 ? 'ANIMATES' : 'check');

// about icon marquee moving?
await p.evaluate((y) => scrollTo(0, y + 620), aboutY);
await p.waitForTimeout(500);
const a0 = await trackTx('.about__track'); await p.waitForTimeout(1200); const a1 = await trackTx('.about__track');
console.log('ICON marquee: tx', a0.toFixed(1), '->', a1.toFixed(1), '=>', Math.abs(a1 - a0) > 2 ? 'MOVES ' + ((a1 - a0) / 1.2).toFixed(0) + 'px/s' : 'static');
await p.close();

// ---------- mobile ----------
const mp = await (await b.newContext({ viewport: { width: 390, height: 840 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' })).newPage();
await mp.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await mp.waitForTimeout(1200);
await mp.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
const mTts = await mp.evaluate(() => { const c = document.querySelector('#things-they-say'); scrollTo(0, c.getBoundingClientRect().top + scrollY - 10); });
await mp.waitForTimeout(600);
await sharp(await mp.screenshot({ clip: { x: 0, y: 0, width: 390, height: 760 } })).toFile(join(OUT, 'mine_tts_mobile.png'));
await mp.evaluate(() => { const c = document.querySelector('#more-about-me'); scrollTo(0, c.getBoundingClientRect().top + scrollY - 10); });
await mp.waitForTimeout(700);
await sharp(await mp.screenshot({ clip: { x: 0, y: 0, width: 390, height: 820 } })).toFile(join(OUT, 'mine_about_mobile.png'));
await mp.close();
console.log('wrote mobile screenshots');
await b.close();
