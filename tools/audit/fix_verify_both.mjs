import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/gtt2'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });

// ===== GTT default + hover (desktop) =====
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 90)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(800);
await p.evaluate(() => { const el = document.getElementById('more-about-me'); const y = el.getBoundingClientRect().top + (window.scrollY || document.body.scrollTop) + 400; window.scrollTo(0, y); document.documentElement.scrollTop = y; document.body.scrollTop = y; });
await p.waitForTimeout(700);
const gb = await p.evaluate(() => { const r = document.querySelector('.gtt').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), cx: Math.round(r.left) - 40, cy: Math.round(r.top) - 40 }; });
// default (move mouse away)
await p.mouse.move(gb.x - 500, gb.y - 500); await p.waitForTimeout(400);
await p.screenshot({ path: `${dir}/mine_default.png`, clip: { x: gb.cx, y: gb.cy, width: 160, height: 160 } });
const defState = await p.evaluate(() => { const l = getComputedStyle(document.querySelector('.gtt__label')); const a = getComputedStyle(document.querySelector('.gtt__arrow')); return { labelOpacity: l.opacity, labelText: document.querySelector('.gtt__label').textContent, arrowTransform: a.transform }; });
// hover
await p.mouse.move(gb.x, gb.y); await p.waitForTimeout(700);
await p.screenshot({ path: `${dir}/mine_hover.png`, clip: { x: gb.cx, y: gb.cy, width: 160, height: 160 } });
const hovState = await p.evaluate(() => { const l = getComputedStyle(document.querySelector('.gtt__label')); const a = getComputedStyle(document.querySelector('.gtt__arrow')); return { labelOpacity: l.opacity, labelFont: l.fontFamily.slice(0, 14), labelSize: l.fontSize, labelColor: l.color, arrowTransform: a.transform }; });
console.log('GTT default:', JSON.stringify(defState));
console.log('GTT hover  :', JSON.stringify(hovState));
console.log('errors:', errs.length, errs);
await p.close();

// ===== GTT mobile default =====
const mp = await (await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })).newPage();
await mp.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await mp.waitForTimeout(800);
await mp.evaluate(() => { const el = document.getElementById('more-about-me'); const y = el.getBoundingClientRect().top + (window.scrollY || document.body.scrollTop) + 300; window.scrollTo(0, y); document.documentElement.scrollTop = y; document.body.scrollTop = y; });
await mp.waitForTimeout(700);
const mgb = await mp.evaluate(() => { const el = document.querySelector('.gtt'); const r = el.getBoundingClientRect(); return { ok: el.classList.contains('gtt--show'), cx: Math.max(0, Math.round(r.left) - 30), cy: Math.max(0, Math.round(r.top) - 30) }; });
await mp.screenshot({ path: `${dir}/mine_mobile.png`, clip: { x: mgb.cx, y: mgb.cy, width: 130, height: 130 } });
console.log('GTT mobile show:', mgb.ok);
// card 2 mobile
const c2y = await mp.evaluate(() => { const cards = [...document.querySelectorAll('.rw-card')]; return cards[1].getBoundingClientRect().top + (window.scrollY || document.body.scrollTop); });
await mp.evaluate((y) => { const t = y - 80; window.scrollTo(0, t); document.documentElement.scrollTop = t; document.body.scrollTop = t; }, c2y);
await mp.waitForTimeout(700);
const mm = await mp.evaluate(() => { const media = document.querySelectorAll('.rw-card')[1].querySelector('.rw-card__media'); const r = media.getBoundingClientRect(); const big = document.querySelectorAll('.rw-card')[1].querySelector('.rw-gamify__b').getBoundingClientRect(); return { clip: { x: Math.max(0, Math.round(r.left)), y: Math.max(0, Math.round(r.top)), w: Math.round(r.width), h: Math.round(r.height) }, bigBottomOverflow: +(big.bottom - r.bottom).toFixed(0), bigTopVsMediaTop: +(big.top - r.top).toFixed(0) }; });
if (mm.clip.y < 700) await mp.screenshot({ path: `${dir}/mine_card2_mobile.png`, clip: { x: mm.clip.x, y: mm.clip.y, width: Math.min(390 - mm.clip.x, mm.clip.w), height: Math.min(844 - mm.clip.y, mm.clip.h) } });
console.log('card2 mobile: bigBottomOverflow(px, >=0 good)=', mm.bigBottomOverflow, ' bigTopVsMediaTop(<=0 good)=', mm.bigTopVsMediaTop);
await mp.close();

// ===== card 2 tablet =====
const tp = await (await b.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await tp.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await tp.waitForTimeout(800);
const tc2 = await tp.evaluate(() => [...document.querySelectorAll('.rw-card')][1].getBoundingClientRect().top + (window.scrollY || document.body.scrollTop));
await tp.evaluate((y) => { const t = y - 20; window.scrollTo(0, t); document.documentElement.scrollTop = t; document.body.scrollTop = t; }, tc2);
await tp.waitForTimeout(700);
const tm = await tp.evaluate(() => { const media = document.querySelectorAll('.rw-card')[1].querySelector('.rw-card__media'); const r = media.getBoundingClientRect(); const big = document.querySelectorAll('.rw-card')[1].querySelector('.rw-gamify__b').getBoundingClientRect(); return { clip: { x: Math.max(0, Math.round(r.left)), y: Math.max(0, Math.round(r.top)), w: Math.round(r.width), h: Math.round(r.height) }, bigBottomOverflow: +(big.bottom - r.bottom).toFixed(0), bigTopVsMediaTop: +(big.top - r.top).toFixed(0) }; });
if (tm.clip.y < 700) await tp.screenshot({ path: `${dir}/mine_card2_tablet.png`, clip: { x: tm.clip.x, y: tm.clip.y, width: Math.min(1024 - tm.clip.x, tm.clip.w), height: Math.min(900 - tm.clip.y, tm.clip.h) } });
console.log('card2 tablet: bigBottomOverflow=', tm.bigBottomOverflow, ' bigTopVsMediaTop=', tm.bigTopVsMediaTop);
await tp.close();
await b.close();
