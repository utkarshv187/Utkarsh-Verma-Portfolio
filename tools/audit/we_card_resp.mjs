import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function m(w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, isMobile: w < 810 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const cardY = await p.evaluate(() => { const c = [...document.querySelectorAll('div')].find((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor)); return c ? Math.round(c.getBoundingClientRect().y + window.scrollY) : 2000; });
  await p.evaluate((y) => window.scrollTo(0, Math.max(0, y - 1200)), cardY);
  await p.waitForTimeout(500);
  await p.evaluate((y) => window.scrollTo(0, y - 300), cardY);
  await p.waitForTimeout(250); // mid count-up, value present
  const d = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const cards = [...document.querySelectorAll('div')].filter((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor));
    const card = cards[0]; if (!card) return null; const cr = card.getBoundingClientRect();
    const grp = card.parentElement;
    // value: biggest text in the card group
    let value = null; let best = 0;
    [...grp.querySelectorAll('*')].forEach((e) => { if (e.children.length) return; const c = getComputedStyle(e); const fs = parseFloat(c.fontSize); const r = e.getBoundingClientRect(); if (fs > best && r.width > 4 && /255, 255, 255/.test(c.color)) { best = fs; value = { t: norm(e.textContent).slice(0, 6), fs: c.fontSize, fw: c.fontWeight, fam: c.fontFamily.split(',')[0].replace(/"/g, ''), topOff: Math.round(r.y - cr.y), leftOff: Math.round(r.x - cr.x) }; } });
    // label
    const lab = [...grp.querySelectorAll('*')].find((e) => /YEARS OF EXPERIENCE|SUCCESSFUL PRODUCTS|DIVERSIFIED USERS/.test(norm(e.textContent)) && norm(e.textContent).length < 26 && e.getBoundingClientRect().width > 0);
    let label = null; if (lab) { const r = lab.getBoundingClientRect(); const c = getComputedStyle(lab); label = { t: norm(lab.textContent), fs: c.fontSize, topOff: Math.round(r.y - cr.y), leftOff: Math.round(r.x - cr.x) }; }
    return { card: { w: Math.round(cr.width), h: Math.round(cr.height), radius: getComputedStyle(card).borderRadius }, value, label };
  });
  console.log('W' + w, JSON.stringify(d));
  await ctx.close();
}
await m(1024);
await m(390);
await b.close();
