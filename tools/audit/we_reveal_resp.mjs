import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function check(w, mobile) {
  const ctx = await b.newContext({ viewport: { width: w, height: Math.max(900, 1200) }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(700);
  await p.evaluate(() => { const r = document.querySelector('.we__row--spinny'); const y = r.getBoundingClientRect().top + window.scrollY; window.scrollTo(0, y - 120); });
  await p.waitForTimeout(250);
  const media = await p.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);
  // try to hover (desktop moves real mouse; mobile has no hover)
  try { await p.hover('.we__row--spinny .we__role', { timeout: 2000 }); } catch (e) {}
  await p.waitForTimeout(650);
  const r = await p.evaluate(() => { const rev = document.querySelector('.we__row--spinny .we__reveal'); const img = document.querySelector('.we__reveal-img'); const ir = img ? img.getBoundingClientRect() : null; return { rows: getComputedStyle(rev).gridTemplateRows, op: getComputedStyle(rev).opacity, imgW: ir ? Math.round(ir.width) : null, imgH: ir ? Math.round(ir.height) : null }; });
  console.log(`W${w}${mobile ? ' (mobile)' : ''}  hoverMedia=${media}  reveal: rows=${r.rows} op=${r.op} img=${r.imgW}x${r.imgH}`);
  await ctx.close();
}
await check(1920, false);
await check(1280, false);
await check(1024, false);
await check(390, true);
await b.close();
