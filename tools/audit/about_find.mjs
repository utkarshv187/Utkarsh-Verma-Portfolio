import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 220)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });

// locate headings
const heads = await p.evaluate(() => {
  const want = ['THINGS THEY SAY', 'REAL WORK', 'MORE ABOUT ME', 'ENGINEER TURNED ARTIST', 'LEARNING'];
  const out = {};
  for (const n of document.querySelectorAll('*')) {
    const t = (n.textContent || '').trim();
    for (const w of want) {
      if (t.toUpperCase().includes(w) && t.length < w.length + 30 && !out[w]) {
        const r = n.getBoundingClientRect();
        if (r.width > 20 && r.height > 5) out[w] = { docY: Math.round(r.top + scrollY), tag: n.tagName.toLowerCase(), text: t.slice(0, 60), fs: getComputedStyle(n).fontSize };
      }
    }
  }
  return { out, bodyH: document.body.scrollHeight };
});
console.log('bodyH', heads.bodyH);
console.log(JSON.stringify(heads.out, null, 2));
await b.close();
