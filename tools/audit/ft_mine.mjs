import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/footer'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const errs = [];
async function shot(W, H, label) {
  const p = await (await b.newContext({ viewport: { width: W, height: H }, reducedMotion: 'no-preference' })).newPage();
  p.on('pageerror', (e) => errs.push(`[${W}] ${e.message.slice(0, 90)}`));
  await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(900);
  const pageH = await p.evaluate(() => document.body.scrollHeight);
  // scroll so the footer CTA is pinned/centered: footer top + ~half its pin
  const fy = await p.evaluate(() => { const f = document.querySelector('.footer'); return f ? f.getBoundingClientRect().top + (window.scrollY || document.body.scrollTop) : 0; });
  await p.evaluate((y) => { const t = y + 200; window.scrollTo(0, t); document.documentElement.scrollTop = t; document.body.scrollTop = t; }, fy);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${dir}/mine_${label}.png` });
  const info = await p.evaluate(() => {
    const q = document.querySelector('.footer__q'); const cta = document.querySelector('.footer__cta');
    const vt = (el) => { if (!el) return null; const shown = [...el.querySelectorAll('.footer__t')].find((s) => getComputedStyle(s).display !== 'none'); const cs = getComputedStyle(shown || el); const r = (shown || el).getBoundingClientRect(); return { text: (shown || el).textContent, size: cs.fontSize, color: cs.color, x: Math.round(r.left), y: Math.round(r.top) }; };
    const pills = [...document.querySelectorAll('.footer__pill')].map((a) => { const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { t: a.textContent.trim(), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), color: cs.color, radius: cs.borderRadius, href: a.getAttribute('href'), target: a.getAttribute('target') }; });
    const badge = (() => { const im = document.querySelector('.footer__badge img'); if (!im) return null; const r = im.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; })();
    const gtt = document.querySelector('.gtt'); const gttShown = gtt && gtt.classList.contains('gtt--show');
    return { q: vt(q), cta: vt(cta), pills, badge, gttShown };
  });
  console.log(`\n### mine ${W} ###`);
  console.log(' Q:', JSON.stringify(info.q));
  console.log(' CTA:', JSON.stringify(info.cta));
  for (const pl of info.pills) console.log('  pill', JSON.stringify(pl));
  console.log(' badge:', JSON.stringify(info.badge), 'GTT shown:', info.gttShown);
  await p.close();
}
await shot(1440, 900, '1440');
await shot(1024, 900, '1024');
await shot(390, 844, '390');
console.log('\nERRORS:', errs.length, errs);
await b.close();
