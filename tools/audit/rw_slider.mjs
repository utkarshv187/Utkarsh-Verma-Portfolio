import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
const cardDocY = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); return Math.round(a.getBoundingClientRect().top + scrollY); });
await p.evaluate((y) => scrollTo(0, y - 132), cardDocY);
await p.waitForTimeout(1500);

// Card1 viewport region: x120..720 (left media half), y ~132..752
const dump = () => p.evaluate(() => {
  const R = { l: 150, t: 150, r: 650, b: 740 };
  const inR = (r) => { const cx = r.left + r.width / 2, cy = r.top + r.height / 2; return cx > R.l && cx < R.r && cy > R.t && cy < R.b; };
  // media elements
  const media = [];
  for (const el of document.querySelectorAll('img, div')) {
    const r = el.getBoundingClientRect(); if (r.width < 20 || r.height < 20 || !inR(r)) continue;
    const cs = getComputedStyle(el);
    const isImg = el.tagName === 'IMG';
    const hasClip = cs.clipPath !== 'none';
    const hasBgImg = cs.backgroundImage !== 'none' && cs.backgroundImage.includes('url');
    if (!isImg && !hasClip && !hasBgImg) continue;
    media.push({
      tag: el.tagName, name: el.getAttribute('data-framer-name'),
      file: isImg ? (el.currentSrc || el.src).split('?')[0].split('/').pop() : (hasBgImg ? cs.backgroundImage.split('/').pop().split('?')[0].replace(/["')]/g, '') : null),
      x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      clipPath: hasClip ? cs.clipPath : null, overflow: cs.overflow, transform: cs.transform === 'none' ? null : cs.transform,
      zIndex: cs.zIndex, pos: cs.position,
    });
  }
  // handle element (text '<' '>' or 'See')
  const handle = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /^(<|>|See)$/.test((e.textContent || '').trim()) && inR(e.getBoundingClientRect())).map((e) => { const r = e.getBoundingClientRect(); return { text: e.textContent.trim(), x: Math.round(r.left), y: Math.round(r.top) }; });
  return { media, handle };
});

const before = await dump();
// drag the handle left by 120px
const hx = 423, hy = 445;
await p.mouse.move(hx, hy); await p.mouse.down(); await p.mouse.move(hx - 120, hy, { steps: 14 }); await p.mouse.up();
await p.waitForTimeout(600);
const after = await dump();

writeFileSync(join(OUT, 'slider.json'), JSON.stringify({ before, after }, null, 2));
const show = (label, d) => { console.log(`\n=== ${label} ===`); console.log(' handle:', JSON.stringify(d.handle)); for (const m of d.media.sort((a, c) => a.x - c.x)) console.log(`  ${m.tag} ${m.name || ''} file=${m.file} @(${m.x},${m.y}) ${m.w}x${m.h} clip=${m.clipPath} of=${m.overflow} z=${m.zIndex} tf=${m.transform}`); };
show('BEFORE drag', before);
show('AFTER drag-left-120', after);
await b.close();
