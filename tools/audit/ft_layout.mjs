import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
await p.waitForTimeout(500);
const pageH = await p.evaluate(() => document.body.scrollHeight);

async function snap(y, label) {
  await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(700);
  return await p.evaluate(() => {
    const V = (r) => ({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
    const byText = (re, tag = '*') => [...document.querySelectorAll(tag)].filter((el) => re.test((el.textContent || '').replace(/\s+/g, ' ').trim()) && el.children.length <= 2);
    const out = { headings: [], pills: [], roles: [], badge: null };
    // CTA headings
    for (const el of document.querySelectorAll('h1,h2,h3,p,div,span')) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^(SCROLLED THIS FAR\?|CAME THIS FAR\?|LET.S WORK TOGETHER|LET.S TALK WORK)$/i.test(t) && el.children.length <= 3) {
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width < 1) continue;
        out.headings.push({ t, ...V(r), size: cs.fontSize, weight: cs.fontWeight, color: cs.color, lh: cs.lineHeight, family: cs.fontFamily.split(',')[0].replace(/"/g, '') });
      }
    }
    // contact pills
    for (const a of document.querySelectorAll('a,div')) {
      const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^(\+91 8869808079|utkarshv187@gmail.com|Connect)$/.test(t)) {
        const cs = getComputedStyle(a); const r = a.getBoundingClientRect(); if (r.width < 40 || r.height < 20 || r.height > 70) continue;
        out.pills.push({ t, ...V(r), bg: cs.backgroundColor, radius: cs.borderRadius, color: cs.color });
      }
    }
    // giant role words
    for (const el of document.querySelectorAll('h1,h2,h3,p,div,span')) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^(DESIGNER|STRATEGIST|RESEARCHER|STORYTELLER|COPY WRITER|ANIMATOR)$/.test(t)) {
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (parseInt(cs.fontSize) < 80) continue;
        out.roles.push({ t, ...V(r), size: cs.fontSize, color: cs.color, opacity: cs.opacity });
      }
    }
    // badge image
    const bimg = [...document.querySelectorAll('img')].find((im) => /jx8W2T5lbEY3/.test(im.currentSrc || im.src));
    if (bimg) { const r = bimg.getBoundingClientRect(); out.badge = { ...V(r), src: (bimg.currentSrc || bimg.src) }; }
    return out;
  });
}

const a = await snap(pageH - 900, 'bottom');
console.log('== HEADINGS ==', JSON.stringify(a.headings, null, 1));
console.log('== PILLS ==', JSON.stringify(a.pills, null, 1));
console.log('== BADGE ==', JSON.stringify(a.badge, null, 1));
console.log('== ROLES (y at bottom) ==', JSON.stringify(a.roles.map((r) => ({ t: r.t, y: r.y, size: r.size, color: r.color, op: r.opacity })), null, 1));
const a2 = await snap(pageH - 2400, 'up1500');
console.log('== ROLES (1500px up) ==', JSON.stringify(a2.roles.map((r) => ({ t: r.t, y: r.y })), null, 1));
console.log('   (compare role y to detect scroll-linked vertical movement)');
await b.close();
