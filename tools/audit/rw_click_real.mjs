import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1000);

for (const key of ['auction', 'gamification', 'designsystem', 'beyond']) {
  await p.evaluate((k) => { const c = document.querySelector('.rw-card--' + k); scrollTo(0, c.getBoundingClientRect().top + scrollY - 140); }, key);
  await p.waitForTimeout(400);
  const box = await p.evaluate((k) => { const c = document.querySelector('.rw-card--' + k); const r = c.getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.55 }; }, key);
  let opened = null;
  const popupP = ctx.waitForEvent('page', { timeout: 1500 }).then((pg) => { opened = pg.url(); pg.close().catch(() => {}); }).catch(() => {});
  await p.mouse.click(box.x, box.y);
  await popupP;
  console.log(`card ${key}: click opened -> ${opened || 'NOTHING'}`);
}
await b.close();
