import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
// find heading page-y WITHOUT triggering (only scroll a little)
const hy = await p.evaluate(() => { const norm = (s) => (s || '').replace(/\s+/g, ' ').trim(); const h = [...document.querySelectorAll('*')].find((e) => /^WORK EXPERIENCE$/i.test(norm(e.textContent)) && norm(e.textContent).length < 30 && e.getBoundingClientRect().height > 8); return h ? Math.round(h.getBoundingClientRect().y + window.scrollY) : 1275; });
// position heading ~200px below the viewport bottom (not yet visible)
await p.evaluate((y) => window.scrollTo(0, y - 900 - 150), hy);
await p.waitForTimeout(500);
// scroll so heading is ~mid viewport, sample opacity/transform rapidly
const sample = () => p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const pick = (re, max = 60) => [...document.querySelectorAll('*')].find((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return re.test(norm(own)) && norm(own).length < max && e.getBoundingClientRect().height > 4; });
  const rep = (e) => { if (!e) return null; let n = e, op = 1, tf = 'none'; for (let i = 0; i < 4 && n; i++) { const c = getComputedStyle(n); if (parseFloat(c.opacity) < 1) op = Math.min(op, parseFloat(c.opacity)); if (c.transform !== 'none') tf = c.transform; n = n.parentElement; } return { op: +op.toFixed(2), tf: tf.slice(0, 30) }; };
  return { heading: rep(pick(/^WORK EXPERIENCE$/i, 30)), tlc: rep(pick(/^TLC$/)), card: (() => { const c = [...document.querySelectorAll('div')].find((e) => /rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor)); return rep(c); })() };
});
await p.evaluate((y) => window.scrollTo(0, y - 500), hy);
const frames = [];
for (let i = 0; i < 12; i++) { frames.push(await sample()); await p.waitForTimeout(70); }
await b.close();
frames.forEach((f, i) => console.log(i, JSON.stringify(f)));
