import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });
await p.evaluate(() => scrollTo(0, 6706 - 150));
await p.waitForTimeout(700);

// deepest leaf holding a phrase -> real style
const leafStyle = (phrase) => p.evaluate((ph) => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  let cands = [...document.querySelectorAll('*')].filter(e => n(e.textContent).toLowerCase().includes(ph.toLowerCase()) && e.children.length === 0);
  // if no leaf (text split), take smallest element containing it
  if (!cands.length) cands = [...document.querySelectorAll('div,p,span')].filter(e => n(e.textContent).toLowerCase().includes(ph.toLowerCase())).sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width).slice(0, 1);
  const e = cands[0]; if (!e) return null;
  const c = getComputedStyle(e);
  return { fs: c.fontSize, lh: c.lineHeight, fw: c.fontWeight, color: c.color, ff: c.fontFamily, ls: c.letterSpacing, style: c.fontStyle };
}, phrase);
console.log('BIO main leaf:', JSON.stringify(await leafStyle('driven designer')));
console.log('INSERT leaf (& improving):', JSON.stringify(await leafStyle('& improving')));
console.log('INSERT leaf (if not, then):', JSON.stringify(await leafStyle('if not, then we correct')));

// caret marks: find small text elements that are just a caret near the bio
const carets = await p.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('*')) {
    if (e.children.length) continue;
    const t = (e.textContent || '').trim();
    if (t === '^' || t === '˅' || t === 'ˇ' || t === '⌄' || t === 'v' && false) { const r = e.getBoundingClientRect(); out.push({ t, x: Math.round(r.left), y: Math.round(r.top + scrollY), color: getComputedStyle(e).color, fs: getComputedStyle(e).fontSize }); }
  }
  return out;
});
console.log('CARETS:', JSON.stringify(carets));

// bio full structure: the element with the largest font that contains the whole bio
const bioBox = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const els = [...document.querySelectorAll('div,p')].filter(e => /Result, impact & delight/i.test(n(e.textContent)) && /work & thrive/i.test(n(e.textContent)));
  const big = els.map(e => ({ e, fs: parseFloat(getComputedStyle(e).fontSize) })).sort((a, b) => b.fs - a.fs)[0];
  if (!big) return null; const r = big.e.getBoundingClientRect(); const c = getComputedStyle(big.e);
  return { fs: c.fontSize, lh: c.lineHeight, fw: c.fontWeight, color: c.color, ff: c.fontFamily.split(',')[0], w: Math.round(r.width), x: Math.round(r.left), docY: Math.round(r.top + scrollY) };
});
console.log('BIO box (biggest font):', JSON.stringify(bioBox));

// ALL icons in the about band (include off-viewport), from the DOM
await p.evaluate(() => scrollTo(0, 7451 - 350));
await p.waitForTimeout(500);
const icons = await p.evaluate(() => {
  const out = [];
  for (const im of document.querySelectorAll('img')) { const r = im.getBoundingClientRect(); const dy = r.top + scrollY; if (dy < 7250 || dy > 7650) continue; if (Math.abs(r.width - 100) > 6) continue; out.push({ x: Math.round(r.left), src: (im.currentSrc || im.src) }); }
  return out.sort((a, b) => a.x - b.x);
});
console.log('\nICONS full-src (', icons.length, '):'); for (const i of icons) console.log('  x' + i.x, i.src);

// icon marquee: sample first icon x over 2s
const iconX = () => p.evaluate(() => { const im = [...document.querySelectorAll('img')].filter(i => { const r = i.getBoundingClientRect(); const dy = r.top + scrollY; return dy > 7250 && dy < 7650 && Math.abs(r.width - 100) < 6; }).sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)[0]; return im ? +im.getBoundingClientRect().left.toFixed(1) : null; });
const ix0 = await iconX(); await p.waitForTimeout(2000); const ix1 = await iconX();
console.log(`icon marquee: x ${ix0} -> ${ix1} (Δ ${ix1 - ix0} over 2s => ${Math.abs(ix1 - ix0) > 3 ? 'MOVES ' + ((ix1 - ix0) / 2).toFixed(1) + 'px/s' : 'static'})`);

// LEARNING badge: which icon has it
const learning = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const lab = [...document.querySelectorAll('*')].find(e => n(e.textContent) === 'LEARNING' && e.children.length <= 1);
  if (!lab) return null; const r = lab.getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top + scrollY), color: getComputedStyle(lab).color, bg: getComputedStyle(lab).backgroundColor, fs: getComputedStyle(lab).fontSize };
});
console.log('LEARNING badge:', JSON.stringify(learning));

// insert appear-animation: approach from below, sample opacity of one insert
await p.evaluate(() => scrollTo(0, 7323 - 900));
await p.waitForTimeout(500);
console.log('\ninsert "& improving" opacity vs scroll:');
for (const dy of [-500, -350, -200, -80, 40, 160]) {
  await p.evaluate((y) => scrollTo(0, y), 7078 + dy);
  await p.waitForTimeout(300);
  const o = await p.evaluate(() => { const n = (s) => (s || '').replace(/\s+/g, ' ').trim(); const e = [...document.querySelectorAll('div,span,p')].filter(e => n(e.textContent) === '& improving').sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0]; if (!e) return null; return { op: getComputedStyle(e).opacity, tf: getComputedStyle(e).transform }; });
  console.log(`  scrollDy ${String(dy).padStart(4)}: ${JSON.stringify(o)}`);
}
await b.close();
