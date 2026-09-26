// LCP with vs without the page-load intro, measured fairly: one discarded warm-up load per browser
// (the first load in a fresh browser is always ~1s slower — cold caches — whatever the page does),
// then variants interleaved. usage: node tools/audit/intro_lcp.mjs [url] [rounds]
import { chromium } from 'playwright';
const PAGE = process.argv[2] || 'http://localhost:4199/';
const ROUNDS = Number(process.argv[3] || 5);
const variants = { noIntro: 'strip', intro: null };
const b = await chromium.launch({ args: ['--use-angle=d3d11'] });
const load = async (css) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  if (css === 'strip') await p.route((u) => u.pathname === '/', async (r) => { const f = await r.fetch(); r.fulfill({ response: f, body: (await f.text()).replace("document.documentElement.classList.add('is-intro')", 'void 0') }); });
  await p.addInitScript((css) => {
    window.__lcp = 0; window.__el = '';
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = Math.round(e.startTime); window.__el = (e.element?.className?.baseVal ?? e.element?.className) || e.element?.tagName; } }).observe({ type: 'largest-contentful-paint', buffered: true });
    if (css && css !== 'strip') { const s = document.createElement('style'); s.textContent = css; document.documentElement.appendChild(s); }
  }, css);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1800);
  const r = await p.evaluate(() => [window.__lcp, window.__el]);
  await ctx.close();
  return r;
};
await load('strip'); // warm-up, discarded
const res = Object.fromEntries(Object.keys(variants).map((k) => [k, []]));
for (let i = 0; i < ROUNDS; i++) for (const [k, css] of Object.entries(variants)) res[k].push(await load(css));
for (const [k, v] of Object.entries(res)) {
  const ms = v.map((x) => x[0]).sort((a, b) => a - b);
  console.log(k.padEnd(8), 'median', ms[Math.floor(ms.length / 2)], 'ms  runs', v.map((x) => x[0]).join(' '), ' LCP el:', [...new Set(v.map((x) => x[1]))].join(','));
}
await b.close();
