import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);

async function chain(y) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(220);
  return await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const findProd = () => [...document.querySelectorAll('h1,h2,span,div,p')].find((e) => /^PR.?DUCT$/i.test(norm(e.textContent)) && e.getBoundingClientRect().width > 100);
    const findRole = () => [...document.querySelectorAll('*')].find((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return /^(DESIGNER|RESEARCHER|STORYTELLER|COPY WRITER|ANIMATOR|STRATEGIST)$/.test(norm(own)) && e.getBoundingClientRect().width > 4; });
    const dump = (leaf) => { if (!leaf) return null; const out = []; let n = leaf; for (let i = 0; i < 8 && n; i++) { const t = getComputedStyle(n).transform; if (t && t !== 'none') { const m = new DOMMatrix(t); out.push({ lvl: i, dfn: n.getAttribute('data-framer-name'), skewX: +(Math.atan(m.c) * 180 / Math.PI).toFixed(2), tx: +m.e.toFixed(1), b: +m.b.toFixed(3) }); } if (/700|1067/.test('') ) {} const r = n.getBoundingClientRect(); if (r.height > 700) break; n = n.parentElement; } return out; };
    return { product: dump(findProd()), role: dump(findRole()) };
  });
}
for (const y of [0, 1000]) {
  const r = await chain(y);
  console.log('=== scroll', y, '===');
  console.log(' PRODUCT chain:', JSON.stringify(r.product));
  console.log(' ROLE chain   :', JSON.stringify(r.role));
}
await b.close();
