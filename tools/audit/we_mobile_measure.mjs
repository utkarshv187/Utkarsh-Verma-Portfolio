import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function m(w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < Math.min(H, 9000); y += 400) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(70); }
  const top = await p.evaluate(() => { const cards = [...document.querySelectorAll('div')].filter((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor)); return cards.length ? Math.min(...cards.map((c) => c.getBoundingClientRect().top)) + window.scrollY : 2000; });
  await p.evaluate((y) => window.scrollTo(0, Math.max(0, y - 250)), top);
  await p.waitForTimeout(2800);
  const d = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const cards = [...document.querySelectorAll('div')].filter((e) => { const r = e.getBoundingClientRect(); return /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor) && r.width > 40 && r.height > 40 && r.top > -300 && r.top < 800; }).sort((a, bb) => a.getBoundingClientRect().top - bb.getBoundingClientRect().top);
    return cards.slice(0, 3).map((card) => {
      const cr = card.getBoundingClientRect();
      const grp = card.parentElement;
      let value = null, best = 0;
      [...grp.querySelectorAll('*')].forEach((e) => { if (e.children.length) return; const c = getComputedStyle(e); const r = e.getBoundingClientRect(); const fs = parseFloat(c.fontSize); const ov = r.left < cr.right && r.right > cr.left && r.top < cr.bottom && r.bottom > cr.top; if (ov && fs > best && r.width > 4 && /255, 255, 255/.test(c.color) && norm(e.textContent).length <= 5) { best = fs; value = { t: norm(e.textContent), fs: Math.round(fs), left: Math.round(r.x - cr.x), top: Math.round(r.y - cr.y) }; } });
      const labs = [...grp.querySelectorAll('*')].filter((e) => !e.children.length && /^(YEARS|OF|EXPERIENCE|SUCCESSFUL|PRODUCTS|DIVERSIFIED|USERS)$/i.test(norm(e.textContent)) && e.getBoundingClientRect().left >= cr.left - 5 && e.getBoundingClientRect().left < cr.right && e.getBoundingClientRect().top >= cr.top - 5 && e.getBoundingClientRect().bottom <= cr.bottom + 5);
      let label = null; if (labs.length) { const c = getComputedStyle(labs[0]); const r = labs[0].getBoundingClientRect(); label = { fs: Math.round(parseFloat(c.fontSize)), left: Math.round(r.x - cr.x), top: Math.round(r.y - cr.y) }; }
      let z = null; [...grp.querySelectorAll('svg')].forEach((s) => { const r = s.getBoundingClientRect(); if (r.width > 20 && r.left < cr.right && r.right > cr.left && r.top < cr.bottom && r.bottom > cr.top) z = { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.x - cr.x), top: Math.round(r.y - cr.y) }; });
      return { w: Math.round(cr.width), h: Math.round(cr.height), radius: getComputedStyle(card).borderRadius, value, label, z };
    });
  });
  console.log('W' + w); d.forEach((c, i) => console.log(' card' + i, JSON.stringify(c)));
  await ctx.close();
}
await m(390);
await b.close();
