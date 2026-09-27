// Testimonial cards: a click / tap (no drag) must open https://www.linkedin.com/in/uxuiuv/ in a new
// tab; a drag must move the marquee and NOT open anything. Desktop mouse + phone touch.
// usage: node tools/audit/tts_link_check.mjs [url]
import { chromium } from 'playwright';
const PAGE = process.argv[2] || 'http://localhost:5199/';
const b = await chromium.launch();
for (const [label, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  const opened = []; ctx.on('page', (np) => { opened.push(np); });
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const card = async () => p.evaluate(() => {
    document.querySelector('.tts__marquee').scrollIntoView({ block: 'center' });
    const a = [...document.querySelectorAll('.tts__card')].find((c) => { const q = c.getBoundingClientRect(); return q.left > 10 && q.right < innerWidth - 10; }) || document.querySelector('.tts__card');
    const q = a.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 };
  });
  let r = await card(); await p.waitForTimeout(300); r = await card();
  // 1) tap / click
  if (opts.hasTouch) await p.touchscreen.tap(r.x, r.y); else await p.mouse.click(r.x, r.y);
  await p.waitForTimeout(1500);
  const urls = await Promise.all(opened.map(async (np) => { await np.waitForLoadState('commit').catch(() => {}); return np.url(); }));
  const rel = await p.evaluate(() => { const a = document.querySelector('.tts__card'); return `${a.getAttribute('target')} / ${a.getAttribute('rel')}`; });
  console.log(`${label.padEnd(8)} ${opts.hasTouch ? 'tap  ' : 'click'} -> new tab: ${urls.length ? urls.join(', ') : 'NONE'}   (target/rel: ${rel})`);
  for (const np of opened) await np.close();
  opened.length = 0;
  // 2) drag
  const before = await p.evaluate(() => getComputedStyle(document.querySelector('.tts__track')).transform);
  if (opts.hasTouch) {
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x + 80, y: r.y }] });
    for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: r.x + 80 - i * 20, y: r.y }] }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await p.mouse.move(r.x + 80, r.y); await p.mouse.down(); await p.mouse.move(r.x - 80, r.y, { steps: 8 }); await p.mouse.up();
  }
  await p.waitForTimeout(1200);
  const after = await p.evaluate(() => getComputedStyle(document.querySelector('.tts__track')).transform);
  console.log(`${label.padEnd(8)} drag  -> new tab: ${opened.length ? 'OPENED (bad)' : 'none'}   marquee moved: ${before !== after}`);
  await ctx.close();
}
await b.close();
