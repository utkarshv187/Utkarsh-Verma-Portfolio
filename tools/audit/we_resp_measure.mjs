import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function m(w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 1000 }, deviceScaleFactor: 1, isMobile: w < 810 });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  for (let y = 0; y < 4000; y += 600) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(110); }
  const d = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const byOwn = (re, max = 60) => [...document.querySelectorAll('*')].filter((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return re.test(norm(own)) && norm(own).length < max && vis(e); });
    const fs = (els) => els.map((e) => ({ t: norm(e.textContent).slice(0, 30), fs: getComputedStyle(e).fontSize, x: Math.round(e.getBoundingClientRect().x), y: Math.round(e.getBoundingClientRect().y) }));
    const card = [...document.querySelectorAll('div')].find((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor) && vis(e));
    return {
      heading: fs(byOwn(/^WORK EXPERIENCE$/i, 30))[0],
      subtitle: fs(byOwn(/BASED IN DELHI NCR/i))[0],
      tlc: fs(byOwn(/^TLC$/))[0],
      roles: fs(byOwn(/(Sr\. Product|Senior Product|UX UI Designer|UI Intern|UI Design Intern)/)),
      dates: fs(byOwn(/^(May 2019|Jan 2019|Oct 2018)/)),
      card: card ? { w: Math.round(card.getBoundingClientRect().width), h: Math.round(card.getBoundingClientRect().height), x: Math.round(card.getBoundingClientRect().x) } : null,
    };
  });
  console.log('W' + w, JSON.stringify(d, null, 1));
  await ctx.close();
}
await m(1024);
await m(390);
await b.close();
