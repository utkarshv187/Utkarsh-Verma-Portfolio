// Full-header hover-state capture + DOM specifics for each interaction.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'interactions', 'full');
await mkdir(OUT, { recursive: true });

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
const clip = { x: 0, y: 0, width: 1440, height: 92 };

async function centerOf(finder) {
  return page.evaluate((fe) => { const el = eval(fe); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, finder);
}
async function away() { await page.mouse.move(3, 400); await page.waitForTimeout(500); }
async function shot(n) { await page.screenshot({ path: join(OUT, n + '.png'), clip }); }

await away(); await shot('default');
let c;
c = await centerOf(`(function(){var t=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&e.textContent.trim()==='About');return t;})()`);
if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(800); await shot('hover_about'); }
await away();
c = await centerOf(`(function(){var t=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&e.textContent.trim()==='Contact');return t;})()`);
if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(800); await shot('hover_contact'); }
await away();
c = await centerOf(`document.querySelector('[role="timer"]')`);
if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(900); await shot('hover_counter'); }
await away();
c = await centerOf(`(function(){var a=[...document.querySelectorAll('a')].find(a=>/Résumé/.test(a.textContent));return a;})()`);
if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(800); await shot('hover_resume'); }

// DOM specifics while hovering counter: the "Thinking design" block image + text
await away();
c = await centerOf(`document.querySelector('[role="timer"]')`);
await page.mouse.move(c.x, c.y); await page.waitForTimeout(800);
const details = await page.evaluate(() => {
  const out = {};
  // images near "Thinking design"
  const td = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Thinking design/i.test(e.textContent));
  if (td) {
    let box = td; for (let i = 0; i < 5 && box.parentElement; i++) box = box.parentElement;
    out.thinkingImgs = [...box.querySelectorAll('img')].map((i) => ({ src: i.src, w: i.naturalWidth, h: i.naturalHeight }));
    out.thinkingText = box.innerText.replace(/\s+/g, ' ').trim().slice(0, 80);
    out.thinkingFont = getComputedStyle(td).fontFamily;
  }
  return out;
});
await writeFile(join(OUT, 'details.json'), JSON.stringify(details, null, 2));
console.log('thinking imgs:', JSON.stringify(details.thinkingImgs));
console.log('done');
await b.close();
