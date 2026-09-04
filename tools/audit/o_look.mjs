import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
await p.waitForTimeout(1500);
await p.mouse.move(3, 870); await p.waitForTimeout(300);
const geo = await p.evaluate(() => {
  // hide only stuff behind so we see O + ring clearly on dark
  document.querySelectorAll('.hero__portrait, .hero__face, .hero__fade, .hero__graffiti').forEach((e) => (e.style.display = 'none'));
  const sec = document.querySelector('.hero'); if (sec) sec.style.background = '#160c2b';
  const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect();
  const fs = parseFloat(getComputedStyle(o).fontSize);
  // outer glyph bounds via range
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, fs, boxw: r.width, boxh: r.height };
});
await p.waitForTimeout(200);
const size = 360;
await p.screenshot({ path: join(__dirname, 'out', 'hero', 'overify', 'mine_bareO.png'), clip: { x: geo.cx - size / 2, y: geo.cy - size / 2, width: size, height: size } });
console.log('geo', JSON.stringify(geo), 'saved mine_bareO.png');
await b.close();
