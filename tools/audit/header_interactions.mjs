// Targeted header interaction capture: About/Contact/Résumé/counter hover deltas + transitions,
// and a time-sample of the Résumé button's continuous gold glow/stroke loop.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'interactions');

const PROPS = ['color', 'backgroundColor', 'backgroundImage', 'boxShadow', 'filter', 'opacity', 'transform', 'letterSpacing', 'borderTopColor', 'borderTopWidth', 'transitionProperty', 'transitionDuration', 'transitionTimingFunction', 'transitionDelay'];

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

await page.evaluate((props) => {
  window.__snap = (el) => { const cs = getComputedStyle(el); const o = {}; for (const p of props) o[p] = cs[p]; return o; };
  window.__byText = (t) => [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === t);
}, PROPS);

async function hoverDelta(label, findExpr) {
  const snap = () => page.evaluate((fe) => { const el = eval(fe); return el ? window.__snap(el) : null; }, findExpr);
  const box = await page.evaluate((fe) => { const el = eval(fe); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, findExpr);
  if (!box) { console.log(label, 'NOT FOUND'); return { label, notFound: true }; }
  await page.mouse.move(5, 5); await page.waitForTimeout(250);
  const def = await snap();
  await page.mouse.move(box.x, box.y); await page.waitForTimeout(550);
  const hov = await snap();
  await page.mouse.move(5, 5); await page.waitForTimeout(300);
  if (!def || !hov) { console.log(label, 'snap null'); return { label, notFound: true }; }
  const changed = {};
  for (const k of PROPS) if (def[k] !== hov[k]) changed[k] = `${def[k]}  ->  ${hov[k]}`;
  return { label, changed, transition: { p: def.transitionProperty, d: def.transitionDuration, e: def.transitionTimingFunction, delay: def.transitionDelay } };
}

const out = {};
// About: nav text "About" -> climb to its clickable frame (parent with data-framer-name)
out.about = await hoverDelta('About', `(function(){var t=window.__byText('About'); return t?t.closest('[data-framer-name]')||t.parentElement:null;})()`);
out.contact = await hoverDelta('Contact', `(function(){var t=window.__byText('Contact'); return t?t.closest('[data-framer-name]')||t.parentElement:null;})()`);
out.resume = await hoverDelta('Resume', `(function(){var t=window.__byText('Résumé'); return t?t.closest('a'):null;})()`);
out.counter = await hoverDelta('Counter', `document.querySelector('[role="timer"]')`);

// Sample the Résumé glow/stroke loop over time (at rest, no interaction)
const glowSamples = await page.evaluate(async () => {
  const resume = [...document.querySelectorAll('a')].find((a) => /Résumé/.test(a.textContent));
  const layers = [...resume.querySelectorAll('*')].filter((d) => getComputedStyle(d).backgroundImage.includes('gradient'));
  const names = layers.map((l) => l.getAttribute('data-framer-name') || l.tagName);
  const samples = [];
  const t0 = performance.now();
  while (performance.now() - t0 < 4000) {
    samples.push({ t: Math.round(performance.now() - t0), bg: layers.map((l) => getComputedStyle(l).backgroundImage), tf: getComputedStyle(resume).transform });
    await new Promise((r) => setTimeout(r, 70));
  }
  return { names, count: samples.length, samples };
});
out.resumeGlowLoop = glowSamples;

await writeFile(join(OUT, 'header_interactions.json'), JSON.stringify(out, null, 2));
console.log('About changed:', JSON.stringify(out.about.changed));
console.log('Contact changed:', JSON.stringify(out.contact.changed));
console.log('Resume changed:', JSON.stringify(out.resume.changed));
console.log('Counter changed:', JSON.stringify(out.counter.changed), 'transition', JSON.stringify(out.counter.transition));
console.log('Glow layers:', glowSamples.names, 'samples:', glowSamples.count);
await b.close();
