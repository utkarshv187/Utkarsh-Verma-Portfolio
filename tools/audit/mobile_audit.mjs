import { chromium } from 'playwright';
import fs from 'fs';

const URL = process.argv[2];
const LABEL = process.argv[3] || 'x';
const outDir = 'audit/out/mobile';
fs.mkdirSync(outDir, { recursive: true });
const widths = [430, 414, 390, 375, 360, 320];

const b = await chromium.launch({ headless: true });
const all = {};

for (const W of widths) {
  const ctx = await b.newContext({
    viewport: { width: W, height: 900 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const p = await ctx.newPage();
  const consoleErrors = [];
  p.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 140)); });
  p.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + (e.message || '').slice(0, 140)));
  await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(URL.includes('framer') ? 2600 : 900);
  // scroll through to trigger lazy content + in-view animations
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
    scrollTo(0, 0); await new Promise((r) => setTimeout(r, 300));
  });

  const data = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const vis = (el) => {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.02 && r.width > 1 && r.height > 1;
    };
    // find the biggest visible element whose text matches (exact or contains), skipping wrappers
    const find = (t, exact = true, maxKids = 4) => {
      let best = null;
      for (const el of document.querySelectorAll('h1,h2,h3,h4,p,span,a,div,li,button')) {
        const tx = norm(el.textContent);
        const ok = exact ? tx === t : tx.includes(t);
        if (!ok || el.children.length > maxKids || !vis(el)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
        const r = el.getBoundingClientRect();
        const score = fs * 1e6 + r.width * r.height;
        if (!best || score > best.score) best = { el, score };
      }
      return best ? best.el : null;
    };
    const F = (el, extra) => {
      if (!el) return null;
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      const o = {
        fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing,
        ff: (cs.fontFamily || '').split(',')[0].replace(/["']/g, ''),
        color: cs.color, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      };
      if (extra) { for (const k of extra) o[k] = cs[k]; }
      return o;
    };
    const bgOf = (el) => el ? getComputedStyle(el).backgroundColor : null;
    // nearest ancestor section-ish bg
    const sectionBg = (el) => {
      let n = el;
      for (let i = 0; i < 14 && n; i++) {
        const cs = getComputedStyle(n); const bg = cs.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return { bg, tag: n.tagName, w: Math.round(n.getBoundingClientRect().width) };
        n = n.parentElement;
      }
      return null;
    };

    const R = { vw: innerWidth };

    // ---- overflow ----
    const de = document.documentElement;
    R.overflow = { scrollWidth: Math.max(de.scrollWidth, document.body.scrollWidth), innerWidth: innerWidth, overflows: Math.max(de.scrollWidth, document.body.scrollWidth) > innerWidth + 1 };
    if (R.overflow.overflows) {
      const wide = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.right > innerWidth + 2 && r.width > 0 && getComputedStyle(el).position !== 'fixed') {
          // skip if inside an overflow:hidden ancestor (clipped, not a page overflow)
          let clipped = false, a = el.parentElement;
          for (let i = 0; i < 8 && a; i++) { if (/hidden|clip/.test(getComputedStyle(a).overflowX)) { clipped = true; break; } a = a.parentElement; }
          if (!clipped) wide.push({ cls: (el.className?.toString?.() || el.tagName).slice(0, 30), right: Math.round(r.right) });
        }
      }
      R.overflow.offenders = wide.slice(0, 6);
    }

    // ---- header ----
    const logoImg = document.querySelector('header img, header svg');
    R.header = {
      counter: F(find('Designing for', false, 6)),
      about: F(find('About')),
      contact: F(find('Contact')),
      resume: F(find('Résumé') || find('Resume')),
      // count header interactive icons/links
      navLinks: [...document.querySelectorAll('header a, header button')].filter(vis).length,
      hasHamburger: !!document.querySelector('header [aria-label*="menu" i], header [class*="burger" i], header [class*="hamburger" i]'),
    };

    // ---- hero ----
    let hero = null, hs = 0;
    for (const el of document.querySelectorAll('h1,h2,span,div,p')) { const t = norm(el.textContent); if (/PR.?DUCT|PRODUCT/.test(t) && t.length < 12 && vis(el)) { const fs = parseFloat(getComputedStyle(el).fontSize) || 0; if (fs > hs) { hs = fs; hero = el; } } }
    // role words present + sizes
    const roleWords = ['DESIGNER', 'STRATEGIST', 'RESEARCHER', 'STORYTELLER', 'COPY WRITER', 'ANIMATOR'];
    const roles = [];
    for (const w of roleWords) { const el = find(w); if (el) roles.push({ word: w, fs: getComputedStyle(el).fontSize, y: Math.round(el.getBoundingClientRect().top) }); }
    R.hero = {
      product: F(hero),
      productBg: hero ? sectionBg(hero) : null,
      roles,
      utkarsh: (() => { const im = [...document.querySelectorAll('img')].find(i => /graffiti|utkarsh/i.test((i.currentSrc || i.src || '') + (i.alt || ''))); return im ? F(im) : null; })(),
      // portrait: biggest img in the top 900px
      portrait: (() => { const im = [...document.querySelectorAll('img,picture')].map(i => ({ i, r: i.getBoundingClientRect() })).filter(o => o.r.top > -200 && o.r.top < 900 && o.r.height > 200).sort((a, bb) => bb.r.height - a.r.height)[0]; return im ? { ...F(im.i), src: (im.i.currentSrc || im.i.src || '').split('/').pop().slice(0, 16) } : null; })(),
      rotatingBadge: !!document.querySelector('[class*="badge" i] svg textPath, textPath'),
    };

    // ---- work experience ----
    R.we = {
      heading: F(find('WORK EXPERIENCE')),
      subtitle: F(find('BASED IN DELHI', false)),
      statValues: ['7+', '30+', '1M+'].map(v => F(find(v))),
      statLabels: ['YEARS OF', 'SUCCESSFUL', 'DIVERSIFIED'].map(v => F(find(v, false))),
      spinnyImg: (() => { const im = [...document.querySelectorAll('img')].find(i => /spinny.?high|highlight/i.test((i.currentSrc || i.src || '') + (i.alt || ''))); return im ? { ...F(im), vis: vis(im) } : null; })(),
    };

    // ---- recent work ----
    R.rw = {
      heading: F(find('RECENT WORK')),
      subtitle: F(find('BLENDING ART', false)),
      cardTitle1: F(find('car auction', false)),
      statNum: F(find('13%')),
      statLabel: F(find('MORE USER', false)),
    };

    // ---- testimonials / things they say ----
    R.tts = {
      heading: F(find('THINGS THEY SAY') || find('WHAT PEOPLE', false) || find('KIND WORDS', false) || find('TESTIMONIAL', false)),
    };

    // ---- more about me ----
    R.about = {
      heading: F(find('MORE ABOUT ME')),
      subtitle: F(find('ENGINEER TURNED ARTIST') || find('ENGINEER', false)),
      bio: F(find('delight', false) || find('years of expertise', false), false, 40),
      script1: F(find('designer', false, 2)),
      portrait: (() => {
        const about = find('MORE ABOUT ME'); if (!about) return null;
        let sec = about; for (let i = 0; i < 12 && sec; i++) { if (sec.querySelectorAll && [...sec.querySelectorAll('img')].some(im => im.getBoundingClientRect().height > 150)) break; sec = sec.parentElement; }
        const im = sec ? [...sec.querySelectorAll('img')].map(i => ({ i, h: i.getBoundingClientRect().height })).filter(o => o.h > 150).sort((a, bb) => bb.h - a.h)[0] : null;
        return im ? { ...F(im.i), visible: vis(im.i) } : 'none';
      })(),
    };

    // ---- hobbies ----
    const grid = find('PHOTOGRAPHING') ? (() => { let n = find('PHOTOGRAPHING'); let sec = n; for (let i = 0; i < 8 && sec; i++) { sec = sec.parentElement; if (sec && sec.querySelectorAll('img').length >= 4) break; } return sec; })() : null;
    R.hob = {
      intro: F(find('WHEN I AM NOT DESIGNING', false)),
      photoTitle: F(find('PHOTOGRAPHING')),
      // grid columns: count distinct x of grid images in the first row
      gridCols: (() => {
        // find images that look like the landscape grid (wide, many siblings)
        const imgs = [...document.querySelectorAll('img')].map(i => i.getBoundingClientRect()).filter(r => r.width > 60 && r.height > 40 && r.top > 0);
        if (!imgs.length) return null;
        // group by rounded top, take the most-populated row
        const rows = {};
        for (const r of imgs) { const k = Math.round(r.top / 10) * 10; (rows[k] = rows[k] || []).push(Math.round(r.left)); }
        const best = Object.values(rows).sort((a, bb) => bb.length - a.length)[0];
        return best ? new Set(best).size : null;
      })(),
    };

    // ---- footer ----
    R.footer = {
      headingWide: F(find('SCROLLED THIS FAR', false)),
      headingNarrow: F(find('CAME THIS FAR', false)),
      cta: F(find('LET', false, 3)),
      pillPhone: F(find('8869808079', false)),
      goToTop: F(find('GO TO', false) || find('TOP')),
      bg: (() => { const h = find('CAME THIS FAR', false) || find('LET', false, 3); return h ? sectionBg(h) : null; })(),
    };

    // ---- global ----
    R.global = {
      cursorEl: !!document.querySelector('[class*="cursor" i]'),
      cursorVisible: (() => { const c = document.querySelector('.cursor, [class*="cursor" i]'); return c ? (getComputedStyle(c).display !== 'none' && +getComputedStyle(c).opacity > 0.02) : null; })(),
      bodyCursor: getComputedStyle(document.body).cursor,
      framerBadge: !!document.querySelector('#__framer-badge-container, [class*="framer-badge" i], a[href*="framer.com"][class*="badge" i]'),
      framerBadgeText: !!([...document.querySelectorAll('a')].find(a => /made in framer|create.*website.*framer/i.test(norm(a.textContent)))),
    };

    return R;
  });

  all[W] = { ...data, consoleErrors };
  await p.screenshot({ path: `${outDir}/${LABEL}_${W}.png`, fullPage: true }).catch(() => {});
  await ctx.close();
}

