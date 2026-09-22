import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/card2'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 90)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(800);
const c2 = await p.evaluate(() => [...document.querySelectorAll('.rw-card')][1].getBoundingClientRect().top + (window.scrollY || document.body.scrollTop));
const read = () => p.evaluate(() => {
  const dec = (el) => { const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/); if (!m) return { tx: 0, rot: 0 }; const a = m[1].split(',').map(parseFloat); return { tx: Math.round(a[4]), ty: Math.round(a[5]), rot: +(Math.atan2(a[1], a[0]) * 180 / Math.PI).toFixed(1) }; };
  const card = [...document.querySelectorAll('.rw-card')][1];
  const media = card.querySelector('.rw-card__media').getBoundingClientRect();
  const big = card.querySelector('.rw-gamify__b'); const small = card.querySelector('.rw-gamify__a');
  const bigR = big.getBoundingClientRect();
  return { big: dec(big), small: dec(small), bigTopRel: Math.round(bigR.top - media.top), bigBottomRel: Math.round(bigR.bottom - media.top) };
});
for (const [name, off] of Object.entries({ enter: -560, mid: -300, pin: -20 })) {
  await p.evaluate((y) => { window.scrollTo(0, y); document.documentElement.scrollTop = y; document.body.scrollTop = y; }, c2 + off);
  await p.waitForTimeout(800);
  const d = await read();
  console.log(`[${name}] big{tx:${d.big.tx}, ty:${d.big.ty}, rot:${d.big.rot}} small{tx:${d.small.tx}, ty:${d.small.ty}, rot:${d.small.rot}}  bigTop:${d.bigTopRel} bigBottom:${d.bigBottomRel}`);
}
console.log('errors:', errs.length, errs);
await b.close();
