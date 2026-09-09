import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);

async function measure(y) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(220);
  return await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const bigs = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 700 && r.top + window.scrollY < 60 && r.width > 800; });
    const hero = bigs.sort((a, c) => a.getBoundingClientRect().height - c.getBoundingClientRect().height)[0];
    const cum = (leaf) => { if (!leaf) return null; let M = new DOMMatrix(); let n = leaf; for (let i = 0; i < 12 && n; i++) { const t = getComputedStyle(n).transform; if (t && t !== 'none') M = new DOMMatrix(t).multiply(M); if (n === hero) break; n = n.parentElement; } return { skew: +(Math.atan2(M.c, M.d) * 180 / Math.PI).toFixed(2), tx: +M.e.toFixed(1) }; };
    // PRODUCT leaf
    const prod = [...document.querySelectorAll('*')].find((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return /PRODUCT/i.test(norm(own)) && norm(own).length < 12 && e.getBoundingClientRect().width > 4; });
    // ROLE leaf (a visible role word)
    const role = [...document.querySelectorAll('*')].find((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return /^(DESIGNER|RESEARCHER|STORYTELLER|COPY WRITER|ANIMATOR|STRATEGIST)$/.test(norm(own)) && e.getBoundingClientRect().width > 4; });
    return { product: cum(prod), role: cum(role), roleWord: role ? norm(role.textContent).slice(0, 12) : null };
  });
}
console.log('scroll | PRODUCT (skew/tx) | ROLE (skew/tx)');
for (const y of [0, 250, 500, 750, 1000, 1067]) {
  const r = await measure(y);
  console.log(String(y).padStart(4), '|', JSON.stringify(r.product).padEnd(26), '|', JSON.stringify(r.role), r.roleWord || '');
}
await b.close();
