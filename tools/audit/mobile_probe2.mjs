import { chromium } from 'playwright';
const URL = process.argv[2];
const LABEL = process.argv[3] || 'x';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });
const p = await ctx.newPage();
await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(URL.includes('framer') ? 2600 : 1000);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 300)); });

const d = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.02 && r.width > 1 && r.height > 1; };
  const find = (t, ex = true, mk = 4) => { let best = null; for (const el of document.querySelectorAll('h1,h2,h3,h4,p,span,a,div,li,button')) { const tx = norm(el.textContent); const ok = ex ? tx === t : tx.includes(t); if (!ok || el.children.length > mk || !vis(el)) continue; const fs = parseFloat(getComputedStyle(el).fontSize) || 0; const r = el.getBoundingClientRect(); const sc = fs * 1e6 + r.width * r.height; if (!best || sc > best.sc) best = { el, sc }; } return best ? best.el : null; };
  const F = (el) => { if (!el) return null; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { t: norm(el.textContent).slice(0, 24), fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, color: cs.color, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top) }; };
  const out = {};

  // header: topmost fixed/sticky bar
  const bars = [...document.querySelectorAll('header,nav,div')].filter(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return (cs.position === 'fixed' || cs.position === 'sticky') && r.top <= 30 && r.width > innerWidth * 0.6 && r.height > 20 && r.height < 120; }).sort((a, bb) => a.getBoundingClientRect().top - bb.getBoundingClientRect().top);
  const bar = bars[0];
  out.header = bar ? {
    barH: Math.round(bar.getBoundingClientRect().height),
    items: [...bar.querySelectorAll('a,button')].filter(vis).map(el => ({ label: norm(el.textContent) || el.getAttribute('aria-label') || '', hasIcon: !!el.querySelector('svg,img'), w: Math.round(el.getBoundingClientRect().width) })),
  } : 'no-bar';

  // WE subtitle + stats (via label -> card)
  out.we_subtitle = F(find('BASED IN DELHI', false, 6));
  const statFor = (labelText) => {
    const lab = find(labelText, false, 4); if (!lab) return null;
    // walk up to a card, then find the biggest number-ish text in it
    let card = lab; for (let i = 0; i < 5 && card; i++) { if (card.getBoundingClientRect().height > 80) break; card = card.parentElement; }
    let val = null, vs = 0; for (const el of (card || document).querySelectorAll('span,div,p,h2,h3')) { const tx = norm(el.textContent); if (/^[0-9]+[MK+%.x/ ]*$|^[0-9.]+[MKmk+]/.test(tx) && tx.length < 8 && vis(el) && el !== lab) { const fs = parseFloat(getComputedStyle(el).fontSize) || 0; if (fs > vs) { vs = fs; val = el; } } }
    return { label: F(lab), value: F(val) };
  };
  out.we_stat_years = statFor('YEARS OF');

  // RW first card stat
  out.rw_stat = (() => {
    const t = find('MORE USER', false, 4); if (!t) return null;
    let card = t; for (let i = 0; i < 4 && card; i++) { if (card.getBoundingClientRect().height > 60) break; card = card.parentElement; }
    let num = null, ns = 0; for (const el of (card || document).querySelectorAll('span,div,p')) { const tx = norm(el.textContent); if (/^[0-9]+[%x+]?$/.test(tx) && vis(el)) { const fs = parseFloat(getComputedStyle(el).fontSize) || 0; if (fs > ns) { ns = fs; num = el; } } }
    return { label: F(t), num: F(num) };
  })();

  // about portrait: img in the MORE ABOUT ME section
  out.about_portrait = (() => {
    const ab = find('MORE ABOUT ME'); if (!ab) return 'no-heading';
    let sec = ab; for (let i = 0; i < 12 && sec; i++) { const imgs = [...sec.querySelectorAll('img,picture')].filter(im => im.getBoundingClientRect().height > 150 && im.getBoundingClientRect().width > 100); if (imgs.length) return imgs.sort((a, bb) => bb.getBoundingClientRect().height - a.getBoundingClientRect().height).map(im => ({ ...F(im), vis: vis(im), src: (im.currentSrc || im.src || '').split('/').pop().slice(0, 18) }))[0]; sec = sec.parentElement; }
    return 'none';
  })();

  // hobby intro
  out.hob_intro = F(find('WHEN I AM NOT DESIGNING', false, 4) || find('NOT DESIGNING', false, 4));

  // PHOTOGRAPHING grid columns
  out.photo_grid = (() => {
    const ph = find('PHOTOGRAPHING'); if (!ph) return 'no-heading';
    // gather landscape images below PHOTOGRAPHING
    const py = ph.getBoundingClientRect().bottom;
    const imgs = [...document.querySelectorAll('img')].map(i => i.getBoundingClientRect()).filter(r => r.top >= py - 10 && r.top < py + 2500 && r.width > 60 && r.width / r.height > 1.2 && r.width / r.height < 2.4);
    if (imgs.length < 2) return { cols: null, n: imgs.length };
    // first row = smallest top group
    const minTop = Math.min(...imgs.map(r => r.top));
    const firstRow = imgs.filter(r => Math.abs(r.top - minTop) < 20);
    return { cols: new Set(firstRow.map(r => Math.round(r.left))).size, n: imgs.length, cellW: Math.round(firstRow[0].width) };
  })();

  // footer heading (biggest text in the gold footer)
  out.footer = (() => {
    // the gold section near the bottom
    let gold = null; for (const el of document.querySelectorAll('div,section,footer')) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (/255, 18[0-9]|255, 179|255, 183/.test(cs.backgroundColor) && r.top > innerHeight && r.height > 200) { if (!gold || r.top > gold.getBoundingClientRect().top) gold = el; } }
    let head = null, hs = 0; const scope = gold || document; for (const el of scope.querySelectorAll('h1,h2,h3,span,div,p')) { const tx = norm(el.textContent); if (tx.length > 3 && tx.length < 40 && vis(el) && el.children.length <= 3) { const fs = parseFloat(getComputedStyle(el).fontSize) || 0; if (fs > hs) { hs = fs; head = el; } } }
    // contact pill
    const pill = find('8869808079', false, 4);
    return { heading: F(head), pill: F(pill), goldW: gold ? Math.round(gold.getBoundingClientRect().width) : null };
  })();

  // custom cursor on touch
  out.cursor = (() => {
    const els = [...document.querySelectorAll('div,span')].filter(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.position === 'fixed' && +cs.zIndex > 50 && r.width < 80 && r.height < 80 && (/cursor/i.test(el.className?.toString?.() || '') || cs.mixBlendMode === 'difference'); });
    return { count: els.length, anyVisible: els.some(vis), classes: els.map(e => (e.className?.toString?.() || '').slice(0, 20)) };
  })();

  return out;
});
console.log(`\n===== ${LABEL} @390 =====`);
console.log(JSON.stringify(d, null, 1));
await b.close();
