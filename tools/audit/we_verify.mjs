import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
await p.waitForTimeout(1200);
for (let y = 0; y < 3000; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
const d = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const sec = document.querySelector('.we');
  const secTop = sec.getBoundingClientRect().y + window.scrollY;
  const off = (el) => el ? Math.round(el.getBoundingClientRect().y + window.scrollY - secTop) : null;
  const g = (sel) => { const e = document.querySelector(sel); return e ? { off: off(e), fs: getComputedStyle(e).fontSize, x: Math.round(e.getBoundingClientRect().x), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) } : null; };
  const rows = [...document.querySelectorAll('.we__row')].map((r) => off(r));
  const cards = [...document.querySelectorAll('.we-card')].map((c) => ({ off: off(c), x: Math.round(c.getBoundingClientRect().x), w: Math.round(c.getBoundingClientRect().width), h: Math.round(c.getBoundingClientRect().height) }));
  const vals = [...document.querySelectorAll('.we-card__value')].map((v) => ({ off: off(v), text: norm(v.textContent), fs: getComputedStyle(v).fontSize }));
  return {
    sectionH: Math.round(sec.getBoundingClientRect().height),
    heading: g('.we__heading'), subtitle: g('.we__subtitle'),
    rows, cards, vals,
    innerX: Math.round(document.querySelector('.we__inner').getBoundingClientRect().x), innerW: Math.round(document.querySelector('.we__inner').getBoundingClientRect().width),
  };
});
console.log('MINE offsets from section top (LIVE targets in comment):');
console.log(JSON.stringify(d, null, 2));
console.log('\nLIVE targets: heading 208, subtitle 320, row1 456, row2 593, row3 761, card 1012, sectionH 1242, innerX 120 innerW 1200');
await b.close();
