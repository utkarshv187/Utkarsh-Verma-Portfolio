// Behaviour snapshot for "performance-only" changes: at every 150px of scroll (desktop 1440 + phone
// 390) records every scroll-driven output — Go-to-top shown?, aurora paused?, hero skew/shift,
// Recent Work card scale + image pans + phone fan, every scroll-reveal inline style, and the WE /
// RW stat scramble trigger states. Run BEFORE and AFTER a change and diff the JSON.
// (Time-driven things — marquee offsets, aurora drift, scramble digits mid-animation — are excluded.)
// usage: node tools/audit/behavior_snapshot.mjs <url> <out.json>
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const [PAGE, OUT] = process.argv.slice(2);
const b = await chromium.launch();
const result = {};
for (const [label, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
]) {
  const p = await (await b.newContext(opts)).newPage();
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  result[label] = await p.evaluate(async () => {
    const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))));
    const cs = (el, prop) => (el ? getComputedStyle(el)[prop] : null);
    const H = document.scrollingElement.scrollHeight;
    const rows = [];
    // settle pass: walk down once (lazy media, IO-triggered one-shots) then back to the top
    for (let y = 0; y < H; y += 400) { document.scrollingElement.scrollTop = y; await raf2(); }
    document.scrollingElement.scrollTop = 0; await raf2(); await raf2();
    for (let y = 0; y < H; y += 150) {
      document.scrollingElement.scrollTop = y; await raf2(); await raf2();
      const reveal = [...document.querySelectorAll('main [style*="translate"]')].map((e) => `${e.className.split(' ')[0]}|${e.style.translate}|${e.style.filter}`);
      rows.push({
        y,
        gtt: document.querySelector('.gtt').classList.contains('gtt--show'),
        auroraPaused: document.querySelector('.hero__aurora').classList.contains('is-paused'),
        heroProduct: cs(document.querySelector('.hero__product'), 'transform'),
        heroRole: cs(document.querySelector('.hero__role-shift'), 'transform'),
        cards: [...document.querySelectorAll('.rw-card')].map((c) => cs(c, 'transform')),
        pans: [...document.querySelectorAll('.rw-figma img, .rw-collage__a')].map((e) => cs(e, 'transform')),
        fans: [...document.querySelectorAll('.rw-gamify__wrap')].map((e) => cs(e, 'transform')),
        reveal,
      });
    }
    return rows;
  });
  await p.context().close();
}
await b.close();
await writeFile(OUT, JSON.stringify(result));
console.log(`${OUT}: desktop ${result.desktop.length} + phone ${result.phone.length} scroll positions`);
