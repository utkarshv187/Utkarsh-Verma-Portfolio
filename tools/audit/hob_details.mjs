import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 180)); } });
const decomp = (t) => { if (!t || t === 'none') return { sx: 1, rot: 0 }; const m = t.match(/matrix\(([^)]+)\)/); if (!m) return { sx: 1, rot: 0 }; const [a, bb] = m[1].split(',').map(parseFloat); return { sx: +Math.hypot(a, bb).toFixed(3), rot: +(Math.atan2(bb, a) * 180 / Math.PI).toFixed(1) }; };

// stack photo rotations (each id -> rotation from its transformed wrapper), z-index
await p.evaluate(() => scrollTo(0, 7550));
await p.waitForTimeout(400);
const stacks = await p.evaluate(() => {
  const ids = ['LPldbLZ', 'OCxNlm00', '0xM0Lwgl', 'RgYfjJzg', 'XFUk3Sput', 'm0vqge19', 'xCgmx8Ft', 'SeM8KGSZ', 'TvEhfYna', 'gxxPbKBL', 'ZnNaPG8g', 'p6SftsAX'];
  const out = {};
  for (const id of ids) {
    const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id));
    if (!im) { out[id] = null; continue; }
    let n = im, tf = 'none', z = 'auto', radius = getComputedStyle(im).borderRadius;
    for (let k = 0; k < 5 && n; k++) { const cs = getComputedStyle(n); if (cs.transform && cs.transform !== 'none') { tf = cs.transform; z = cs.zIndex; break; } n = n.parentElement; }
    const r = im.getBoundingClientRect();
    out[id] = { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top + scrollY), tf, z, radius };
  }
  return out;
});
console.log('STACK photos:');
for (const [id, d] of Object.entries(stacks)) console.log('  ', id, d ? `${d.w}x${d.h} @(${d.x},${d.y}) rot=${decomp(d.tf).rot} z=${d.z} br=${d.radius}` : 'null');

// text styles: intro, sub-titles, captions, PHOTOGRAPHING, "&"
const text = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const pick = (match, minFs) => { const els = [...document.querySelectorAll('div,h1,h2,h3,p,span')].filter((n) => { const t = norm(n.textContent); return match(t) && parseFloat(getComputedStyle(n).fontSize) >= (minFs || 0); }); const e = els.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height)[0]; if (!e) return null; const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { text: norm(e.textContent), fs: c.fontSize, lh: c.lineHeight, fw: c.fontWeight, color: c.color, ff: c.fontFamily.split(',')[0].replace(/"/g, ''), x: Math.round(r.left), docY: Math.round(r.top + scrollY) }; };
  return {
    intro: pick((t) => t === 'JUST IN CASE WHEN I AM NOT DESIGNING', 20),
    gaming: pick((t) => t === 'GAMING', 20),
    gamingCap: pick((t) => /very very competitive/i.test(t) && t.length < 30, 10),
    photographing: pick((t) => t === 'PHOTOGRAPHING' || t === '& PHOTOGRAPHING', 40),
    amp: pick((t) => t === '&', 20),
  };
});
console.log('\nTEXT styles:');
for (const [k, v] of Object.entries(text)) console.log('  ', k, JSON.stringify(v));

// grid entrance: track a lower grid image's opacity + scale as it scrolls up into view
const gridId = 'lc9rKGcl'; // a lower-row grid image
console.log('\nGRID entrance (img lc9rKGcl) opacity/scale/vpTop vs scroll:');
for (let s = 8600; s <= 9900; s += 160) {
  const m = await p.evaluate((id) => { scrollTo(0, arguments0); const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id)); if (!im) return null; const r = im.getBoundingClientRect(); let n = im, op = getComputedStyle(im).opacity, tf = 'none'; for (let k = 0; k < 5 && n; k++) { const cs = getComputedStyle(n); if (cs.opacity !== '1') op = cs.opacity; if (cs.transform !== 'none') tf = cs.transform; n = n.parentElement; } return { vpTop: Math.round(r.top), w: Math.round(r.width), op, tf }; }, gridId).catch(() => null);
  // fallback with explicit scroll
  await p.evaluate((s2) => scrollTo(0, s2), s); await p.waitForTimeout(120);
  const m2 = await p.evaluate((id) => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id)); if (!im) return null; const r = im.getBoundingClientRect(); let n = im, op = 1, tf = 'none'; for (let k = 0; k < 6 && n; k++) { const cs = getComputedStyle(n); if (parseFloat(cs.opacity) < 1) op = cs.opacity; if (cs.transform !== 'none' && cs.transform.includes('matrix')) tf = cs.transform; n = n.parentElement; } return { vpTop: Math.round(r.top), w: Math.round(r.width), op, tf }; }, gridId);
  console.log(`  scroll ${s}: ${m2 ? `vpTop=${m2.vpTop} w=${m2.w} op=${m2.op} sx=${decomp(m2.tf).sx}` : '-'}`);
}
await b.close();
