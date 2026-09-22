import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
// click About
const clicked = await p.evaluate(() => { const a = [...document.querySelectorAll('a,button')].find((el) => (el.textContent || '').trim().toLowerCase() === 'about'); if (!a) return false; a.click(); return true; });
console.log('clicked About:', clicked);
await p.waitForTimeout(1600);
const landing = await p.evaluate(() => {
  // find MORE ABOUT ME heading loosely
  let h = null; for (const el of [...document.querySelectorAll('h1,h2,h3,h4')]) { if (/MORE ABOUT ME/i.test((el.textContent || '').replace(/\s+/g, ' ')) && (el.textContent || '').trim().length < 40) { h = el; break; } }
  return { scrollY: Math.round(scrollY), headingTop: h ? Math.round(h.getBoundingClientRect().top) : null, headingText: h ? h.textContent.trim().slice(0, 24) : null };
});
console.log('LIVE after About click:', JSON.stringify(landing), '(headingTop = px from viewport top; header is ~fixed at top)');
await b.close();
