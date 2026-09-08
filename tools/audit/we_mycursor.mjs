import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1500 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(800);
await p.evaluate(() => { const r = document.querySelector('.we__row--spinny'); const y = r.getBoundingClientRect().top + window.scrollY; window.scrollTo(0, y - 140); });
await p.waitForTimeout(300);
// hover the row role text, then move onto the revealed image (kept inside the tall viewport)
await p.hover('.we__row--spinny .we__role');
await p.waitForTimeout(700);
const box = await p.evaluate(() => { const im = document.querySelector('.we__reveal-img'); const r = im.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), y2: Math.round(r.top + 60) }; });
console.log('image centre in viewport:', JSON.stringify(box));
await p.mouse.move(box.x, box.y, { steps: 8 });
await p.waitForTimeout(400);
const cur = await p.evaluate(() => {
  const c = document.querySelector('.cursor');
  if (!c) return { cursor: 'none-rendered' };
  const lines = [...c.querySelectorAll('.cursor__line')].map((l) => l.textContent);
  const r = c.getBoundingClientRect();
  const cs = getComputedStyle(c);
  return { cls: c.className.trim(), lines, w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, radius: cs.borderRadius, x: Math.round(r.left), y: Math.round(r.top) };
});
console.log('cursor over image:', JSON.stringify(cur));
await p.screenshot({ path: join(OUT, 'my_reveal_cursor.png') });
// also confirm hovering the row TEXT (not image) shows the plain dot, not the pill
await p.mouse.move(box.x, box.y - 500, { steps: 6 }); // move up toward the role text area
await p.waitForTimeout(300);
await b.close();
