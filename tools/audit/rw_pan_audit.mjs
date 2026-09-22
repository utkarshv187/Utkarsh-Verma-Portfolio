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
await p.evaluate(async () => { const s = innerHeight * 0.5; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });

const SIGS = [
  { key: 'card2', sig: 'Introduced a' },
  { key: 'card3', sig: 'Established the Spinny' },
  { key: 'card4', sig: 'Other small' },
];

// card4 media bg color: the panel behind the collage
const bg = await p.evaluate(() => {
  const card = [...document.querySelectorAll('div')].find((e) => getComputedStyle(e).position === 'sticky' && /Other small/.test(e.innerText || '') && e.getBoundingClientRect().width > 1000);
  const r = card.getBoundingClientRect();
  // the media box ~ 524x524 at (48,48); find divs with a solid bg (not the card itself) in the left region
  const panels = [...card.querySelectorAll('div')].map((e) => { const rr = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { x: Math.round(rr.left - r.left), y: Math.round(rr.top - r.top), w: Math.round(rr.width), h: Math.round(rr.height), bg: cs.backgroundColor, hasImg: cs.backgroundImage.includes('url') }; }).filter((e) => e.x < 60 && e.y < 60 && e.w > 400 && e.w < 560 && e.bg !== 'rgba(0, 0, 0, 0)');
  return panels;
});
writeFileSync(join(OUT, 'card4_bg.json'), JSON.stringify(bg, null, 2));
console.log('CARD4 media panels (bg):', JSON.stringify(bg));

// scroll-pan: for each card, while pinned, sample the media images' translateY/top vs scrollY
for (const { key, sig } of SIGS) {
  const pin = await p.evaluate((sig) => {
    const card = [...document.querySelectorAll('a,div')].find((e) => getComputedStyle(e).position === 'sticky' && (e.innerText || '').includes(sig) && e.getBoundingClientRect().width > 1000);
    const st = parseFloat(getComputedStyle(card).top) || 0;
    return Math.round(card.getBoundingClientRect().top + scrollY - st);
  }, sig);
  const rows = [];
  for (let off = -100; off <= 700; off += 100) {
    await p.evaluate((y) => scrollTo(0, y), pin + off);
    await p.waitForTimeout(200);
    const s = await p.evaluate((sig) => {
      const card = [...document.querySelectorAll('a,div')].find((e) => getComputedStyle(e).position === 'sticky' && (e.innerText || '').includes(sig) && e.getBoundingClientRect().width > 1000);
      if (!card) return { imgs: [], bgs: [], miss: true };
      const cr = card.getBoundingClientRect();
      const imgs = [...card.querySelectorAll('img')].map((im) => { const cs = getComputedStyle(im); const r = im.getBoundingClientRect(); const m = cs.transform; let ty = 0; if (m && m !== 'none') { const q = m.match(/matrix\(([^)]+)\)/); if (q) ty = Math.round(parseFloat(q[1].split(',')[5])); } return { file: (im.currentSrc || im.src).split('?')[0].split('/').pop().slice(0, 10), relTop: Math.round(r.top - cr.top), h: Math.round(r.height), ty }; });
      // also bg-position of any bg-image divs (in case pan is via background-position)
      const bgs = [...card.querySelectorAll('div')].filter((e) => getComputedStyle(e).backgroundImage.includes('url')).map((e) => ({ file: getComputedStyle(e).backgroundImage.split('/').pop().split('?')[0].replace(/["')]/g, '').slice(0, 10), bgPos: getComputedStyle(e).backgroundPosition }));
      return { imgs, bgs };
    }, sig);
    rows.push({ off, ...s });
  }
  console.log(`\n=== ${key} (${sig}) pin@${pin} — media motion vs scroll offset ===`);
  for (const r of rows) console.log(` off=${String(r.off).padStart(4)}  imgs=${JSON.stringify(r.imgs)}  bgs=${JSON.stringify(r.bgs)}`);
  writeFileSync(join(OUT, `pan_${key}.json`), JSON.stringify(rows, null, 2));
}
await b.close();
