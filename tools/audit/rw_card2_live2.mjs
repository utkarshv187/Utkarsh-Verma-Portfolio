import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.7) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 500)); });

// locate the heading's document Y (scroll-independent)
const headY = await p.evaluate(() => {
  scrollTo(0, 0);
  const nodes = [...document.querySelectorAll('h1,h2,h3,h4,p,div,span')];
  const cands = nodes.filter((n) => /tier based gamification/i.test((n.textContent || '').trim()) && (n.textContent || '').trim().length < 60);
  // pick the VISIBLE one (Framer keeps a display:contents phantom at docY 0)
  const h = cands.map((n) => { const r = n.getBoundingClientRect(); return { n, docY: r.top + scrollY, w: r.width }; }).filter((o) => o.w > 100 && o.docY > 500).sort((a, b) => a.docY - b.docY)[0];
  return h ? Math.round(h.docY) : null;
});
console.log('gamification heading docY =', headY);
if (headY == null) { console.log('NOT FOUND'); await b.close(); process.exit(0); }

const decomp = (t) => { if (!t || t === 'none') return { rot: 0, sx: 1, tx: 0, ty: 0 }; const m = t.match(/matrix\(([^)]+)\)/); if (!m) return { rot: 0, sx: 1, tx: 0, ty: 0 }; const [a, bb, c, d, e, f] = m[1].split(',').map(parseFloat); return { rot: +(Math.atan2(bb, a) * 180 / Math.PI).toFixed(2), sx: +Math.hypot(a, bb).toFixed(3), tx: Math.round(e), ty: Math.round(f) }; };

console.log('\nscrollY | headingVpTop | phone images [WxH rot=deg origin tx,ty br]');
for (let s = Math.max(0, headY - 900); s <= headY + 700; s += 80) {
  await p.evaluate((yy) => scrollTo(0, yy), s);
  await p.waitForTimeout(150);
  const data = await p.evaluate(() => {
    const nodes = [...document.querySelectorAll('h1,h2,h3,h4,p,div,span')];
    const cands = nodes.filter((n) => /tier based gamification/i.test((n.textContent || '').trim()) && (n.textContent || '').trim().length < 60);
    const hobj = cands.map((n) => ({ n, r: n.getBoundingClientRect() })).filter((o) => o.r.width > 100).sort((a, b) => a.r.top - b.r.top)[0];
    if (!hobj) return null;
    const h = hobj.n; const hr = hobj.r;
    // phones = imgs left of the heading, vertically near it, taller-than-wide, sizeable
    const imgs = [];
    for (const im of document.querySelectorAll('img')) {
      const r = im.getBoundingClientRect();
      if (r.width < 60 || r.height < 120) continue;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx > hr.left) continue;                       // left of heading only
      if (cy < hr.top - 250 || cy > hr.top + 550) continue; // vertically near the card
      // find transform on the img or a close wrapper
      let node = im, tf = getComputedStyle(im).transform, org = getComputedStyle(im).transformOrigin;
      for (let k = 0; k < 4 && (!tf || tf === 'none') && node.parentElement; k++) { node = node.parentElement; tf = getComputedStyle(node).transform; org = getComputedStyle(node).transformOrigin; }
      imgs.push({ w: Math.round(r.width), h: Math.round(r.height), tf, org, br: getComputedStyle(im).borderRadius, natW: im.naturalWidth, natH: im.naturalHeight, src: (im.currentSrc || im.src).split('/').pop().slice(0, 24) });
    }
    return { headTop: Math.round(hr.top), imgs };
  });
  if (!data) { console.log(String(s).padStart(6), '| (heading gone)'); continue; }
  const desc = data.imgs.map((o) => { const d = decomp(o.tf); return `{${o.w}x${o.h} nat${o.natW}x${o.natH} rot=${d.rot} sx=${d.sx} org="${o.org}" tx=${d.tx} ty=${d.ty} br=${o.br} ${o.src}}`; }).join('\n              ');
  console.log(String(s).padStart(6), '|', String(data.headTop).padStart(5), '|', desc || '(no phones)');
}
await b.close();
