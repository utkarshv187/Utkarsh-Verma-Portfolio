import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(800);
// scroll Spinny row into view
await p.evaluate(() => { const r = document.querySelector('.we__row--spinny'); r.scrollIntoView({ block: 'center' }); window.scrollBy(0, -120); });
await p.waitForTimeout(300);
const before = await p.evaluate(() => {
  const rev = document.querySelector('.we__row--spinny .we__reveal');
  const img = document.querySelector('.we__reveal-img');
  return { rows: getComputedStyle(rev).gridTemplateRows, op: getComputedStyle(rev).opacity, imgLoaded: img ? img.complete && img.naturalWidth : null, imgNatural: img ? img.naturalWidth + 'x' + img.naturalHeight : null };
});
console.log('before hover:', JSON.stringify(before));
// hover the Spinny row (role text)
await p.hover('.we__row--spinny .we__role');
await p.waitForTimeout(700);
const after = await p.evaluate(() => {
  const rev = document.querySelector('.we__row--spinny .we__reveal');
  const img = document.querySelector('.we__reveal-img');
  const ir = img.getBoundingClientRect();
  return { rows: getComputedStyle(rev).gridTemplateRows, op: getComputedStyle(rev).opacity, imgBox: { w: Math.round(ir.width), h: Math.round(ir.height), y: Math.round(ir.top) } };
});
console.log('after hover:', JSON.stringify(after));
await p.screenshot({ path: join(OUT, 'my_reveal_desktop.png') });
// move mouse onto the revealed image centre to trigger the pill cursor
const box = await p.evaluate(() => { const im = document.querySelector('.we__reveal-img'); const r = im.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
await p.mouse.move(box.x, box.y, { steps: 6 });
await p.waitForTimeout(350);
const cur = await p.evaluate(() => { const c = document.querySelector('.cursor'); if (!c) return { cursor: 'none' }; const lines = [...c.querySelectorAll('.cursor__line')].map((l) => l.textContent); const r = c.getBoundingClientRect(); return { cls: c.className, lines, w: Math.round(r.width), h: Math.round(r.height) }; });
console.log('cursor over image:', JSON.stringify(cur));
await p.screenshot({ path: join(OUT, 'my_reveal_cursor.png') });
await b.close();
