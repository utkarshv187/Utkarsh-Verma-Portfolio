// Scroll-reveal "no blur" check: scrolls the whole page (desktop + phone) and, at every step, scans
// the computed `filter` of EVERY element for blur(). The only allowed blur is the Résumé button's own
// glow (.resume__glow), which isn't part of the reveal. Also confirms the fade/rise still runs and the
// other scroll-linked motion (hero skew, sticky card stack, number scramble) still responds.
// usage: node tools/audit/reveal_noblur_check.mjs [url]
import { chromium } from 'playwright';
const PAGE = process.argv[2] || 'http://localhost:5199/';
const b = await chromium.launch();
for (const [label, opts] of [
  ['desktop 1440', { viewport: { width: 1440, height: 900 } }],
  ['phone 390', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
]) {
  const p = await (await b.newContext(opts)).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1000);
  const r = await p.evaluate(async () => {
    const set = (y) => { document.scrollingElement.scrollTop = y; };
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));
    const H = document.scrollingElement.scrollHeight;
    const blurred = new Set();
    let fading = 0, steps = 0;
    const heroT = [], cardT = [], scramble = new Set();
    for (let y = 0; y < H; y += 150) {
      set(y); await wait(45); steps++;
      for (const el of document.querySelectorAll('*')) {
        const f = getComputedStyle(el).filter;
        if (f && f.includes('blur(') && !el.classList.contains('resume__glow')) blurred.add((el.className?.baseVal ?? el.className) || el.tagName);
      }
      if (document.querySelector('main [style*="opacity("]')) fading++; // a block mid fade/rise
      heroT.push(getComputedStyle(document.querySelector('.hero__product')).transform);
      cardT.push(getComputedStyle(document.querySelector('.rw-card')).transform);
      const v = document.querySelector('.we-card__value-live'); if (v) scramble.add(v.textContent);
    }
    return {
      steps, blurred: [...blurred], stepsWithFadeRise: fading,
      heroSkewStates: new Set(heroT).size, cardScaleStates: new Set(cardT).size, scrambleTexts: scramble.size,
    };
  });
  console.log(`${label}: ${r.steps} scroll steps`);
  console.log(`  elements with blur (excl. Résumé glow): ${r.blurred.length ? r.blurred.join(', ') : 'none'}`);
  console.log(`  steps with a block mid fade/rise:       ${r.stepsWithFadeRise}`);
  console.log(`  hero skew distinct states:              ${r.heroSkewStates}`);
  console.log(`  RW card scale distinct states:          ${r.cardScaleStates}`);
  console.log(`  WE scramble distinct texts seen:        ${r.scrambleTexts}`);
  console.log(`  page errors:                            ${errs.length}`);
  await p.context().close();
}
await b.close();
