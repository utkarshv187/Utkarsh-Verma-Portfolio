import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1000);
const secTop = await p.evaluate(() => document.querySelector('#recent-work').getBoundingClientRect().top + scrollY);

const cards = ['auction', 'gamification', 'designsystem', 'beyond'];
for (const key of cards) {
  // scroll so this card is pinned/front
  await p.evaluate((k) => { const c = document.querySelector('.rw-card--' + k); scrollTo(0, c.getBoundingClientRect().top + scrollY - 140); }, key);
  await p.waitForTimeout(400);
  const info = await p.evaluate((k) => {
    const c = document.querySelector('.rw-card--' + k);
    const r = c.getBoundingClientRect();
    // probe several points across the card: what element is topmost, and does it live inside an <a href>?
    const pts = [[0.3, 0.3], [0.72, 0.42], [0.5, 0.6], [0.85, 0.75]];
    const res = pts.map(([fx, fy]) => {
      const x = Math.round(r.left + r.width * fx), y = Math.round(r.top + r.height * fy);
      const el = document.elementFromPoint(x, y);
      const a = el?.closest?.('a');
      const anyClickBlocker = (() => { let n = el, out = []; for (let i = 0; i < 6 && n; i++) { const cs = getComputedStyle(n); out.push(`${n.tagName.toLowerCase()}.${(n.className && n.className.baseVal !== undefined ? n.className.baseVal : n.className || '').toString().split(' ')[0]}(pe:${cs.pointerEvents})`); n = n.parentElement; } return out.join(' > '); })();
      return { pt: [fx, fy], el: el ? `${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').split(' ')[0]}` : null, hasAnchor: !!a, href: a?.getAttribute('href') || null, chain: anyClickBlocker };
    });
    return { tag: c.tagName.toLowerCase(), href: c.getAttribute('href'), target: c.getAttribute('target'), rel: c.getAttribute('rel'), pe: getComputedStyle(c).pointerEvents, res };
  }, key);
  console.log(`\n=== card ${key} === <${info.tag}> href=${info.href} target=${info.target} rel=${info.rel} pe=${info.pe}`);
  for (const r of info.res) console.log(`  pt${JSON.stringify(r.pt)} top=${r.el} anchor=${r.hasAnchor} href=${r.href}\n      chain=${r.chain}`);
}
await b.close();
