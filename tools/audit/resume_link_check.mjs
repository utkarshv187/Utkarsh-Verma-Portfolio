// Résumé link: every résumé anchor on the page points at the one URL (LINKS.resume), opens in a new
// tab with rel="noopener noreferrer", and clicking / tapping the visible Résumé button really opens
// it. Desktop 1440, tablet 1024, phone 390 (touch).
// usage: node tools/audit/resume_link_check.mjs [url]
import { chromium } from 'playwright';
const PAGE = process.argv[2] || 'http://localhost:5199/';
const NEW = 'https://drive.google.com/file/d/1tfhAWJ2jAmRjVymT_v4HQ_srxkQiQlTi/view?usp=drive_link';
const OLD = /1EvrImXsOyJRC9|1g0gHmhit|1Ks4l8E/;
const b = await chromium.launch();
for (const [label, opts] of [
  ['desktop 1440', { viewport: { width: 1440, height: 900 } }],
  ['tablet 1024', { viewport: { width: 1024, height: 800 } }],
  ['phone 390', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }],
]) {
  const ctx = await b.newContext(opts);
  // don't actually load Google Drive: record the URL the new tab navigates to, then stop it there
  await ctx.route(/drive\.google\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }));
  const p = await ctx.newPage();
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const info = await p.evaluate((old) => {
    const drive = [...document.querySelectorAll('a[href*="drive.google"]')].map((a) => ({ href: a.href, target: a.target, rel: a.rel, cls: a.className, visible: !!a.offsetParent && a.getBoundingClientRect().width > 0 }));
    return { drive, oldInHtml: new RegExp(old).test(document.documentElement.outerHTML) };
  }, OLD.source);
  const btn = info.drive.find((d) => d.visible);
  const sel = btn.cls.includes('resume--mobile') ? '.resume--mobile' : '.header__nav--desktop .resume';
  const r = await p.evaluate((s) => { const q = document.querySelector(s).getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; }, sel);
  const opened = ctx.waitForEvent('page', { timeout: 8000 });
  if (opts.hasTouch) await p.touchscreen.tap(r.x, r.y); else await p.mouse.click(r.x, r.y);
  const np = await opened; await np.waitForLoadState('domcontentloaded').catch(() => {});
  console.log(`== ${label}`);
  console.log(`  résumé anchors: ${info.drive.length} (${info.drive.map((d) => `.${d.cls.split(' ')[0]}${d.visible ? ' visible' : ' hidden'}`).join(', ')})`);
  console.log(`  all = new URL: ${info.drive.every((d) => d.href === NEW)} · target _blank: ${info.drive.every((d) => d.target === '_blank')} · rel: ${[...new Set(info.drive.map((d) => d.rel))].join(' | ')}`);
  console.log(`  ${opts.hasTouch ? 'tap' : 'click'} ${sel} -> new tab: ${np.url() === NEW ? 'NEW résumé URL ✓' : np.url()} · old id anywhere in page: ${info.oldInHtml}`);
  await ctx.close();
}
await b.close();
