import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });

// section bg (find the dark wrapper containing the intro heading)
const meta = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const h = [...document.querySelectorAll('div,h2,p')].find((n) => /JUST IN CASE WHEN I AM NOT DESIGNING/i.test(norm(n.textContent)) && parseFloat(getComputedStyle(n).fontSize) > 28);
  let bg = null, node = h;
  for (let k = 0; k < 16 && node; k++) { const c = getComputedStyle(node).backgroundColor; const r = node.getBoundingClientRect(); if (c && c !== 'rgba(0, 0, 0, 0)' && r.width >= 1440) { bg = { c, top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), h: Math.round(r.height) }; break; } node = node.parentElement; }
  return { bg };
});
console.log('SECTION bg:', JSON.stringify(meta.bg));

// enumerate images by scanning the section (scroll to a mid point so all lazy-load), grouping by docY band
await p.evaluate(() => scrollTo(0, 8000));
await p.waitForTimeout(500);
const imgs = await p.evaluate(() => {
  const out = [];
  for (const im of document.querySelectorAll('img')) {
    const r = im.getBoundingClientRect(); const dy = r.top + scrollY;
    if (dy < 7500 || dy > 13000) continue;
    if (r.width < 30) continue;
    const src = (im.currentSrc || im.src);
    const id = src.split('/').pop().split('?')[0];
    const q = src.split('?')[1] || '';
    out.push({ id, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), docY: Math.round(dy), br: getComputedStyle(im).borderRadius, q: q.slice(0, 40) });
  }
  return out.sort((a, b) => a.docY - b.docY || a.x - b.x);
});
console.log('\nIMAGES in section (', imgs.length, '):');
for (const im of imgs) console.log('  ', JSON.stringify(im));
await b.close();
