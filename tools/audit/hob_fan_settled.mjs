import { chromium } from 'playwright';
const widths = [1920, 1440, 1280, 1024];
const b = await chromium.launch({ headless: true });
for (const W of widths) {
  const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2200);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
  await p.waitForTimeout(400);
  const gy = await p.evaluate(() => { let best = null; for (const el of [...document.querySelectorAll('*')]) if ((el.textContent || '').trim() === 'GAMING' && el.children.length === 0) { if (!best || el.getBoundingClientRect().width < best.getBoundingClientRect().width) best = el; } return best ? best.getBoundingClientRect().top + scrollY : null; });
  // approach the stacks from below then settle 2.5s (let appear-animations finish)
  await p.evaluate((y) => scrollTo(0, y + 300), gy); await p.waitForTimeout(500);
  await p.evaluate((y) => scrollTo(0, y - 470), gy); await p.waitForTimeout(2500);

  const out = await p.evaluate(() => {
    const decompose = (m) => { const mm = m.match(/matrix\(([^)]+)\)/); if (!mm) return { rot: 0, tx: 0, ty: 0, sx: 1 }; const [a, b2, , , e, f] = mm[1].split(',').map(parseFloat); return { rot: +(Math.atan2(b2, a) * 180 / Math.PI).toFixed(1), tx: Math.round(e), ty: Math.round(f), sx: +Math.hypot(a, b2).toFixed(3) }; };
    const findTitle = (w) => { let best = null; for (const el of [...document.querySelectorAll('*')]) if ((el.textContent || '').trim() === w && el.children.length === 0) { if (!best || el.getBoundingClientRect().width < best.getBoundingClientRect().width) best = el; } return best; };
    const res = {};
    for (const w of ['GAMING', 'SOCIALIZING', 'ADVENTURING']) {
      const t = findTitle(w); if (!t) { res[w] = 'no title'; continue; }
      let node = t.parentElement, col = null;
      for (let k = 0; k < 8 && node; k++) { if (node.querySelectorAll('img').length >= 2) { col = node; break; } node = node.parentElement; }
      if (!col) { res[w] = 'no col'; continue; }
      const cr = col.getBoundingClientRect();
      const cards = [...col.querySelectorAll('img')].map((im) => { const r = im.getBoundingClientRect(); let n = im, tf = 'none', tfEl = im; for (let k = 0; k < 6 && n; k++) { const cs = getComputedStyle(n); if (cs.transform && cs.transform !== 'none') { tf = cs.transform; tfEl = n; break; } n = n.parentElement; } return { src: (im.currentSrc || im.src).split('/').pop().slice(0, 10), lw: im.offsetWidth, lh: im.offsetHeight, left: Math.round(r.left), right: Math.round(r.right), radius: getComputedStyle(im).borderRadius, wrapR: getComputedStyle(tfEl).borderRadius, z: +getComputedStyle(tfEl).zIndex || 0, ...decompose(tf) }; }).filter((c) => (c.right - c.left) > 40).sort((a, b2) => a.z - b2.z || a.rot - b2.rot);
      const left = Math.min(...cards.map((c) => c.left)), right = Math.max(...cards.map((c) => c.right));
      res[w] = { colCx: Math.round(cr.left + cr.width / 2), colW: Math.round(cr.width), stackCx: Math.round((left + right) / 2), stackL: Math.round(left), stackR: Math.round(right), cards };
    }
    return res;
  });
  console.log(`\n############## WIDTH ${W} ##############`);
  for (const w of Object.keys(out)) { const s = out[w]; if (typeof s === 'string') { console.log(w, s); continue; }
    console.log(`--- ${w} colCx=${s.colCx} colW=${s.colW} stackCx=${s.stackCx}[${s.stackL}-${s.stackR}] offset=${s.stackCx - s.colCx}`);
    for (const c of s.cards) console.log(`     z=${c.z} rot=${String(c.rot).padStart(6)} sx=${c.sx} ty=${c.ty} layout=${c.lw}x${c.lh} imgR=${c.radius} wrapR=${c.wrapR} ${c.src}`);
  }
  await p.close();
}
await b.close();
