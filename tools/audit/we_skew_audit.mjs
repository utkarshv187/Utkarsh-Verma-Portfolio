import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);

// Find candidate hero text elements (PRODUCT label + role words) and tag them
const found = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const words = ['PRODUCT', 'DESIGNER', 'RESEARCHER', 'COPY WRITER', 'COPYWRITER', 'STORYTELLER', 'DEVELOPER', 'ENGINEER'];
  const hits = [];
  [...document.querySelectorAll('*')].forEach((e) => {
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
    const t = norm(own);
    if (words.some((w) => t === w) && e.getBoundingClientRect().width > 4) hits.push(e);
  });
  hits.forEach((e, i) => e.setAttribute('data-skew', 'w' + i));
  return hits.map((e, i) => ({ i, t: norm(e.textContent).slice(0, 16), tag: e.tagName }));
});
console.log('candidates:', JSON.stringify(found));

// sampler: scroll a big delta, then sample transforms of tagged elements + their ancestors
async function burst(dir, label) {
  await p.evaluate((d) => { window.__f = []; const els = [...document.querySelectorAll('[data-skew]')]; const t0 = performance.now(); window.scrollBy(0, d); (function loop() { const rec = els.map((e) => { let n = e, sk = 0, tx = 0, tf = 'none'; for (let k = 0; k < 4 && n; k++) { const m = new DOMMatrix(getComputedStyle(n).transform); if (Math.abs(m.c) > Math.abs(sk)) sk = m.c; if (Math.abs(m.e) > Math.abs(tx)) tx = m.e; n = n.parentElement; } return { sk: +sk.toFixed(4), tx: +tx.toFixed(1) }; }); window.__f.push({ t: Math.round(performance.now() - t0), rec }); if (performance.now() - t0 < 700) requestAnimationFrame(loop); })(); }, dir);
  await p.waitForTimeout(800);
  const f = await p.evaluate(() => window.__f);
  // report peak skew (as angle) and tx for w0
  let peak = { sk: 0 };
  f.forEach((fr) => fr.rec.forEach((r) => { if (Math.abs(r.sk) > Math.abs(peak.sk)) peak = r; }));
  const angle = Math.atan(peak.sk) * 180 / Math.PI;
  console.log(`\n[${label}] peak skew c=${peak.sk} => ${angle.toFixed(1)}deg, tx=${peak.tx}`);
  // print a compact time curve for w0
  const curve = f.filter((_, i) => i % 3 === 0).map((fr) => ({ t: fr.t, sk: fr.rec[0] ? fr.rec[0].sk : null, tx: fr.rec[0] ? fr.rec[0].tx : null }));
  console.log(' w0 curve:', JSON.stringify(curve));
}
await burst(700, 'scroll DOWN 700');
await p.waitForTimeout(600);
await burst(-500, 'scroll UP 500');
await b.close();
