import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 220)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });

const res = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const want = ['THINGS THEY SAY', 'REAL WORK, REAL WORDS', 'MORE ABOUT ME', 'ENGINEER TURNED ARTIST', 'Result, impact & delight'];
  const found = {};
  for (const n of document.querySelectorAll('div,p,h1,h2,h3,h4,span,a')) {
    const t = norm(n.textContent);
    for (const w of want) {
      if (t.toUpperCase().includes(w.toUpperCase())) {
        const r = n.getBoundingClientRect();
        if (r.width < 20 || r.height < 5) continue;
        const area = r.width * r.height;
        if (!found[w] || area < found[w].area) found[w] = { area, docY: Math.round(r.top + scrollY), tag: n.tagName.toLowerCase(), fs: getComputedStyle(n).fontSize, w: Math.round(r.width), h: Math.round(r.height), text: t.slice(0, 90) };
      }
    }
  }
  return found;
});
for (const [k, v] of Object.entries(res)) console.log(k, '=>', JSON.stringify(v));
await b.close();
