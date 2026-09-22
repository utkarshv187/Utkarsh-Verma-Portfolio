import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');

const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });

const res = await p.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const urls = ['https://auction-plp-redesign-by-uv.vercel.app/', 'https://gamification-by-uv.vercel.app/', 'https://www.figma.com/design/iBOEPZFnnHc4BZ3FtVsQZ7'];
  const cards = urls.map((u) => {
    const as = [...document.querySelectorAll('a[href]')].filter((a) => (a.getAttribute('href') || '').startsWith(u.slice(0, 40)) && vis(a));
    return as.map((a) => {
      const r = a.getBoundingClientRect();
      const imgs = [...a.querySelectorAll('img')].map((i) => (i.currentSrc || i.src).split('?')[0].split('/').pop());
      return {
        href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'),
        box: { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
        innerText: a.innerText,
        images: imgs,
        dataFramerName: a.getAttribute('data-framer-name'),
      };
    });
  });

  // headings computed type
  const heads = {};
  const grab = (needle) => {
    const el = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')].find((e) => vis(e) && e.children.length === 0 && (e.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase() === needle);
    if (!el) return null;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { text: el.textContent, tag: el.tagName, fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, color: cs.color, textTransform: cs.textTransform, box: { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width) } };
  };
  heads.recentWork = grab('RECENT WORK');
  heads.blending = grab('I LOVE BLENDING ART & TECHNOLOGY');
  return { cards, heads };
});

writeFileSync(join(OUT, 'cards.json'), JSON.stringify(res, null, 2));
for (let i = 0; i < res.cards.length; i++) {
  console.log(`\n===== CARD ${i + 1} (${res.cards[i].length} visible match) =====`);
  const c = res.cards[i][0];
  if (!c) { console.log('  NONE VISIBLE'); continue; }
  console.log('href:', c.href, '| target:', c.target, '| rel:', c.rel, '| box:', JSON.stringify(c.box));
  console.log('images:', c.images.join(', '));
  console.log('--- innerText ---\n' + c.innerText);
}
console.log('\n===== HEADINGS =====');
console.log('RECENT WORK:', JSON.stringify(res.heads.recentWork, null, 1));
console.log('BLENDING:', JSON.stringify(res.heads.blending, null, 1));
await b.close();