fs.writeFileSync(`${outDir}/${LABEL}.json`, JSON.stringify(all, null, 1));
console.log(`\n===== ${LABEL} =====`);
for (const W of widths) {
  const d = all[W];
  console.log(`\n-- ${W}px --  overflow=${d.overflow.overflows} (sw ${d.overflow.scrollWidth}/${d.overflow.innerWidth})  consoleErrors=${d.consoleErrors.length}`);
  if (d.overflow.offenders) console.log('   offenders:', JSON.stringify(d.overflow.offenders));
  const fmt = (o) => o ? `${o.fs}/${o.fw}${o.lh ? ' lh' + o.lh : ''}${o.ls && o.ls !== 'normal' ? ' ls' + o.ls : ''} ${o.color || ''}` : '—';
  console.log('   product:', fmt(d.hero.product), '| roles:', d.hero.roles.map(r => `${r.word.slice(0, 4)}:${r.fs}`).join(','));
  console.log('   product.y', d.hero.product?.y, 'utkarsh', d.hero.utkarsh ? `${d.hero.utkarsh.w}x${d.hero.utkarsh.h}@${d.hero.utkarsh.y}` : '—', 'portrait', d.hero.portrait ? `${d.hero.portrait.w}x${d.hero.portrait.h}@${d.hero.portrait.y}` : '—');
  console.log('   header: about', fmt(d.header.about), '| contact', fmt(d.header.contact), '| navLinks', d.header.navLinks, 'hamburger', d.header.hasHamburger);
  console.log('   WE h', fmt(d.we.heading), '| sub', fmt(d.we.subtitle));
  console.log('   WE statVal', d.we.statValues.map(fmt).join(' || '));
  console.log('   RW h', fmt(d.rw.heading), '| statLabel', fmt(d.rw.statLabel));
  console.log('   about h', fmt(d.about.heading), '| sub', fmt(d.about.subtitle), '| portrait', d.about.portrait === 'none' ? 'NONE' : (d.about.portrait ? `${d.about.portrait.w}x${d.about.portrait.h} vis=${d.about.portrait.visible}` : '—'));
  console.log('   hob intro', fmt(d.hob.intro), '| photo', fmt(d.hob.photoTitle), '| gridCols', d.hob.gridCols);
  console.log('   footer wide', fmt(d.footer.headingWide), '| narrow', fmt(d.footer.headingNarrow), '| pill', fmt(d.footer.pillPhone), '| bg', JSON.stringify(d.footer.bg));
  console.log('   global cursorVisible', d.global.cursorVisible, 'bodyCursor', d.global.bodyCursor, 'framerBadge', d.global.framerBadge, 'framerText', d.global.framerBadgeText);
  if (d.consoleErrors.length) console.log('   ERRORS:', d.consoleErrors.slice(0, 3).join(' | '));
}
await b.close();
