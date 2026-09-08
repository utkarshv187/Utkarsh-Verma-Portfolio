import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
for (const W of [1000, 834]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 1000 }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  for (let y = 0; y < 5000; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  const res = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const we = [...document.querySelectorAll('*')].find((x) => /^WORK EXPERIENCE$/i.test(norm(x.textContent)) && norm(x.textContent).length < 30 && x.getBoundingClientRect().height > 8);
    const weY = we ? Math.round(we.getBoundingClientRect().y + window.scrollY) : null;
    const bullets = [...document.querySelectorAll('*')].filter((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return /Managing & leading|Championed a user-centric|Working directly with the product|team of 4 designers/i.test(own); }).map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { text: norm(e.textContent).slice(0, 40), y: Math.round(r.y + window.scrollY), h: Math.round(r.height), vis: cs.visibility, disp: cs.display, op: cs.opacity }; });
    return { weY, bulletCount: bullets.length, bullets: bullets.slice(0, 4) };
  });
  console.log('width', W, JSON.stringify(res));
  if (res.weY != null) { await p.evaluate((y) => window.scrollTo(0, y - 30), res.weY); await p.waitForTimeout(400); await p.screenshot({ path: join(OUT, `we_tablet_${W}.png`) }); }
  await ctx.close();
}
await b.close();
console.log('done');
