import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/fix5'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.evaluate(() => scrollTo(0, 8000)); await p.waitForTimeout(700);
const r = await p.evaluate(() => { const c = document.querySelector('.framer-q53ii-container'); const b = c.getBoundingClientRect(); return { x: Math.round(b.left) - 12, y: Math.round(b.top) - 12, w: Math.round(b.width) + 24, h: Math.round(b.height) + 24 }; });
await p.screenshot({ path: `${dir}/gtt_button.png`, clip: r });
// zoom the arrow region big
await sharpZoom(`${dir}/gtt_button.png`, `${dir}/gtt_button_big.png`);
console.log('saved gtt button', JSON.stringify(r));
await b.close();
async function sharpZoom(src, out) { const sharp = (await import('sharp')).default; await sharp(src).resize({ width: 320 }).toFile(out); }
