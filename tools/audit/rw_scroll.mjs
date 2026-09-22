import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');

const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 180)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });

// tag the 3 cards + read their ancestor position chain
await p.evaluate(() => {
  const urls = ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'];
  window.__cards = urls.map((u) => [...document.querySelectorAll('a[href]')].find((a) => (a.getAttribute('href') || '').includes(u) && a.getBoundingClientRect().width > 0));
});

const chain = await p.evaluate(() => {
  return window.__cards.map((a, idx) => {
    if (!a) return { idx, missing: true };
    const anc = [];
    let el = a;
    for (let d = 0; d < 6 && el; d++) {
      const cs = getComputedStyle(el);
      anc.push({ d, tag: el.tagName, name: el.getAttribute('data-framer-name'), position: cs.position, top: cs.top, zIndex: cs.zIndex, transform: cs.transform.slice(0, 40), h: Math.round(el.getBoundingClientRect().height) });
      el = el.parentElement;
    }
    return { idx, anc };
  });
});
writeFileSync(join(OUT, 'chain.json'), JSON.stringify(chain, null, 2));
console.log('ANCESTOR CHAINS (card -> up):');
for (const c of chain) { console.log('\ncard', c.idx); (c.anc || []).forEach((a) => console.log('  d' + a.d, a.tag, JSON.stringify({ name: a.name, pos: a.position, top: a.top, z: a.zIndex, h: a.h, t: a.transform }))); }

// scroll through the section, record each card's viewport rect + transform + sticky state, screenshot frames
const startY = 2200, endY = 5400, stepY = 320;
const rows = [];
let fi = 0;
for (let y = startY; y <= endY; y += stepY) {
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(280);
  const snap = await p.evaluate(() => {
    return window.__cards.map((a) => { if (!a) return null; const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), tf: cs.transform === 'none' ? 'none' : cs.transform.replace(/matrix\(|\)/g, '').split(',').map((n) => Math.round(parseFloat(n))).join(','), op: +cs.opacity }; });
  });
  rows.push({ y, snap });
  await p.screenshot({ path: join(OUT, `frame_${String(fi).padStart(2, '0')}_y${y}.png`), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  fi++;
}
console.log('\nSCROLL TABLE (card top/bottom in viewport, transform matrix, opacity):');
for (const r of rows) {
  const s = r.snap.map((c, i) => c ? `c${i + 1}[t=${c.top} b=${c.bottom} op=${c.op} tf=${c.tf}]` : `c${i + 1}[-]`).join('  ');
  console.log('scrollY=' + String(r.y).padStart(4), s);
}
writeFileSync(join(OUT, 'scroll.json'), JSON.stringify(rows, null, 2));
console.log('\nwrote', fi, 'frames');
await b.close();
