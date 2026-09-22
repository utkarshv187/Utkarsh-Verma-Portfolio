import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
const cardDocY = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('gamification-by-uv')); return Math.round(a.getBoundingClientRect().top + scrollY); });
await p.evaluate((y) => scrollTo(0, y - 146), cardDocY);
await p.waitForTimeout(1200);
const info = await p.evaluate(() => {
  const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('gamification-by-uv'));
  const cr = a.getBoundingClientRect();
  const gifs = [...a.querySelectorAll('img')].filter((im) => /\.gif/.test(im.currentSrc || im.src));
  return gifs.map((im) => {
    const cs = getComputedStyle(im);
    const r = im.getBoundingClientRect();
    // walk up capturing any transform on wrappers
    const chain = [];
    let el = im;
    for (let d = 0; d < 4 && el && el !== a; d++) { const c = getComputedStyle(el); chain.push({ tag: el.tagName, transform: c.transform, w: c.width, h: c.height, rot: c.rotate, left: c.left, top: c.top, pos: c.position }); el = el.parentElement; }
    return { file: (im.currentSrc || im.src).split('?')[0].split('/').pop(), naturalW: im.naturalWidth, naturalH: im.naturalHeight, bboxW: Math.round(r.width), bboxH: Math.round(r.height), imgW: cs.width, imgH: cs.height, transform: cs.transform, chain };
  });
});
console.log(JSON.stringify(info, null, 2));
await b.close();
