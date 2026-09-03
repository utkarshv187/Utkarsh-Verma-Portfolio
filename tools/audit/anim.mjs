// Robust animation probe: smooth-scroll detection, role-ticker cycle, badge rotation,
// scroll-linked transform sampling, counter behavior.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out');
const SITE = 'https://uxuiuv.framer.website/';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(SITE, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

const result = {};

// 1. Smooth-scroll / scroll setup detection
result.scrollSetup = await page.evaluate(() => {
  const html = document.documentElement;
  const body = document.body;
  const csHtml = getComputedStyle(html);
  const csBody = getComputedStyle(body);
  // Framer smooth scroll usually wraps content and animates a transform, OR sets scroll-behavior
  const hasLenis = !!(window.Lenis || document.querySelector('[data-lenis], .lenis'));
  return {
    htmlScrollBehavior: csHtml.scrollBehavior,
    bodyScrollBehavior: csBody.scrollBehavior,
    htmlOverflow: csHtml.overflow,
    bodyOverflow: csBody.overflow,
    hasLenis,
    dataFramerReset: html.getAttribute('data-framer-reset'),
    bodyClass: body.className,
  };
});

// 2. Role ticker: observe text under the hero for ~7s
result.roleTicker = await page.evaluate(async () => {
  // find the element containing rotating role word: look for a node whose text is one of known roles
  const roles = ['DESIGNER','STRATEGIST','RESEARCHER','STORYTELLER','COPY WRITER','ANIMATOR'];
  const isRole = (t) => roles.includes(t.trim().toUpperCase());
  let target = [...document.querySelectorAll('*')].find(e => e.children.length===0 && isRole(e.textContent));
  // climb to the animating container
  const seq = [];
  const t0 = performance.now();
  while (performance.now() - t0 < 8000) {
    const cur = [...document.querySelectorAll('*')].filter(e=>e.children.length===0 && isRole(e.textContent)).map(e=>e.textContent.trim());
    const now = Math.round(performance.now()-t0);
    const last = seq[seq.length-1];
    const val = cur.join('|');
    if (!last || last.val !== val) seq.push({ t: now, val });
    await new Promise(r=>setTimeout(r,120));
  }
  return { targetTag: target?.tagName, sequence: seq };
});

// 3. Badge rotation: sample transform of the circular "LET'S WORK TOGETHER" badge over time
result.badge = await page.evaluate(async () => {
  // the badge text path is often an svg with textPath; find element that rotates
  const cands = [...document.querySelectorAll('*')].filter(e => {
    const t = e.textContent||''; return /LET.?S|WORK|TOGETHER/i.test(t) && e.querySelector('svg, path, textPath');
  });
  const el = cands[0];
  if (!el) return { found:false };
  // find the actual rotating child (has transform changing)
  const samples = [];
  const t0 = performance.now();
  while (performance.now()-t0 < 3000) {
    // sample transforms of el and its descendants
    const list = [el, ...el.querySelectorAll('*')].slice(0,20).map(n=>getComputedStyle(n).transform).filter(t=>t&&t!=='none');
    samples.push({ t: Math.round(performance.now()-t0), transforms: list.slice(0,4) });
    await new Promise(r=>setTimeout(r,300));
  }
  return { found:true, samples };
});

// 4. Scroll-linked transforms: sample inline-transform elements at scroll positions
const maxY = await page.evaluate(()=>document.body.scrollHeight - window.innerHeight);
const scrollSamples = [];
for (const frac of [0,0.05,0.1,0.15,0.2,0.3,0.4,0.5,0.6,0.7,0.85,1]) {
  const y = Math.round(maxY*frac);
  await page.evaluate(yy=>window.scrollTo(0,yy), y);
  await page.waitForTimeout(450);
  const snap = await page.evaluate(() => {
    const items = [];
    for (const el of document.querySelectorAll('[style*="transform"]')) {
      const cs = getComputedStyle(el);
      if (cs.transform && cs.transform !== 'none' && cs.transform !== 'matrix(1, 0, 0, 1, 0, 0)') {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight+200) continue; // only near-viewport
        items.push({ name: el.getAttribute('data-framer-name')||el.tagName, tf: cs.transform, op: cs.opacity });
      }
    }
    return { y: window.scrollY, n: items.length, items: items.slice(0,25) };
  });
  scrollSamples.push({ frac, ...snap });
}
result.scrollSamples = scrollSamples;

await writeFile(join(OUT,'anim.json'), JSON.stringify(result, null, 2));
console.log('scrollSetup:', JSON.stringify(result.scrollSetup));
console.log('roleTicker transitions:', result.roleTicker.sequence.length);
console.log('badge found:', result.badge.found);
console.log('scroll sample positions:', scrollSamples.length);
await browser.close();
