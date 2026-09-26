// Frame-time cost of the scroll-reveal (src/lib/scrollReveal.ts) while scrolling the whole page.
// usage: node tools/audit/reveal_perf.mjs <url> <desktop|phone> <on|none|off> [cpuThrottle]
//   on     = the reveal as shipped (fade + rise)
//   none   = reveal disabled, everything else animating — the fair baseline
//   off    = prefers-reduced-motion (reveal AND the site's other motion disabled)
import { chromium } from 'playwright';
const [URL, DEVICE, MODE, CPU = '1'] = process.argv.slice(2);
const phone = DEVICE === 'phone';
const b = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
const ctx = await b.newContext({
  viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: phone ? 3 : 1,
  isMobile: phone,
  hasTouch: phone,
  reducedMotion: MODE === 'off' ? 'reduce' : 'no-preference',
});
const p = await ctx.newPage();
await p.addInitScript(({ mode }) => {
  // none = the reveal finds no targets (everything else on the page animates as normal)
  if (mode === 'none') {
    const qsa = Document.prototype.querySelectorAll;
    Document.prototype.querySelectorAll = function (s) { return s.includes('.we__heading,') ? [] : qsa.call(this, s); };
  }
}, { mode: MODE });
await p.goto(URL, { waitUntil: 'load' });
await p.waitForTimeout(1500);
// warm: load lazy images once, then back to top
await p.evaluate(async () => {
  const set = (y) => { document.documentElement.scrollTop = y; document.body.scrollTop = y; };
  const H = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  for (let y = 0; y < H; y += innerHeight) { set(y); await new Promise((r) => setTimeout(r, 80)); }
  set(0);
});
await p.waitForTimeout(800);
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(CPU) });
await cdp.send('Performance.enable');
const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
const m0 = await metric();
const runPass = () => p.evaluate(async () => {
  const set = (y) => { document.documentElement.scrollTop = y; document.body.scrollTop = y; };
  const H = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight;
  const dts = [];
  const hits = {};
  await new Promise((done) => {
    let y = 0, last = 0;
    const step = (t) => {
      if (last) { dts.push(t - last); if (t - last > 34) { const k = [...document.querySelectorAll('[style*="will-change"]')].map((e) => e.className.split(' ')[0]).join('+') || '(none)'; hits[k] = (hits[k] || 0) + 1; } }
      last = t;
      y += 14; // ~840px/s at 60fps — a brisk steady scroll
      set(y);
      if (y < H) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
  dts.sort((a, b) => a - b);
  const q = (f) => dts[Math.floor(dts.length * f)];
  return {
    frames: dts.length,
    p50: q(0.5).toFixed(1), p95: q(0.95).toFixed(1), p99: q(0.99).toFixed(1),
    over20: ((dts.filter((d) => d > 20).length / dts.length) * 100).toFixed(1) + '%',
    over34: ((dts.filter((d) => d > 34).length / dts.length) * 100).toFixed(1) + '%',
    hits,
  };
});
const passes = Number(process.env.PASSES || 1);
let res;
for (let i = 0; i < passes; i++) { res = await runPass(); if (i < passes - 1) { console.log(`  pass ${i + 1}:`, res.over20, JSON.stringify(res.hits)); await p.evaluate(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }); await p.waitForTimeout(600); } }
const m1 = await metric();
for (const k of ["TaskDuration", "ScriptDuration", "RecalcStyleDuration", "LayoutDuration"]) res[k.replace("Duration", "")] = Math.round((m1[k] - m0[k]) * 1000) + "ms";
res.LayoutCount = m1.LayoutCount - m0.LayoutCount;
res.RecalcStyleCount = m1.RecalcStyleCount - m0.RecalcStyleCount;
console.log(`${DEVICE} ${MODE} cpu${CPU}x:`, JSON.stringify(res));
await b.close();
