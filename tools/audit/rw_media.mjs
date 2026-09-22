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
const cardDoc = await p.evaluate(() => ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'].map((u) => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(u) && x.getBoundingClientRect().width > 0); return Math.round(a.getBoundingClientRect().top + scrollY); }));

const info = [];
for (let i = 0; i < 3; i++) {
  await p.evaluate((y) => scrollTo(0, y), cardDoc[i] - 150);
  await p.waitForTimeout(1500);
  const d = await p.evaluate((idx) => {
    const u = ['auction-plp', 'gamification-by-uv', 'iBOEPZFnnHc4BZ3'][idx];
    const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes(u) && x.getBoundingClientRect().width > 0);
    const ar = a.getBoundingClientRect();
    // card container = nearest ancestor whose width ~ card width and that has img descendants
    let card = a;
    while (card && card.parentElement) { const r = card.getBoundingClientRect(); if (Math.abs(r.width - ar.width) < 30 && card.querySelectorAll('img').length > 0) break; card = card.parentElement; }
    // ALL images under the card container, incl offscreen slides
    const imgs = [...card.querySelectorAll('img')].map((im) => { const r = im.getBoundingClientRect(); return { file: (im.currentSrc || im.src).split('?')[0].split('/').pop(), x: Math.round(r.left - ar.left), y: Math.round(r.top - ar.top), w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.top < 900 && r.bottom > 0 }; });
    // detect slideshow-ish descendants (Framer often uses aria-roledescription or data-framer-name)
    const named = [...card.querySelectorAll('[data-framer-name]')].map((e) => e.getAttribute('data-framer-name')).filter((n, j, s) => s.indexOf(n) === j).slice(0, 40);
    // background patterned layers (with background-image)
    const bgs = [...card.querySelectorAll('div')].map((e) => getComputedStyle(e).backgroundImage).filter((b) => b && b !== 'none' && b.includes('url')).slice(0, 8);
    return { cardMatchW: Math.round(card.getBoundingClientRect().width), imgCount: imgs.length, imgs, named, bgs };
  }, i);
  info.push({ card: i + 1, ...d });
}
writeFileSync(join(OUT, 'media.json'), JSON.stringify(info, null, 2));
for (const c of info) {
  console.log(`\n===== CARD ${c.card} media (container w=${c.cardMatchW}, ${c.imgCount} imgs) =====`);
  console.log(' named:', c.named.join(' | '));
  console.log(' imgs:');
  for (const im of c.imgs) console.log(`   ${im.visible ? 'V' : '.'} ${im.file}  @(${im.x},${im.y}) ${im.w}x${im.h}`);
  if (c.bgs.length) console.log(' bg-images:', c.bgs.map((b) => b.split('/').pop().split('?')[0].replace(/["')]/g, '')).join(', '));
}
await b.close();
