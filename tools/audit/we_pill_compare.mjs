import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const DSF = 2;
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1500 }, deviceScaleFactor: DSF });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1000);

async function pillShot(hoverTarget, movePoint, name) {
  // hoverTarget: () => boundingBox to hover; movePoint: () => {x,y} final mouse pos
  const t = await hoverTarget();
  await p.mouse.move(t.hx, t.hy, { steps: 6 });
  await p.waitForTimeout(400);
  if (t.mx) await p.mouse.move(t.mx, t.my, { steps: 6 });
  await p.waitForTimeout(400);
  const info = await p.evaluate(() => {
    const c = document.querySelector('.cursor'); if (!c) return null;
    const cs = getComputedStyle(c); const cr = c.getBoundingClientRect();
    const lab = c.querySelector('.cursor__label'); const lr = lab.getBoundingClientRect();
    return { cls: c.className.trim(), h: Math.round(cr.height), w: Math.round(cr.width), radius: cs.borderRadius, hPad: Math.round((cr.width - lr.width) / 2), cx: cr.left + cr.width / 2, cy: cr.top + cr.height / 2 };
  });
  // crop around the pill centre (Playwright clip is in CSS px; DSF only affects output res)
  const half = 90;
  const clip = { x: Math.max(0, info.cx - half), y: Math.max(0, info.cy - 60), width: half * 2, height: 120 };
  const buf = await p.screenshot({ clip });
  return { info, buf };
}

// HERO: hover the graffiti badge
const hero = await pillShot(async () => {
  await p.evaluate(() => { const el = document.querySelector('.hero__graffiti'); el.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(300);
  const bb = await (await p.$('.hero__graffiti')).boundingBox();
  return { hx: bb.x + bb.width / 2, hy: bb.y + bb.height / 2 };
}, null, 'hero');
console.log('HERO', JSON.stringify(hero.info));

// SPINNY: hover the row, then move onto the image
const spin = await pillShot(async () => {
  await p.evaluate(() => { const r = document.querySelector('.we__row--spinny'); const y = r.getBoundingClientRect().top + window.scrollY; window.scrollTo(0, y - 140); });
  await p.waitForTimeout(300);
  const rb = await (await p.$('.we__row--spinny .we__role')).boundingBox();
  const imgc = await p.evaluate(() => { const im = document.querySelector('.we__reveal-img'); const r = im.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 120) }; });
  return { hx: rb.x + rb.width / 2, hy: rb.y + rb.height / 2, mx: imgc.x, my: imgc.y };
}, null, 'spin');
console.log('SPIN', JSON.stringify(spin.info));

// montage side by side on a mid-grey card
const pad = 40, gap = 40;
const hm = await sharp(hero.buf).metadata();
const sm = await sharp(spin.buf).metadata();
const W = pad * 2 + hm.width + gap + sm.width;
const H = pad * 2 + Math.max(hm.height, sm.height);
await sharp({ create: { width: W, height: H, channels: 3, background: '#3a3550' } })
  .composite([
    { input: hero.buf, left: pad, top: pad },
    { input: spin.buf, left: pad + hm.width + gap, top: pad },
  ]).png().toFile(join(OUT, 'pill_compare.png'));
console.log('wrote pill_compare.png  (hero pill left | Spinny pill right)');
await b.close();
