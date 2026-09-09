import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);

// find hero, scan for max pure-skewX element (b~0, c!=0), report angle+tx+identity
const scan = () => p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const bigs = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 700 && r.top + window.scrollY < 60 && r.width > 800; });
  const hero = bigs.sort((a, c) => a.getBoundingClientRect().height - c.getBoundingClientRect().height)[0] || document.body;
  let best = { c: 0 };
  for (const el of hero.querySelectorAll('*')) { const m = new DOMMatrix(getComputedStyle(el).transform); if (Math.abs(m.b) < 0.02 && Math.abs(m.c) > Math.abs(best.c)) best = { c: +m.c.toFixed(4), e: +m.e.toFixed(1), txt: norm(el.textContent).slice(0, 14), dfn: el.getAttribute('data-framer-name'), cls: (el.className || '').toString().slice(0, 18) }; }
  return best;
});
const ang = (c) => (Math.atan(c) * 180 / Math.PI).toFixed(1);

async function jump(to, label) {
  await p.evaluate((y) => window.scrollTo(0, y), Math.max(0, to - 400));
  await p.waitForTimeout(500);
  await p.evaluate((y) => window.scrollTo(0, y), to); // instant jump = velocity spike
  const waits = [0, 60, 120, 200, 320, 500, 800];
  const out = [];
  for (const w of waits) { if (w) await p.waitForTimeout(w - (out.length ? waits[out.length - 1] : 0)); const s = await scan(); out.push({ w, ang: +ang(s.c), tx: s.e, on: s.txt || s.dfn || s.cls }); }
  console.log(`\n[${label}] jump to ${to}`);
  out.forEach((o) => console.log('  +' + String(o.w).padStart(3) + 'ms  ang', String(o.ang).padStart(6), 'tx', String(o.tx).padStart(7), 'on', o.on));
}
await jump(400, 'DOWN to 400');
await jump(150, 'UP to 150');
await b.close();
