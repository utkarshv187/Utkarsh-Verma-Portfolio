import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'oeven');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
await p.waitForTimeout(1400); await p.mouse.move(3, 860); await p.waitForTimeout(200);
const g = await p.evaluate(() => {
  document.querySelectorAll('.hero__portrait,.hero__face,.hero__fade,.hero__aurora,.hero__accent,.hero__graffiti').forEach((e) => (e.style.display = 'none'));
  const s = document.querySelector('.hero'); if (s) s.style.background = '#160c2b';
  const bs = document.querySelector('.badge__svg'); if (bs) { bs.style.animation = 'none'; bs.style.transform = 'rotate(0deg)'; }
  const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect(); const fs = parseFloat(getComputedStyle(o).fontSize);
  const tp = document.querySelector('.badge__text');
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 - 0.014 * fs, len: tp.getComputedTextLength(), path: document.querySelector('#badge-curve').getTotalLength() };
});
console.log('textLen', g.len.toFixed(1), 'pathLen', g.path.toFixed(1), 'coverage', (100 * g.len / g.path).toFixed(1) + '%');
await p.waitForTimeout(150);
const S = 300;
await p.screenshot({ path: join(OUT, 'ring_even.png'), clip: { x: g.cx - S / 2, y: g.cy - S / 2, width: S, height: S } });
await b.close();
console.log('wrote ring_even.png');
