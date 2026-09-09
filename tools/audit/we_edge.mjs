import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
const d = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const wh = [...document.querySelectorAll('*')].find((e) => /^WORK EXPERIENCE$/i.test(norm(e.textContent)) && norm(e.textContent).length < 30 && e.getBoundingClientRect().height > 8);
  let we = wh; for (let i = 0; i < 12 && we; i++) { if (/255, 183, 5/.test(getComputedStyle(we).backgroundColor)) break; we = we.parentElement; }
  const cs = getComputedStyle(we);
  const wrap = we.parentElement; const wcs = getComputedStyle(wrap);
  return { we: { dfn: we.getAttribute('data-framer-name'), radius: cs.borderRadius, shadow: cs.boxShadow.slice(0, 70), bg: cs.backgroundColor, pos: cs.position, z: cs.zIndex, mt: cs.marginTop, overflow: cs.overflow }, wrap: { dfn: wrap.getAttribute('data-framer-name'), radius: wcs.borderRadius, shadow: wcs.boxShadow.slice(0, 70), pos: wcs.position, z: wcs.zIndex, mt: wcs.marginTop, overflow: wcs.overflow } };
});
console.log(JSON.stringify(d, null, 1));
await b.close();
