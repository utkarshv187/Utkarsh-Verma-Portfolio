import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.55) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

// ---- 1) section boundaries: RECENT WORK bottom vs THINGS THEY SAY top ----
const bounds = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  // find the colored section wrappers by their heading text, climb to full-width bg box
  const wrap = (re) => { const h = [...document.querySelectorAll('div,h2,p')].find(e => re.test(n(e.textContent)) && parseFloat(getComputedStyle(e).fontSize) > 40); let node = h; for (let k = 0; k < 16 && node; k++) { const r = node.getBoundingClientRect(); const bg = getComputedStyle(node).backgroundColor; if (r.width >= 1440 && bg && bg !== 'rgba(0, 0, 0, 0)') return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), h: Math.round(r.height), bg }; node = node.parentElement; } return null; };
  return { rw: wrap(/RECENT WORK/i), tts: wrap(/THINGS THEY SAY/i), we: wrap(/WORK EXPERIENCE/i) };
});
console.log('SECTION BOUNDS:', JSON.stringify(bounds, null, 2));
if (bounds.rw && bounds.tts) console.log('GAP rw.bottom -> tts.top =', bounds.tts.top - bounds.rw.bottom, 'px');

// ---- 3) bio entrance: sample bio text opacity/transform as the section enters ----
const aboutY = await p.evaluate(() => { const n = (s) => (s || '').replace(/\s+/g, ' ').trim(); const h = [...document.querySelectorAll('div,p')].find(e => /Result, impact & delight/i.test(n(e.textContent)) && n(e.textContent).length > 120); return h.getBoundingClientRect().top + scrollY; });
console.log('\nbio docY', Math.round(aboutY));
console.log('BIO entrance (opacity/transform of bio + its word/line spans as it enters):');
// find how the bio is structured (per word? per line?) and sample the FIRST word span
await p.evaluate((y) => scrollTo(0, y - 1100), aboutY);
await p.waitForTimeout(500);
const struct = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const bio = [...document.querySelectorAll('div,p')].find(e => /Result, impact & delight/i.test(n(e.textContent)) && parseFloat(getComputedStyle(e).fontSize) > 30);
  if (!bio) return null;
  // count descendant spans/divs that hold single words
  const kids = [...bio.querySelectorAll('*')].filter(e => e.children.length === 0 && n(e.textContent).length > 0 && n(e.textContent).length < 20);
  const sample = kids.slice(0, 3).map(e => ({ t: n(e.textContent), op: getComputedStyle(e).opacity, tf: getComputedStyle(e).transform }));
  return { bioFs: getComputedStyle(bio).fontSize, wordish: kids.length, firstWords: kids.slice(0, 6).map(e => n(e.textContent)), sample, bioOpacity: getComputedStyle(bio).opacity, bioTf: getComputedStyle(bio).transform };
});
console.log(JSON.stringify(struct, null, 2));
// step through scroll to watch the entrance
for (const dy of [-700, -500, -350, -200, -50, 120]) {
  await p.evaluate((y) => scrollTo(0, y), aboutY + dy);
  await p.waitForTimeout(280);
  const s = await p.evaluate(() => {
    const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const bio = [...document.querySelectorAll('div,p')].find(e => /Result, impact & delight/i.test(n(e.textContent)) && parseFloat(getComputedStyle(e).fontSize) > 30);
    const kids = [...bio.querySelectorAll('*')].filter(e => e.children.length === 0 && n(e.textContent).length > 0 && n(e.textContent).length < 20);
    const first = kids[0], last = kids[kids.length - 1];
    return { firstOp: first && +getComputedStyle(first).opacity.slice(0, 4), firstTf: first && getComputedStyle(first).transform.slice(0, 30), lastOp: last && +getComputedStyle(last).opacity.slice(0, 4) };
  });
  console.log(`  dy ${String(dy).padStart(5)}: firstWordOp=${s.firstOp} lastWordOp=${s.lastOp} firstTf=${s.firstTf}`);
}

// ---- 4/5) insert font + caret char/font ----
const insDetail = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const leaf = (ph) => { const cands = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && n(e.textContent).toLowerCase().includes(ph)); const e = cands.sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0]; if (!e) return null; const c = getComputedStyle(e); return { text: n(e.textContent), ff: c.fontFamily, fs: c.fontSize, color: c.color }; };
  // carets: any leaf that is a lone ^ or v near gold
  const carets = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && ['^', 'v', 'V', '˅', 'ˇ', '⌄'].includes(n(e.textContent))).map(e => { const c = getComputedStyle(e); return { t: n(e.textContent), ff: c.fontFamily, fs: c.fontSize, color: c.color }; });
  return { improving: leaf('improving'), ifnot: leaf('if not, then'), carets: carets.slice(0, 6) };
});
console.log('\nINSERT font:', JSON.stringify(insDetail, null, 2));
await b.close();
