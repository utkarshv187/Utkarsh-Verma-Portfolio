// Hero O hover: WhatsApp icon scales 0 -> 40px dead-centre on the O's counter (same centre as the
// ring badge + centre dot), green dotted ripples flow outward from the O's outer edge while hovered and stop on leave, and a click opens
// the WhatsApp link in a new tab. Desktop 1440 + tablet 1024 (fine pointer).
// usage: OUT=<dir> node tools/audit/o_hover_check.mjs [url]
import { chromium } from 'playwright';
const PAGE = process.argv[2] || 'http://localhost:5199/';
const OUT = process.env.OUT || '.';
const WA = 'https://api.whatsapp.com/send/?phone=918869808079&text=Hi+Utkarsh%2C+I+visited+your+portfolio+and+would+like+to+discuss+an+opportunity.&type=phone_number&app_absent=0';
const b = await chromium.launch();
for (const [label, vp] of [['desktop 1440', { width: 1440, height: 900 }], ['tablet 1024', { width: 1024, height: 800 }]]) {
  const ctx = await b.newContext({ viewport: vp });
  const p = await ctx.newPage();
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const state = () => p.evaluate(() => {
    const c = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: +(r.left + r.width / 2).toFixed(1), y: +(r.top + r.height / 2).toFixed(1), w: +r.width.toFixed(1) }; };
    const cv = document.querySelector('.hero__o-ripples');
    // lit dots in the ripple canvas: count, nearest/farthest from the centre (CSS px), and the radii of
    // the ring bands (radial histogram peaks, 4px bins) so successive samples show them moving outward
    const g = cv.getContext('2d'); const W = cv.width, k = cv.offsetWidth / W; const px = W ? g.getImageData(0, 0, W, W).data : [];
    let lit = 0, rMin = Infinity, rMax = 0; const hist = new Array(60).fill(0);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const a = px[(y * W + x) * 4 + 3]; if (a < 60) continue; lit++; const r = Math.hypot(x + 0.5 - W / 2, y + 0.5 - W / 2) * k; rMin = Math.min(rMin, r); rMax = Math.max(rMax, r); hist[Math.floor(r / 4)]++; }
    const bands = []; for (let i = 1; i < 59; i++) if (hist[i] > 20 && hist[i] >= hist[i - 1] && hist[i] > hist[i + 1]) bands.push(i * 4 + 2);
    return { icon: c('.hero__o-wa'), dot: c('.hero__o-dot'), badge: c('.badge'), cv: c('.hero__o-ripples'), ripplesOpacity: getComputedStyle(cv).opacity, lit, rMin: Math.round(rMin), rMax: Math.round(rMax), bands };
  });
  const s0 = await state();
  // hover a visible part of the O (its left stroke, clear of the portrait)
  const o = await p.evaluate(() => { const r = document.querySelector('.hero__o').getBoundingClientRect(); return { x: r.left + r.width * 0.2, y: r.top + r.height / 2 }; });
  await p.mouse.move(o.x, o.y, { steps: 4 });
  const mid = []; for (let i = 0; i < 3; i++) { await p.waitForTimeout(70); mid.push((await state()).icon.w); }
  await p.waitForTimeout(700);
  const s1 = await state();
  await p.waitForTimeout(400);
  const s1b = await state();
  const bb = await p.evaluate(() => { const r = document.querySelector('.hero__o').getBoundingClientRect(); return { x: Math.max(0, r.left - 40), y: Math.max(0, r.top - 40), width: r.width + 80, height: r.height + 80 }; });
  if (label.startsWith('desktop')) await p.screenshot({ path: `${OUT}/o_hover.png`, clip: bb });
  await p.mouse.move(o.x, vp.height - 20, { steps: 3 }); await p.waitForTimeout(700);
  const s2 = await state();
  if (label.startsWith('desktop')) {
    await p.screenshot({ path: `${OUT}/o_default.png`, clip: bb });
  }
  // click the icon itself (centre of the O)
  await p.mouse.move(o.x, o.y, { steps: 3 }); await p.waitForTimeout(600);
  const opened = ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null);
  const ic = await p.evaluate(() => { const r = document.querySelector('.hero__o-wa').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const hit = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e?.closest('a')?.className?.baseVal ?? e?.closest('a')?.className; }, [ic.x, ic.y]);
  await p.mouse.click(ic.x, ic.y);
  const np = await opened;
  let url = null; if (np) { url = np.url(); if (!url || url === 'about:blank') { await np.waitForURL(/./, { timeout: 5000 }).catch(() => {}); url = np.url(); } }
  const aAttrs = await p.evaluate(() => { const a = document.querySelector('.hero__o'); return { href: a.href, target: a.target, rel: a.rel }; });
  console.log(`== ${label}`);
  console.log(`  default: icon ${s0.icon.w}px · ripples opacity ${s0.ripplesOpacity} · lit dot px ${s0.lit}`);
  console.log(`  hover:   icon width over time ${mid.join(' → ')} → ${s1.icon.w}px · ripples opacity ${s1.ripplesOpacity}`);
  console.log(`  centres: icon (${s1.icon.x},${s1.icon.y})  dot (${s1.dot.x},${s1.dot.y})  ring badge (${s1.badge.x},${s1.badge.y})`);
  console.log(`  ripples: canvas ${s1.cv.w}px at (${s1.cv.x},${s1.cv.y}) · lit dot px ${s1.lit}, radius ${s1.rMin}–${s1.rMax}px · ring bands at r=${s1.bands.join('/')} → 400ms later ${s1b.bands.join('/')}`);
  console.log(`  leave:   icon ${s2.icon.w}px · ripples opacity ${s2.ripplesOpacity} · lit dot px ${s2.lit} (loop stopped + cleared)`);
  console.log(`  click on icon (element under it: a.${hit}) -> new tab: ${url === WA ? 'WhatsApp URL ✓' : url}   (target ${aAttrs.target}, rel ${aAttrs.rel}, href matches: ${aAttrs.href === WA})`);
  await ctx.close();
}
await b.close();
