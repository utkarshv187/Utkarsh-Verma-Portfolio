import { chromium } from 'playwright';
import fs from 'fs';
const URL = process.argv[2];
const LABEL = process.argv[3];
const W = Number(process.argv[4] || 1440);
const outDir = 'audit/out/diff'; fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(URL.includes('framer') ? 2500 : 900);
// scroll through to load lazy + settle animations, then back to top
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } scrollTo(0, 0); });
await p.waitForTimeout(500);

const data = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.02 && r.width > 0 && r.height > 0; };
  // visible element whose trimmed text matches `t`, preferring the LARGEST font-size (the real
  // styled heading, not Framer's hidden 12px placeholder duplicate); few children (leaf-ish).
  const find = (t, exact = true) => {
    let best = null;
    for (const el of document.querySelectorAll('h1,h2,h3,h4,p,span,a,div,button,li')) {
      const tx = norm(el.textContent);
      const ok = exact ? tx === t : tx.includes(t);
      if (!ok || !vis(el) || el.children.length > 3) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
      const r = el.getBoundingClientRect();
      const score = fs * 1e6 + r.width * r.height; // largest font first, then largest box
      if (!best || score > best.s) best = { el, s: score };
    }
    return best ? best.el : null;
  };
  const css = (el, props) => { if (!el) return null; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); const o = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; for (const pr of props) o[pr] = cs[pr]; return o; };
  const font = (el) => css(el, ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'color', 'textAlign']);

  const R = { vw: innerWidth, dpr: devicePixelRatio };
  R.bodyBg = getComputedStyle(document.body).backgroundColor;
  R.bodyFont = getComputedStyle(document.body).fontFamily;
  // header
  R.about = font(find('About'));
  R.contact = font(find('Contact'));
  R.resume = font(find('Résumé') || find('Resume'));
  // hero PRODUCT — find biggest text with "DUCT" or "PRODUCT"
  let hero = null; for (const el of document.querySelectorAll('h1,h2,span,div')) { const t = norm(el.textContent); if (/PR.?DUCT|PRODUCT/.test(t) && t.length < 12 && vis(el)) { const r = el.getBoundingClientRect(); if (parseInt(getComputedStyle(el).fontSize) > 100) { hero = el; break; } } }
  R.heroProduct = font(hero);
  // role words (DESIGNER etc)
  R.designer = font(find('DESIGNER'));
  // section headings
  R.recentWork = font(find('RECENT WORK'));
  R.thingsSay = font(find('THINGS THEY SAY') || find('THEY SAY', false));
  R.moreAbout = font(find('MORE ABOUT ME'));
  R.engineer = font(find('ENGINEER TURNED ARTIST'));
  R.gaming = font(find('GAMING'));
  R.photographing = font(find('PHOTOGRAPHING'));
  R.footerCta = font(find('TOGETHER') || find('WORK') || find('TALK'));
  R.footerQ = font(find('SCROLLED', false) || find('CAME THIS', false) || find('FAR?', false));
  // work experience heading
  R.weHeading = font(find('WORK EXPERIENCE'));
  // contact pill numbers
  R.phone = font(find('+91 8869808079'));
  R.email = font(find('utkarshv187@gmail.com'));
  R.connect = font(find('Connect'));
  // section backgrounds: sample a few big section divs by finding known headings' section bg
  const secBg = (headingEl) => { if (!headingEl) return null; let n = headingEl; for (let i = 0; i < 12 && n; i++) { const cs = getComputedStyle(n); if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') return cs.backgroundColor; n = n.parentElement; } return null; };
  R.rwSectionBg = secBg(find('RECENT WORK'));
  R.aboutSectionBg = secBg(find('MORE ABOUT ME'));
  R.pageHeight = document.body.scrollHeight;
  // RW card titles
  R.rwCard1 = font(find("Spinny's car auction app PLP redesign") || find('car auction app', false));
  R.rwCard2 = font(find('Introduced a tier based gamification') || find('tier based', false));
  // testimonial heading
  R.testiHeading = font(find('THINGS THEY SAY') || find('THEY SAY', false) || find('WHAT PEOPLE', false));
  // WE role labels (big role words in Work Experience)
  R.weRole = font(find('PRODUCT DESIGNER') || find('SR. PRODUCT', false));
  // stat numbers (recent work / we) — a percentage
  R.stat13 = font(find('13%'));
  // subheadings
  R.rwSub = font(find('I LOVE BLENDING ART & TECHNOLOGY') || find('BLENDING ART', false));
  // hobby caption (script)
  R.hobbyCaption = font(find('very very competitive!') || find('competitive', false));
  // designing-for label + counter
  R.designingFor = font(find('Designing for'));
  return R;
});
console.log(JSON.stringify({ label: LABEL, url: URL, w: W, data }, null, 1));
fs.writeFileSync(`${outDir}/${LABEL}_${W}.json`, JSON.stringify(data, null, 1));
await b.close();
