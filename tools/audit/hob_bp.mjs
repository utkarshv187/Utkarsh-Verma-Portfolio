import { chromium } from 'playwright';
const widths = [1200, 1080, 900, 810, 500, 390];
const b = await chromium.launch({ headless: true });
for (const W of widths) {
  const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(1800);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } });
  await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const findTitle = (w) => { let best = null; for (const el of [...document.querySelectorAll('*')]) if ((el.textContent || '').trim() === w && el.children.length === 0) { if (!best || el.getBoundingClientRect().width < best.getBoundingClientRect().width) best = el; } return best; };
    const cys = {};
    for (const w of ['GAMING', 'SOCIALIZING', 'ADVENTURING']) { const t = findTitle(w); if (t) { const b = t.getBoundingClientRect(); cys[w] = { cx: Math.round(b.left + b.width / 2), y: Math.round(b.top + scrollY) }; } }
    return cys;
  });
  const cxs = Object.values(r).map((o) => o && o.cx);
  const ys = Object.values(r).map((o) => o && o.y);
  const sameRow = Math.max(...ys) - Math.min(...ys) < 80;
  console.log(`W=${W}: titles`, JSON.stringify(r), sameRow ? '=> 3-col (same row)' : '=> stacked (single col)');
  await p.close();
}
await b.close();
