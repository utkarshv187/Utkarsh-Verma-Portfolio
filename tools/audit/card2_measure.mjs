import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/card2'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });

// ---- MINE: measure phone wrappers vs media box, screenshot full card 2 ----
const p = await (await b.newContext({ viewport: { width: 1440, height: 1200 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(800);
const c2top = await p.evaluate(() => { const cards = [...document.querySelectorAll('.rw-card')]; const c = cards[1]; return c.getBoundingClientRect().top + (window.scrollY || document.body.scrollTop); });
// scroll so card2 is pinned and fan fully open (spin completes ~ pin)
await p.evaluate((y) => { const t = y - 20; window.scrollTo(0, t); document.documentElement.scrollTop = t; document.body.scrollTop = t; }, c2top);
await p.waitForTimeout(900);
const m = await p.evaluate(() => {
  const card = [...document.querySelectorAll('.rw-card')][1];
  const media = card.querySelector('.rw-card__media').getBoundingClientRect();
  const wraps = [...card.querySelectorAll('.rw-gamify__wrap')].map((w) => { const r = w.getBoundingClientRect(); const cls = w.className.includes('__a') ? 'small' : 'big'; return { cls, top: +(r.top - media.top).toFixed(1), bottom: +(r.bottom - media.top).toFixed(1), left: +(r.left - media.left).toFixed(1), h: Math.round(r.height) }; });
  const lowestCover = Math.max(...wraps.map((w) => w.bottom));
  return { mediaH: Math.round(media.height), wraps, bottomGap: +(media.height - lowestCover).toFixed(1) };
});
console.log('MINE card2 (media-relative):', JSON.stringify(m, null, 1));
const cardBox = await p.evaluate(() => { const c = [...document.querySelectorAll('.rw-card')][1].getBoundingClientRect(); return { x: Math.max(0, Math.round(c.left)), y: Math.max(0, Math.round(c.top)), w: Math.round(c.width), h: Math.round(c.height) }; });
await p.screenshot({ path: `${dir}/mine_card2_full.png`, clip: { x: cardBox.x, y: cardBox.y, width: Math.min(1440 - cardBox.x, cardBox.w), height: Math.min(1200 - cardBox.y, cardBox.h) } });
console.log('saved mine_card2_full.png');
await p.close();

// ---- LIVE: screenshot full card 2 ----
const lp = await (await b.newContext({ viewport: { width: 1440, height: 1200 }, reducedMotion: 'no-preference' })).newPage();
await lp.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await lp.waitForTimeout(2500);
await lp.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 110)); } });
await lp.waitForTimeout(400);
const ltop = await lp.evaluate(() => { for (const el of [...document.querySelectorAll('*')]) { if (/Introduced a tier based gamification/i.test(el.textContent || '') && el.textContent.length < 60) { const card = el.closest('a'); return (card || el).getBoundingClientRect().top + scrollY; } } return null; });
console.log('live card2 title top:', ltop);
if (ltop != null) {
  await lp.evaluate((y) => scrollTo(0, y - 90), ltop); await lp.waitForTimeout(900);
  // find the card <a> and clip to it
  const lb = await lp.evaluate(() => { for (const el of [...document.querySelectorAll('*')]) { if (/Introduced a tier based gamification/i.test(el.textContent || '') && el.textContent.length < 60) { const card = el.closest('a'); const r = (card || el).getBoundingClientRect(); return { x: Math.max(0, Math.round(r.left)), y: Math.max(0, Math.round(r.top)), w: Math.round(r.width), h: Math.round(r.height) }; } } return null; });
  if (lb) { await lp.screenshot({ path: `${dir}/live_card2_full.png`, clip: { x: lb.x, y: lb.y, width: Math.min(1440 - lb.x, lb.w), height: Math.min(1200 - lb.y, lb.h) } }); console.log('saved live_card2_full.png', JSON.stringify(lb)); }
}
await lp.close();
await b.close();
