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
  const top = await p.evaluate(() => { const cards = [...document.querySelectorAll('div')].filter((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor)); return cards.length ? Math.min(...cards.map((c) => c.getBoundingClientRect().top)) + window.scrollY : 2000; });
  await p.evaluate((y) => window.scrollTo(0, Math.max(0, y - 350)), top);
  await p.waitForTimeout(2600);
  const d = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const cards = [...document.querySelectorAll('div')].filter((e) => { const r = e.getBoundingClientRect(); return /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor) && r.width > 20 && r.height > 20 && r.top > -200 && r.top < 900; }).sort((a, bb) => a.getBoundingClientRect().left - bb.getBoundingClientRect().left);
    return cards.map((card) => {
      const cr = card.getBoundingClientRect();
      const grp = card.parentElement;
      const words = [...grp.querySelectorAll('*')].filter((e) => !e.children.length && /^(YEARS|OF|EXPERIENCE|SUCCESSFUL|PRODUCTS|DIVERSIFIED|USERS)$/i.test(norm(e.textContent)) && e.getBoundingClientRect().left >= cr.left - 5 && e.getBoundingClientRect().left < cr.right && e.getBoundingClientRect().top >= cr.top - 5 && e.getBoundingClientRect().bottom <= cr.bottom + 5);
      // also grab the label container (parent that holds the words)
      let cont = null;
      if (words.length) { cont = words[0].parentElement; while (cont && cont !== grp && cont.getBoundingClientRect().width > cr.width) cont = cont.parentElement; }
      const box = (els) => { const rs = els.map((e) => e.getBoundingClientRect()); return { left: Math.round(Math.min(...rs.map((r) => r.left)) - cr.left), right: Math.round(cr.right - Math.max(...rs.map((r) => r.right))), top: Math.round(Math.min(...rs.map((r) => r.top)) - cr.top), bottom: Math.round(cr.bottom - Math.max(...rs.map((r) => r.bottom))) }; };
      const wordBox = words.length ? box(words) : null;
      const contInfo = cont ? { ta: getComputedStyle(cont).textAlign, box: box([cont]) } : null;
      const lines = {};
      words.forEach((e) => { const r = e.getBoundingClientRect(); const key = Math.round(r.top - cr.top); (lines[key] = lines[key] || []).push({ t: norm(e.textContent), l: Math.round(r.left - cr.left) }); });
      return { w: Math.round(cr.width), wordBox, contInfo, lines };
    });
  });
  console.log('W' + w); d.forEach((c, i) => console.log(' card' + i, JSON.stringify(c)));
  await ctx.close();
}
await m(1024);
await b.close();
