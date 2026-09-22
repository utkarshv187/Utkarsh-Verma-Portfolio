import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });

async function grab(width) {
  const ctx = await b.newContext({ viewport: { width, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
  await p.waitForTimeout(1600);
  await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 130)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
  const hrefs = ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'];
  const cards = [];
  for (let i = 0; i < 3; i++) {
    // scroll card into view
    const docY = await p.evaluate((h) => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(h) && x.getBoundingClientRect().width > 50); return a ? Math.round(a.getBoundingClientRect().top + scrollY) : null; }, hrefs[i]);
    if (docY == null) { cards.push(null); continue; }
    await p.evaluate((y) => scrollTo(0, y - 100), docY);
    await p.waitForTimeout(700);
    const d = await p.evaluate((h) => {
      const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(h) && x.getBoundingClientRect().width > 50);
      const r = a.getBoundingClientRect();
      const rel = (el) => { const rr = el.getBoundingClientRect(); return { x: Math.round(rr.left - r.left), y: Math.round(rr.top - r.top), w: Math.round(rr.width), h: Math.round(rr.height) }; };
      const desc = [...a.querySelectorAll('*')];
      const title = desc.filter((e) => e.children.length === 0 && e.textContent.trim().length > 6).sort((x, y) => parseFloat(getComputedStyle(y).fontSize) - parseFloat(getComputedStyle(x).fontSize))[0];
      // stat tiles: tinted bg
      const tiles = desc.filter((e) => { const c = getComputedStyle(e).backgroundColor; return c.includes('37, 197, 179') || c.includes('255, 182, 1'); }).map((e) => rel(e)).filter((t) => t.w > 40 && t.h > 30).sort((a, c) => a.y - c.y || a.x - c.x);
      // a label + number font sizes
      const numFs = (() => { const e = desc.find((x) => x.children.length === 0 && /^\d/.test(x.textContent.trim()) && parseFloat(getComputedStyle(x).fontSize) > 14); return e ? getComputedStyle(e).fontSize : null; })();
      const labelFs = (() => { const e = desc.find((x) => x.children.length === 0 && /RETENTION|GROWTH|DEVELOPED/.test(x.textContent)); return e ? getComputedStyle(e).fontSize : null; })();
      // media transforms (gif wrappers / bg divs)
      const media = desc.filter((e) => { const cs = getComputedStyle(e); return (e.tagName === 'IMG') || cs.backgroundImage.includes('url'); }).map((e) => { const cs = getComputedStyle(e); return { tag: e.tagName, file: e.tagName === 'IMG' ? (e.currentSrc || e.src).split('?')[0].split('/').pop() : cs.backgroundImage.split('/').pop().split('?')[0].replace(/["')]/g, ''), ...rel(e), transform: cs.transform === 'none' ? null : cs.transform }; }).filter((m) => m.w > 30);
      return { padding: getComputedStyle(a).padding, box: { w: Math.round(r.width), h: Math.round(r.height) }, title: title ? { fs: getComputedStyle(title).fontSize, lh: getComputedStyle(title).lineHeight, ...rel(title) } : null, tiles, tileCount: tiles.length, numFs, labelFs, media };
    }, hrefs[i]);
    cards.push(d);
  }
  await ctx.close();
  return cards;
}

const out = {};
for (const w of [1024, 390]) { out[w] = await grab(w); }
writeFileSync(join(OUT, 'resp_detail.json'), JSON.stringify(out, null, 2));
for (const w of [1024, 390]) {
  console.log(`\n############ WIDTH ${w} ############`);
  out[w].forEach((c, i) => {
    if (!c) return;
    console.log(`\n-- CARD ${i + 1} box=${JSON.stringify(c.box)} pad=${c.padding} titleFs=${c.title?.fs} numFs=${c.numFs} labelFs=${c.labelFs}`);
    console.log('  title', JSON.stringify(c.title));
    console.log('  tiles', JSON.stringify(c.tiles));
    console.log('  media', JSON.stringify(c.media));
  });
}
await b.close();
