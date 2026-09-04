// Deep hero probe: geometry + z-order, background layers, role-ticker timing, badge rotation, interactions.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero');
const SITE = 'https://uxuiuv.framer.website/';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(SITE, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

// 1. Geometry + z-order of key hero elements (visible ones only)
const geo = await page.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const info = (el, tag) => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { tag, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), z: cs.zIndex, pos: cs.position, fontSize: cs.fontSize, color: cs.color, transform: cs.transform.slice(0, 40), borderRadius: cs.borderRadius }; };
  const findText = (t) => [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim() === t && vis(e));
  const out = {};
  const product = findText('PRODUCT')[0] || [...document.querySelectorAll('*')].find((e) => /^PR\s+DUCT$/.test(e.textContent.trim()) && vis(e));
  out.product = info(product, 'PRODUCT');
  // role ticker: find visible role word
  const roles = ['DESIGNER', 'STRATEGIST', 'RESEARCHER', 'STORYTELLER', 'COPY WRITER', 'ANIMATOR'];
  let roleEl = null;
  for (const rr of roles) { const m = findText(rr); if (m.length) { roleEl = m[0]; break; } }
  out.role = info(roleEl, 'role');
  // ticker container (climb from role until element clips overflow / is the animating stack)
  let tickerC = roleEl;
  for (let i = 0; i < 4 && tickerC?.parentElement; i++) { const cs = getComputedStyle(tickerC.parentElement); if (cs.overflow !== 'visible') { tickerC = tickerC.parentElement; break; } tickerC = tickerC.parentElement; }
  out.tickerContainer = info(tickerC, 'tickerContainer');
  // portrait
  const portrait = [...document.querySelectorAll('img')].filter((i) => i.src.includes('IWdo08dy') && vis(i))[0];
  out.portrait = info(portrait, 'portrait');
  // graffiti wordmark
  const wm = [...document.querySelectorAll('img')].filter((i) => i.src.includes('7nuBCHYz') && vis(i))[0];
  out.wordmark = info(wm, 'wordmark');
  if (wm) out.wordmarkSrc = wm.src;
  // badge: element containing LET'S WORK TOGETHER text/path
  const badge = [...document.querySelectorAll('*')].filter((e) => /LET.?S|TOGETHER/i.test(e.textContent) && (e.querySelector('svg,textPath,path')) && vis(e))[0];
  out.badge = info(badge, 'badge');
  // hero section root
  const heroSection = document.querySelector('[data-framer-name]');
  out.docBg = getComputedStyle(document.body).backgroundColor;
  return out;
});

// 2. Background layers in the hero viewport (images / gradients on large absolutely-positioned elements)
const bg = await page.evaluate(() => {
  const layers = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.top > 900 || r.bottom < 0) continue;
    if (r.width < 400 || r.height < 300) continue;
    const cs = getComputedStyle(el);
    const bi = cs.backgroundImage;
    if ((bi && bi !== 'none') || cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      layers.push({ name: el.getAttribute('data-framer-name') || el.tagName, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), bgColor: cs.backgroundColor, bgImage: bi.slice(0, 90), z: cs.zIndex, filter: cs.filter, opacity: cs.opacity });
    }
  }
  return layers.slice(0, 25);
});

// 3. Role ticker timing: sample visible role word + ticker transform over ~12s
const ticker = await page.evaluate(async () => {
  const roles = ['DESIGNER', 'STRATEGIST', 'RESEARCHER', 'STORYTELLER', 'COPY WRITER', 'ANIMATOR'];
  const isRole = (t) => roles.includes(t.trim());
  const seq = [];
  const t0 = performance.now();
  let last = '';
  while (performance.now() - t0 < 12000) {
    const vis = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && isRole(e.textContent) && e.getBoundingClientRect().height > 40 && e.getBoundingClientRect().top > 0 && e.getBoundingClientRect().top < 900);
    const words = vis.map((e) => e.textContent.trim());
    const key = words.join(',');
    if (key !== last) { seq.push({ t: Math.round(performance.now() - t0), words }); last = key; }
    await new Promise((r) => setTimeout(r, 40));
  }
  return seq;
});

// 4. Badge rotation: sample transform of the rotating element over 5s
const badgeRot = await page.evaluate(async () => {
  const badge = [...document.querySelectorAll('*')].filter((e) => /LET.?S|TOGETHER/i.test(e.textContent) && e.querySelector('svg,textPath,path'))[0];
  if (!badge) return { found: false };
  // find the actually-rotating descendant
  const cands = [badge, ...badge.querySelectorAll('*')];
  const samples = [];
  const t0 = performance.now();
  while (performance.now() - t0 < 5000) {
    const row = cands.slice(0, 8).map((c) => getComputedStyle(c).transform).filter((t) => t && t !== 'none');
    samples.push({ t: Math.round(performance.now() - t0), tf: row.slice(0, 3) });
    await new Promise((r) => setTimeout(r, 250));
  }
  return { found: true, samples };
});

await writeFile(join(OUT, 'hero_probe2.json'), JSON.stringify({ geo, bg, ticker, badgeRot }, null, 2));
console.log('geo:', JSON.stringify(geo, null, 1));
console.log('\nbg layers:', bg.length);
for (const l of bg) console.log('  ', l.name, l.w + 'x' + l.h, '@' + l.x + ',' + l.y, 'z=' + l.z, l.bgColor, l.bgImage);
console.log('\nticker transitions:', ticker.length);
for (const s of ticker.slice(0, 12)) console.log('  t=' + s.t, s.words.join('|'));
console.log('\nbadge found:', badgeRot.found, 'samples:', badgeRot.samples ? badgeRot.samples.length : 0);
await b.close();
