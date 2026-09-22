import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });
await p.waitForTimeout(500);
const gy = await p.evaluate(() => { const all = [...document.querySelectorAll('*')]; let best = null; for (const el of all) if ((el.textContent || '').trim() === 'GAMING' && el.children.length === 0) { if (!best || el.getBoundingClientRect().width < best.getBoundingClientRect().width) best = el; } return best ? best.getBoundingClientRect().top + scrollY : null; });
// put the stacks fully in view (titles near bottom of viewport)
await p.evaluate((y) => scrollTo(0, y - 480), gy);
await p.waitForTimeout(700);

const data = await p.evaluate(() => {
  const decompose = (m) => { const mm = m.match(/matrix\(([^)]+)\)/); if (!mm) return { rot: 0, tx: 0, ty: 0, sx: 1 }; const [a, b2, c, d, e, f] = mm[1].split(',').map(parseFloat); return { rot: +(Math.atan2(b2, a) * 180 / Math.PI).toFixed(1), tx: Math.round(e), ty: Math.round(f), sx: +Math.hypot(a, b2).toFixed(3) }; };
  // stack images = big imgs in the upper band (y 40..340)
  const imgs = [...document.querySelectorAll('img')].map((im) => {
    const r = im.getBoundingClientRect();
    // find the transformed ancestor (card wrapper)
    let node = im, tf = 'none', tfEl = im;
    for (let k = 0; k < 6 && node; k++) { const cs = getComputedStyle(node); if (cs.transform && cs.transform !== 'none') { tf = cs.transform; tfEl = node; break; } node = node.parentElement; }
    return { im, r, tf, tfEl, ow: im.offsetWidth, oh: im.offsetHeight, radius: getComputedStyle(im).borderRadius, src: (im.currentSrc || im.src).split('/').pop().slice(0, 12) };
  }).filter((o) => o.r.height > 60 && o.r.width > 60 && o.r.top > -40 && o.r.top < 480 && o.r.bottom < 540);

  // group into 3 columns by screen center third
  const W = innerWidth; const col = (cx) => cx < W / 3 ? 0 : cx < 2 * W / 3 ? 1 : 2;
  const groups = [[], [], []];
  for (const o of imgs) { const cx = o.r.left + o.r.width / 2; groups[col(cx)].push(o); }
  const names = ['GAMING', 'SOCIALIZING', 'ADVENTURING'];
  return groups.map((g, gi) => {
    const cards = g.map((o) => ({ src: o.src, layoutW: o.ow, layoutH: o.oh, boxW: Math.round(o.r.width), boxH: Math.round(o.r.height), cx: Math.round(o.r.left + o.r.width / 2), cy: Math.round(o.r.top + o.r.height / 2), left: Math.round(o.r.left), right: Math.round(o.r.right), radius: o.radius, z: +getComputedStyle(o.tfEl).zIndex || 0, ...decompose(o.tf) }))
      .sort((a, b2) => a.z - b2.z);
    const left = Math.min(...cards.map((c) => c.left)), right = Math.max(...cards.map((c) => c.right));
    return { name: names[gi], n: cards.length, stackCx: Math.round((left + right) / 2), left: Math.round(left), right: Math.round(right), cards };
  });
});
for (const s of data) {
  console.log(`\n=== ${s.name} === n=${s.n} stackCx=${s.stackCx} extent[${s.left}-${s.right}]`);
  for (const c of s.cards) console.log(`   z=${String(c.z).padStart(2)} rot=${String(c.rot).padStart(6)}° sx=${c.sx} layout=${c.layoutW}x${c.layoutH} box=${c.boxW}x${c.boxH} tx=${c.tx} ty=${c.ty} r=${c.radius} cx=${c.cx} [${c.left}-${c.right}] ${c.src}`);
}
for (let i = 0; i < data.length - 1; i++) console.log(`\ngap ${data[i].name}->${data[i + 1].name}: ${data[i + 1].left - data[i].right}px`);
await b.close();
