import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
// scroll rows into view
await p.evaluate(() => { const c = document.querySelector('[data-framer-name="Experinece Info"]').parentElement; const y = c.children[0].getBoundingClientRect().top + window.scrollY; window.scrollTo(0, y - 220); });
await p.waitForTimeout(600);

const rowCenters = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const c = document.querySelector('[data-framer-name="Experinece Info"]').parentElement;
  return [...c.children].slice(0, 3).map((r) => { const b = r.getBoundingClientRect(); return { txt: norm(r.textContent).slice(0, 10), x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) }; });
});
console.log('rows:', JSON.stringify(rowCenters));

function wideImgs() {
  return p.evaluate(() => [...document.querySelectorAll('img')]
    .filter((im) => { const r = im.getBoundingClientRect(); return r.width > 700 && r.top > -400 && r.top < 1500; })
    .map((im) => { const r = im.getBoundingClientRect(); return { src: im.src, w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.top), x: Math.round(r.left) }; }));
}

for (let i = 0; i < rowCenters.length; i++) {
  // reset: move mouse far away, wait
  await p.mouse.move(5, 5);
  await p.waitForTimeout(500);
  const rc = rowCenters[i];
  await p.mouse.move(rc.x, rc.y, { steps: 8 }); // enter motion
  await p.waitForTimeout(1000);
  const imgs = await wideImgs();
  console.log(`\n[hover row ${i} "${rc.txt}"] wide imgs:`, JSON.stringify(imgs.map((m) => ({ src: m.src.split('/').pop().split('?')[0], w: m.w, h: m.h, y: m.y }))));
}
await b.close();
