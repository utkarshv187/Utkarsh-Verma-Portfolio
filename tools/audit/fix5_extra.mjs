import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.waitForTimeout(400);

// ---- header height (for scroll offset) ----
const hdr = await p.evaluate(() => { const h = document.querySelector('header') || document.querySelector('[class*="header"]'); if (!h) return null; const r = h.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), bottom: Math.round(r.bottom) }; });
console.log('header:', JSON.stringify(hdr));

// ---- GTT arrow svg + thorough hover on the <a> ----
await p.evaluate(() => scrollTo(0, 8000)); await p.waitForTimeout(600);
const arrow = await p.evaluate(() => {
  const c = document.querySelector('.framer-q53ii-container'); if (!c) return null;
  const a = c.querySelector('a'); const svg = c.querySelector('svg'); const path = c.querySelector('path, use, polygon, line');
  const acs = getComputedStyle(a);
  return { aBg: acs.backgroundColor, aRadius: acs.borderRadius, aShadow: acs.boxShadow.slice(0, 60), svgColor: svg ? getComputedStyle(svg).color : null, svgHTML: svg ? svg.outerHTML.slice(0, 180) : null };
});
console.log('GTT arrow:', JSON.stringify(arrow, null, 1));
const abox = await p.evaluate(() => { const a = document.querySelector('.framer-q53ii-container a'); const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
const rd = (sel) => p.evaluate((sel) => { const a = document.querySelector(sel); const cs = getComputedStyle(a); return { transform: cs.transform, bg: cs.backgroundColor, shadow: cs.boxShadow.slice(0, 50), scale: cs.scale }; }, sel);
console.log('a before hover:', JSON.stringify(await rd('.framer-q53ii-container a')));
await p.mouse.move(abox.x, abox.y); await p.waitForTimeout(600);
console.log('a after  hover:', JSON.stringify(await rd('.framer-q53ii-container a')));
const svgAfter = await p.evaluate(() => { const s = document.querySelector('.framer-q53ii-container svg'); return s ? getComputedStyle(s).transform : null; });
console.log('svg transform after hover:', svgAfter);

// ---- Contact underline animation (fix 3) ----
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
// open the contact reveal by hovering the Contact pill
const contact = await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find((e) => (e.textContent || '').trim() === 'Contact' && e.children.length === 0); if (!el) return null; const pill = el.closest('a,button,div'); const r = (pill || el).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
console.log('\ncontact pill:', JSON.stringify(contact));
if (contact) {
  await p.mouse.move(contact.x, contact.y); await p.waitForTimeout(800);
  // find the number / email text els and inspect their underline mechanism
  const links = await p.evaluate(() => {
    const out = [];
    for (const el of [...document.querySelectorAll('a,span,div')]) {
      const t = (el.textContent || '').trim();
      if (/^\+?\d[\d\s]{7,}$/.test(t) || /@/.test(t)) {
        if (t.length > 40) continue;
        const cs = getComputedStyle(el); const aft = getComputedStyle(el, '::after'); const bef = getComputedStyle(el, '::before');
        out.push({ t: t.slice(0, 26), td: cs.textDecorationLine, tdColor: cs.textDecorationColor, tdThick: cs.textDecorationThickness, bg: cs.backgroundImage.slice(0, 40), bgSize: cs.backgroundSize, afterW: aft.width, afterContent: aft.content, afterTransform: aft.transform, afterBg: aft.backgroundColor, beforeW: bef.width, beforeTransform: bef.transform });
      }
    }
    return out;
  });
  console.log('contact number/email els:', JSON.stringify(links, null, 1));
  // hover the NUMBER specifically and re-measure its underline growth
  const numBox = await p.evaluate(() => { const el = [...document.querySelectorAll('a,span,div')].find((e) => /^\+?\d[\d\s]{7,}$/.test((e.textContent || '').trim())); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (numBox) {
    await p.mouse.move(numBox.x, numBox.y); await p.waitForTimeout(150);
    const g0 = await p.evaluate(() => { const el = [...document.querySelectorAll('a,span,div')].find((e) => /^\+?\d[\d\s]{7,}$/.test((e.textContent || '').trim())); const aft = getComputedStyle(el, '::after'); return { w: aft.width, transform: aft.transform, bg: aft.backgroundColor, td: getComputedStyle(el).textDecorationColor }; });
    await p.waitForTimeout(600);
    const g1 = await p.evaluate(() => { const el = [...document.querySelectorAll('a,span,div')].find((e) => /^\+?\d[\d\s]{7,}$/.test((e.textContent || '').trim())); const aft = getComputedStyle(el, '::after'); return { w: aft.width, transform: aft.transform, bg: aft.backgroundColor, td: getComputedStyle(el).textDecorationColor }; });
    console.log('number underline t=150ms:', JSON.stringify(g0), '\nnumber underline t=750ms:', JSON.stringify(g1));
  }
}
await b.close();
