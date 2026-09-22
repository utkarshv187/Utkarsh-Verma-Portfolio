import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
// scroll whole page to trigger lazy loads
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } });
await p.waitForTimeout(600);

// find the three hobby titles and their positions
const titles = await p.evaluate(() => {
  const want = ['GAMING', 'SOCIALIZING', 'ADVENTURING'];
  const out = [];
  const all = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')];
  for (const w of want) {
    // smallest element whose trimmed text === the word
    let best = null;
    for (const el of all) {
      const t = (el.textContent || '').trim();
      if (t === w) { if (!best || el.getBoundingClientRect().width < best.getBoundingClientRect().width) best = el; }
    }
    if (best) { const r = best.getBoundingClientRect(); out.push({ word: w, cx: Math.round(r.left + r.width / 2), top: Math.round(r.top + scrollY), left: Math.round(r.left), right: Math.round(r.right) }); }
  }
  return out;
});
console.log('TITLES:', JSON.stringify(titles, null, 1));

// scroll so the GAMING title is mid-screen, then probe images just ABOVE the titles (the stacks)
if (titles.length) {
  const gy = titles[0].top;
  await p.evaluate((y) => scrollTo(0, y - 480), gy);
  await p.waitForTimeout(700);
}

// For each title, gather all IMG elements whose vertical center is above the title within ~420px and horizontally near the title column
const stacks = await p.evaluate(() => {
  const want = ['GAMING', 'SOCIALIZING', 'ADVENTURING'];
  const all = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')];
  const findTitle = (w) => { let best = null; for (const el of all) { const t = (el.textContent || '').trim(); if (t === w) { if (!best || el.getBoundingClientRect().width < best.getBoundingClientRect().width) best = el; } } return best; };
  const imgs = [...document.querySelectorAll('img')].map((im) => {
    const r = im.getBoundingClientRect();
    // climb to the nearest ancestor that has a rotate/translate transform
    let node = im, tf = 'none', tfEl = null;
    for (let k = 0; k < 6 && node; k++) { const cs = getComputedStyle(node); if (cs.transform && cs.transform !== 'none') { tf = cs.transform; tfEl = node; break; } node = node.parentElement; }
    return { im, r, tf, tfEl, radius: getComputedStyle(im).borderRadius, src: (im.currentSrc || im.src).split('/').pop().slice(0, 24) };
  }).filter((o) => o.r.width > 40 && o.r.height > 40);

  const decompose = (m) => {
    const mm = m.match(/matrix\(([^)]+)\)/); if (!mm) return { rot: 0, tx: 0, ty: 0 };
    const [a, b2, c, d, e, f] = mm[1].split(',').map(parseFloat);
    return { rot: +(Math.atan2(b2, a) * 180 / Math.PI).toFixed(1), tx: Math.round(e), ty: Math.round(f) };
  };

  const res = [];
  for (const w of want) {
    const t = findTitle(w); if (!t) continue;
    const tr = t.getBoundingClientRect();
    const tcx = tr.left + tr.width / 2;
    // stack cards: images whose bottom is above the title top, within 460px, and center within 220px of title center
    const cards = imgs.filter((o) => o.r.bottom <= tr.top + 20 && o.r.bottom > tr.top - 460 && Math.abs(o.r.left + o.r.width / 2 - tcx) < 260)
      .map((o) => ({ src: o.src, w: Math.round(o.r.width), h: Math.round(o.r.height), cx: Math.round(o.r.left + o.r.width / 2), cy: Math.round(o.r.top + o.r.height / 2), left: Math.round(o.r.left), right: Math.round(o.r.right), top: Math.round(o.r.top), bottom: Math.round(o.r.bottom), radius: o.radius, z: o.tfEl ? +getComputedStyle(o.tfEl).zIndex || 0 : 0, ...decompose(o.tf) }))
      .sort((a2, b2) => a2.cy - b2.cy);
    const left = Math.min(...cards.map((c) => c.left)), right = Math.max(...cards.map((c) => c.right));
    res.push({ word: w, titleCx: Math.round(tcx), stackCx: Math.round((left + right) / 2), stackLeft: Math.round(left), stackRight: Math.round(right), n: cards.length, cards });
  }
  return res;
});

for (const s of stacks) {
  console.log(`\n=== ${s.word} ===  titleCx=${s.titleCx} stackCx=${s.stackCx} (offset ${s.stackCx - s.titleCx}) extent[${s.stackLeft}-${s.stackRight}] cards=${s.n}`);
  for (const c of s.cards) console.log(`   ${c.src.padEnd(24)} ${c.w}x${c.h} rot=${c.rot}° tx=${c.tx} ty=${c.ty} z=${c.z} r=${c.radius} cx=${c.cx} box[${c.left}-${c.right}]`);
}
// cross-column gaps
for (let i = 0; i < stacks.length - 1; i++) { const gap = stacks[i + 1].stackLeft - stacks[i].stackRight; console.log(`\ngap ${stacks[i].word}->${stacks[i + 1].word}: ${gap}px ${gap < 0 ? 'OVERLAP' : 'ok'}`); }
await b.close();
