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

// Find all sticky project cards in the RECENT WORK area: <a target=_blank> that are ~1200 wide and 620 tall
const cards = await p.evaluate(() => {
  const out = [];
  const as = [...document.querySelectorAll('a[href][target="_blank"]')];
  for (const a of as) {
    const r = a.getBoundingClientRect();
    if (r.width < 800 || r.height < 400 || r.height > 800) continue; // card-sized
    const cs = getComputedStyle(a);
    if (cs.position !== 'sticky') continue;
    // title = biggest text
    const desc = [...a.querySelectorAll('*')];
    const title = desc.filter((e) => e.children.length === 0 && e.textContent.trim().length > 4).sort((x, y) => parseFloat(getComputedStyle(y).fontSize) - parseFloat(getComputedStyle(x).fontSize))[0];
    // stat labels (16px teal/gold)
    const labels = desc.filter((e) => { const c = getComputedStyle(e); return e.children.length === 0 && (c.color.includes('37, 197, 179') || c.color.includes('255, 182, 1')) && parseFloat(c.fontSize) < 20 && e.textContent.trim(); }).map((e) => e.textContent.trim());
    const imgs = [...a.querySelectorAll('img')].map((i) => (i.currentSrc || i.src).split('?')[0].split('/').pop());
    const bgs = desc.filter((e) => getComputedStyle(e).backgroundImage.includes('url')).map((e) => getComputedStyle(e).backgroundImage.split('/').pop().split('?')[0].replace(/["')]/g, ''));
    out.push({ href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'), docY: Math.round(r.top + scrollY), bg: cs.backgroundColor, stickyTop: cs.top, title: title ? title.textContent.trim() : null, labels, imgs: [...new Set(imgs)], bgs: [...new Set(bgs)] });
  }
  // sort by docY
  return out.sort((a, c) => a.docY - c.docY);
});
writeFileSync(join(OUT, 'cards_all.json'), JSON.stringify(cards, null, 2));
console.log('FOUND', cards.length, 'sticky project cards:\n');
cards.forEach((c, i) => {
  console.log(`--- CARD ${i + 1} (docY ${c.docY}, stickyTop ${c.stickyTop}, bg ${c.bg}) ---`);
  console.log('  href:', c.href, '| target:', c.target, '| rel:', c.rel);
  console.log('  title:', c.title);
  console.log('  labels:', JSON.stringify(c.labels));
  console.log('  imgs:', c.imgs.join(', '));
  console.log('  bgs:', c.bgs.join(', '));
});
await b.close();
