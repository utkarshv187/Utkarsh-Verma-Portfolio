// Performance profile of the real page: records a Chrome trace per scenario and reports
//   - frames: rAF cadence (p50/p95, % >20ms) + Chrome's own dropped-frame count (PipelineReporter)
//   - main-thread time by activity (script / style / layout / paint / …) on the renderer main thread
//   - forced synchronous layouts (Layout nested inside JS), attributed to the JS function + file
//   - top JS by function (self-ish time of FunctionCall / FireAnimationFrame / EventDispatch)
// Scenarios: 'scroll' = steady full-page scroll; 'hero' = sit on the hero 5s with the mouse moving.
// usage: node tools/audit/profile_trace.mjs <url> <desktop|phone> <scroll|hero> [cpuThrottle] [label]
// A/B experiments: env INJECT_CSS='…' adds a stylesheet, INJECT_JS='…' runs before the page loads.
// Real GPU via ANGLE D3D11. phone = 390x844 @3x, isMobile/touch (use cpuThrottle 4 for mid-tier).
import { chromium } from 'playwright';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [PAGE, DEVICE, SCEN, CPU = '1', LABEL = ''] = process.argv.slice(2);
const phone = DEVICE === 'phone';
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
const ctx = await b.newContext({
  viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: phone ? 3 : 1, isMobile: phone, hasTouch: phone,
});
if (process.env.INJECT_JS) await ctx.addInitScript(process.env.INJECT_JS);
if (process.env.INJECT_CSS) await ctx.addInitScript((css) => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }); }, process.env.INJECT_CSS);
// warm-up load in a throwaway page (first load in a fresh browser is always slower)
{ const w = await ctx.newPage(); await w.goto(PAGE, { waitUntil: 'load' }); await w.close(); }
const p = await ctx.newPage();
await p.goto(PAGE, { waitUntil: 'load' });
await p.waitForTimeout(2500);
// preload lazy media once so the measured pass isn't a network test, then back to top
await p.evaluate(async () => { const H = document.scrollingElement.scrollHeight; for (let y = 0; y < H; y += innerHeight) { document.scrollingElement.scrollTop = y; await new Promise((r) => setTimeout(r, 90)); } document.scrollingElement.scrollTop = 0; });
await p.waitForTimeout(1500);
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(CPU) });

