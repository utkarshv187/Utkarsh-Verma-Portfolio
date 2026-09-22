import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });
await p.evaluate(() => scrollTo(0, 5916 - 100));
await p.waitForTimeout(700);

const firstCardX = () => p.evaluate(() => { const a = [...document.querySelectorAll('a')].filter(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href)); const im = a[0]?.querySelector('img'); return im ? +im.getBoundingClientRect().left.toFixed(1) : null; });
const allX = () => p.evaluate(() => [...document.querySelectorAll('a')].filter(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href)).map(a => { const im = a.querySelector('img'); return im ? Math.round(im.getBoundingClientRect().left) : null; }));

// track structure: the transformed ancestor of card 1
const track = await p.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href));
  let node = a, chain = [];
  for (let k = 0; k < 8 && node; k++) { const cs = getComputedStyle(node); chain.push({ tag: node.tagName.toLowerCase(), cls: (node.className || '').toString().slice(0, 30), transform: cs.transform, overflow: cs.overflow, w: Math.round(node.getBoundingClientRect().width) }); node = node.parentElement; }
  return chain;
});
console.log('card1 ancestor chain:'); for (const c of track) console.log('  ', JSON.stringify(c));

console.log('\nfree motion (all 3 card x over ~3s):');
for (let i = 0; i < 8; i++) { const xs = await allX(); console.log(`  t=${i * 400}ms`, JSON.stringify(xs)); await p.waitForTimeout(400); }

// speed estimate
const a1 = await firstCardX(); await p.waitForTimeout(1000); const a2 = await firstCardX();
console.log(`\nspeed ~ ${Math.round((a2 - a1))} px/sec (sign = direction)`);

// hover pause
const box = await p.evaluate(() => { const a = [...document.querySelectorAll('a')].find(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href)); const r = a.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
await p.mouse.move(box.x, box.y); await p.waitForTimeout(150);
const h0 = await firstCardX(); await p.waitForTimeout(1000); const h1 = await firstCardX();
console.log(`hover pause: x ${h0} -> ${h1} (delta ${Math.round(h1 - h0)}) => ${Math.abs(h1 - h0) < 3 ? 'PAUSES on hover' : 'keeps moving'}`);
await b.close();
