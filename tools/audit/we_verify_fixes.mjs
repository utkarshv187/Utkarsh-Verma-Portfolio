import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1500 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);

// ============ 1) CURSOR SHAPE ============
await p.evaluate(() => { const r = document.querySelector('.we__row--spinny'); const y = r.getBoundingClientRect().top + window.scrollY; window.scrollTo(0, y - 140); });
await p.waitForTimeout(300);
await p.hover('.we__row--spinny .we__role');
await p.waitForTimeout(700);
const imgc = await p.evaluate(() => { const im = document.querySelector('.we__reveal-img'); const r = im.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 120) }; });
await p.mouse.move(imgc.x, imgc.y, { steps: 6 });
await p.waitForTimeout(350);
const cur = await p.evaluate(() => { const c = document.querySelector('.cursor'); const cs = getComputedStyle(c); const r = c.getBoundingClientRect(); return { cls: c.className.trim(), w: Math.round(r.width), h: Math.round(r.height), radius: cs.borderRadius, lines: [...c.querySelectorAll('.cursor__line')].map((l) => l.textContent), cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
console.log('CURSOR', JSON.stringify(cur));
await p.screenshot({ path: join(OUT, 'fix_cursor_shape.png'), clip: { x: cur.cx - 90, y: cur.cy - 60, width: 180, height: 120 } });

// ============ 2) ZIGZAG HOVER ============
// leave the reveal
await p.mouse.move(30, 30);
await p.waitForTimeout(500);
await p.evaluate(() => { const s = document.querySelector('.we__stats'); s.scrollIntoView({ block: 'center' }); });
await p.waitForTimeout(1600); // settle scramble
// rest state of box1
const box1 = await p.evaluate(() => { const c = document.querySelectorAll('.we-card')[0]; const r = c.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) }; });
const zRest = await p.evaluate(() => { const z = document.querySelector('.we-card .we-card__z'); return getComputedStyle(z).transform; });
await p.screenshot({ path: join(OUT, 'fix_zig_rest.png'), clip: { x: box1.x - 10, y: box1.y - 40, width: box1.w + 20, height: box1.h + 60 } });
// hover box1
await p.mouse.move(box1.cx, box1.cy, { steps: 6 });
await p.waitForTimeout(700); // let the transform settle
const zHover = await p.evaluate(() => { const z = document.querySelector('.we-card .we-card__z'); return getComputedStyle(z).transform; });
await p.screenshot({ path: join(OUT, 'fix_zig_hover.png'), clip: { x: box1.x - 10, y: box1.y - 40, width: box1.w + 20, height: box1.h + 60 } });
console.log('ZIG rest transform :', zRest);
console.log('ZIG hover transform:', zHover);
await b.close();
