// Frame cost of the hero aurora (6 drifting blobs + cursor-follow + animated grain), sitting on the
// hero with the mouse circling over it (desktop) / idle (phone). Real GPU via ANGLE D3D11.
// usage: node tools/audit/hero_perf.mjs <url> <desktop|phone> <full|nograin|lite|nowrap|four|static> [cpuThrottle]
//   full    = everything on
//   nograin = grain layer hidden (isolates its cost)
//   lite    = no grain + no hue shift (a lighter phone candidate)
//   nowrap  = follow wrappers not promoted to layers
//   four    = nowrap + only 4 blobs
//   static  = aurora drift + grain frozen (the baseline; the rest of the hero still animates)
import { chromium } from 'playwright';
const [URL, DEVICE, MODE, CPU = '1'] = process.argv.slice(2);
const phone = DEVICE === 'phone';
const b = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
const ctx = await b.newContext({
  viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: phone ? 3 : 1,
  isMobile: phone,
  hasTouch: phone,
});
const p = await ctx.newPage();
await p.goto(URL, { waitUntil: 'load' });
await p.waitForTimeout(1200);
if (MODE !== 'full') {
  await p.addStyleTag({
    content: MODE === 'static'
      ? '.hero__aurora-blob{animation:none!important}.hero__grain{display:none!important}'
      : MODE === 'nowrap'
        ? '.hero__aurora-follow{will-change:auto!important}'
      : MODE === 'four'
        ? '.hero__aurora-follow{will-change:auto!important}.hero__aurora-blob--c,.hero__aurora-blob--e{display:none!important}'
      : MODE === 'lite'
        ? '.hero__grain{display:none!important}.hero__aurora-blob{filter:none!important}'
        : '.hero__grain{display:none!important}',
  });
}
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(CPU) });
await cdp.send('Performance.enable');
const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
const m0 = await metric();
const measure = p.evaluate(async () => {
  const dts = [];
  await new Promise((done) => {
    let last = 0;
    const t0 = performance.now();
    const step = (t) => {
      if (last) dts.push(t - last);
      last = t;
      if (t - t0 < 6000) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
  dts.sort((a, b) => a - b);
  const q = (f) => dts[Math.floor(dts.length * f)];
  return {
    frames: dts.length,
    p50: q(0.5).toFixed(1), p95: q(0.95).toFixed(1), p99: q(0.99).toFixed(1),
    over20: ((dts.filter((d) => d > 20).length / dts.length) * 100).toFixed(1) + '%',
  };
});
if (!phone) {
  // circle the mouse over the upper hero for the whole window (drives the follow loop)
  const t0 = Date.now();
  let a = 0;
  while (Date.now() - t0 < 5800) {
    a += 0.12;
    await p.mouse.move(720 + Math.cos(a) * 520, 330 + Math.sin(a) * 200);
    await p.waitForTimeout(16);
  }
}
const res = await measure;
const m1 = await metric();
for (const k of ['TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration']) res[k.replace('Duration', '')] = Math.round((m1[k] - m0[k]) * 1000) + 'ms';
console.log(`${DEVICE} ${MODE} cpu${CPU}x:`, JSON.stringify(res));
await b.close();
