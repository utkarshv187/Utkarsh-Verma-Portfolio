import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero');
const b = await chromium.launch({ headless: true });

// --- Cursor: desktop, simulate mouse move, inspect the follower element ---
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2000);
await p.mouse.move(700, 400);
await p.waitForTimeout(400);
await p.mouse.move(720, 420);
await p.waitForTimeout(600);
const cursor = await p.evaluate(() => {
  // find fixed, pointer-events:none, small elements high in z that moved near the mouse
  const cands = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed') continue;
    if (cs.pointerEvents !== 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width > 120 || r.height > 120 || r.width < 3 || r.height < 3) continue;
    cands.push({
      name: el.getAttribute('data-framer-name') || el.className?.toString().slice(0, 30) || el.tagName,
      w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y),
      bg: cs.backgroundColor, border: cs.border, borderRadius: cs.borderRadius,
      mixBlend: cs.mixBlendMode, zIndex: cs.zIndex, transform: cs.transform.slice(0, 40),
      opacity: cs.opacity, outerStart: el.outerHTML.slice(0, 160),
    });
  }
  return cands;
});
await writeFile(join(OUT, 'cursor.json'), JSON.stringify(cursor, null, 2));
console.log('cursor candidates:', cursor.length);
for (const c of cursor) console.log(' ', c.w + 'x' + c.h, 'bg=' + c.bg, 'r=' + c.borderRadius, 'blend=' + c.mixBlend, 'z=' + c.zIndex, c.name);

// --- Mobile header icons (mail/whatsapp): resolve <use> symbols in the phone navbar ---
const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const p2 = await ctx2.newPage();
await p2.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await p2.waitForTimeout(2000);
const icons = await p2.evaluate(() => {
  const nav = [...document.querySelectorAll('[data-framer-name="navbar"]')].find((el) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().top < 200);
  const links = [...nav.querySelectorAll('a')];
  const res = [];
  for (const a of links) {
    const href = a.getAttribute('href');
    // svg via <use> or background-image
    let svg = null;
    const use = a.querySelector('use');
    if (use) {
      const id = (use.getAttribute('href') || '').replace('#', '');
      const sym = document.getElementById(id);
      svg = sym ? sym.outerHTML : null;
    }
    let bgImg = null;
    for (const el of a.querySelectorAll('*')) {
      const bi = getComputedStyle(el).backgroundImage;
      if (bi && bi.includes('svg')) { bgImg = decodeURIComponent(bi).slice(0, 800); break; }
    }
    res.push({ href, svg: svg ? svg.slice(0, 800) : null, bgImg });
  }
  return res;
});
await writeFile(join(OUT, 'mobile_icons.json'), JSON.stringify(icons, null, 2));
console.log('mobile header links:', icons.length);
icons.forEach((i, k) => console.log(' ', k, i.href, i.svg ? 'svg' : (i.bgImg ? 'bgImg' : 'none')));
await b.close();
