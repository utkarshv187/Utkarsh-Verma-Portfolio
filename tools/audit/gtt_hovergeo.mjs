import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.evaluate(() => scrollTo(0, 9000)); await p.waitForTimeout(900);
const sel = '.framer-q53ii-container';
const geo = async (label) => await p.evaluate((sel) => {
  const c = document.querySelector(sel); const cr = c.getBoundingClientRect();
  const a = c.querySelector('a'); const ar = a.getBoundingClientRect();
  const svg = c.querySelector('[data-framer-component-type="SVG"], svg');
  const pr = c.querySelector('p');
  const rel = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { cx: +(r.left + r.width / 2 - ar.left).toFixed(1), cy: +(r.top + r.height / 2 - ar.top).toFixed(1), top: +(r.top - ar.top).toFixed(1), w: Math.round(r.width), h: Math.round(r.height), op: getComputedStyle(el).opacity }; };
  const container = pr ? pr.closest('[data-framer-component-type="RichTextContainer"]') : null;
  return {
    button: { w: Math.round(ar.width), h: Math.round(ar.height) },
    arrow: rel(svg),
    arrowSvgTransform: svg ? getComputedStyle(svg).transform.slice(0, 40) : null,
    text: pr ? { ...rel(pr), font: getComputedStyle(pr).fontSize, weight: getComputedStyle(pr).fontWeight, lh: getComputedStyle(pr).lineHeight, color: getComputedStyle(pr).color, txt: pr.textContent } : null,
    textContainerOpacity: container ? getComputedStyle(container).opacity : null,
    textContainerTransform: container ? getComputedStyle(container).transform.slice(0, 40) : null,
  };
}, sel);
// default
const box = await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
await p.mouse.move(box.x - 400, box.y - 400); await p.waitForTimeout(500);
console.log('DEFAULT:', JSON.stringify(await geo('default'), null, 1));
await p.mouse.move(box.x, box.y); await p.waitForTimeout(800);
console.log('\nHOVER  :', JSON.stringify(await geo('hover'), null, 1));
await b.close();
