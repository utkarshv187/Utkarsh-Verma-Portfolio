import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1000);

async function pillShot(name, cx, cy) {
  await p.mouse.move(cx - 40, cy - 30);
  await p.mouse.move(cx, cy, { steps: 8 });
  await p.waitForTimeout(450);
  await sharp(await p.screenshot({ clip: { x: Math.max(0, cx - 90), y: Math.max(0, cy - 55), width: 180, height: 110 } })).resize(400).toFile(join(OUT, name));
}

// Spinny pill: scroll WE, open reveal, hover the image
const weY = await p.evaluate(() => document.querySelector('#work-experience').getBoundingClientRect().top + scrollY);
await p.evaluate((y) => scrollTo(0, y - 40), weY);
await p.waitForTimeout(300);
// enter the section to latch the reveal, then hover the revealed image
const rev = await p.evaluate(() => { const we = document.querySelector('#work-experience'); we.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true })); return true; });
await p.evaluate(() => { const we = document.querySelector('#work-experience'); const r = we.getBoundingClientRect(); }); // noop
await p.waitForTimeout(400);
const spinny = await p.evaluate(() => { const im = document.querySelector('.we__reveal-img'); if (!im) return null; const r = im.getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 }; });
if (spinny) await pillShot('pill_spinny.png', spinny.x, spinny.y);
else console.log('spinny image not visible');

// View pill: scroll to card1, hover the title area
const c1 = await p.evaluate(() => { const a = document.querySelector('.rw-card--auction'); const y = a.getBoundingClientRect().top + scrollY; scrollTo(0, y - 132); return true; });
await p.waitForTimeout(500);
const vp = await p.evaluate(() => { const a = document.querySelector('.rw-card--auction'); const r = a.getBoundingClientRect(); return { x: r.left + r.width * 0.72, y: r.top + r.height * 0.42 }; });
await pillShot('pill_view.png', vp.x, vp.y);
console.log('wrote pill_spinny.png + pill_view.png');
await b.close();
