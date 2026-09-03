// Visual capture of header hover states + the Résumé glow loop (frames), at 2x.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'interactions', 'shots');
await mkdir(OUT, { recursive: true });

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

async function centerOf(finder) {
  return page.evaluate((fe) => { const el = eval(fe); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, finder);
}

// header clip regions (CSS px -> device px handled by clip in CSS px * DSF? Playwright clip is in CSS px)
const clips = {
  left: { x: 100, y: 20, width: 320, height: 70 },      // logo + designing-for + counter
  right: { x: 880, y: 15, width: 460, height: 75 },     // About / Contact / Résumé
  resume: { x: 1170, y: 20, width: 170, height: 66 },   // Résumé button only
};

async function shot(name, clip) { await page.screenshot({ path: join(OUT, name + '.png'), clip }); }

// Default (mouse far away)
await page.mouse.move(5, 5); await page.waitForTimeout(400);
await shot('right_default', clips.right);
await shot('left_default', clips.left);

// Hover About
let c = await centerOf(`(function(){var t=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&e.textContent.trim()==='About');return t;})()`);
if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(700); await shot('right_hover_about', clips.right); }
// Hover Contact
await page.mouse.move(5, 5); await page.waitForTimeout(400);
c = await centerOf(`(function(){var t=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&e.textContent.trim()==='Contact');return t;})()`);
if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(700); await shot('right_hover_contact', clips.right); }
// Hover Résumé
await page.mouse.move(5, 5); await page.waitForTimeout(400);
c = await centerOf(`(function(){var a=[...document.querySelectorAll('a')].find(a=>/Résumé/.test(a.textContent));return a;})()`);
if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(700); await shot('right_hover_resume', clips.right); }
// Hover counter
await page.mouse.move(5, 5); await page.waitForTimeout(400);
c = await centerOf(`document.querySelector('[role="timer"]')`);
if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(700); await shot('left_hover_counter', clips.left); }

// Résumé glow loop frames (at rest)
await page.mouse.move(5, 5); await page.waitForTimeout(600);
for (let i = 0; i < 20; i++) {
  await shot(`glow_${String(i).padStart(2, '0')}`, clips.resume);
  await page.waitForTimeout(150);
}
console.log('done');
await b.close();
