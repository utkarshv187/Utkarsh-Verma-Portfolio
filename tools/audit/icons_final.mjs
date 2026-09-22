import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });
await p.evaluate(() => scrollTo(0, 7451 - 350));
await p.waitForTimeout(600);

// every image between the bio and the "JUST IN CASE" heading, any size, sorted by x then y
const all = await p.evaluate(() => {
  const out = [];
  for (const im of document.querySelectorAll('img')) { const r = im.getBoundingClientRect(); const dy = r.top + scrollY; if (dy < 7300 || dy > 7600) continue; out.push({ x: Math.round(r.left), y: Math.round(dy), w: Math.round(r.width), h: Math.round(r.height), id: (im.currentSrc || im.src).split('/').pop().split('.')[0] }); }
  return out.sort((a, b) => a.x - b.x);
});
console.log('images in icon band:', all.length);
for (const i of all) console.log('  ', JSON.stringify(i));

// LEARNING badge: full context
const learn = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const els = [...document.querySelectorAll('*')].filter(e => n(e.textContent) === 'LEARNING' && e.children.length <= 2);
  return els.map(e => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); let bgn = e; let bg = 'transparent'; for (let k = 0; k < 4 && bgn; k++) { const b = getComputedStyle(bgn).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)') { bg = b; break; } bgn = bgn.parentElement; } return { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), color: c.color, fs: c.fontSize, fw: c.fontWeight, bg }; });
});
console.log('\nLEARNING:', JSON.stringify(learn));

// icon container: is it a ticker? check ancestor of first icon
const cont = await p.evaluate(() => {
  const im = [...document.querySelectorAll('img')].find(i => { const r = i.getBoundingClientRect(); const dy = r.top + scrollY; return dy > 7300 && dy < 7600 && Math.abs(r.width - 100) < 8; });
  if (!im) return null; let node = im, chain = [];
  for (let k = 0; k < 6 && node; k++) { chain.push({ tag: node.tagName.toLowerCase(), cls: (node.className || '').toString().slice(0, 24), overflow: getComputedStyle(node).overflow, w: Math.round(node.getBoundingClientRect().width) }); node = node.parentElement; }
  return chain;
});
console.log('\nicon ancestor chain:'); for (const c of cont || []) console.log('  ', JSON.stringify(c));
await b.close();
