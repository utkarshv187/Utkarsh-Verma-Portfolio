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
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });

// doc positions of the 3 cards (at rest)
const cardDoc = await p.evaluate(() => {
  const urls = ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'];
  return urls.map((u) => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(u) && x.getBoundingClientRect().width > 0); const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { docY: Math.round(r.top + scrollY), x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), radius: cs.borderRadius, bg: cs.backgroundColor, padding: cs.padding, stickyTop: cs.top }; });
});

const results = [];
for (let i = 0; i < 3; i++) {
  const c = cardDoc[i];
  // scroll so the card is fully in view (top near y=140), let counters settle
  await p.evaluate((docY) => scrollTo(0, docY - 150), c.docY);
  await p.waitForTimeout(2600);
  const detail = await p.evaluate(() => {
    const cards = ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'];
    // recompute this card's current viewport box (the topmost fully-visible one we scrolled to)
    return { t: performance.now() };
  });
  // find current viewport box of THIS card
  const box = await p.evaluate((u) => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(u) && x.getBoundingClientRect().width > 0); const r = a.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }, ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'][i]);

  const data = await p.evaluate((bx) => {
    const inBox = (r) => { const cx = r.left + r.width / 2, cy = r.top + r.height / 2; return cx >= bx.l - 2 && cx <= bx.r + 2 && cy >= bx.t - 2 && cy <= bx.b + 2; };
    // leaf text nodes
    const texts = [];
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length !== 0) continue;
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > 44) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || !inBox(r)) continue;
      const cs = getComputedStyle(el);
      texts.push({ text: t, fs: cs.fontSize, fw: cs.fontWeight, ff: cs.fontFamily.split(',')[0].replace(/"/g, ''), color: cs.color, x: Math.round(r.left - bx.l), y: Math.round(r.top - bx.t), w: Math.round(r.width) });
    }
    // images by geometric containment
    const imgs = [];
    for (const im of document.querySelectorAll('img')) { const r = im.getBoundingClientRect(); if (r.width === 0 || !inBox(r)) continue; imgs.push({ file: (im.currentSrc || im.src).split('?')[0].split('/').pop(), x: Math.round(r.left - bx.l), y: Math.round(r.top - bx.t), w: Math.round(r.width), h: Math.round(r.height) }); }
    // stat tiles: elements whose background differs and that contain a label word
    const tiles = [];
    for (const el of document.querySelectorAll('div,a,section')) { const r = el.getBoundingClientRect(); if (!inBox(r) || r.width < 120 || r.width > 360 || r.height < 60 || r.height > 200) continue; const cs = getComputedStyle(el); if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') continue; tiles.push({ bg: cs.backgroundColor, radius: cs.borderRadius, x: Math.round(r.left - bx.l), y: Math.round(r.top - bx.t), w: Math.round(r.width), h: Math.round(r.height) }); }
    return { texts, imgs, tiles };
  }, box);
  results.push({ card: i + 1, meta: cardDoc[i], viewportBox: { l: Math.round(box.l), t: Math.round(box.t), r: Math.round(box.r), b: Math.round(box.b) }, ...data });
}

// section background: sample behind the cards + the Solid Part work container
const sectionBg = await p.evaluate(() => {
  const el = [...document.querySelectorAll('[data-framer-name="Solid Part work"]')][0];
  const chain = [];
  let e = el;
  for (let d = 0; d < 4 && e; d++) { const cs = getComputedStyle(e); chain.push({ d, name: e.getAttribute('data-framer-name'), bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0, 40) }); e = e.parentElement; }
  return chain;
});

writeFileSync(join(OUT, 'detail.json'), JSON.stringify({ results, sectionBg }, null, 2));
for (const rcard of results) {
  console.log(`\n========== CARD ${rcard.card} ==========`);
  console.log('meta:', JSON.stringify(rcard.meta));
  console.log('TEXTS:');
  for (const t of rcard.texts.sort((a, b) => a.y - b.y || a.x - b.x)) console.log(`  (${String(t.x).padStart(4)},${String(t.y).padStart(3)}) ${t.fs}/${t.fw} ${t.color} ${t.ff}  "${t.text}"`);
  console.log('IMAGES:');
  for (const im of rcard.imgs.sort((a, b) => a.x - b.x)) console.log(`  ${im.file}  @(${im.x},${im.y}) ${im.w}x${im.h}`);
  console.log('TILES:');
  for (const tl of rcard.tiles.sort((a, b) => a.y - b.y || a.x - b.x)) console.log(`  @(${tl.x},${tl.y}) ${tl.w}x${tl.h} r=${tl.radius} bg=${tl.bg}`);
}
console.log('\nSECTION BG CHAIN:', JSON.stringify(sectionBg, null, 1));
await b.close();
