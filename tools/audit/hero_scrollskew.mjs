// Measure scroll-linked skew + translateX on PRODUCT and role text; + O counter/ring geometry.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2000);

// tag PRODUCT + role wrappers
await p.evaluate(() => {
  // PRODUCT: the span containing "PR       DUCT"
  const prod = [...document.querySelectorAll('*')].find((e) => /^PR\s+DUCT$/.test(e.textContent.trim()) && e.getBoundingClientRect().width > 400);
  if (prod) { let w = prod; for (let i = 0; i < 3 && w.parentElement; i++) { if (getComputedStyle(w).transform !== 'none') break; w = w.parentElement; } (w || prod).setAttribute('data-sk', 'product'); prod.setAttribute('data-sk2', 'product-span'); }
  // role: the visible role word wrapper
  const roles = ['DESIGNER', 'STRATEGIST', 'RESEARCHER', 'STORYTELLER', 'COPY WRITER', 'ANIMATOR'];
  const re = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && roles.includes(e.textContent.trim()) && e.getBoundingClientRect().height > 60);
  if (re) { let w = re; for (let i = 0; i < 4 && w.parentElement; i++) { if (getComputedStyle(w).transform !== 'none' && getComputedStyle(w).transform !== 'matrix(1, 0, 0, 1, 0, 0)') break; w = w.parentElement; } (w || re).setAttribute('data-sk', 'role'); }
});

function decomp(t) {
  if (!t || t === 'none') return { skewXdeg: 0, tx: 0, a: 1, raw: t };
  const nums = (t.match(/matrix\(([^)]+)\)/) || [])[1];
  if (!nums) return { skewXdeg: 0, tx: 0, raw: t };
  const [a, bb, c, d, e] = nums.split(',').map((x) => parseFloat(x));
  const skew = Math.atan2(c, d) * 180 / Math.PI;
  return { skewXdeg: Math.round(skew * 100) / 100, tx: Math.round(e * 100) / 100, a: +a.toFixed(3), b: +bb.toFixed(3), c: +c.toFixed(3), d: +d.toFixed(3), raw: t };
}

const samples = [];
for (const y of [0, 60, 120, 180, 260, 360, 480, 620, 800]) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(300);
  const row = await p.evaluate(() => {
    const g = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).transform : null; };
    return { scrollY: Math.round(window.scrollY), product: g('[data-sk="product"]'), productSpan: g('[data-sk2="product-span"]'), role: g('[data-sk="role"]') };
  });
  samples.push({ scrollY: row.scrollY, product: decomp(row.product), productSpan: decomp(row.productSpan), role: decomp(row.role) });
}

// O counter + ring geometry
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);
const geo = await p.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('textPath') && s.getBoundingClientRect().width > 40);
  const link = svg.closest('a');
  const path = svg.querySelector('path');
  const tp = svg.querySelector('textPath');
  const r = svg.getBoundingClientRect(); const lr = link.getBoundingClientRect();
  return {
    svg: { w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2), viewBox: svg.getAttribute('viewBox') },
    link: { cx: Math.round(lr.x + lr.width / 2), cy: Math.round(lr.y + lr.height / 2), w: Math.round(lr.width), h: Math.round(lr.height) },
    pathD: path ? path.getAttribute('d') : null,
    fontSize: tp ? getComputedStyle(tp.closest('text') || tp).fontSize : null,
    startOffset: tp ? tp.getAttribute('startOffset') : null,
  };
});

await writeFile(join(__dirname, 'out', 'hero', 'scrollskew.json'), JSON.stringify({ samples, geo }, null, 2));
console.log('=== scroll skew ===');
for (const s of samples) console.log(`y=${s.scrollY}  PRODUCT skew=${s.product.skewXdeg}° tx=${s.product.tx}  | span skew=${s.productSpan.skewXdeg}° tx=${s.productSpan.tx}  | role skew=${s.role.skewXdeg}° tx=${s.role.tx}`);
console.log('=== O geo ===');
console.log('svg', JSON.stringify(geo.svg), 'link', JSON.stringify(geo.link));
console.log('pathD', geo.pathD);
await b.close();
