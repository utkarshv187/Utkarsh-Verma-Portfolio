import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);

// Identify hero + WE sections and their key wrappers
const ids = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  // hero: the section containing "PRODUCT" role cycler and the portrait
  // WE: the gold section containing "WORK EXPERIENCE"
  const heHead = [...document.querySelectorAll('*')].find((e) => /^WORK EXPERIENCE$/i.test(norm(e.textContent)) && norm(e.textContent).length < 30 && e.getBoundingClientRect().height > 8);
  let we = heHead; for (let i = 0; i < 12 && we; i++) { if (/255, 183, 5/.test(getComputedStyle(we).backgroundColor)) break; we = we.parentElement; }
  // hero = the first big section (top of page)
  const secs = [...document.querySelectorAll('section, [data-framer-name]')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 400; });
  // tag them
  we && we.setAttribute('data-audit', 'we');
  // find hero: a top-of-page ancestor that is a sibling structure above WE
  return { weFound: !!we, weTag: we && we.tagName, weCls: we && (we.className || '').toString().slice(0, 30) };
});
console.log('ids', JSON.stringify(ids));

// sample across scroll
const H = await p.evaluate(() => document.body.scrollHeight);
console.log('scrollHeight', H, 'viewport 900');
const rows = [];
for (let y = 0; y <= 2200; y += 100) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(60);
  const s = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const we = document.querySelector('[data-audit="we"]');
    // hero portrait as a proxy for the hero section position
    const heHeadEl = [...document.querySelectorAll('*')].find((e) => /^PRODUCT$/i.test(norm(e.textContent)) && norm(e.textContent).length < 12 && e.getBoundingClientRect().width > 4);
    const heroSec = (() => { let n = heHeadEl; for (let i = 0; i < 14 && n; i++) { const r = n.getBoundingClientRect(); if (r.height > 700) return n; n = n.parentElement; } return heHeadEl; })();
    const info = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { top: Math.round(r.top), h: Math.round(r.height), pos: cs.position, z: cs.zIndex, tf: cs.transform === 'none' ? 'none' : cs.transform.slice(0, 30) }; };
    return { we: info(we), heroSec: info(heroSec), product: (() => { const e = heHeadEl; if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top) }; })() };
  });
  rows.push({ y, ...s });
}
rows.forEach((r) => console.log(String(r.y).padStart(4), 'WE', JSON.stringify(r.we), 'HERO', JSON.stringify(r.heroSec)));
await b.close();
