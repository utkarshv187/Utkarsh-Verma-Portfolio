import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });
await p.evaluate(() => scrollTo(0, 6706 - 150));
await p.waitForTimeout(700);

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

// 1) bio container + main text style
const bio = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const el = [...document.querySelectorAll('div,p,span')].find(e => /Result, impact & delight driven designer/i.test(n(e.textContent)) && n(e.textContent).length > 120 && n(e.textContent).length < 260);
  if (!el) return null;
  const c = getComputedStyle(el); const r = el.getBoundingClientRect();
  return { text: n(el.textContent), fs: c.fs || c.fontSize, lh: c.lineHeight, fw: c.fontWeight, color: c.color, ff: c.fontFamily.split(',')[0], w: Math.round(r.width), x: Math.round(r.left), docY: Math.round(r.top + scrollY) };
});
console.log('BIO:', JSON.stringify(bio, null, 2));

// 2) gold inserts — find elements whose text matches the known phrases
const inserts = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const phrases = ['mentor, storyteller', '& improving', 'products & businesses', 'sometimes unconventional', 'if not, then we correct'];
  const out = [];
  for (const ph of phrases) {
    let best = null;
    for (const e of document.querySelectorAll('div,p,span')) {
      const t = n(e.textContent);
      if (!t.toLowerCase().includes(ph.toLowerCase())) continue;
      if (t.length > ph.length + 24) continue;
      const r = e.getBoundingClientRect(); if (r.width < 8) continue;
      const c = getComputedStyle(e);
      const cand = { text: t, fs: c.fontSize, fw: c.fontWeight, color: c.color, ff: c.fontFamily.split(',')[0], transform: c.transform, opacity: c.opacity, x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
      if (!best || cand.w < best.w) best = cand;
    }
    out.push({ ph, found: best });
  }
  return out;
});
console.log('\nGOLD INSERTS:'); for (const i of inserts) console.log('  ', JSON.stringify(i));

// 3) section bg colors
const bg = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const grab = (re, band) => { const h = [...document.querySelectorAll('div,p')].find(e => re.test(n(e.textContent)) && parseFloat(getComputedStyle(e).fontSize) > 40); let node = h; for (let k = 0; k < 14 && node; k++) { const b = getComputedStyle(node).backgroundColor; const r = node.getBoundingClientRect(); if (b && b !== 'rgba(0, 0, 0, 0)' && r.width > 1200) return { bg: b, w: Math.round(r.width), h: Math.round(r.height), docY: Math.round(r.top + scrollY) }; node = node.parentElement; } return null; };
  return { tts: grab(/THINGS THEY SAY/i), about: grab(/MORE ABOUT ME/i) };
});
console.log('\nBG:', JSON.stringify(bg));

// 4) portrait
const portrait = await p.evaluate(() => { const im = [...document.querySelectorAll('img')].find(i => /XqTvKhL5G8EjG5fVvNDgpH3epI/.test(i.src)); if (!im) return null; const r = im.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), docY: Math.round(r.top + scrollY), src: im.currentSrc || im.src, radius: getComputedStyle(im).borderRadius }; });
console.log('\nPORTRAIT:', JSON.stringify(portrait));

// 5) icon grid — all imgs in the band 7250..7600, and their marquee track
await p.evaluate(() => scrollTo(0, 7451 - 300));
await p.waitForTimeout(500);
const icons = await p.evaluate(() => {
  const out = [];
  for (const im of document.querySelectorAll('img')) { const r = im.getBoundingClientRect(); const dy = r.top + scrollY; if (dy < 7250 || dy > 7650) continue; if (r.width < 30 || r.width > 160) continue; out.push({ w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), src: (im.currentSrc || im.src).split('/').pop().slice(0, 34) }); }
  return out.sort((a, b) => a.x - b.x);
});
console.log('\nICONS (', icons.length, '):'); for (const i of icons) console.log('  ', JSON.stringify(i));

// icon marquee motion
const iconTrack = () => p.evaluate(() => { const im = [...document.querySelectorAll('img')].find(i => { const r = i.getBoundingClientRect(); const dy = r.top + scrollY; return dy > 7250 && dy < 7650 && r.width > 30 && r.width < 160; }); if (!im) return null; let node = im; for (let k = 0; k < 8 && node; k++) { const t = getComputedStyle(node).transform; if (t && t.includes('matrix') && t !== 'matrix(1, 0, 0, 1, 0, 0)') { return { depth: k, tag: node.tagName.toLowerCase(), t }; } node = node.parentElement; } return null; });
const it0 = await iconTrack(); await p.waitForTimeout(1500); const it1 = await iconTrack();
console.log('\nicon track t0:', JSON.stringify(it0), '\nicon track t1:', JSON.stringify(it1));
await b.close();
