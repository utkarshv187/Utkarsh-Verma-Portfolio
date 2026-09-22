import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'about');
const b = await chromium.launch({ headless: true });

// ===== LIVE: find the Framer custom-cursor content for the testimonial cards =====
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.55) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } });
await p.evaluate(() => scrollTo(0, 5916 - 120));
await p.waitForTimeout(600);
const box = await p.evaluate(() => { const a = [...document.querySelectorAll('a')].find(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href)); const r = a.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
await p.mouse.move(box.x - 50, box.y);
await p.mouse.move(box.x, box.y, { steps: 12 });
await p.waitForTimeout(700);
// dump any element that is fixed/absolute with content near the pointer OR references the cursor id
const cursor = await p.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('[data-framer-cursor-container], [class*="cursor"], div, span')) {
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    if (cs.position !== 'fixed' && cs.position !== 'absolute') continue;
    if (r.width < 20 || r.width > 220 || r.height < 20 || r.height > 220) continue;
    if (+cs.zIndex < 8 && cs.zIndex !== 'auto') continue;
    // near the pointer?
    const html = e.innerHTML.slice(0, 200);
    const hasImg = e.querySelector('img,svg');
    const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
    if (!hasImg && !t && cs.backgroundImage === 'none') continue;
    out.push({ pos: cs.position, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top), z: cs.zIndex, br: cs.borderRadius, bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0, 60), t: t.slice(0, 30), tag: e.tagName.toLowerCase(), hasImg: !!hasImg, html });
  }
  return out;
});
console.log('LIVE cursor candidates on testimonial hover:');
for (const c of cursor) console.log('  ', JSON.stringify(c));
// full-viewport screenshot to see the cursor visually (headless may still paint DOM cursor)
await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } })).resize(720).toFile(join(OUT, 'live_tts_hover_full.png'));
await p.close();

// ===== MINE: capture the icon ticker to confirm all 9 icons incl. Framer render =====
const mp = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await mp.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await mp.waitForTimeout(1000);
const aboutY = await mp.evaluate(() => document.querySelector('#more-about-me').getBoundingClientRect().top + scrollY);
await mp.evaluate((y) => scrollTo(0, y + 560), aboutY);
await mp.waitForTimeout(700);
const mineIcons = await mp.evaluate(() => [...document.querySelectorAll('.about__icon img')].map(i => ({ ok: i.complete && i.naturalWidth > 0, src: i.currentSrc.split('/').pop() })).slice(0, 9));
console.log('\nMINE ticker icons render:', JSON.stringify(mineIcons));
await sharp(await mp.screenshot({ clip: { x: 0, y: 360, width: 1440, height: 320 } })).resize(720).toFile(join(OUT, 'mine_ticker.png'));
await mp.close();
console.log('wrote live_tts_hover_full.png + mine_ticker.png');
await b.close();
