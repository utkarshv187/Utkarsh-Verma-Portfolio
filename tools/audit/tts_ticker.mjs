import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });
// center the testimonials section
await p.evaluate(() => scrollTo(0, 5916 - 250));
await p.waitForTimeout(800);

const readTicker = () => p.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href));
  const ul = a?.closest('ul');
  const items = ul ? ul.querySelectorAll(':scope > li').length : 0;
  const t = ul ? getComputedStyle(ul).transform : 'n/a';
  const m = t.match(/matrix\(([^)]+)\)/); const tx = m ? +m[1].split(',')[4] : null;
  // count total linkedin anchors (duplicated set)
  const total = [...document.querySelectorAll('a')].filter(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href)).length;
  return { items, tx, total };
});

console.log('ticker tx over 5s (raw translateX of the <ul>):');
let prev = null;
for (let i = 0; i <= 10; i++) {
  const r = await readTicker();
  const d = prev == null ? '' : `(Δ ${(r.tx - prev).toFixed(1)})`;
  console.log(`  t=${i * 500}ms  items=${r.items} totalAnchors=${r.total}  tx=${r.tx} ${d}`);
  prev = r.tx;
  await p.waitForTimeout(500);
}
await b.close();
