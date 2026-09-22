import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/footer'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
await p.waitForTimeout(500);
const pageH = await p.evaluate(() => document.body.scrollHeight);
// entrance: from ~ pageH-5200 to pageH-3200 in 400px steps
let i = 0;
for (let y = pageH - 5400; y <= pageH - 3000; y += 480) {
  await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(650);
  await p.screenshot({ path: `${dir}/enter_${String(i).padStart(2, '0')}_y${Math.round(y)}.png` });
  i++;
}
console.log('entrance frames', i, 'pageH', pageH);

// measure the footer/gold section: find the element with gold bg #FFB705 that is large
const gold = await p.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('div,section,footer')) {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const bg = cs.backgroundColor;
    if (/255, 18[0-9], /.test(bg) && r.width > 800 && r.height > 400) out.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 30), bg, w: Math.round(r.width), h: Math.round(r.height), pos: cs.position, top: cs.top });
  }
  return out.slice(0, 6);
});
console.log('gold sections:', JSON.stringify(gold, null, 1));
await b.close();
