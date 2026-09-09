import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function check(url, label) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const heroInfo = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    // hero = topmost tall block; find its position
    const bigs = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 300 && r.top + window.scrollY < 60 && r.width > 300; });
    const hero = bigs.sort((a, c) => a.getBoundingClientRect().height - c.getBoundingClientRect().height)[0];
    return hero ? { pos: getComputedStyle(hero).position, top: getComputedStyle(hero).top, h: Math.round(hero.getBoundingClientRect().height), dfn: hero.getAttribute('data-framer-name'), cls: (hero.className || '').toString().slice(0, 20) } : null;
  });
  console.log(`[${label}] hero:`, JSON.stringify(heroInfo));
  const track = [];
  for (const y of [0, 200, 400, 600]) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(70); const t = await p.evaluate(() => { const bigs = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 300 && r.width > 300; }); return null; }); const heroTop = await p.evaluate(() => { const b2 = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return (getComputedStyle(e).position === 'sticky') && r.height > 200 && r.width > 300; }); return b2.length ? Math.round(b2[0].getBoundingClientRect().top) : 'no-sticky'; }); track.push(`y${y}:heroTop=${heroTop}`); }
  console.log('   track:', track.join('  '));
  await ctx.close();
}
await check('https://uxuiuv.framer.website/', 'LIVE');
await check('http://localhost:5199/', 'MINE');
await b.close();
