import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });
await p.evaluate(() => scrollTo(0, 5916 - 250));
await p.waitForTimeout(800);

const tickTx = () => p.evaluate(() => { const a = [...document.querySelectorAll('a')].find(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href)); const ul = a?.closest('ul'); const t = getComputedStyle(ul).transform; const m = t.match(/matrix\(([^)]+)\)/); return m ? +m[1].split(',')[4] : null; });

// precise speed over 8s (no hover)
const s0 = await tickTx(); await p.waitForTimeout(8000); const s1 = await tickTx();
console.log('speed:', ((s1 - s0) / 8).toFixed(2), 'px/sec (neg=left) over 8s; tx', s0.toFixed(1), '->', s1.toFixed(1));

// hover pause on a card
const box = await p.evaluate(() => { const a = [...document.querySelectorAll('a')].find(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href)); const r = a.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
await p.mouse.move(box.x, box.y); await p.waitForTimeout(200);
const h0 = await tickTx(); await p.waitForTimeout(1500); const h1 = await tickTx();
console.log('hover:', Math.abs(h1 - h0) < 2 ? 'PAUSES' : `keeps moving (Δ${(h1 - h0).toFixed(1)})`);
await p.mouse.move(50, 50); await p.waitForTimeout(300);
const r0 = await tickTx(); await p.waitForTimeout(1500); const r1 = await tickTx();
console.log('after unhover:', Math.abs(r1 - r0) > 2 ? 'RESUMES' : 'still paused');

// section + heading styling
const style = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const head = [...document.querySelectorAll('div,h2,p')].find(n => norm(n.textContent) === 'THINGS THEY SAY');
  const sub = [...document.querySelectorAll('div,p')].find(n => /REAL WORK, REAL WORDS, REAL WORTH/i.test(norm(n.textContent)) && norm(n.textContent).length < 40);
  const secBg = (() => { let n = head; for (let k = 0; k < 12 && n; k++) { const bg = getComputedStyle(n).backgroundColor; if (bg && bg !== 'rgba(0, 0, 0, 0)') return { bg, at: k, w: Math.round(n.getBoundingClientRect().width) }; n = n.parentElement; } return null; })();
  const cs = (el) => el ? { fs: getComputedStyle(el).fontSize, lh: getComputedStyle(el).lineHeight, fw: getComputedStyle(el).fontWeight, color: getComputedStyle(el).color, ff: getComputedStyle(el).fontFamily.split(',')[0] } : null;
  const a = [...document.querySelectorAll('a')].find(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href));
  const r = a.getBoundingClientRect();
  const cards = [...document.querySelectorAll('a')].filter(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href)).map(a => Math.round(a.getBoundingClientRect().left));
  return { heading: cs(head), sub: cs(sub), secBg, card: { w: Math.round(r.width), h: Math.round(r.height), radius: getComputedStyle(a.querySelector('img')).borderRadius }, cardX: cards };
});
console.log('\nheading:', JSON.stringify(style.heading));
console.log('subhead:', JSON.stringify(style.sub));
console.log('sectionBg:', JSON.stringify(style.secBg));
console.log('card:', JSON.stringify(style.card), 'x positions:', JSON.stringify(style.cardX));
await b.close();
