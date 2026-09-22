import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });
await p.waitForTimeout(500);
const gy = await p.evaluate(() => { const all = [...document.querySelectorAll('*')]; let best = null; for (const el of all) if ((el.textContent || '').trim() === 'GAMING' && el.children.length === 0) { if (!best || el.getBoundingClientRect().width < best.getBoundingClientRect().width) best = el; } return best ? best.getBoundingClientRect().top + scrollY : null; });
await p.evaluate((y) => scrollTo(0, y - 480), gy);
await p.waitForTimeout(700);

const out = await p.evaluate(() => {
  const decompose = (m) => { const mm = m.match(/matrix\(([^)]+)\)/); if (!mm) return { rot: 0, tx: 0, ty: 0, sx: 1 }; const [a, b2, c, d, e, f] = mm[1].split(',').map(parseFloat); return { rot: +(Math.atan2(b2, a) * 180 / Math.PI).toFixed(1), tx: Math.round(e), ty: Math.round(f), sx: +Math.hypot(a, b2).toFixed(3) }; };
  const findTitle = (w) => { let best = null; for (const el of [...document.querySelectorAll('*')]) if ((el.textContent || '').trim() === w && el.children.length === 0) { if (!best || el.getBoundingClientRect().width < best.getBoundingClientRect().width) best = el; } return best; };
  const words = ['GAMING', 'SOCIALIZING', 'ADVENTURING'];
  const res = {};
  for (const w of words) {
    const t = findTitle(w); if (!t) { res[w] = 'no title'; continue; }
    // climb until ancestor contains >=2 imgs (the stack) — that's the column
    let node = t.parentElement, col = null;
    for (let k = 0; k < 8 && node; k++) { if (node.querySelectorAll('img').length >= 2) { col = node; break; } node = node.parentElement; }
    if (!col) { res[w] = 'no col with imgs'; continue; }
    const cr = col.getBoundingClientRect();
    const cards = [...col.querySelectorAll('img')].map((im) => {
      const r = im.getBoundingClientRect(); let n = im, tf = 'none', tfEl = im;
      for (let k = 0; k < 6 && n; k++) { const cs = getComputedStyle(n); if (cs.transform && cs.transform !== 'none') { tf = cs.transform; tfEl = n; break; } n = n.parentElement; }
      return { src: (im.currentSrc || im.src).split('/').pop().slice(0, 12), lw: im.offsetWidth, lh: im.offsetHeight, boxW: Math.round(r.width), boxH: Math.round(r.height), cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), radius: getComputedStyle(im).borderRadius, wrapRadius: getComputedStyle(tfEl).borderRadius, z: +getComputedStyle(tfEl).zIndex || 0, ...decompose(tf) };
    }).filter((c) => c.boxW > 50).sort((a, b2) => a.z - b2.z);
    const left = Math.min(...cards.map((c) => c.left)), right = Math.max(...cards.map((c) => c.right));
    res[w] = { colBox: { w: Math.round(cr.width), cx: Math.round(cr.left + cr.width / 2), left: Math.round(cr.left), right: Math.round(cr.right) }, n: cards.length, stackLeft: Math.round(left), stackRight: Math.round(right), stackCx: Math.round((left + right) / 2), cards };
  }
  return res;
});
for (const w of Object.keys(out)) {
  const s = out[w]; if (typeof s === 'string') { console.log(w, s); continue; }
  console.log(`\n=== ${w} === col.cx=${s.colBox.cx} col[${s.colBox.left}-${s.colBox.right}] w=${s.colBox.w} | stack.cx=${s.stackCx} stack[${s.stackLeft}-${s.stackRight}] (stack-vs-col offset ${s.stackCx - s.colBox.cx}) n=${s.n}`);
  for (const c of s.cards) console.log(`   z=${String(c.z).padStart(2)} rot=${String(c.rot).padStart(6)}° sx=${c.sx} layout=${c.lw}x${c.lh} box=${c.boxW}x${c.boxH} tx=${c.tx} ty=${c.ty} imgR=${c.radius} wrapR=${c.wrapRadius} cx=${c.cx} [${c.left}-${c.right}] ${c.src}`);
}
await b.close();
