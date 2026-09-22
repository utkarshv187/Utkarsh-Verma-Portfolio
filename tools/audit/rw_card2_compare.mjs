import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });

// ---- LIVE ----
const lp = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await lp.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await lp.waitForTimeout(2500);
await lp.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.7) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });
// find card2 heading docY (visible one) then scroll so it pins (~heading vpTop 194)
const headY = await lp.evaluate(() => { scrollTo(0, 0); const ns = [...document.querySelectorAll('div,p,h1,h2,h3')]; const c = ns.filter(n => /tier based gamification/i.test((n.textContent || '').trim()) && (n.textContent || '').trim().length < 60).map(n => { const r = n.getBoundingClientRect(); return { docY: r.top + scrollY, w: r.width }; }).filter(o => o.w > 100 && o.docY > 500).sort((a, b) => a.docY - b.docY)[0]; return c ? Math.round(c.docY) : null; });
for (const s of [headY - 194 - 200, headY - 194, headY - 194 + 200]) { await lp.evaluate(y => scrollTo(0, y), s); await lp.waitForTimeout(250); }
await lp.evaluate(y => scrollTo(0, y), headY - 194);
await lp.waitForTimeout(400);
// pinned card top ~ viewport 146; phones sit in the left half. Fixed clip around them.
await sharp(await lp.screenshot({ clip: { x: 120, y: 150, width: 560, height: 560 } })).toFile(join(OUT, 'cmp_live_c2.png'));
await lp.close();

// ---- MINE ----
const mp = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await mp.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await mp.waitForTimeout(1000);
const pinTop = await mp.evaluate(() => { const c = document.querySelector('.rw-card--gamification'); return c.getBoundingClientRect().top + scrollY; });
{ const cur = await mp.evaluate(() => scrollY); const target = pinTop - 146; for (let i = 1; i <= 20; i++) { await mp.evaluate(y => window.scrollTo(0, y), cur + (target - cur) * i / 20); await mp.waitForTimeout(16); } }
await mp.waitForTimeout(300);
// pinned card top ~146, media at left 168 / top 194; phones extend above. Fixed clip.
await sharp(await mp.screenshot({ clip: { x: 150, y: 150, width: 560, height: 560 } })).toFile(join(OUT, 'cmp_mine_c2.png'));
await mp.close();

// side by side
const L = await sharp(join(OUT, 'cmp_live_c2.png')).resize(400, 400, { fit: 'contain', background: '#222' }).toBuffer();
const M = await sharp(join(OUT, 'cmp_mine_c2.png')).resize(400, 400, { fit: 'contain', background: '#222' }).toBuffer();
await sharp({ create: { width: 806, height: 424, channels: 3, background: '#111' } })
  .composite([
    { input: Buffer.from('<svg width="806" height="22"><rect width="100%" height="100%" fill="#111"/><text x="8" y="16" font-family="monospace" font-size="13" fill="#fff">LIVE (left)   vs   MINE (right)  — card 2 fanned at pin</text></svg>'), top: 0, left: 0 },
    { input: L, top: 22, left: 0 }, { input: M, top: 22, left: 406 },
  ]).png().toFile(join(OUT, 'cmp_c2_both.png'));
console.log('live headY', headY, 'wrote cmp_c2_both.png');
await b.close();
