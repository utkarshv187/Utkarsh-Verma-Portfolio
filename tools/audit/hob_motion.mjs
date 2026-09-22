import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });

const decomp = (t) => { if (!t || t === 'none') return { sx: 1, sy: 1, rot: 0, tx: 0, ty: 0 }; const m = t.match(/matrix\(([^)]+)\)/); if (!m) return { sx: 1, sy: 1, rot: 0, tx: 0, ty: 0 }; const [a, bb, c, d, e, f] = m[1].split(',').map(parseFloat); return { sx: +Math.hypot(a, bb).toFixed(3), sy: +Math.hypot(c, d).toFixed(3), rot: +(Math.atan2(bb, a) * 180 / Math.PI).toFixed(1), tx: Math.round(e), ty: Math.round(f) }; };

// track: a GAMING stack photo, the PHOTOGRAPHING heading, a top grid image
const track = (scroll) => p.evaluate((s) => {
  scrollTo(0, s);
  const norm = (x) => (x || '').replace(/\s+/g, ' ').trim();
  const byId = (id) => [...document.querySelectorAll('img')].find((im) => (im.currentSrc || im.src).includes(id));
  const tf = (el) => { if (!el) return null; // find nearest transformed wrapper
    let n = el; for (let k = 0; k < 5 && n; k++) { const t = getComputedStyle(n).transform; if (t && t !== 'none') { const r = n.getBoundingClientRect(); return { t, w: Math.round(r.width), h: Math.round(r.height), vpTop: Math.round(r.top) }; } n = n.parentElement; } const r = el.getBoundingClientRect(); return { t: 'none', w: Math.round(r.width), h: Math.round(r.height), vpTop: Math.round(r.top) }; };
  const heading = [...document.querySelectorAll('div,h2')].find((n) => /PHOTOGRAPHING/i.test(norm(n.textContent)) && parseFloat(getComputedStyle(n).fontSize) > 40);
  const hr = heading?.getBoundingClientRect();
  const stack = byId('LPldbLZ'); // GAMING top photo
  const sr = stack?.getBoundingClientRect();
  const grid = byId('fAjY3sZM'); // top-left grid image
  const gr = grid?.getBoundingClientRect();
  return {
    stack: stack ? { vpTop: Math.round(sr.top), w: Math.round(sr.width), tf: tf(stack) } : null,
    heading: heading ? { vpTop: Math.round(hr.top), tf: tf(heading) } : null,
    grid: grid ? { vpTop: Math.round(gr.top), w: Math.round(gr.width), h: Math.round(gr.height), tf: tf(grid) } : null,
  };
}, scroll);

console.log('scroll | GAMING-photo(vpTop,w) | PHOTO-heading(vpTop) | grid-img(vpTop,w,h)');
for (let s = 7500; s <= 10400; s += 150) {
  const m = await track(s);
  await p.waitForTimeout(90);
  const st = m.stack ? `${m.stack.vpTop},${m.stack.w} ${decomp(m.stack.tf.t).rot}deg` : '-';
  const hd = m.heading ? `${m.heading.vpTop} sx${decomp(m.heading.tf.t).sx} ty${decomp(m.heading.tf.t).ty}` : '-';
  const gd = m.grid ? `${m.grid.vpTop},${m.grid.w}x${m.grid.h} sx${decomp(m.grid.tf.t).sx}` : '-';
  console.log(`${s} | ${st} | ${hd} | ${gd}`);
}
await b.close();
