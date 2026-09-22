import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.5; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });

// identify the 4 recent-work sticky cards by their bg colors + docY order
const key = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).position === 'sticky' && e.getBoundingClientRect().width > 1000 && e.getBoundingClientRect().height > 400 && (e.getBoundingClientRect().top + scrollY) > 2000).sort((a, c) => (a.getBoundingClientRect().top + scrollY) - (c.getBoundingClientRect().top + scrollY));
  return { origins: cards.map((c) => getComputedStyle(c).transformOrigin), tops: cards.map((c) => getComputedStyle(c).top) };
});
console.log('transform-origins:', JSON.stringify(key.origins));
console.log('sticky tops:', JSON.stringify(key.tops));

function getCards() {
  return [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).position === 'sticky' && e.getBoundingClientRect().width > 1000 && e.getBoundingClientRect().height > 400 && (e.getBoundingClientRect().top + scrollY) > 2000).sort((a, c) => (a.getBoundingClientRect().top + scrollY) - (c.getBoundingClientRect().top + scrollY));
}

const rows = [];
for (let y = 2400; y <= 6400; y += 80) {
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(90);
  const s = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).position === 'sticky' && e.getBoundingClientRect().width > 1000 && e.getBoundingClientRect().height > 400 && (e.getBoundingClientRect().top + scrollY) > 2000).sort((a, c) => (a.getBoundingClientRect().top + scrollY) - (c.getBoundingClientRect().top + scrollY));
    return cards.map((c) => {
      const m = getComputedStyle(c).transform;
      let sc = 1, ty = 0;
      if (m && m !== 'none') { const q = m.match(/matrix\(([^)]+)\)/); if (q) { const a = q[1].split(',').map(parseFloat); sc = +a[0].toFixed(3); ty = Math.round(a[5]); } }
      return { sc, ty, top: Math.round(c.getBoundingClientRect().top) };
    });
  });
  rows.push({ y, s });
}
writeFileSync(join(OUT, 'scale.json'), JSON.stringify(rows));
const n = rows[rows.length - 1].s.length;
for (let ci = 0; ci < n; ci++) {
  console.log(`\n--- CARD ${ci + 1} (scale, ty, vtop) ---`);
  let prev = null;
  for (const r of rows) { const c = r.s[ci]; if (!c) continue; const k = c.sc + '|' + c.ty; if (k !== prev) { console.log(`  y=${r.y}  scale=${c.sc}  ty=${String(c.ty).padStart(5)}  vtop=${c.top}`); prev = k; } }
}
await b.close();
