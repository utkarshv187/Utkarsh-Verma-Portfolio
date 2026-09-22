import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/fix5'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(900);

// FIX1: About click lands heading just under header
await p.evaluate(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }); await p.waitForTimeout(300);
await p.evaluate(() => { const a = [...document.querySelectorAll('.nav-link')].find((x) => /About/.test(x.textContent)); a && a.click(); });
await p.waitForTimeout(1200);
const land = await p.evaluate(() => { const h = document.getElementById('about'); return { headingTop: Math.round(h.getBoundingClientRect().top) }; });
console.log('FIX1 heading top after click:', land.headingTop, '(header is 80px; ~112 = clean gap under it)');

// screenshot GoToTop button (scroll into about+below)
await p.evaluate(() => { const el = document.getElementById('more-about-me'); const y = el.getBoundingClientRect().top + (window.scrollY || document.body.scrollTop) + 500; document.documentElement.scrollTop = y; document.body.scrollTop = y; });
await p.waitForTimeout(800);
const r = await p.evaluate(() => { const el = document.querySelector('.gtt'); const b = el.getBoundingClientRect(); return { x: Math.round(b.left) - 16, y: Math.round(b.top) - 16, w: Math.round(b.width) + 32, h: Math.round(b.height) + 32 }; });
await p.screenshot({ path: `${dir}/mine_gtt.png`, clip: { x: r.x, y: r.y, width: r.w, height: r.h } });
console.log('saved mine_gtt.png');

// FIX5: capture the phrases mid/after reveal — scroll about heading to top to (re)trigger, wait, shoot
await p.evaluate(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }); await p.waitForTimeout(300);
await p.evaluate(() => { const el = document.getElementById('about'); const y = el.getBoundingClientRect().top + (window.scrollY || document.body.scrollTop) - 60; document.documentElement.scrollTop = y; document.body.scrollTop = y; });
await p.waitForTimeout(2600);
const bio = await p.evaluate(() => { const el = document.querySelector('.about__bio'); const r = el.getBoundingClientRect(); return { x: Math.max(0, Math.round(r.left) - 10), y: Math.max(0, Math.round(r.top) - 20), w: Math.min(1440, Math.round(r.width) + 20), h: Math.round(r.height) + 40 }; });
await p.screenshot({ path: `${dir}/mine_phrases.png`, clip: bio });
console.log('saved mine_phrases.png (all 5 script phrases should be visible, settled)');

console.log('errors:', errs.length, errs);
await b.close();
