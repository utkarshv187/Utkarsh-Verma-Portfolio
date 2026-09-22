import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.5; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
const cardDocY = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); return Math.round(a.getBoundingClientRect().top + scrollY); });
await p.evaluate((y) => scrollTo(0, y - 132), cardDocY);
await p.waitForTimeout(800);

// card1 media box in viewport
const box = await p.evaluate(() => {
  const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp'));
  const r = a.getBoundingClientRect();
  // media ~ left 48..572 within card
  return { left: r.left + 48, top: r.top + 48, w: 524, h: 524, cardLeft: r.left, cardTop: r.top };
});

// move mouse FAR away (not over card) then capture 4 frames to detect default ripple animation
await p.mouse.move(1400, 850);
await p.waitForTimeout(300);
const clip = { x: box.left, y: box.top, width: box.w, height: box.h };
for (let i = 0; i < 4; i++) { await sharp(await p.screenshot({ clip })).toFile(join(OUT, `c1_idle_${i}.png`)); await p.waitForTimeout(500); }

// DOM structure of the media (svg? canvas? divs?)
const dom = await p.evaluate(() => {
  const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp'));
  const r = a.getBoundingClientRect();
  const inMedia = (el) => { const rr = el.getBoundingClientRect(); return rr.left >= r.left + 20 && rr.left < r.left + 580 && rr.top >= r.top + 20 && rr.width > 8 && rr.height > 8; };
  const nodes = [...a.querySelectorAll('*')].filter(inMedia).slice(0, 40).map((e) => { const cs = getComputedStyle(e); const rr = e.getBoundingClientRect(); return { tag: e.tagName, cls: (e.className.baseVal ?? e.className ?? '').toString().slice(0, 30), name: e.getAttribute('data-framer-name'), x: Math.round(rr.left - r.left), y: Math.round(rr.top - r.top), w: Math.round(rr.width), h: Math.round(rr.height), clip: cs.clipPath === 'none' ? null : cs.clipPath.slice(0, 40), bg: cs.backgroundImage.includes('url') ? cs.backgroundImage.split('/').pop().split('?')[0].replace(/["')]/g, '') : null }; });
  const svgs = [...a.querySelectorAll('svg')].map((s) => ({ vb: s.getAttribute('viewBox'), html: s.outerHTML.slice(0, 300) }));
  const canvases = [...a.querySelectorAll('canvas')].length;
  return { nodes, svgCount: svgs.length, svgs: svgs.slice(0, 3), canvases };
});
writeFileSync(join(OUT, 'c1_dom.json'), JSON.stringify(dom, null, 2));
console.log('svgCount', dom.svgCount, 'canvases', dom.canvases);
console.log('nodes:'); dom.nodes.forEach((n) => console.log(' ', JSON.stringify(n)));

// now HOVER: move mouse to several x positions across the media, capture divider position
for (const frac of [0.2, 0.5, 0.8]) {
  const mx = box.left + box.w * frac, my = box.top + box.h * 0.5;
  await p.mouse.move(mx - 20, my); await p.mouse.move(mx, my, { steps: 5 });
  await p.waitForTimeout(400);
  await sharp(await p.screenshot({ clip })).toFile(join(OUT, `c1_hover_${Math.round(frac * 100)}.png`));
}
console.log('wrote idle + hover frames');
await b.close();
