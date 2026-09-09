import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);

// tag hero + WE and dump the hero's ancestor chain (looking for sticky/fixed)
const setup = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const weHead = [...document.querySelectorAll('*')].find((e) => /^WORK EXPERIENCE$/i.test(norm(e.textContent)) && norm(e.textContent).length < 30 && e.getBoundingClientRect().height > 8);
  if (!weHead) return { error: 'no WE head' };
  let we = weHead; for (let i = 0; i < 12 && we; i++) { if (/255, 183, 5/.test(getComputedStyle(we).backgroundColor)) break; we = we.parentElement; }
  if (!we) we = weHead;
  we.setAttribute('data-audit', 'we');
  // hero = the big block at the very top of the page (top ~0, tall), not WE
  const bigs = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 700 && r.top + window.scrollY < 50 && r.width > 800 && !e.hasAttribute('data-audit'); });
  // choose the deepest such (smallest height) that is still tall — the hero section itself
  let hero = bigs.sort((a, c) => a.getBoundingClientRect().height - c.getBoundingClientRect().height)[0];
  if (hero) hero.setAttribute('data-audit', 'hero');
  // dump ancestor chain of hero looking for sticky/fixed and the WE ancestor chain top
  const chain = []; let n = hero; for (let i = 0; i < 8 && n; i++) { const cs = getComputedStyle(n); const r = n.getBoundingClientRect(); chain.push({ i, tag: n.tagName, dfn: n.getAttribute('data-framer-name'), pos: cs.position, top: cs.top, z: cs.zIndex, h: Math.round(r.height) }); n = n.parentElement; }
  // also any sticky/fixed elements on the page near the top
  const sticky = [...document.querySelectorAll('*')].filter((e) => { const cs = getComputedStyle(e); return (cs.position === 'sticky' || cs.position === 'fixed') && e.getBoundingClientRect().height > 300; }).map((e) => ({ dfn: e.getAttribute('data-framer-name'), cls: (e.className || '').toString().slice(0, 24), pos: getComputedStyle(e).position, top: getComputedStyle(e).top, h: Math.round(e.getBoundingClientRect().height), z: getComputedStyle(e).zIndex }));
  return { heroChain: chain, stickyEls: sticky };
});
console.log('HERO CHAIN:'); setup.heroChain.forEach((c) => console.log(' ', JSON.stringify(c)));
console.log('STICKY/FIXED (h>300):', JSON.stringify(setup.stickyEls, null, 1));

// track hero + we across scroll
console.log('\nSCROLL TRACK (heroTop = hero section top in viewport):');
for (let y = 0; y <= 2000; y += 150) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(60);
  const s = await p.evaluate(() => {
    const info = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { top: Math.round(r.top), bot: Math.round(r.bottom), pos: cs.position, z: cs.zIndex, tf: cs.transform === 'none' ? 0 : Math.round(new DOMMatrix(cs.transform).m42) }; };
    return { hero: info('[data-audit="hero"]'), we: info('[data-audit="we"]') };
  });
  console.log(String(y).padStart(4), 'HERO', JSON.stringify(s.hero), 'WE', JSON.stringify(s.we));
}
await b.close();
