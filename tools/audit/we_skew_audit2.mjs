import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);

const res = await p.evaluate(async () => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  // hero = Intro
  const bigs = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 700 && r.top + window.scrollY < 60 && r.width > 800; });
  const hero = bigs.sort((a, c) => a.getBoundingClientRect().height - c.getBoundingClientRect().height)[0];
  const els = [...hero.querySelectorAll('*')];
  const frames = [];
  const t0 = performance.now();
  let step = 0;
  return await new Promise((resolve) => {
    function loop() {
      const scrolling = step < 16;
      if (scrolling) window.scrollBy(0, 48);
      step++;
      // find max-skew element this frame
      let best = { c: 0, e: 0, tag: '', txt: '', dfn: '' };
      for (const el of els) {
        const m = new DOMMatrix(getComputedStyle(el).transform);
        if (Math.abs(m.c) > Math.abs(best.c)) {
          best = { c: +m.c.toFixed(4), e: +m.e.toFixed(1), tag: el.tagName, txt: norm(el.textContent).slice(0, 14), dfn: el.getAttribute('data-framer-name') };
        }
      }
      frames.push({ t: Math.round(performance.now() - t0), y: Math.round(window.scrollY), maxSkewC: best.c, angle: +(Math.atan(best.c) * 180 / Math.PI).toFixed(1), tx: best.e, on: best.txt || best.dfn || best.tag });
      if (performance.now() - t0 < 1600) requestAnimationFrame(loop); else resolve(frames);
    }
    loop();
  });
});
res.forEach((f) => console.log(String(f.t).padStart(4), 'y', String(f.y).padStart(4), 'skewC', String(f.maxSkewC).padStart(8), 'ang', String(f.angle).padStart(6), 'tx', String(f.tx).padStart(7), 'on', f.on));
await b.close();
