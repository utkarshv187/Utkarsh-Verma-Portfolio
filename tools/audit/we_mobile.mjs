import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
const H = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < Math.min(H, 8000); y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
const weY = await p.evaluate(() => { const norm = (s) => (s || '').replace(/\s+/g, ' ').trim(); const e = [...document.querySelectorAll('*')].find((x) => /^WORK EXPERIENCE$/i.test(norm(x.textContent)) && norm(x.textContent).length < 30 && x.getBoundingClientRect().height > 8); return e ? Math.round(e.getBoundingClientRect().y + window.scrollY) : null; });
// is any experience bullet visible (rendered, non-zero) on mobile?
const bulletsVisible = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const bs = [...document.querySelectorAll('*')].filter((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return /Managing & leading|Championed a user-centric|Working directly with the product/i.test(own); });
  return bs.map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { y: Math.round(r.y + window.scrollY), h: Math.round(r.height), vis: cs.visibility, disp: cs.display, op: cs.opacity }; });
});
console.log('weY(mobile)', weY, 'bulletsVisible', JSON.stringify(bulletsVisible));
// montage the mobile WE region
const shots = [];
for (let y = Math.max(0, weY - 60); y <= weY + 2600; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(240); shots.push(await sharp(await p.screenshot()).resize(300).png().toBuffer()); }
await b.close();
const gap = 6, cw = 300, ch = Math.round(300 * 844 / 390);
const comp = shots.map((s, i) => ({ input: s, left: gap + i * (cw + gap), top: gap }));
await sharp({ create: { width: shots.length * (cw + gap) + gap, height: ch + gap * 2, channels: 3, background: '#000' } }).composite(comp).png().toFile(join(OUT, 'we_mobile.png'));
console.log('wrote we_mobile.png', shots.length, 'frames');
