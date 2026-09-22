import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/fix5'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.waitForTimeout(500);

// ---- find a "GO TO TOP" / back-to-top control ----
const gtt = await p.evaluate(() => {
  const cand = [...document.querySelectorAll('a,button,div')].filter((el) => /go to top|back to top|top/i.test((el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '').trim().slice(0, 40)));
  // prefer fixed-position ones
  const info = cand.map((el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { txt: (el.textContent || '').trim().slice(0, 30), aria: el.getAttribute('aria-label'), pos: cs.position, right: cs.right, bottom: cs.bottom, w: Math.round(r.width), h: Math.round(r.height), transform: cs.transform, bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius, z: cs.zIndex, opacity: cs.opacity, href: el.getAttribute('href') }; }).filter((o) => o.pos === 'fixed' || o.pos === 'sticky' || o.w > 0);
  return info.slice(0, 8);
});
console.log('GO-TO-TOP candidates:', JSON.stringify(gtt, null, 1));

// find more-about-me heading Y
const aboutY = await p.evaluate(() => { let best = null; for (const el of [...document.querySelectorAll('*')]) if ((el.textContent || '').trim() === 'MORE ABOUT ME' && el.children.length === 0) { if (!best || el.getBoundingClientRect().width < best.getBoundingClientRect().width) best = el; } return best ? Math.round(best.getBoundingClientRect().top + scrollY) : null; });
console.log('\nMORE ABOUT ME heading absY:', aboutY);

// track the back-to-top control's transform/opacity as we scroll around more-about-me
async function probeBtn(label) {
  return await p.evaluate((label) => {
    const els = [...document.querySelectorAll('a,button,div')].filter((el) => getComputedStyle(el).position === 'fixed');
    // pick the one that looks like a small pill near bottom-right
    const pick = els.map((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { el, r, cs }; })
      .filter((o) => o.r.width > 20 && o.r.width < 260 && o.r.height > 20 && o.r.height < 120 && (parseFloat(o.cs.right) < 200 || o.r.left > innerWidth - 320))
      .sort((a, b) => (b.r.top) - (a.r.top))[0];
    if (!pick) return { label, none: true };
    const el = pick.el, cs = pick.cs, r = pick.r;
    return { label, txt: (el.textContent || '').trim().slice(0, 24), transform: cs.transform, opacity: cs.opacity, visibility: cs.visibility, left: Math.round(r.left), right: Math.round(innerWidth - r.right), bottom: Math.round(innerHeight - r.bottom), w: Math.round(r.width), h: Math.round(r.height) };
  }, label);
}
if (aboutY != null) {
  await p.evaluate((y) => scrollTo(0, y - 700), aboutY); await p.waitForTimeout(700); console.log('\n[above about]', JSON.stringify(await probeBtn('above')));
  await p.evaluate((y) => scrollTo(0, y - 100), aboutY); await p.waitForTimeout(700); console.log('[about in view]', JSON.stringify(await probeBtn('inview')));
  await p.evaluate((y) => scrollTo(0, y + 1200), aboutY); await p.waitForTimeout(700); console.log('[below about]', JSON.stringify(await probeBtn('below')));
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(700); console.log('[bottom]', JSON.stringify(await probeBtn('bottom')));
  await p.evaluate((y) => scrollTo(0, y - 700), aboutY); await p.waitForTimeout(700); console.log('[back above]', JSON.stringify(await probeBtn('backabove')));
}

// ---- About click scroll behaviour ----
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600);
const aboutLink = await p.evaluate(() => { const a = [...document.querySelectorAll('a,button')].find((el) => (el.textContent || '').trim().toLowerCase() === 'about'); return a ? { href: a.getAttribute('href'), tag: a.tagName } : null; });
console.log('\nAbout link:', JSON.stringify(aboutLink));
await b.close();
