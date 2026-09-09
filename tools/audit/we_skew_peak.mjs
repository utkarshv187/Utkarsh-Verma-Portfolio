import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);

async function peak(delta, label) {
  const r = await p.evaluate(async (d) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const bigs = [...document.querySelectorAll('body *')].filter((e) => { const rr = e.getBoundingClientRect(); return rr.height > 700 && rr.top + window.scrollY < 60 && rr.width > 800; });
    const hero = bigs.sort((a, c) => a.getBoundingClientRect().height - c.getBoundingClientRect().height)[0] || document.body;
    const els = [...hero.querySelectorAll('*')];
    return await new Promise((resolve) => {
      // scroll, then read on the next two frames (catch peak before decay)
      window.scrollBy(0, d);
      requestAnimationFrame(() => {
        const snap = () => { let best = { c: 0 }; for (const el of els) { const m = new DOMMatrix(getComputedStyle(el).transform); if (Math.abs(m.b) < 0.02 && Math.abs(m.c) > Math.abs(best.c)) { best = { c: +m.c.toFixed(4), a: +m.a.toFixed(3), d: +m.d.toFixed(3), e: +m.e.toFixed(1), txt: norm(el.textContent).slice(0, 16), dfn: el.getAttribute('data-framer-name'), cls: (el.className || '').toString().slice(0, 20) }; } } return best; };
        const f1 = snap();
        requestAnimationFrame(() => { const f2 = snap(); resolve({ f1, f2, y: Math.round(window.scrollY) }); });
      });
    });
  }, delta);
  const ang = (c) => (Math.atan(c) * 180 / Math.PI).toFixed(1);
  console.log(`[${label}] y=${r.y}`);
  console.log('  frame1: skewC', r.f1.c, '=>', ang(r.f1.c) + 'deg', 'tx', r.f1.e, 'on', r.f1.txt || r.f1.dfn || r.f1.cls);
  console.log('  frame2: skewC', r.f2.c, '=>', ang(r.f2.c) + 'deg', 'tx', r.f2.e, 'on', r.f2.txt || r.f2.dfn || r.f2.cls);
}

await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
await peak(1200, 'DOWN 1200 (from top)');
await p.waitForTimeout(500);
await peak(-800, 'UP 800');
await p.waitForTimeout(500);
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
await peak(400, 'DOWN 400 (from top)');
await b.close();
