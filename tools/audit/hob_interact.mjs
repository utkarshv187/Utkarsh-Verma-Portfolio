import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 180)); } });

// 1) definitive grid layout: scroll grid into view, measure all grid img rects
await p.evaluate(() => scrollTo(0, 8900));
await p.waitForTimeout(500);
const grid = await p.evaluate(() => {
  const out = [];
  for (const im of document.querySelectorAll('img')) {
    const src = (im.currentSrc || im.src); const q = src.split('?')[1] || '';
    if (!/scale-down-to|width=18|width=14|width=17/.test(q)) continue; // grid images use large landscape natives
    const r = im.getBoundingClientRect(); const dy = r.top + scrollY;
    if (dy < 8400 || dy > 10200) continue;
    if (Math.abs(r.width / r.height - 1.78) > 0.3 && Math.abs(r.width / r.height - 1.33) > 0.3) continue;
    out.push({ id: src.split('/').pop().split('.')[0].slice(0, 10), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(dy), br: getComputedStyle(im).borderRadius });
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
});
console.log('GRID images (', grid.length, '):');
for (const g of grid) console.log('  ', JSON.stringify(g));
if (grid.length) { const xs = [...new Set(grid.map((g) => g.x))].sort((a, b) => a - b); const ys = [...new Set(grid.map((g) => g.y))].sort((a, b) => a - b); console.log('cols x:', xs, '| rows y:', ys, '| cell:', grid[0].w + 'x' + grid[0].h); }

// 2) hover a GAMING stack photo -> transform/cursor change
async function hoverInfo(id, label) {
  const box = await p.evaluate((id) => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id)); if (!im) return null; const r = im.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), cursor: getComputedStyle(im.closest('a') || im).cursor, dfc: (im.closest('[data-framer-cursor]') ? 'yes' : 'no') }; }, id);
  if (!box) { console.log(label, 'not found'); return; }
  const before = await p.evaluate((id) => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id)); let n = im; for (let k = 0; k < 4; k++) { const t = getComputedStyle(n).transform; if (t !== 'none') return t; n = n.parentElement; } return 'none'; }, id);
  await p.mouse.move(box.x - 40, box.y - 30); await p.mouse.move(box.x, box.y, { steps: 8 }); await p.waitForTimeout(450);
  const after = await p.evaluate((id) => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id)); let n = im; for (let k = 0; k < 4; k++) { const t = getComputedStyle(n).transform; if (t !== 'none') return t; n = n.parentElement; } return 'none'; }, id);
  console.log(`${label}: cursor=${box.cursor} data-framer-cursor=${box.dfc} | transform before==after: ${before === after} ${before !== after ? '(before ' + before.slice(0, 30) + ' -> after ' + after.slice(0, 30) + ')' : ''}`);
  await p.mouse.move(20, 20); await p.waitForTimeout(200);
}
console.log('\nHOVER:');
await p.evaluate(() => scrollTo(0, 7550)); await p.waitForTimeout(400);
await hoverInfo('0xM0Lwgl', 'GAMING stack top photo');
await p.evaluate(() => scrollTo(0, 8900)); await p.waitForTimeout(400);
await hoverInfo('fam52Jvb', 'GRID image');

// 3) drag containers: is the stacks-row or grid inside a ticker/overflow-scroll?
const dragCheck = await p.evaluate(() => {
  const findContainer = (id) => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id)); if (!im) return null; let n = im, chain = []; for (let k = 0; k < 8 && n; k++) { const cs = getComputedStyle(n); chain.push({ tag: n.tagName.toLowerCase(), cls: (n.className || '').toString().slice(0, 20), overflow: cs.overflowX + '/' + cs.overflowY, touch: cs.touchAction }); n = n.parentElement; } return chain; };
  return { stack: findContainer('0xM0Lwgl'), grid: findContainer('fam52Jvb') };
});
console.log('\nSTACK ancestor chain:'); for (const c of dragCheck.stack || []) console.log('  ', JSON.stringify(c));
console.log('GRID ancestor chain:'); for (const c of dragCheck.grid || []) console.log('  ', JSON.stringify(c));
await b.close();
