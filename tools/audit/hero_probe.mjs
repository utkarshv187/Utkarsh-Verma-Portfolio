// Precise hero geometry + clean reference shots at desktop & mobile.
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out');
await mkdir(join(OUT, 'hero'), { recursive: true });
const SITE = 'https://uxuiuv.framer.website/';
const b = await chromium.launch({ headless: true });

async function probe(width, label) {
  const ctx = await b.newContext({ viewport: { width, height: width < 810 ? 844 : 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(SITE, { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: join(OUT, 'hero', `hero_${label}.png`) });
  // geometry of key hero elements + header
  const geo = await p.evaluate(() => {
    const pick = [];
    const seen = new Set();
    const push = (el, tag) => {
      if (!el || seen.has(el)) return; seen.add(el);
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      pick.push({
        tag, text: (el.textContent || '').trim().slice(0, 24),
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: cs.color, transform: cs.transform,
        zIndex: cs.zIndex, position: cs.position,
      });
    };
    const byText = (t) => [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === t);
    push(byText('PRODUCT') || byText('PR       DUCT'), 'PRODUCT');
    push(byText('DESIGNER'), 'role');
    push([...document.querySelectorAll('img')].find(i => i.src.includes('IWdo08dy')), 'portrait');
    push([...document.querySelectorAll('img')].find(i => i.src.includes('7nuBCHYz')), 'wordmark');
    push([...document.querySelectorAll('img')].find(i => i.src.includes('HNcMAlWL')), 'logo');
    // header nav bar
    const nav = [...document.querySelectorAll('*')].find(e => e.getAttribute('data-framer-name') === 'navbar');
    push(nav, 'navbar');
    // viewport + background of hero root
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const firstSection = document.querySelector('[data-framer-name]');
    return { pick, bodyBg, vw: innerWidth, vh: innerHeight, docH: document.body.scrollHeight };
  });
  await writeFile(join(OUT, 'hero', `geo_${label}.json`), JSON.stringify(geo, null, 2));
  console.log(label, 'vw', geo.vw, 'items', geo.pick.length);
  await ctx.close();
}
await probe(1440, 'desktop');
await probe(390, 'phone');
await b.close();
console.log('done');
