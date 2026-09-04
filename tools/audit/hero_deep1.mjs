// Deep hero probe #1: the "O" component (structure/href/hover WhatsApp+ripple),
// graffiti hover, portrait mask, hero background gradient.
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

await page.evaluate(() => {
  window.__kf = (name) => { for (const ss of document.styleSheets) { let r; try { r = ss.cssRules; } catch { continue; } if (!r) continue; for (const x of r) if ((x.type === 7 || x.constructor.name === 'CSSKeyframesRule') && x.name === name) return x.cssText; } return null; };
  window.__style = (el) => { const c = getComputedStyle(el); return { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height), bg: c.backgroundColor, bgImage: c.backgroundImage.slice(0, 90), color: c.color, opacity: c.opacity, transform: c.transform.slice(0, 40), animation: c.animation.slice(0, 80), transition: c.transition.slice(0, 80), borderRadius: c.borderRadius, maskImage: (c.maskImage || c.webkitMaskImage || 'none').slice(0, 90), mixBlend: c.mixBlendMode, filter: c.filter }; };
});

const out = {};

// ---- The O: find the element/link around the badge ----
const oInfo = await page.evaluate(() => {
  const badge = [...document.querySelectorAll('svg')].find((s) => /curve|TOGETHER/i.test(s.innerHTML) || (s.querySelector('textPath')));
  if (!badge) return { found: false };
  // the O container = closest link or data-framer-name wrapping the badge
  const link = badge.closest('a');
  let container = badge.closest('[data-framer-name]') || badge.parentElement;
  // climb a bit to include the O letter + badge
  for (let i = 0; i < 3 && container.parentElement; i++) { if (container.querySelector('svg') && /O/.test(container.textContent)) break; container = container.parentElement; }
  const r = container.getBoundingClientRect();
  return {
    found: true,
    href: link ? link.getAttribute('href') : null,
    isLink: !!link,
    container: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), name: container.getAttribute('data-framer-name') },
    html: (link || container).outerHTML.slice(0, 900),
  };
});
out.O = oInfo;

// hover the O and capture revealed elements + animations
if (oInfo.found) {
  const cx = oInfo.container.x + oInfo.container.w / 2;
  const cy = oInfo.container.y + oInfo.container.h / 2;
  await page.mouse.move(5, 500); await page.waitForTimeout(300);
  const before = await page.evaluate((c) => {
    const badge = [...document.querySelectorAll('svg')].find((s) => s.querySelector('textPath'));
    const cont = badge.closest('a') || badge.closest('[data-framer-name]');
    return [...cont.querySelectorAll('img,svg,div')].slice(0, 30).map((e) => ({ tag: e.tagName, name: e.getAttribute('data-framer-name') || '', img: e.tagName === 'IMG' ? e.src.split('/').pop().split('?')[0] : '', ...window.__style(e) }));
  }, null).catch(() => []);
  await page.mouse.move(cx, cy); await page.waitForTimeout(700);
  const after = await page.evaluate(() => {
    const badge = [...document.querySelectorAll('svg')].find((s) => s.querySelector('textPath'));
    const cont = badge.closest('a') || badge.closest('[data-framer-name]');
    const els = [...cont.querySelectorAll('img,svg,div')].slice(0, 40).map((e) => ({ tag: e.tagName, name: e.getAttribute('data-framer-name') || '', img: e.tagName === 'IMG' ? e.src.split('/').pop().split('?')[0] : '', ...window.__style(e) }));
    // keyframes for any animation present
    const kf = {};
    for (const e of cont.querySelectorAll('*')) { const n = getComputedStyle(e).animationName; if (n && n !== 'none') kf[n] = window.__kf(n); }
    return { els, kf };
  });
  out.O_hover = { before, after: after.els, keyframes: after.kf };
  await page.mouse.move(5, 500); await page.waitForTimeout(300);
}

// ---- Graffiti hover ----
const graf = await page.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('eNT4Xgz'));
  if (!img) return null;
  const el = img.closest('a') || img.closest('[data-framer-name]') || img.parentElement;
  return { def: window.__style(el), transition: getComputedStyle(el).transition, href: el.closest('a')?.getAttribute('href') || null };
});
if (graf) {
  const g = await page.evaluate(() => { const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('eNT4Xgz')); const r = (img.closest('a') || img).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.mouse.move(g.x, g.y); await page.waitForTimeout(600);
  const hov = await page.evaluate(() => { const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('eNT4Xgz')); const el = img.closest('a') || img.closest('[data-framer-name]') || img.parentElement; return window.__style(el); });
  out.graffiti = { default: graf.def, hover: hov, href: graf.href, transition: graf.transition };
  await page.mouse.move(5, 500);
}

// ---- Portrait mask + wrapper ----
out.portrait = await page.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('IWdo08dy') && i.getBoundingClientRect().width > 100);
  const chain = [];
  let el = img;
  for (let i = 0; i < 5 && el; i++) { chain.push({ tag: el.tagName, name: el.getAttribute('data-framer-name') || '', ...window.__style(el) }); el = el.parentElement; }
  return chain;
});

// ---- Hero background gradient (Intro section + children) ----
out.bg = await page.evaluate(() => {
  const layers = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.top > 1100 || r.bottom < 0 || r.width < 300 || r.height < 200) continue;
    const c = getComputedStyle(el);
    if ((c.backgroundImage && c.backgroundImage !== 'none') || (c.backgroundColor !== 'rgba(0, 0, 0, 0)')) {
      layers.push({ name: el.getAttribute('data-framer-name') || el.tagName, w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y), bgColor: c.backgroundColor, bgImage: c.backgroundImage.slice(0, 160), opacity: c.opacity, z: c.zIndex, transform: c.transform.slice(0, 30) });
    }
  }
  return layers.slice(0, 20);
});

await writeFile(join(OUT, 'hero_deep1.json'), JSON.stringify(out, null, 2));
console.log('O found:', out.O.found, 'href:', out.O.href, 'isLink:', out.O.isLink);
console.log('O_hover after els:', out.O_hover ? out.O_hover.after.length : 0, 'keyframes:', out.O_hover ? Object.keys(out.O_hover.keyframes) : []);
console.log('graffiti:', JSON.stringify(out.graffiti));
console.log('portrait chain masks:', out.portrait.map((p) => p.maskImage));
console.log('bg layers:', out.bg.length);
await b.close();
