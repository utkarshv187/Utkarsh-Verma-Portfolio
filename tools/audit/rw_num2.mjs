import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });

const read = () => p.evaluate(() => {
  const tint = (c) => c.includes('37, 197, 179') || c.includes('255, 182, 1');
  const tiles = [...document.querySelectorAll('div,a')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return tint(cs.backgroundColor) && r.width > 200 && r.width < 320 && r.height > 70 && r.height < 110 && r.top > 100 && r.bottom < 880; });
  return tiles.map((t) => { const r = t.getBoundingClientRect(); const numEl = [...t.querySelectorAll('*')].find((e) => e.children.length === 0 && /[0-9]/.test(e.textContent)); const cs = numEl ? getComputedStyle(numEl) : null; return { it: t.innerText.replace(/\n+/g, ' ').trim(), x: Math.round(r.left), y: Math.round(r.top), tbg: cs ? getComputedStyle(t).backgroundColor : null, num: numEl ? numEl.textContent.trim() : null, numFs: cs ? cs.fontSize : null, numColor: cs ? cs.color : null }; }).sort((a, c) => a.y - c.y || a.x - c.x);
});

for (const [label, y] of [['CARD1', 2540], ['CARD3', 4120]]) {
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(3200);
  const tiles = await read();
  console.log(`\n===== ${label} (scrollY=${y}) =====`);
  for (const t of tiles) console.log(`  @(${t.x},${t.y}) num="${t.num}" ${t.numFs} ${t.numColor} tileBg=${t.tbg}  | "${t.it}"`);
}
await b.close();
