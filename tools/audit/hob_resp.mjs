import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const w of [1920, 1440, 1280, 1024, 810, 390]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2000);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.55) { scrollTo(0, y); await new Promise(r => setTimeout(r, 130)); } });
  const r = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    // find visible text elements containing the intro phrases (fs>20)
    const cands = [...document.querySelectorAll('div,h1,h2,h3,p,span')].filter((n) => { const t = norm(n.textContent); return (/JUST IN CASE|WHEN I AM NOT DESIGNING/i.test(t)) && t.length < 45 && parseFloat(getComputedStyle(n).fontSize) > 18; });
    const vis = cands.map((n) => { const c = getComputedStyle(n); const rr = n.getBoundingClientRect(); return { t: norm(n.textContent), fs: c.fontSize, x: Math.round(rr.left), w: Math.round(rr.width) }; }).filter((o) => o.w > 20);
    // caption style
    const capEl = [...document.querySelectorAll('*')].find((n) => n.children.length === 0 && /very very competitive/i.test(norm(n.textContent)));
    const cap = capEl ? { fs: getComputedStyle(capEl).fontSize, ff: getComputedStyle(capEl).fontFamily.split(',')[0].replace(/"/g, ''), color: getComputedStyle(capEl).color } : null;
    // number of stack columns visible (count GAMING/SOCIALIZING/ADVENTURING titles)
    const titles = ['GAMING', 'SOCIALIZING', 'ADVENTURING'].map((tt) => { const e = [...document.querySelectorAll('div,h3,p')].find((n) => norm(n.textContent) === tt && parseFloat(getComputedStyle(n).fontSize) > 18); return e ? { t: tt, x: Math.round(e.getBoundingClientRect().left), fs: getComputedStyle(e).fontSize } : null; }).filter(Boolean);
    return { intro: [...new Map(vis.map((o) => [o.t + o.fs, o])).values()], cap, titles };
  });
  console.log(`\n=== ${w}px ===`);
  console.log('  intro:', JSON.stringify(r.intro));
  console.log('  caption:', JSON.stringify(r.cap));
  console.log('  stack titles:', JSON.stringify(r.titles));
  await p.close();
}
await b.close();
