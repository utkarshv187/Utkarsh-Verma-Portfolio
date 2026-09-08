import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function measure(url, mine) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1320 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  for (let y = 0; y < 3200; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
  await p.evaluate(() => window.scrollTo(0, 1120)); await p.waitForTimeout(1500);
  const d = await p.evaluate((isMine) => {
    const card = [...document.querySelectorAll('div')].find((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor));
    const cr = card.getBoundingClientRect();
    const out = { card: { w: Math.round(cr.width), h: Math.round(cr.height), radius: getComputedStyle(card).borderRadius } };
    // value: biggest white text near the card top
    let value = null;
    if (isMine) { const v = card.parentElement.querySelector('.we-card__value') || document.querySelector('.we-card__value'); if (v) { const r = v.getBoundingClientRect(); value = { fs: getComputedStyle(v).fontSize, topOff: Math.round(r.y - cr.y), leftOff: Math.round(r.x - cr.x), h: Math.round(r.height) }; } }
    else { const el = document.elementFromPoint(cr.x + 40, cr.y - 12); if (el) { const r = el.getBoundingClientRect(); value = { fs: getComputedStyle(el).fontSize, fw: getComputedStyle(el).fontWeight, topOff: Math.round(r.y - cr.y), leftOff: Math.round(r.x - cr.x), h: Math.round(r.height), t: (el.textContent || '').trim().slice(0, 6) }; } }
    out.value = value;
    // Z motif: the svg-bg div with cream stroke near the card
    const grp = card.parentElement;
    const z = [...grp.querySelectorAll('*')].find((e) => /255, 225, 151|FFE197/i.test(getComputedStyle(e).backgroundImage) || (e.tagName === 'svg' && /FFE197/i.test(e.innerHTML)) || (e.className && e.className.toString().includes('we-card__z')));
    if (z) { const r = z.getBoundingClientRect(); out.z = { w: Math.round(r.width), h: Math.round(r.height), topOff: Math.round(r.y - cr.y), rightOff: Math.round(cr.right - r.right) }; }
    // label
    const lab = isMine ? document.querySelector('.we-card__label') : [...grp.querySelectorAll('*')].find((e) => /YEARS OF EXPERIENCE/.test((e.textContent || '').replace(/\s+/g, ' ')) && (e.textContent || '').length < 26);
    if (lab) { const r = lab.getBoundingClientRect(); out.label = { fs: getComputedStyle(lab).fontSize, leftOff: Math.round(r.x - cr.x), bottomOff: Math.round(cr.bottom - r.bottom) }; }
    return out;
  }, mine);
  console.log(mine ? 'MINE' : 'LIVE', JSON.stringify(d));
  await ctx.close();
}
await measure('https://uxuiuv.framer.website/', false);
await measure('http://localhost:5199/', true);
await b.close();
