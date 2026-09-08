import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function m(w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 1000 }, deviceScaleFactor: 1, isMobile: w < 810 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < Math.min(H, 7000); y += 500) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(80); }
  const top = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('div')].filter((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor));
    return cards.length ? Math.min(...cards.map((c) => c.getBoundingClientRect().top)) + window.scrollY : 2000;
  });
  await p.evaluate((y) => window.scrollTo(0, Math.max(0, y - 350)), top);
  await p.waitForTimeout(2600);
  const d = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const cards = [...document.querySelectorAll('div')].filter((e) => {
      const r = e.getBoundingClientRect();
      return /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor) && r.width > 20 && r.height > 20 && r.top > -200 && r.top < 900;
    }).sort((a, bb) => a.getBoundingClientRect().left - bb.getBoundingClientRect().left);
    return cards.map((card) => {
      const cr = card.getBoundingClientRect();
      const grp = card.parentElement;
      // value = biggest white leaf overlapping this card horizontally
      let value = null, best = 0;
      [...grp.querySelectorAll('*')].forEach((e) => {
        if (e.children.length) return;
        const c = getComputedStyle(e); const r = e.getBoundingClientRect();
        const fs = parseFloat(c.fontSize);
        const overlap = r.left < cr.right && r.right > cr.left && r.left >= cr.left - 30;
        if (overlap && fs > best && r.width > 4 && /255, 255, 255/.test(c.color) && norm(e.textContent).length <= 5) {
          best = fs; value = { t: norm(e.textContent), fs: Math.round(fs), left: Math.round(r.x - cr.x), top: Math.round(r.y - cr.y), bottom: Math.round(r.bottom - cr.bottom) };
        }
      });
      // label leaves inside this card
      const labs = [...grp.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return !e.children.length && /^(YEARS OF|EXPERIENCE|SUCCESSFUL|PRODUCTS|DIVERSIFIED|USERS)$/.test(norm(e.textContent)) && r.left >= cr.left - 5 && r.left < cr.right && r.top >= cr.top - 5 && r.bottom <= cr.bottom + 5; });
      let label = null;
      if (labs.length) { const first = labs[0].getBoundingClientRect(); const c = getComputedStyle(labs[0]); label = { t: labs.map((l) => norm(l.textContent)).join(' '), fs: Math.round(parseFloat(c.fontSize)), lh: c.lineHeight, left: Math.round(first.x - cr.x), top: Math.round(first.y - cr.y) }; }
      // any svg overlapping this card
      let z = null;
      [...grp.querySelectorAll('svg')].forEach((s) => { const r = s.getBoundingClientRect(); if (r.width > 10 && r.left < cr.right && r.right > cr.left) z = { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.x - cr.x) }; });
      return { w: Math.round(cr.width), h: Math.round(cr.height), value, label, z };
    });
  });
  console.log('W' + w); d.forEach((c, i) => console.log(' card' + i, JSON.stringify(c)));
  await ctx.close();
}
await m(1024);
await b.close();
