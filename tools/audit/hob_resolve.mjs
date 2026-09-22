import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hob');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 180)); } });

// at scroll 8600, use elementFromPoint across the grid area to find actual grid cells
await p.evaluate(() => scrollTo(0, 8600));
await p.waitForTimeout(500);
const cells = await p.evaluate(() => {
  const seen = new Map();
  for (let y = 220; y < 850; y += 20) for (let x = 40; x < 1400; x += 20) {
    const el = document.elementFromPoint(x, y);
    if (!el) continue;
    // find the nearest element that has a background-image or is an img
    let n = el, found = null;
    for (let k = 0; k < 4 && n; k++) { const cs = getComputedStyle(n); if (n.tagName === 'IMG' || (cs.backgroundImage && cs.backgroundImage !== 'none')) { found = n; break; } n = n.parentElement; }
    if (!found) continue;
    const r = found.getBoundingClientRect();
    const key = Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.width) + 'x' + Math.round(r.height);
    if (!seen.has(key)) { const cs = getComputedStyle(found); seen.set(key, { tag: found.tagName.toLowerCase(), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundImage.slice(0, 50), src: found.tagName === 'IMG' ? (found.currentSrc || found.src).split('/').pop().slice(0, 16) : null }); }
  }
  return [...seen.values()].filter((c) => c.w > 150 && c.w < 700 && c.h > 100).sort((a, b) => a.y - b.y || a.x - b.x);
});
console.log('GRID cells via elementFromPoint (scroll 8600):');
for (const c of cells) console.log('  ', JSON.stringify(c));

// full-res screenshot of two grid rows
await sharp(await p.screenshot({ clip: { x: 0, y: 210, width: 1440, height: 300 } })).toFile(join(OUT, 'grid_fullres.png'));

// cursor over a grid cell + a stack photo: capture the framer cursor id + content
async function cursorAt(x, y, label) {
  await p.mouse.move(x - 30, y); await p.mouse.move(x, y, { steps: 6 }); await p.waitForTimeout(400);
  const info = await p.evaluate(() => {
    const el = document.elementFromPoint(700, 460);
    const a = document.querySelector('[data-framer-cursor]');
    // the active cursor element (fixed, follows pointer)
    const cur = [...document.querySelectorAll('div')].find((e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.position === 'fixed' && r.width > 8 && r.width < 120 && cs.borderRadius && parseInt(cs.borderRadius) >= 20 && +cs.zIndex >= 10; });
    return { curFramer: el?.closest('[data-framer-cursor]')?.getAttribute('data-framer-cursor') || null, activeCursor: cur ? { w: Math.round(cur.getBoundingClientRect().width), bg: getComputedStyle(cur).backgroundColor, mix: getComputedStyle(cur).mixBlendMode, hasSvg: !!cur.querySelector('svg') } : null };
  });
  console.log(label, JSON.stringify(info));
}
console.log('\nCURSOR:');
await cursorAt(700, 460, 'over grid cell:');
await p.evaluate(() => scrollTo(0, 7550)); await p.waitForTimeout(400);
await cursorAt(280, 300, 'over GAMING stack:');
await b.close();
