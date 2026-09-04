// Deep hero probe #2: measure animations (aurora, badge spin, role cycle) + find gradient/mask
// treatments (incl. pseudo-elements) for the bottom fade / black ramp.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

// 1) find gradient/mask treatments incl pseudo-elements in the hero
const treatments = await page.evaluate(() => {
  const found = [];
  const check = (el, pseudo) => {
    const c = getComputedStyle(el, pseudo || null);
    const bi = c.backgroundImage, mi = c.maskImage || c.webkitMaskImage;
    const r = el.getBoundingClientRect();
    if (r.top > 1100 || r.bottom < 0) return;
    const hasGrad = bi && bi.includes('gradient');
    const hasMask = mi && mi !== 'none';
    if (hasGrad || hasMask) {
      found.push({
        name: (el.getAttribute && el.getAttribute('data-framer-name')) || el.tagName, pseudo: pseudo || '',
        w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y),
        bgImage: hasGrad ? bi.slice(0, 180) : '', maskImage: hasMask ? mi.slice(0, 180) : '',
        opacity: c.opacity, z: c.zIndex, mixBlend: c.mixBlendMode,
      });
    }
  };
  for (const el of document.querySelectorAll('body *')) {
    check(el, null); check(el, '::before'); check(el, '::after');
  }
  return found.slice(0, 40);
});

// 2) animation sampling: badge svg, role, and any large element whose transform/bg/opacity changes
const anim = await page.evaluate(async () => {
  const badge = [...document.querySelectorAll('svg')].find((s) => s.querySelector('textPath'));
  const roles = ['DESIGNER', 'STRATEGIST', 'RESEARCHER', 'STORYTELLER', 'COPY WRITER', 'ANIMATOR'];
  // candidate aurora layers: large elements in hero with a gradient/animation, + their transform
  const auroraCands = [...document.querySelectorAll('body *')].filter((el) => {
    const r = el.getBoundingClientRect(); if (r.top > 1000 || r.width < 300 || r.height < 200) return false;
    const c = getComputedStyle(el); return c.animationName !== 'none' || c.transform !== 'none' || getComputedStyle(el, '::before').animationName !== 'none';
  }).slice(0, 12);
  const badgeAngle = () => { if (!badge) return null; const m = new DOMMatrix(getComputedStyle(badge).transform); return Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI * 10) / 10; };
  const centeredRole = () => { let best = null, bd = 1e9; for (const e of document.querySelectorAll('*')) { if (e.children.length) continue; const t = e.textContent.trim(); if (!roles.includes(t)) continue; const r = e.getBoundingClientRect(); if (r.height < 60 || r.top < 300 || r.top > 850) continue; const d = Math.abs(r.top + r.height / 2 - 620); if (d < bd) { bd = d; best = t; } } return best; };
  const samples = [];
  const t0 = performance.now();
  let lastRole = null, lastRoleT = 0;
  const roleDwell = [];
  while (performance.now() - t0 < 14000) {
    const t = Math.round(performance.now() - t0);
    const ba = badgeAngle();
    const cr = centeredRole();
    if (cr !== lastRole) { if (lastRole) roleDwell.push({ role: lastRole, from: lastRoleT, to: t, dwell: t - lastRoleT }); lastRole = cr; lastRoleT = t; }
    samples.push({ t, badgeAngle: ba, role: cr, aurora: auroraCands.map((el) => getComputedStyle(el).transform).map((x) => x === 'none' ? 'n' : x.slice(7, 30)) });
    await new Promise((r) => setTimeout(r, 200));
  }
  return { badgePresent: !!badge, samples, roleDwell, auroraCount: auroraCands.length };
});

await writeFile(join(OUT, 'hero_deep2.json'), JSON.stringify({ treatments, anim }, null, 2));
console.log('=== treatments (gradients/masks) ===');
for (const t of treatments) console.log(` ${t.name}${t.pseudo} ${t.w}x${t.h}@${t.y} z${t.z} grad=${t.bgImage.slice(0, 70)} mask=${t.maskImage.slice(0, 70)}`);
// badge period from angle progression
const s = anim.samples.filter((x) => x.badgeAngle != null);
if (s.length > 2) {
  // unwrap angles
  let total = 0; for (let i = 1; i < s.length; i++) { let d = s[i].badgeAngle - s[i - 1].badgeAngle; if (d > 180) d -= 360; if (d < -180) d += 360; total += d; }
  const dt = s[s.length - 1].t - s[0].t;
  const degPerMs = total / dt;
  console.log(`\nbadge: rotated ${Math.round(total)}deg over ${dt}ms -> ${(Math.abs(360 / degPerMs) / 1000).toFixed(2)}s per rev (dir ${degPerMs > 0 ? 'cw' : 'ccw'})`);
}
console.log('role dwell:', JSON.stringify(anim.roleDwell));
console.log('role order seen:', [...new Set(anim.samples.map((x) => x.role).filter(Boolean))].join(' -> '));
await b.close();
