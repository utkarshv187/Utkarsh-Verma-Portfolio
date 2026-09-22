import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'fs';
const dir = 'audit/out/hob/mine2';
// re-shoot my stacks band + popup
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(600);
const y = await p.evaluate(() => document.querySelector('#not-designing').getBoundingClientRect().top + scrollY);
// align so the stacks sit like live's scan_2 (titles near y ~690)
await p.evaluate((yy) => scrollTo(0, yy - 40), y); await p.waitForTimeout(500);
await p.screenshot({ path: `${dir}/band_mine.png`, clip: { x: 0, y: 120, width: 1440, height: 640 } });
// popup fit re-check
await p.evaluate(() => { const pile = document.querySelector('.hob__pile'); const r = pile.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; pile.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx, clientY: cy, bubbles: true, pointerId: 3 })); pile.dispatchEvent(new PointerEvent('pointerup', { clientX: cx, clientY: cy, bubbles: true, pointerId: 3 })); });
await p.waitForTimeout(500);
const fit = await p.evaluate(() => { const s = document.querySelector('.hob__lb-set').getBoundingClientRect(); return { top: Math.round(s.top), bottom: Math.round(s.bottom), inView: s.top >= 0 && s.bottom <= innerHeight }; });
console.log('popup set rect:', JSON.stringify(fit), fit.inView ? 'FITS ✓' : 'overflow ✗');
await p.screenshot({ path: `${dir}/popup_fit.png` });
await b.close();

// side-by-side: live scan_2 (band) over mine band
const liveBand = 'audit/out/hob/live2/scan_2_y7984.png'; // 1440x720
const live = await sharp(liveBand).extract({ left: 0, top: 60, width: 1440, height: 640 }).toBuffer();
const mine = await sharp(`${dir}/band_mine.png`).toBuffer();
const label = (txt) => Buffer.from(`<svg width="1440" height="34"><rect width="1440" height="34" fill="#111"/><text x="12" y="24" font-family="Arial" font-size="20" fill="#fff">${txt}</text></svg>`);
await sharp({ create: { width: 1440, height: 34 + 640 + 34 + 640, channels: 3, background: '#000' } })
  .composite([
    { input: label('LIVE'), top: 0, left: 0 },
    { input: live, top: 34, left: 0 },
    { input: label('MINE'), top: 34 + 640, left: 0 },
    { input: mine, top: 34 + 640 + 34, left: 0 },
  ]).png().toFile(`${dir}/sbs_1440.png`);
console.log('wrote sbs_1440.png');
