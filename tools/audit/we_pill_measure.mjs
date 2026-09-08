import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1500 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1000);

// --- HERO pill: hover the graffiti/UTKARSH badge ---
const heroSel = '[data-cursor-label]';
await p.evaluate(() => { const el = document.querySelector('.hero__graffiti') || document.querySelector('[data-cursor-label]'); el.scrollIntoView({ block: 'center' }); });
await p.waitForTimeout(300);
const heroBox = await p.$('.hero__graffiti');
if (heroBox) {
  const bb = await heroBox.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 6 });
}
await p.waitForTimeout(400);
const hero = await p.evaluate(() => {
  const c = document.querySelector('.cursor');
  if (!c) return null;
  const cs = getComputedStyle(c);
  const lab = c.querySelector('.cursor__label');
  const lcs = lab ? getComputedStyle(lab) : null;
  const cr = c.getBoundingClientRect();
  const lr = lab ? lab.getBoundingClientRect() : null;
  return {
    cls: c.className.trim(),
    pill: { w: +cs.width.replace('px', ''), h: +cs.height.replace('px', ''), radius: cs.borderRadius, bg: cs.backgroundColor, blur: cs.backdropFilter, margin: cs.margin },
    label: lcs ? { w: Math.round(lr.width), font: lcs.fontFamily.split(',')[0].replace(/"/g, ''), size: lcs.fontSize, weight: lcs.fontWeight, lh: lcs.lineHeight, color: lcs.color, width: lcs.width, align: lcs.textAlign } : null,
    hPadding: (lr && cr) ? Math.round((cr.width - lr.width) / 2) : null,
  };
});
console.log('HERO', JSON.stringify(hero, null, 1));

// --- SPINNY pill: hover the revealed image ---
await p.evaluate(() => { const r = document.querySelector('.we__row--spinny'); const y = r.getBoundingClientRect().top + window.scrollY; window.scrollTo(0, y - 140); });
await p.waitForTimeout(300);
await p.hover('.we__row--spinny .we__role');
await p.waitForTimeout(700);
const imgc = await p.evaluate(() => { const im = document.querySelector('.we__reveal-img'); const r = im.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
await p.mouse.move(imgc.x, imgc.y, { steps: 6 });
await p.waitForTimeout(400);
const spin = await p.evaluate(() => {
  const c = document.querySelector('.cursor');
  if (!c) return null;
  const cs = getComputedStyle(c);
  const cr = c.getBoundingClientRect();
  const lines = [...c.querySelectorAll('.cursor__line')].map((l) => ({ t: l.textContent, w: Math.round(l.getBoundingClientRect().width) }));
  const lab = c.querySelector('.cursor__label');
  const lr = lab.getBoundingClientRect();
  return {
    cls: c.className.trim(),
    pill: { w: +cs.width.replace('px', ''), h: +cs.height.replace('px', ''), radius: cs.borderRadius, bg: cs.backgroundColor, margin: cs.margin },
    labelW: Math.round(lr.width), lines,
    hPadding: Math.round((cr.width - lr.width) / 2),
  };
});
console.log('SPINNY', JSON.stringify(spin, null, 1));
await b.close();
