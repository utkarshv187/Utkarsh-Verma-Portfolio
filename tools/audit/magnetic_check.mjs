// Verifies the magnetic/spring buttons (src/lib/magnetic.ts): hover pull, press spring, leave
// cleanup, composition with each button's own transform + the cursor press-shrink, touch, reduced motion.
import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:5199/';
const b = await chromium.launch();
const sample = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); const cs = getComputedStyle(e); return { translate: e.style.translate || '-', scale: e.style.scale || '-', transform: cs.transform }; }, sel);

// ---- desktop ----
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1000);
  const r = await p.evaluate(() => { const e = document.querySelector('.header__nav--desktop .resume').getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2, w: e.width, h: e.height }; });
  await p.mouse.move(1430, r.y + 150); // approach from the right so the path doesn't cross (and expand) Contact
  await p.mouse.move(r.x + r.w / 2 - 16, r.y + 10, { steps: 8 }); // inside the pill, right of + below centre
  await p.waitForTimeout(500);
  console.log('resume hover      ', JSON.stringify(await sample(p, '.header__nav--desktop .resume')));
  await p.mouse.down();
  await p.waitForTimeout(120);
  const cur = await p.evaluate(() => getComputedStyle(document.querySelector('.cursor')).transform);
  console.log('resume pressed    ', JSON.stringify(await sample(p, '.header__nav--desktop .resume')), 'cursor:', cur);
  await p.mouse.up();
  const trail = [];
  for (let i = 0; i < 8; i++) { await p.waitForTimeout(40); trail.push(await p.evaluate(() => document.querySelector('.header__nav--desktop .resume').style.scale || '1')); }
  console.log('release scale trail', trail.join(' '));
  await p.mouse.move(700, 500, { steps: 6 });
  await p.waitForTimeout(700);
  console.log('after leave       ', JSON.stringify(await sample(p, '.header__nav--desktop .resume')));

  // About + a footer pill + go-to-top
  for (const sel of ['.nav-link', '.footer__pill--mail', '.gtt']) {
    if (sel !== '.nav-link') await p.evaluate(() => { const H = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight); document.documentElement.scrollTop = H; document.body.scrollTop = H; });
    await p.waitForTimeout(700);
    const q = await p.evaluate((s) => { const e = document.querySelector(s).getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2, w: e.width }; }, sel);
    await p.mouse.move(q.x - q.w / 2 + 3, q.y - 6, { steps: 6 }); // near the upper-left
    await p.waitForTimeout(500);
    console.log(sel.padEnd(18), JSON.stringify(await sample(p, sel)));
    await p.mouse.move(700, 600, { steps: 4 });
    await p.evaluate(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; });
  }
  console.log('desktop errors:', errs.length, errs.slice(0, 2));
}

// ---- touch phone ----
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1000);
  const cdp = await ctx.newCDPSession(p);
  const q = await p.evaluate(() => { const e = document.querySelector('.nav-icon').getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: q.x, y: q.y }] });
  await p.waitForTimeout(150);
  console.log('touch pressed     ', JSON.stringify(await sample(p, '.nav-icon')));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(700);
  console.log('touch released    ', JSON.stringify(await sample(p, '.nav-icon')));
}

// ---- reduced motion ----
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const r = await p.evaluate(() => { const e = document.querySelector('.header__nav--desktop .resume').getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2, w: e.width }; });
  await p.mouse.move(r.x + r.w / 2 - 16, r.y + 10, { steps: 6 }); await p.mouse.down(); await p.waitForTimeout(200);
  console.log('reduced hover+press', JSON.stringify(await sample(p, '.header__nav--desktop .resume')));
  await p.mouse.up();
}
await b.close();
