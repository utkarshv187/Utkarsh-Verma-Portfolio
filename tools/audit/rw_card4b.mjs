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

// all card-sized <a target=_blank> regardless of position, sorted by docY, near the RECENT WORK band
const cards = await p.evaluate(() => {
  const as = [...document.querySelectorAll('a[href][target="_blank"]')];
  const out = [];
  for (const a of as) {
    const r = a.getBoundingClientRect();
    const docY = Math.round(r.top + scrollY);
    if (r.width < 700 || r.height < 300) continue;
    if (docY < 2400 || docY > 6500) continue; // recent-work band
    const cs = getComputedStyle(a);
    const desc = [...a.querySelectorAll('*')];
    const title = desc.filter((e) => e.children.length === 0 && e.textContent.trim().length > 4).sort((x, y) => parseFloat(getComputedStyle(y).fontSize) - parseFloat(getComputedStyle(x).fontSize))[0];
    const imgs = [...a.querySelectorAll('img')].map((i) => (i.currentSrc || i.src).split('?')[0].split('/').pop());
    const bgs = desc.filter((e) => getComputedStyle(e).backgroundImage.includes('url')).map((e) => getComputedStyle(e).backgroundImage.split('/').pop().split('?')[0].replace(/["')]/g, ''));
    out.push({ href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'), docY, w: Math.round(r.width), h: Math.round(r.height), position: cs.position, stickyTop: cs.top, bg: cs.backgroundColor, radius: cs.borderRadius, title: title ? title.textContent.trim() : null, innerText: a.innerText.replace(/\n+/g, ' | ').slice(0, 200), imgs: [...new Set(imgs)], bgs: [...new Set(bgs)] });
  }
  return out.sort((a, c) => a.docY - c.docY);
});
writeFileSync(join(OUT, 'cards_all2.json'), JSON.stringify(cards, null, 2));
console.log('FOUND', cards.length, 'card-sized links in RECENT WORK band:\n');
cards.forEach((c, i) => {
  console.log(`--- #${i + 1} docY ${c.docY} ${c.w}x${c.h} pos=${c.position} top=${c.stickyTop} bg=${c.bg} r=${c.radius} ---`);
  console.log('  href:', c.href, '|', c.target, c.rel);
  console.log('  title:', c.title);
  console.log('  text:', c.innerText);
  console.log('  imgs:', c.imgs.join(', '), '| bgs:', c.bgs.join(', '));
});
await b.close();
