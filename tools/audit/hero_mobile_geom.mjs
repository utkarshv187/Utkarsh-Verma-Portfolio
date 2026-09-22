import { chromium } from 'playwright';
const URL = process.argv[2] || 'https://uxuiuv.framer.website/';
const b = await chromium.launch({ headless: true });
for (const W of [430, 390, 360]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(URL.includes('framer') ? 2400 : 800);
  const d = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && +cs.opacity > 0.1 && r.width > 1 && r.height > 1; };
    const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.left + r.width / 2), ta: cs.textAlign }; };
    // PRODUCT
    let prod = null, ps = 0; for (const el of document.querySelectorAll('h1,h2,span,div,p')) { const t = norm(el.textContent); if (/^PR.?DUCT$|PRODUCT/.test(t) && t.length < 12 && vis(el)) { const fs = parseFloat(getComputedStyle(el).fontSize) || 0; if (fs > ps) { ps = fs; prod = el; } } }
    // portrait: biggest img in top 900
    const portrait = [...document.querySelectorAll('img,picture')].map(i => ({ i, r: i.getBoundingClientRect() })).filter(o => o.r.top > -200 && o.r.top < 900 && o.r.height > 200).sort((a, bb) => bb.r.height - a.r.height)[0];
    // roles
    const roleWords = ['DESIGNER', 'STRATEGIST', 'RESEARCHER', 'STORYTELLER', 'COPY WRITER', 'ANIMATOR'];
    const roles = [];
    for (const w of roleWords) { let best = null, bs = 0; for (const el of document.querySelectorAll('span,div,p,li')) { if (norm(el.textContent) === w && vis(el)) { const fs = parseFloat(getComputedStyle(el).fontSize) || 0; if (fs > bs) { bs = fs; best = el; } } } if (best) roles.push({ w, ...R(best), fs: getComputedStyle(best).fontSize }); }
    // hero section: ancestor of PRODUCT that's tall + full width
    let hero = prod; for (let i = 0; i < 14 && hero; i++) { const r = hero.getBoundingClientRect(); if (r.height > 400 && r.width > innerWidth * 0.9) break; hero = hero.parentElement; }
    return { vw: innerWidth, hero: hero ? { h: Math.round(hero.getBoundingClientRect().height), w: Math.round(hero.getBoundingClientRect().width) } : null,
      product: prod ? { ...R(prod), fs: getComputedStyle(prod).fontSize, lh: getComputedStyle(prod).lineHeight } : null,
      portrait: portrait ? { ...R(portrait.i), src: (portrait.i.currentSrc || portrait.i.src || '').split('/').pop().slice(0, 16) } : null,
      roles };
  });
  console.log(`\n== ${W} ==`); console.log(JSON.stringify(d));
  await ctx.close();
}
await b.close();
