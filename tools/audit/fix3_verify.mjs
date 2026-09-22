import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/fix5'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });

// ---------- DESKTOP ----------
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(800);

// ===== FIX 3: RW stats bottom aligns with media bottom (measure within each card) =====
const rwY = await p.evaluate(() => { const el = document.getElementById('recent-work'); return el ? el.getBoundingClientRect().top + (window.scrollY || document.body.scrollTop) : 0; });
await p.evaluate((y) => { const t = y + 300; document.documentElement.scrollTop = t; document.body.scrollTop = t; }, rwY);
await p.waitForTimeout(600);
const rw = await p.evaluate(() => {
  return [...document.querySelectorAll('.rw-card')].map((card) => {
    const cr = card.getBoundingClientRect();
    const media = card.querySelector('.rw-card__media').getBoundingClientRect();
    const stats = [...card.querySelectorAll('.rw-stat')].map((s) => s.getBoundingClientRect());
    const lowestStatBottom = Math.max(...stats.map((s) => s.bottom));
    return {
      key: (card.className.match(/rw-card--(\w+)/g) || []).join(' '),
      mediaBottomInCard: Math.round(media.bottom - cr.top),
      mediaBelowGap: Math.round(cr.bottom - media.bottom),
      statBottomInCard: Math.round(lowestStatBottom - cr.top),
      statBelowGap: Math.round(cr.bottom - lowestStatBottom),
      aligned: Math.abs(media.bottom - lowestStatBottom) <= 3,
    };
  });
});
console.log('FIX3 desktop (media bottom-gap should equal bottom-stats bottom-gap):');
rw.forEach((c) => console.log(`  ${c.key.padEnd(40)} mediaBelow=${c.mediaBelowGap} statBelow=${c.statBelowGap} aligned=${c.aligned}`));

// ===== FIX 1: contact underline renders + grows =====
await p.evaluate(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }); await p.waitForTimeout(400);
const cbox = await p.evaluate(() => { const r = document.querySelector('.contact').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await p.mouse.move(cbox.x, cbox.y); await p.waitForTimeout(600);
const wabox = await p.evaluate(() => { const r = document.querySelector('.contact__item--wa').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await p.mouse.move(wabox.x, wabox.y); await p.waitForTimeout(500);
const u = await p.evaluate(() => {
  const ph = document.querySelector('.contact__phone'); const em = document.querySelector('.contact__email');
  const pr = ph.getBoundingClientRect(); const reveal = document.querySelector('.contact__reveal').getBoundingClientRect();
  const pa = getComputedStyle(ph, '::after'); const ea = getComputedStyle(em, '::after');
  return { phoneAfterTransform: pa.transform, phoneAfterBg: pa.backgroundColor, emailAfterTransform: ea.transform, emailAfterBg: ea.backgroundColor, phoneBottom: Math.round(pr.bottom), revealBottom: Math.round(reveal.bottom), underlineClipped: pr.bottom > reveal.bottom + 1 };
});
console.log('\nFIX1 contact underline (hover number):', JSON.stringify(u, null, 0));
console.log('  => phone underline visible (scaleX~1, not clipped):', u.phoneAfterTransform.includes('matrix(1') || u.phoneAfterTransform.includes('matrix(0.9'), '| clipped:', u.underlineClipped);
await p.screenshot({ path: `${dir}/mine_underline.png`, clip: { x: Math.round(cbox.x - 300), y: 0, width: 600, height: 120 } });

// ===== FIX 2: GTT ring on hover =====
await p.evaluate(() => { const el = document.getElementById('more-about-me'); const y = el.getBoundingClientRect().top + (window.scrollY || document.body.scrollTop) + 500; document.documentElement.scrollTop = y; document.body.scrollTop = y; });
await p.waitForTimeout(700);
const gbox = await p.evaluate(() => { const r = document.querySelector('.gtt').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, cx: Math.round(r.left) - 30, cy: Math.round(r.top) - 30 }; });
const ringBefore = await p.evaluate(() => ({ opacity: getComputedStyle(document.querySelector('.gtt__ring')).opacity, text: document.querySelector('.gtt__ring-text').textContent }));
await p.mouse.move(gbox.x, gbox.y); await p.waitForTimeout(600);
const ringAfter = await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('.gtt__ring')); return { opacity: cs.opacity, transform: cs.transform, fill: getComputedStyle(document.querySelector('.gtt__ring-text')).fill, fontFamily: getComputedStyle(document.querySelector('.gtt__ring-text')).fontFamily.slice(0, 16) }; });
console.log('\nFIX2 GTT ring — before hover opacity:', ringBefore.opacity, 'text:', JSON.stringify(ringBefore.text), '| after hover:', JSON.stringify(ringAfter));
await p.screenshot({ path: `${dir}/mine_gtt_ring.png`, clip: { x: gbox.cx, y: gbox.cy, width: 140, height: 140 } });

console.log('\nerrors:', errs.length, errs);
await p.close();
await b.close();
