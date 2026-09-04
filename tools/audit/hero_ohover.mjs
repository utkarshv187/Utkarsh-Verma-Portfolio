import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

await page.evaluate(() => {
  window.__kf = (name) => { for (const ss of document.styleSheets) { let r; try { r = ss.cssRules; } catch { continue; } if (!r) continue; for (const x of r) if ((x.type === 7 || x.constructor.name === 'CSSKeyframesRule') && x.name === name) return x.cssText; } return null; };
});

const out = {};
// locate the O link center
const oc = await page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('textPath'));
  const link = svg.closest('a');
  const r = (link || svg).getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, href: link ? link.getAttribute('href') : null };
});
out.oCenter = oc;

// default screenshot of O region
await page.mouse.move(5, 500); await page.waitForTimeout(400);
await page.screenshot({ path: join(OUT, 'ohover_default.png'), clip: { x: 380, y: 230, width: 320, height: 300 } });

// hover the O and sample revealed elements over ~1.6s (ripple)
await page.mouse.move(oc.x, oc.y);
await page.waitForTimeout(120);
await page.screenshot({ path: join(OUT, 'ohover_t120.png'), clip: { x: 380, y: 230, width: 320, height: 300 } });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, 'ohover_t420.png'), clip: { x: 380, y: 230, width: 320, height: 300 } });
await page.waitForTimeout(400);
await page.screenshot({ path: join(OUT, 'ohover_t820.png'), clip: { x: 380, y: 230, width: 320, height: 300 } });

// capture the revealed whatsapp icon + ripple element details
out.reveal = await page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('textPath'));
  const link = svg.closest('a');
  const items = [];
  for (const el of link.querySelectorAll('*')) {
    const c = getComputedStyle(el); const r = el.getBoundingClientRect();
    const isWA = (el.tagName === 'IMG' && /whatsapp/i.test(el.alt || '')) || (c.backgroundImage.includes('svg') && /21.717|WhatsApp|M 17.087/i.test(decodeURIComponent(c.backgroundImage)));
    const notable = r.width > 4 && (c.animationName !== 'none' || c.borderRadius.includes('%') || (el.tagName === 'IMG') || c.backgroundImage.includes('svg') || c.boxShadow !== 'none');
    if (notable) items.push({ tag: el.tagName, name: el.getAttribute('data-framer-name') || '', w: Math.round(r.width), h: Math.round(r.height), bg: c.backgroundColor, bgImage: c.backgroundImage.slice(0, 40), borderRadius: c.borderRadius, anim: c.animation.slice(0, 70), animName: c.animationName, boxShadow: c.boxShadow.slice(0, 50), opacity: c.opacity, transform: c.transform.slice(0, 30), isWA });
  }
  const kf = {}; for (const el of link.querySelectorAll('*')) { const n = getComputedStyle(el).animationName; if (n && n !== 'none') kf[n] = window.__kf(n); }
  return { items: items.slice(0, 20), keyframes: kf };
});

// graffiti hover
const gc = await page.evaluate(() => { const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('eNT4Xgz')); const r = img.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await page.mouse.move(5, 500); await page.waitForTimeout(300);
const gDef = await page.evaluate(() => { const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('eNT4Xgz')); const c = getComputedStyle(img); return { transform: c.transform, filter: c.filter, transition: c.transition, opacity: c.opacity }; });
await page.mouse.move(gc.x, gc.y); await page.waitForTimeout(600);
const gHov = await page.evaluate(() => { const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('eNT4Xgz')); const c = getComputedStyle(img); return { transform: c.transform, filter: c.filter, opacity: c.opacity }; });
out.graffiti = { default: gDef, hover: gHov };

// portrait bottom fade + bg gradient: read the mask/gradient overlay near portrait bottom
out.fade = await page.evaluate(() => {
  const res = [];
  for (const el of document.querySelectorAll('div')) {
    const r = el.getBoundingClientRect(); if (r.top > 1100 || r.width < 200) continue;
    const c = getComputedStyle(el);
    const mi = c.maskImage || c.webkitMaskImage;
    if ((c.backgroundImage.includes('gradient') && (c.backgroundImage.includes('12, 31') || c.backgroundImage.includes('15, 12') || c.backgroundImage.includes('0, 0, 0'))) || (mi && mi !== 'none')) {
      res.push({ n: el.getAttribute('data-framer-name') || el.tagName, w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y), bgImage: c.backgroundImage.slice(0, 120), mask: mi.slice(0, 120), z: c.zIndex });
    }
  }
  return res.slice(0, 12);
});

await writeFile(join(OUT, 'ohover.json'), JSON.stringify(out, null, 2));
console.log('O href:', oc.href);
console.log('reveal items:', out.reveal.items.length, 'keyframes:', Object.keys(out.reveal.keyframes));
console.log('graffiti default/hover:', JSON.stringify(out.graffiti));
console.log('fade layers:', JSON.stringify(out.fade, null, 1));
await b.close();
