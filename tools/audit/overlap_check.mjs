import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function check(w, h, label) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 800, reducedMotion: 'no-preference' })).newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(900);
  const y = await p.evaluate(() => document.querySelector('#more-about-me').getBoundingClientRect().top + scrollY);
  await p.evaluate((yy) => scrollTo(0, yy - (window.innerWidth < 800 ? 10 : 40)), y);
  await p.waitForTimeout(3300);
  const res = await p.evaluate(() => {
    const words = [...document.querySelectorAll('.about__word')];
    const phrases = [1, 2, 3, 4, 5].map((n) => ({ n, el: document.querySelector('.about__anchor--' + n + ' .about__ins-text'), anchor: document.querySelector('.about__anchor--' + n) }));
    const inter = (a, b2) => { const x = Math.max(0, Math.min(a.right, b2.right) - Math.max(a.left, b2.left)); const yy = Math.max(0, Math.min(a.bottom, b2.bottom) - Math.max(a.top, b2.top)); return { x: Math.round(x), y: Math.round(yy) }; };
    const out = [];
    for (const ph of phrases) {
      if (!ph.el) continue;
      const pr = ph.el.getBoundingClientRect();
      for (const wd of words) {
        if (wd === ph.anchor) continue; // its own anchor word is expected to be adjacent
        const wr = wd.getBoundingClientRect();
        const it = inter(pr, wr);
        // significant overlap = both dims > 5px (visual overlap on the glyph, not just bbox edges)
        if (it.x > 6 && it.y > 6) out.push({ phrase: ph.n, over: wd.textContent.replace(/[^a-zA-Z0-9+]/g, '').slice(0, 10), x: it.x, y: it.y });
      }
    }
    return out;
  });
  console.log(`[${label} ${w}] overlaps: ${res.length}`);
  for (const o of res) console.log('   phrase', o.phrase, 'overlaps word "' + o.over + '" by', o.x + 'x' + o.y + 'px');
  await p.close();
}
await check(1920, 1080, 'XL');
await check(1440, 900, 'DESKTOP');
await check(1280, 900, 'MIN');
await check(1024, 820, 'TABLET');
await check(390, 844, 'MOBILE');
await b.close();
console.log('done');
