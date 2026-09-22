import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/fix5'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });

// desktop card 1
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(700);
const rwY = await p.evaluate(() => document.getElementById('recent-work').getBoundingClientRect().top + (window.scrollY || document.body.scrollTop));
await p.evaluate((y) => { const t = y + 320; document.documentElement.scrollTop = t; document.body.scrollTop = t; }, rwY);
await p.waitForTimeout(700);
await p.screenshot({ path: `${dir}/rw_desktop_card1.png` });
// overlay a guide line at media bottom to eyeball alignment (just log positions)
const g = await p.evaluate(() => { const c = document.querySelector('.rw-card').getBoundingClientRect(); const m = document.querySelector('.rw-card__media').getBoundingClientRect(); const stats = [...document.querySelectorAll('.rw-card:nth-child(1) .rw-stat')].map((s) => s.getBoundingClientRect()); return { mediaBottom: Math.round(m.bottom - c.top), statBottoms: stats.map((s) => Math.round(s.bottom - c.top)) }; });
console.log('desktop card1 mediaBottom:', g.mediaBottom, 'statBottoms:', g.statBottoms);
await p.close();

// mobile card
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })).newPage();
await m.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await m.waitForTimeout(700);
const rwY2 = await m.evaluate(() => document.getElementById('recent-work').getBoundingClientRect().top + (window.scrollY || document.body.scrollTop));
await m.evaluate((y) => { const t = y + 260; document.documentElement.scrollTop = t; document.body.scrollTop = t; }, rwY2);
await m.waitForTimeout(600);
await m.screenshot({ path: `${dir}/rw_mobile_card1.png` });
const mg = await m.evaluate(() => { const c = document.querySelector('.rw-card').getBoundingClientRect(); const md = document.querySelector('.rw-card__media').getBoundingClientRect(); const stats = [...document.querySelectorAll('.rw-card:nth-child(1) .rw-stat')].map((s) => s.getBoundingClientRect()); const cardPadBottom = Math.round(c.bottom - Math.max(...stats.map((s) => s.bottom))); const imgToStats = Math.round(Math.min(...stats.map((s) => s.top)) - md.bottom); return { imgBottomToStatsTop: imgToStats, statsBottomToCardBottom: cardPadBottom }; });
console.log('mobile card1: gap(image->stats)=', mg.imgBottomToStatsTop, ' gap(stats->cardBottom)=', mg.statsBottomToCardBottom);
await m.close();
await b.close();
console.log('saved rw_desktop_card1.png, rw_mobile_card1.png');
