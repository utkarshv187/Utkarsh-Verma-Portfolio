// Interaction-state audit: drive default / hover / focus-visible / active on every
// interactive element of the LIVE site, and record computed-style deltas, transitions,
// and any looping (@keyframes) animations. Desktop + phone.
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'interactions');
await mkdir(OUT, { recursive: true });
const SITE = 'https://uxuiuv.framer.website/';

const PROPS = [
  'color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'borderTopWidth', 'borderStyle',
  'boxShadow', 'filter', 'opacity', 'transform', 'scale', 'translate', 'rotate',
  'textDecorationLine', 'letterSpacing', 'outlineColor', 'outlineWidth', 'outlineStyle',
  'transitionProperty', 'transitionDuration', 'transitionTimingFunction', 'transitionDelay',
  'animationName', 'animationDuration', 'animationTimingFunction', 'animationIterationCount', 'animationDirection', 'animationDelay',
];

const b = await chromium.launch({ headless: true });

async function auditWidth(width, label) {
  const ctx = await b.newContext({ viewport: { width, height: width < 810 ? 844 : 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  // warm scroll to mount everything, back to top
  await page.evaluate(async () => { const m = document.body.scrollHeight; for (let y = 0; y < m; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 180)); } window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 500)); });

  // define snapshot helpers + keyframes collector on window
  await page.evaluate((props) => {
    window.__PROPS = props;
    window.__snap = (el) => { const cs = getComputedStyle(el); const o = {}; for (const p of window.__PROPS) o[p] = cs[p]; return o; };
    window.__snapDeep = (el) => {
      const list = [{ sel: 'self', s: window.__snap(el) }];
      let i = 0;
      for (const d of el.querySelectorAll('*')) {
        if (i > 30) break;
        const cs = getComputedStyle(d);
        if (cs.animationName !== 'none' || cs.transitionDuration !== '0s' || cs.boxShadow !== 'none' || cs.backgroundImage.includes('gradient')) {
          list.push({ sel: (d.getAttribute('data-framer-name') || d.tagName) + '#' + i, s: window.__snap(d) }); i++;
        }
      }
      return list;
    };
    window.__keyframes = (name) => {
      for (const ss of document.styleSheets) {
        let rules; try { rules = ss.cssRules; } catch { continue; }
        if (!rules) continue;
        for (const r of rules) { if ((r.type === 7 || r.constructor.name === 'CSSKeyframesRule') && r.name === name) return r.cssText; }
      }
      return null;
    };
  }, PROPS);

  // collect interactive targets
  const targets = await page.evaluate(() => {
    const els = new Set();
    for (const el of document.querySelectorAll('a[href], button, [role="button"]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      els.add(el);
    }
    // timer + carousel arrows + logo
    const timer = document.querySelector('[role="timer"]'); if (timer) els.add(timer);
    let idx = 0;
    return [...els].map((el) => {
      el.setAttribute('data-iaudit', 'ia' + idx);
      const r = el.getBoundingClientRect();
      return {
        id: 'ia' + (idx++),
        tag: el.tagName,
        name: el.getAttribute('data-framer-name') || '',
        href: el.getAttribute('href') || '',
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32),
        x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
        top: Math.round(r.y + window.scrollY),
      };
    });
  });

  const results = [];
  for (const t of targets) {
    const sel = `[data-iaudit="${t.id}"]`;
    // ensure in view
    await page.evaluate((s) => { const el = document.querySelector(s); el && el.scrollIntoView({ block: 'center' }); }, sel);
    await page.waitForTimeout(150);
    // default (move mouse far away)
    await page.mouse.move(5, 5);
    await page.waitForTimeout(120);
    const def = await page.evaluate((s) => { const el = document.querySelector(s); return el ? window.__snapDeep(el) : null; }, sel);
    if (!def) { continue; }
    // hover
    const box = await page.evaluate((s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
    if (!box) { continue; }
    await page.mouse.move(box.x, box.y);
    await page.waitForTimeout(450); // let transition settle
    const hov = await page.evaluate((s) => { const el = document.querySelector(s); return el ? window.__snapDeep(el) : null; }, sel);
    // active (press without releasing on element)
    await page.mouse.down();
    await page.waitForTimeout(200);
    const act = await page.evaluate((s) => { const el = document.querySelector(s); return el ? window.__snapDeep(el) : null; }, sel);
    await page.mouse.move(5, 5);
    await page.mouse.up();
    // focus-visible via keyboard: focus the element and force focus-visible
    const foc = await page.evaluate((s) => { const el = document.querySelector(s); if (!el) return null; el.focus({ focusVisible: true }); return window.__snapDeep(el); }, sel);
    await page.evaluate(() => document.activeElement && document.activeElement.blur());

    // resolve keyframes for any running animation on default state
    const anims = {};
    for (const layer of def) {
      const n = layer.s.animationName;
      if (n && n !== 'none') anims[n] = await page.evaluate((nm) => window.__keyframes(nm), n);
    }
    results.push({ ...t, default: def, hover: hov, active: act, focus: foc, keyframes: anims });
  }

  await writeFile(join(OUT, `ia_${label}.json`), JSON.stringify(results, null, 2));
  console.log(`${label}: audited ${results.length} interactive elements`);
  await ctx.close();
}

await auditWidth(1440, 'desktop');
await auditWidth(390, 'phone');
await b.close();
