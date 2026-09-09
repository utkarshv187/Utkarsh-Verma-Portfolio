import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);

async function measure(y) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(250);
  return await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    // PRODUCT text leaf: the element whose own text is PRODUCT (or contains PR/DUCT split)
    let leaf = [...document.querySelectorAll('*')].find((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return /PRODUCT/i.test(norm(own)) && norm(own).length < 12 && e.getBoundingClientRect().width > 4; });
    if (!leaf) { // fallback: element containing "PR" and "DUCT" with an O gap
      leaf = [...document.querySelectorAll('h1,h2,span,div')].find((e) => /^PR.?DUCT$/i.test(norm(e.textContent)) && e.getBoundingClientRect().width > 100);
    }
    if (!leaf) return { err: 'no product' };
    // cumulative matrix leaf->hero
    const bigs = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 700 && r.top + window.scrollY < 60 && r.width > 800; });
    const hero = bigs.sort((a, c) => a.getBoundingClientRect().height - c.getBoundingClientRect().height)[0];
    let M = new DOMMatrix();
    let n = leaf; const angs = [];
    for (let i = 0; i < 12 && n; i++) { const t = getComputedStyle(n).transform; if (t && t !== 'none') { const m = new DOMMatrix(t); M = m.multiply(M); angs.push(+(Math.atan2(m.c, m.d) * 180 / Math.PI).toFixed(1)); } if (n === hero) break; n = n.parentElement; }
    const effSkew = Math.atan2(M.c, M.d) * 180 / Math.PI;
    return { text: norm(leaf.textContent).slice(0, 12), effSkew: +effSkew.toFixed(2), perLevelAngles: angs, cumC: +M.c.toFixed(4), cumTx: +M.e.toFixed(1) };
  });
}
for (const y of [0, 200, 400, 600, 800, 1000]) {
  const r = await measure(y);
  console.log('scroll', String(y).padStart(4), JSON.stringify(r));
}
await b.close();
