import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

const res = await page.evaluate(() => {
  const out = {};
  // Portrait blend/mask + wrapper background
  const portrait = [...document.querySelectorAll('img')].find((i) => i.src.includes('IWdo08dy') && i.getBoundingClientRect().width > 100);
  if (portrait) {
    const cs = getComputedStyle(portrait);
    out.portrait = { mixBlend: cs.mixBlendMode, mask: cs.maskImage.slice(0, 60), webkitMask: (cs.webkitMaskImage || '').slice(0, 60), filter: cs.filter, objectFit: cs.objectFit, opacity: cs.opacity };
    // ancestors' backgrounds (up to 5)
    out.portraitAncestors = [];
    let p = portrait.parentElement;
    for (let i = 0; i < 5 && p; i++) { const c = getComputedStyle(p); const r = p.getBoundingClientRect(); out.portraitAncestors.push({ name: p.getAttribute('data-framer-name') || p.tagName, w: Math.round(r.width), h: Math.round(r.height), bg: c.backgroundColor, bgImage: c.backgroundImage.slice(0, 70), mixBlend: c.mixBlendMode, filter: c.filter, borderRadius: c.borderRadius, overflow: c.overflow }); p = p.parentElement; }
  }
  // All hero-region elements with radial-gradient or notable purple bg
  const glow = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.top > 1100 || r.bottom < 0 || r.width < 60 || r.height < 60) continue;
    const cs = getComputedStyle(el);
    const bi = cs.backgroundImage;
    if (bi.includes('radial-gradient') || bi.includes('conic')) {
      glow.push({ name: el.getAttribute('data-framer-name') || el.tagName, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), bg: bi.slice(0, 120), filter: cs.filter, opacity: cs.opacity, mixBlend: cs.mixBlendMode, z: cs.zIndex });
    }
  }
  out.glow = glow.slice(0, 15);
  // Hit-test several hero points to find layer stacks (graffiti, badge)
  const points = { graffiti: [670, 470], graffiti2: [700, 520], badge: [660, 430], portraitHead: [740, 260] };
  out.hits = {};
  for (const [k, [x, y]] of Object.entries(points)) {
    out.hits[k] = document.elementsFromPoint(x, y).slice(0, 6).map((el) => {
      const cs = getComputedStyle(el); const img = el.tagName === 'IMG' ? el.src.split('/').pop().split('?')[0] : '';
      return { tag: el.tagName, name: el.getAttribute('data-framer-name') || '', img, bgImage: cs.backgroundImage.slice(0, 50), text: el.children.length === 0 ? el.textContent.trim().slice(0, 20) : '' };
    });
  }
  // Any image near the graffiti location
  out.imagesInHero = [...document.querySelectorAll('img')].filter((i) => { const r = i.getBoundingClientRect(); return r.top < 1100 && r.width > 20; }).map((i) => ({ src: i.src.split('/').pop().split('?')[0], x: Math.round(i.getBoundingClientRect().x), y: Math.round(i.getBoundingClientRect().y), w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height) }));
  return out;
});

await writeFile(join(OUT, 'hero_layers.json'), JSON.stringify(res, null, 2));
console.log('portrait:', JSON.stringify(res.portrait));
console.log('portraitAncestors:'); for (const a of res.portraitAncestors) console.log('  ', JSON.stringify(a));
console.log('glow layers:', res.glow.length); for (const g of res.glow) console.log('  ', JSON.stringify(g));
console.log('imagesInHero:'); for (const i of res.imagesInHero) console.log('  ', JSON.stringify(i));
console.log('hits.graffiti:', JSON.stringify(res.hits.graffiti));
console.log('hits.badge:', JSON.stringify(res.hits.badge));
await b.close();
