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
    });
    if (!cards.length) return null;
    const card = cards[0];
    const cr = card.getBoundingClientRect();
    const grp = card.parentElement;
    const gr = grp.getBoundingClientRect();
    // value = biggest white leaf text in the card's group
    let value = null, best = 0;
    [...grp.querySelectorAll('*')].forEach((e) => {
      if (e.children.length) return;
      const c = getComputedStyle(e); const r = e.getBoundingClientRect();
      const fs = parseFloat(c.fontSize);
      if (fs > best && r.width > 4 && r.height > 4 && /255, 255, 255/.test(c.color) && norm(e.textContent)) {
        best = fs; value = { t: norm(e.textContent).slice(0, 6), fs: c.fontSize, fw: c.fontWeight, x: Math.round(r.x - cr.x), y: Math.round(r.y - cr.y), h: Math.round(r.height) };
      }
    });
    const lab = [...grp.querySelectorAll('*')].find((e) => /YEARS OF|EXPERIENCE|SUCCESSFUL|PRODUCTS|DIVERSIFIED|USERS/.test(norm(e.textContent)) && norm(e.textContent).length < 26 && e.getBoundingClientRect().width > 0 && /255, 255, 255/.test(getComputedStyle(e).color));
    let label = null;
    if (lab) { const r = lab.getBoundingClientRect(); const c = getComputedStyle(lab); label = { t: norm(lab.textContent), fs: c.fontSize, lh: c.lineHeight, x: Math.round(r.x - cr.x), y: Math.round(r.y - cr.y) }; }
    // Z motif: look for an svg/path with a yellowish stroke within the group, or an element with gold color
    let z = null;
    const svgs = [...grp.querySelectorAll('svg')];
    svgs.forEach((s) => { const r = s.getBoundingClientRect(); if (r.width > 10 && r.height > 6) { const paths = [...s.querySelectorAll('path,polyline,line')]; const strokes = paths.map((pp) => getComputedStyle(pp).stroke); z = { tag: 'svg', w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x - cr.x), y: Math.round(r.y - cr.y), strokes: strokes.slice(0, 3) }; } });
    // also detect any element whose visible color/background is the cream gold ~ #FFE197
    const gold = [...grp.querySelectorAll('*')].find((e) => { const c = getComputedStyle(e); return /255, 225, 151|255, 224|254, 22/.test(c.backgroundColor) || /255, 225, 151/.test(c.color) || /255, 225, 151/.test(c.fill); });
    const goldInfo = gold ? { bg: getComputedStyle(gold).backgroundColor, fill: getComputedStyle(gold).fill } : null;
    return {
      card: { w: Math.round(cr.width), h: Math.round(cr.height), radius: getComputedStyle(card).borderRadius, overflow: getComputedStyle(card).overflow },
      group: { w: Math.round(gr.width), h: Math.round(gr.height) },
      value, label, z, goldInfo,
      nCards: cards.length,
    };
  });
  console.log('W' + w, JSON.stringify(d, null, 0));
  await ctx.close();
}
await m(1024);
await b.close();