const traceFile = join(tmpdir(), `trace-${process.pid}.json`);
await b.startTracing(p, { path: traceFile, categories: [
  'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame',
  'disabled-by-default-devtools.timeline.stack', 'v8.execute', 'blink', 'cc', 'benchmark', 'rail',
  'disabled-by-default-devtools.timeline.invalidationTracking',
] });
const frames = p.evaluate(async (scen) => {
  const dts = []; let last = 0; const t0 = performance.now();
  const dur = scen === 'scroll' ? 999999 : 5000;
  const H = document.scrollingElement.scrollHeight - innerHeight;
  await new Promise((done) => {
    let y = 0;
    const step = (t) => {
      if (last) dts.push(t - last); last = t;
      if (scen === 'scroll') { y += 14; document.scrollingElement.scrollTop = y; if (y >= H) return done(); }
      else if (t - t0 > dur) return done();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  dts.sort((a, b) => a - b);
  const q = (f) => dts[Math.floor(dts.length * f)];
  return { n: dts.length, p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), over20: +((dts.filter((d) => d > 20).length / dts.length) * 100).toFixed(1) };
}, SCEN);
if (SCEN === 'hero' && !phone) { const t0 = Date.now(); let a = 0; while (Date.now() - t0 < 4900) { a += 0.12; await p.mouse.move(720 + Math.cos(a) * 520, 330 + Math.sin(a) * 200); await p.waitForTimeout(16); } }
const fr = await frames;
await b.stopTracing();
await b.close();

// ---------- parse ----------
const raw = JSON.parse(await readFile(traceFile, 'utf8'));
await rm(traceFile, { force: true });
const ev = raw.traceEvents || raw;
const threadName = new Map();
for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name') threadName.set(`${e.pid}:${e.tid}`, e.args.name);
// the page's renderer main thread = the CrRendererMain with the most events
const counts = new Map();
for (const e of ev) { const k = `${e.pid}:${e.tid}`; if (threadName.get(k) === 'CrRendererMain') counts.set(k, (counts.get(k) || 0) + 1); }
const mainKey = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
const main = ev.filter((e) => `${e.pid}:${e.tid}` === mainKey && e.ph === 'X' && e.dur != null).sort((a, b) => a.ts - b.ts);
const span = (main.at(-1).ts + main.at(-1).dur - main[0].ts) / 1000;

const BUCKET = {
  FunctionCall: 'script', EvaluateScript: 'script', FireAnimationFrame: 'script(rAF)', TimerFire: 'script(timer)', EventDispatch: 'script(event)', 'v8.callFunction': null, RunMicrotasks: 'script(microtask)',
  UpdateLayoutTree: 'style', RecalculateStyles: 'style', Layout: 'layout', PrePaint: 'prepaint', Paint: 'paint', PaintImage: 'paint', UpdateLayer: 'layers', UpdateLayerTree: 'layers', Layerize: 'layers', Commit: 'commit', 'HitTest': 'hittest', 'ScrollLayer': 'scroll',
  'Decode Image': 'image decode', 'ImageDecodeTask': 'image decode', ParseHTML: 'parse', GCEvent: 'gc', MinorGC: 'gc', MajorGC: 'gc', 'V8.GC_SCAVENGER': 'gc',
};
const byBucket = {};
for (const e of main) { const bkt = BUCKET[e.name]; if (bkt) byBucket[bkt] = (byBucket[bkt] || 0) + e.dur / 1000; }
// forced layouts: Layout / UpdateLayoutTree nested inside a JS container
const JS = new Set(['FunctionCall', 'FireAnimationFrame', 'EventDispatch', 'TimerFire', 'RunMicrotasks']);
const stack = []; const forced = new Map(); let forcedCount = 0, forcedMs = 0, layoutsTotal = 0;
const fnTime = new Map();
for (const e of main) {
  while (stack.length && stack.at(-1).ts + stack.at(-1).dur <= e.ts) stack.pop();
  if (e.name === 'Layout') layoutsTotal++;
  const inJs = stack.find((s) => JS.has(s.name));
  if ((e.name === 'Layout' || e.name === 'UpdateLayoutTree') && inJs) {
    const frames = e.args?.beginData?.stackTrace || e.args?.data?.stackTrace || [];
    const top = frames[0];
    const fnCall = [...stack].reverse().find((s) => s.name === 'FunctionCall');
    const who = top ? `${top.functionName || '(anon)'} @ ${String(top.url).split('/').pop()}:${top.lineNumber}` : fnCall ? `${fnCall.args?.data?.functionName || '(anon)'} @ ${String(fnCall.args?.data?.url).split('/').pop()}` : inJs.name;
    const k = `${e.name === 'Layout' ? 'layout' : 'style'} ← ${who}`;
    const o = forced.get(k) || { n: 0, ms: 0 }; o.n++; o.ms += e.dur / 1000; forced.set(k, o);
    forcedCount++; forcedMs += e.dur / 1000;
  }
  if (e.name === 'FunctionCall') {
    const d = e.args?.data || {};
    const k = `${d.functionName || '(anon)'} @ ${String(d.url || '').split('/').pop()}:${d.lineNumber ?? ''}`;
    const o = fnTime.get(k) || { n: 0, ms: 0 }; o.n++; o.ms += e.dur / 1000; fnTime.set(k, o);
  }
  stack.push(e);
}
// Chrome's frame reporter: dropped vs presented frames
let dropped = 0, presented = 0;
for (const e of ev) if (e.name === 'PipelineReporter' && e.ph === 'b') { const s = e.args?.chrome_frame_reporter?.state; if (s === 'STATE_DROPPED') dropped++; else if (s === 'STATE_PRESENTED_ALL' || s === 'STATE_PRESENTED_PARTIAL') presented++; }
const longTasks = main.filter((e) => e.name === 'RunTask' && e.dur > 50000).length;

const r1 = (x) => Math.round(x * 10) / 10;
console.log(`== ${LABEL || ''} ${DEVICE} ${SCEN} cpu${CPU}x · ${r1(span)}ms traced`);
console.log(`  frames: rAF n=${fr.n} p50=${fr.p50} p95=${fr.p95} >20ms=${fr.over20}% · Chrome frames presented=${presented} dropped=${dropped} (${presented + dropped ? r1((dropped / (presented + dropped)) * 100) : 0}%) · long tasks(>50ms)=${longTasks}`);
console.log(`  main thread busy: ${Object.entries(byBucket).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round(v)}ms`).join(' · ')}`);
console.log(`  layouts: ${layoutsTotal} total, FORCED (inside JS): ${forcedCount} = ${r1(forcedMs)}ms`);
for (const [k, v] of [...forced.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 8)) console.log(`     ${String(v.n).padStart(5)}× ${r1(v.ms).toString().padStart(6)}ms  ${k}`);
console.log('  top JS (FunctionCall total):');
for (const [k, v] of [...fnTime.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 8)) console.log(`     ${String(v.n).padStart(5)}× ${r1(v.ms).toString().padStart(6)}ms  ${k}`);
