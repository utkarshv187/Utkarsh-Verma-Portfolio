import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.7) { scrollTo(0, y); await new Promise(r => setTimeout(r, 220)); } });
// dump every element whose trimmed text contains the phrase
const matches = await p.evaluate(() => {
  scrollTo(0, 0);
  const out = [];
  for (const n of document.querySelectorAll('*')) {
    const t = (n.textContent || '').trim();
    if (!/tier based gamification/i.test(t)) continue;
    if (t.length > 70) continue; // leaf-ish
    const r = n.getBoundingClientRect();
    out.push({ tag: n.tagName.toLowerCase(), len: t.length, docY: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), vis: getComputedStyle(n).visibility, disp: getComputedStyle(n).display, op: getComputedStyle(n).opacity });
  }
  return { total: out.length, out, bodyH: document.body.scrollHeight };
});
console.log('bodyH', matches.bodyH, 'matches', matches.total);
for (const m of matches.out) console.log(JSON.stringify(m));
await b.close();
