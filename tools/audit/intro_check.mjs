// Page-load intro (html.is-intro, app.css): per-frame timeline recorded IN the page from the first
// frame (no round-trip lag), once-only flag removal, reduced motion, LCP vs a no-intro baseline,
// plus mid-intro phone frames (roles must stay IN FRONT of the portrait during the settle).
// usage: OUT=<dir> node tools/audit/intro_check.mjs [url]
import { chromium } from 'playwright';
const PAGE = process.argv[2] || 'http://localhost:5199/';
const OUT = process.env.OUT || '.';
const b = await chromium.launch({ args: ['--use-angle=d3d11'] });

const recorder = () => {
  window.__lcp = 0;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  window.__rec = [];
  const read = (s) => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; const c = getComputedStyle(e); return [+(+c.opacity).toFixed(2), c.translate === 'none' ? 0 : +parseFloat(c.translate.split(' ')[1] || c.translate).toFixed(1)]; };
  const tick = (t) => {
    if (document.querySelector('.hero__portrait')) {
      window.__rec.push({ t: Math.round(t), intro: document.documentElement.classList.contains('is-intro'),
        product: read('.hero__product'), portrait: read('.hero__portrait'),
        roles: read(innerWidth < 810 ? '.hero__roles-m' : '.hero__role-shift'), header: read('.header__inner') });
    }
    if (t < 4000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

// discarded warm-up load: the FIRST load in a fresh browser is ~1s slower (cold caches) whatever the
// page does — without this, whichever case runs first looks like an LCP regression
{ const w = await b.newContext(); await (await w.newPage()).goto(PAGE, { waitUntil: 'load' }); await w.close(); }

for (const [label, opts, noIntro] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }, false],
  ['desktop, no intro (baseline)', { viewport: { width: 1440, height: 900 } }, true],
  ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, false],
]) {
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.addInitScript(recorder);
  // baseline: serve the page WITHOUT the intro flag script
  if (noIntro) await p.route((u) => u.pathname === '/', async (route) => { const r = await route.fetch(); route.fulfill({ response: r, body: (await r.text()).replace("document.documentElement.classList.add('is-intro')", 'void 0') }); });
  await p.goto(PAGE, { waitUntil: 'commit' });
  if (label === 'phone') {
    await p.waitForSelector('.hero__portrait');
    await p.screenshot({ path: `${OUT}/intro_phone_a.png`, clip: { x: 0, y: 60, width: 390, height: 640 } });
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${OUT}/intro_phone_b.png`, clip: { x: 0, y: 60, width: 390, height: 640 } });
  }
  await p.waitForTimeout(3500);
  const { rec, lcp } = await p.evaluate(() => ({ rec: window.__rec, lcp: Math.round(window.__lcp) }));
  const first = rec[0]?.t ?? 0;
  const introOff = rec.find((r) => !r.intro);
  const settled = rec.find((r) => [r.product, r.portrait, r.roles, r.header].every((v) => !v || (v[0] === 1 && v[1] === 0)));
  const fmt = (v) => (v ? `${v[0].toFixed(2)}/${String(v[1]).padStart(5)}` : '     ·     ');
  if (errs.length) console.log('   errors:', errs.slice(0, 3));
  console.log(`== ${label}: LCP ${lcp}ms · errors ${errs.length} · settled at +${settled ? settled.t - first : '?'}ms · flag removed at +${introOff ? introOff.t - first : 'never'}ms (from the first hero frame)`);
  console.log('   +ms   flag  product       portrait      roles         header      (opacity/translateY)');
  for (const at of [0, 60, 120, 200, 300, 450, 650, 900]) {
    const r = rec.find((x) => x.t - first >= at);
    if (r) console.log(`  ${String(r.t - first).padStart(4)}  ${r.intro ? 'on ' : 'off'}   ${fmt(r.product)}  ${fmt(r.portrait)}  ${fmt(r.roles)}  ${fmt(r.header)}`);
  }
  await ctx.close();
}
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
  await p.goto(PAGE, { waitUntil: 'commit' }); await p.waitForSelector('.hero__portrait');
  console.log('== reduced motion: is-intro =', await p.evaluate(() => document.documentElement.classList.contains('is-intro')),
    '· product opacity =', await p.evaluate(() => getComputedStyle(document.querySelector('.hero__product')).opacity));
}
await b.close();
