import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);

// tag PRODUCT + a role word chains
const setup = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const prod = [...document.querySelectorAll('*')].find((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return norm(own) === 'PRODUCT' && e.getBoundingClientRect().width > 4; });
  const role = [...document.querySelectorAll('*')].find((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return /^(DESIGNER|RESEARCHER|STORYTELLER|COPY WRITER)$/.test(norm(own)) && e.getBoundingClientRect().width > 4; });
  const tagChain = (el, key) => { let n = el; for (let i = 0; i < 6 && n; i++) { n.setAttribute('data-sk', key + i); n = n.parentElement; } };
  if (prod) tagChain(prod, 'p');
  if (role) tagChain(role, 'r');
  return { prod: !!prod, role: !!role };
});
console.log('setup', JSON.stringify(setup));

const res = await p.evaluate(async () => {
  const chain = (key) => [...document.querySelectorAll('[data-sk^="' + key + '"]')];
  const pC = chain('p'), rC = chain('r');
  const read = (els) => { let best = { c: 0, e: 0 }; for (const el of els) { const m = new DOMMatrix(getComputedStyle(el).transform); if (Math.abs(m.c) > Math.abs(best.c)) best.c = +m.c.toFixed(4); if (Math.abs(m.e) > Math.abs(best.e)) best.e = +m.e.toFixed(1); } return best; };
  const frames = []; const t0 = performance.now(); let step = 0;
  return await new Promise((resolve) => {
    function loop() {
      if (step < 24) window.scrollBy(0, 30);
      step++;
      const pr = read(pC), rr = read(rC);
      frames.push({ t: Math.round(performance.now() - t0), y: Math.round(window.scrollY), pC: pr.c, pAng: +(Math.atan(pr.c) * 180 / Math.PI).toFixed(1), pTx: pr.e, rC: rr.c, rAng: +(Math.atan(rr.c) * 180 / Math.PI).toFixed(1), rTx: rr.e });
      if (performance.now() - t0 < 2000) requestAnimationFrame(loop); else resolve(frames);
    }
    loop();
  });
});
console.log('frames:', res.length);
res.forEach((f) => console.log(String(f.t).padStart(4), 'y', String(f.y).padStart(4), '| PRODUCT ang', String(f.pAng).padStart(6), 'tx', String(f.pTx).padStart(7), '| ROLE ang', String(f.rAng).padStart(6), 'tx', String(f.rTx).padStart(7)));
await b.close();
