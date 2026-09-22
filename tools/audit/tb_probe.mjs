import { chromium } from 'playwright';
import fs from 'fs';
const URL = process.argv[2], LABEL = process.argv[3];
const outDir = 'audit/out/tb'; fs.mkdirSync(outDir, { recursive: true });
const widths = [1440, 1280, 1024, 810, 768, 430, 390, 360];
const b = await chromium.launch({ headless: true });
const all = {};
for (const W of widths) {
  const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(URL.includes('framer') ? 2400 : 800);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } scrollTo(0, 0); });
  await p.waitForTimeout(400);
  const d = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.02 && r.width > 0 && r.height > 0; };
    const find = (t, exact = true) => { let best = null; for (const el of document.querySelectorAll('h1,h2,h3,h4,p,span,a,div')) { const tx = norm(el.textContent); const ok = exact ? tx === t : tx.includes(t); if (!ok || !vis(el) || el.children.length > 3) continue; const fs = parseFloat(getComputedStyle(el).fontSize) || 0; const r = el.getBoundingClientRect(); const s = fs * 1e6 + r.width * r.height; if (!best || s > best.s) best = { el, s }; } return best ? best.el : null; };
    const F = (el) => { if (!el) return null; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { fs: cs.fontSize, w: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, x: Math.round(r.left), bw: Math.round(r.width) }; };
    const R = { vw: innerWidth };
    // hero PRODUCT (biggest text with PRODUCT/DUCT)
    let hero = null, hs = 0; for (const el of document.querySelectorAll('h1,h2,span,div')) { const t = norm(el.textContent); if (/PR.?DUCT|PRODUCT/.test(t) && t.length < 12 && vis(el)) { const fs = parseFloat(getComputedStyle(el).fontSize) || 0; if (fs > hs) { hs = fs; hero = el; } } }
    R.product = F(hero);
    R.role = F(find('DESIGNER') || find('RESEARCHER') || find('STRATEGIST') || find('STORYTELLER'));
    R.moreAbout = F(find('MORE ABOUT ME'));
    R.engineer = F(find('ENGINEER TURNED ARTIST'));
    R.photographing = F(find('PHOTOGRAPHING'));
    R.footerQ = F(find('SCROLLED', false) || find('CAME THIS', false));
    R.footerCta = F(find('TOGETHER') || find('TALK') || find('WORK'));
    R.phone = F(find('+91 8869808079'));
    // about portrait: the portrait img near MORE ABOUT ME; report if visible + its width
    const about = find('MORE ABOUT ME');
    let sec = about; for (let i = 0; i < 12 && sec; i++) { if (sec.querySelectorAll && sec.querySelectorAll('img').length) break; sec = sec.parentElement; }
    const imgs = sec ? [...sec.querySelectorAll('img')].map((im) => ({ w: Math.round(im.getBoundingClientRect().width), h: Math.round(im.getBoundingClientRect().height), vis: vis(im), src: (im.currentSrc || im.src).split('/').pop().slice(0, 14) })).filter((o) => o.h > 150) : [];
    R.aboutPortrait = imgs.sort((a, b) => b.h - a.h)[0] || null;
    // bio: find the paragraph with "delight driven" — report width + font-size
    const bio = find('delight driven', false) || find('years of expertise', false);
    R.bio = bio ? (() => { const cs = getComputedStyle(bio); const r = bio.getBoundingClientRect(); return { fs: cs.fontSize, w: cs.fontWeight, bw: Math.round(r.width), x: Math.round(r.left) }; })() : null;
    return R;
  });
  all[W] = d;
  await p.close();
}
fs.writeFileSync(`${outDir}/${LABEL}.json`, JSON.stringify(all, null, 1));
// print compact table
const fmt = (o) => o ? `${o.fs}/${o.w}${o.lh ? ' lh' + o.lh : ''}${o.ls && o.ls !== 'normal' ? ' ls' + o.ls : ''}` : '—';
console.log(`\n===== ${LABEL} =====`);
console.log('W'.padEnd(6), 'PRODUCT'.padEnd(16), 'role'.padEnd(16), 'MOREABOUT'.padEnd(14), 'ENGINEER'.padEnd(12), 'PHOTO'.padEnd(14), 'footerQ'.padEnd(14), 'phone');
for (const W of widths) { const d = all[W]; console.log(String(W).padEnd(6), fmt(d.product).padEnd(16), fmt(d.role).padEnd(16), fmt(d.moreAbout).padEnd(14), fmt(d.engineer).padEnd(12), fmt(d.photographing).padEnd(14), fmt(d.footerQ).padEnd(14), fmt(d.phone)); }
console.log('\nAbout layout (portrait / bio):');
for (const W of widths) { const d = all[W]; console.log(String(W).padEnd(6), 'portrait:', JSON.stringify(d.aboutPortrait), ' bio:', JSON.stringify(d.bio)); }
await b.close();
