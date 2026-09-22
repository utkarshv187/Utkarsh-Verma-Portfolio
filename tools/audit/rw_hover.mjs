import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
const cardDocY = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); return Math.round(a.getBoundingClientRect().top + scrollY); });
await p.evaluate((y) => scrollTo(0, y - 150), cardDocY);
await p.waitForTimeout(1200);

// cursor-label attrs anywhere on the cards + hover effect on card1
const meta = await p.evaluate(() => {
  const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp'));
  const withCursor = [...document.querySelectorAll('[data-framer-cursor], [data-cursor], [class*="cursor"]')].length;
  // does the card or an ancestor carry a custom cursor?
  return { hasWhileHoverAttr: !!a.closest('[data-framer-appear-id]'), aBox: (() => { const r = a.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() };
});
console.log('meta', JSON.stringify(meta));

// sample transform of card <a> before/at hover
const before = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); const cs = getComputedStyle(a); const media = a.parentElement.querySelector('img'); return { aTf: cs.transform, aScale: cs.scale }; });
const box = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); const r = a.getBoundingClientRect(); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; });
await p.mouse.move(box.cx, box.cy, { steps: 10 });
await p.waitForTimeout(700);
const after = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); const cs = getComputedStyle(a); return { aTf: cs.transform, cursor: cs.cursor }; });
console.log('BEFORE hover:', JSON.stringify(before));
console.log('AFTER  hover:', JSON.stringify(after));
await b.close();
