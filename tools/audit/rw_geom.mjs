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
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
const cardDoc = await p.evaluate(() => ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'].map((u) => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(u) && x.getBoundingClientRect().width > 0); return Math.round(a.getBoundingClientRect().top + scrollY); }));
const stickyTop = [132, 146, 160];

const out = [];
for (let i = 0; i < 3; i++) {
  await p.evaluate((y) => scrollTo(0, y), cardDoc[i] - stickyTop[i]);
  await p.waitForTimeout(2600);
  const d = await p.evaluate((idx) => {
    const u = ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'][idx];
    const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(u) && x.getBoundingClientRect().width > 0);
    // card container = nearest ancestor with width ~1200 & height ~620 (the visual card)
    let card = a;
    while (card && card.parentElement) { const r = card.getBoundingClientRect(); if (Math.abs(r.width - 1200) < 20 && r.height > 560 && r.height < 700) break; card = card.parentElement; }
    const cr = card.getBoundingClientRect();
    const rel = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left - cr.left), y: Math.round(r.top - cr.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    // DESCENDANTS only (no bleed)
    const desc = [...card.querySelectorAll('*')];
    // title = biggest Satoshi text
    const titleEl = desc.filter((e) => e.children.length === 0 && e.textContent.trim().length > 4).map((e) => ({ e, fs: parseFloat(getComputedStyle(e).fontSize) })).sort((a, b) => b.fs - a.fs)[0];
    const title = titleEl ? { text: titleEl.e.textContent.trim(), ...rel(titleEl.e), fs: getComputedStyle(titleEl.e).fontSize, ff: getComputedStyle(titleEl.e).fontFamily.split(',')[0].replace(/"/g, ''), fw: getComputedStyle(titleEl.e).fontWeight, lh: getComputedStyle(titleEl.e).lineHeight } : null;
    // media layers: bg-image divs or imgs, in left half
    const media = desc.filter((e) => { const r = rel(e); const cs = getComputedStyle(e); const hasM = e.tagName === 'IMG' || (cs.backgroundImage !== 'none' && cs.backgroundImage.includes('url')); return hasM && r.x < 600 && r.w > 40 && r.h > 40; }).map((e) => { const cs = getComputedStyle(e); return { tag: e.tagName, file: e.tagName === 'IMG' ? (e.currentSrc || e.src).split('?')[0].split('/').pop() : cs.backgroundImage.split('/').pop().split('?')[0].replace(/["')]/g, ''), ...rel(e), clip: cs.clipPath === 'none' ? null : cs.clipPath, bgSize: cs.backgroundSize, bgPos: cs.backgroundPosition }; });
    // stat tiles (tinted) + their number element style
    const tiles = desc.filter((e) => { const cs = getComputedStyle(e); const c = cs.backgroundColor; return (c.includes('37, 197, 179') || c.includes('255, 182, 1')); }).filter((e) => { const r = rel(e); return r.w > 200 && r.w < 320 && r.h > 70 && r.h < 110; }).map((e) => { const cs = getComputedStyle(e); const numEl = [...e.querySelectorAll('*')].find((n) => n.children.length === 0 && /[0-9A-Za-z]/.test(n.textContent) && parseFloat(getComputedStyle(n).fontSize) > 20); const ncs = numEl ? getComputedStyle(numEl) : null; return { ...rel(e), bg: cs.backgroundColor, r: cs.borderRadius, pad: cs.padding, num: numEl ? numEl.textContent.trim() : null, numFs: ncs ? ncs.fontSize : null, numFf: ncs ? ncs.fontFamily.split(',')[0].replace(/"/g, '') : null, numFw: ncs ? ncs.fontWeight : null, numColor: ncs ? ncs.color : null }; }).sort((a, c) => a.y - c.y || a.x - c.x);
    return { cardBox: { w: Math.round(cr.width), h: Math.round(cr.height) }, cardTag: card.tagName, title, media, tiles, statCount: tiles.length };
  }, i);
  out.push({ card: i + 1, ...d });
}
writeFileSync(join(OUT, 'geom.json'), JSON.stringify(out, null, 2));
for (const c of out) {
  console.log(`\n===== CARD ${c.card} (container ${c.cardTag} ${c.cardBox.w}x${c.cardBox.h}) =====`);
  console.log(' TITLE:', JSON.stringify(c.title));
  console.log(' MEDIA:'); for (const m of c.media) console.log('   ', JSON.stringify(m));
  console.log(' TILES:'); for (const t of c.tiles) console.log('   ', JSON.stringify(t));
}
await b.close();
