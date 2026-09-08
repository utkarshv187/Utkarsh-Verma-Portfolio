import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
async function shot(w, tall, name) {
  const ctx = await b.newContext({ viewport: { width: w, height: tall }, deviceScaleFactor: 1, isMobile: w < 810 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < Math.min(H, 6000); y += 600) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(110); }
  const top = await p.evaluate(() => { const norm = (s) => (s || '').replace(/\s+/g, ' ').trim(); const h = [...document.querySelectorAll('*')].find((e) => /^WORK EXPERIENCE$/i.test(norm(e.textContent)) && norm(e.textContent).length < 30 && e.getBoundingClientRect().height > 8); let n = h; for (let i = 0; i < 9 && n; i++) { if (/255, 183, 5/.test(getComputedStyle(n).backgroundColor)) return Math.round(n.getBoundingClientRect().y + window.scrollY); n = n.parentElement; } return Math.round(h.getBoundingClientRect().y + window.scrollY) - 120; });
  await p.evaluate((y) => window.scrollTo(0, y), top);
  await p.waitForTimeout(500);
  await p.screenshot({ path: join(OUT, name) });
  await ctx.close();
}
await shot(1024, 1200, 'live_tablet_1024.png');
await shot(390, 1400, 'live_mobile_390.png');
await b.close();
console.log('wrote live_tablet_1024.png, live_mobile_390.png');
