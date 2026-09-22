import { chromium } from 'playwright';
import sharp from 'sharp';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.evaluate(() => scrollTo(0, 9000)); await p.waitForTimeout(900);
const r = await p.evaluate(() => { const c = document.querySelector('.framer-q53ii-container'); if (!c) return null; const b = c.getBoundingClientRect(); if (b.width < 1) return null; return { x: Math.round(b.left) - 14, y: Math.round(b.top) - 14, w: Math.round(b.width) + 28, h: Math.round(b.height) + 28, op: getComputedStyle(c).opacity }; });
console.log('rect', JSON.stringify(r));
if (r) { await p.screenshot({ path: 'audit/out/fix5/gtt_button.png', clip: { x: r.x, y: r.y, width: r.w, height: r.h } }); await sharp('audit/out/fix5/gtt_button.png').resize({ width: 300 }).toFile('audit/out/fix5/gtt_button_big.png'); console.log('saved'); }
await b.close();
