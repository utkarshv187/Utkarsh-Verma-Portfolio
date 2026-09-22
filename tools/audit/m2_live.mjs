import { chromium } from 'playwright';
const URL = process.argv[2] || 'https://uxuiuv.framer.website/';
const b = await chromium.launch({ headless: true });

// ---- #0: max content width + dark bars — test several widths ----
console.log('\n===== #0 max-width / dark bars =====');
for (const W of [360, 390, 430, 500, 600, 767]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2200);
  const d = await p.evaluate(() => {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
    // find the outermost content wrapper that is narrower than the viewport and centred
    // scan big blocks; report the widest block whose width < innerWidth-4 and is roughly centred
    let cap = null;
    for (const el of document.querySelectorAll('div,main,section')) {
      const r = el.getBoundingClientRect();
      if (r.top > 1200 || r.height < 300) continue;
      const centred = Math.abs((r.left) - (innerWidth - r.right)) < 8;
      if (r.width > 200 && r.width < innerWidth - 6 && centred) {
        if (!cap || r.width > cap.w) cap = { w: Math.round(r.width), left: Math.round(r.left), bg: getComputedStyle(el).backgroundColor };
      }
    }
    // colour of the pixels at the far left edge (the "bar" area) — sample the element at (2, 300)
    const edgeEl = document.elementFromPoint(2, 300);
    const edgeBg = edgeEl ? getComputedStyle(edgeEl).backgroundColor : null;
    return { vw: innerWidth, bodyBg, htmlBg, contentCap: cap, edgeEl: edgeEl ? edgeEl.tagName + '.' + (edgeEl.className?.toString?.() || '').slice(0, 20) : null, edgeBg };
  });
  console.log(`${W}: ${JSON.stringify(d)}`);
  await ctx.close();
}

// ---- everything else at 390 ----
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });
const p = await ctx.newPage();
await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2400);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 300)); });

const d = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && +cs.opacity > 0.1 && r.width > 1 && r.height > 1; };
  const out = {};

  // #3 roles per-word fs + fw
  const roleWords = ['DESIGNER', 'STRATEGIST', 'RESEARCHER', 'STORYTELLER', 'COPY WRITER', 'ANIMATOR'];
  out.roles = roleWords.map(w => { let best = null, bs = 0; for (const el of document.querySelectorAll('span,div,p,li')) { if (norm(el.textContent) === w && vis(el)) { const fs = parseFloat(getComputedStyle(el).fontSize) || 0; if (fs > bs) { bs = fs; best = el; } } } return best ? { w, fs: getComputedStyle(best).fontSize, fw: getComputedStyle(best).fontWeight, y: Math.round(best.getBoundingClientRect().top) } : { w, missing: true }; });

  // #2 yellow accent — find gold-ish coloured element in the hero band
  out.accent = [];
  for (const el of document.querySelectorAll('div,span,svg,img')) {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.top < 0 || r.top > 800 || r.width < 20 || r.height < 6) continue;
    const bg = cs.backgroundImage + ' ' + cs.background + ' ' + cs.backgroundColor;
    if (/255, ?1[0-9][0-9]|255, ?183|gold|ffb|rgb\(255, ?2[0-4]/i.test(bg) && !/PRODUCT|DESIGN/.test(norm(el.textContent))) {
      out.accent.push({ tag: el.tagName, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), z: cs.zIndex, bgImg: cs.backgroundImage.slice(0, 60), bgc: cs.backgroundColor, transform: cs.transform.slice(0, 30) });
    }
  }
  out.accent = out.accent.slice(0, 6);

  // #4 WE stat label wrapping
  out.weStatLabel = (() => { let lab = null; for (const el of document.querySelectorAll('span,div,p')) { if (norm(el.textContent) === 'YEARS OF EXPERIENCE' && parseFloat(getComputedStyle(el).fontSize) >= 12 && vis(el)) { lab = el; break; } } if (!lab) return null; const cs = getComputedStyle(lab); const r = lab.getBoundingClientRect(); return { fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, w: Math.round(r.width), h: Math.round(r.height), lines: Math.round(lab.scrollHeight / (parseFloat(cs.lineHeight) || 20)), white: cs.whiteSpace }; })();

  // #9 Square Peg script text (about inserts)
  out.squarePeg = (() => { let best = null, bs = 0; for (const el of document.querySelectorAll('span,div,p')) { const ff = getComputedStyle(el).fontFamily; if (/square peg/i.test(ff) && vis(el)) { const r = el.getBoundingClientRect(); const a = r.width * r.height; if (a > bs) { bs = a; best = el; } } } if (!best) return 'none'; const cs = getComputedStyle(best); return { t: norm(best.textContent).slice(0, 20), fs: cs.fontSize, lh: cs.lineHeight, ls: cs.letterSpacing }; })();

  // #10 tool ticker icons
  out.ticker = (() => {
    // icons are small square imgs in a horizontal strip in the about section
    const imgs = [...document.querySelectorAll('img')].map(i => ({ i, r: i.getBoundingClientRect() })).filter(o => o.r.width > 30 && o.r.width < 130 && Math.abs(o.r.width - o.r.height) < 30 && o.r.top > 0 && o.r.top < 3000);
    if (!imgs.length) return 'none';
    // group by row (similar top)
    const byTop = {}; for (const o of imgs) { const k = Math.round(o.r.top / 20) * 20; (byTop[k] = byTop[k] || []).push(o); }
    const row = Object.values(byTop).sort((a, bb) => bb.length - a.length)[0];
    const w = row[0].r.width; const visibleInVp = row.filter(o => o.r.left >= -5 && o.r.right <= innerWidth + 5).length;
    return { iconW: Math.round(w), countInRow: row.length, visibleInViewport: visibleInVp };
  })();

  return out;
});
console.log('\n===== live @390 details =====');
console.log(JSON.stringify(d, null, 1));
await b.close();
