import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });

async function measure(W) {
  const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2200);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } });
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(900);
  const d = await p.evaluate(() => {
    const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.02 && r.width > 0 && r.height > 0; };
    const V = (r) => ({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
    // CTA heading lines (Clash Display, big, in footer)
    const heads = [];
    for (const el of document.querySelectorAll('h1,h2,h3,p,div,span')) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^(SCROLLED|THIS FAR\?|CAME THIS|FAR\?|LET.S WORK|TOGETHER|LET.S TALK|LET.S|TALK|WORK|SCROLLED THIS FAR\?|CAME THIS FAR\?|LET.S WORK TOGETHER|LET.S TALK WORK)$/.test(t)) {
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (parseInt(cs.fontSize) < 60 || !vis(el)) continue;
        heads.push({ t, ...V(r), size: cs.fontSize, weight: cs.fontWeight, color: cs.color, lh: cs.lineHeight, ls: cs.letterSpacing, align: cs.textAlign });
      }
    }
    // pills
    const pills = [];
    for (const a of document.querySelectorAll('a')) {
      const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^(\+91 8869808079|utkarshv187@gmail.com|Connect)$/.test(t)) {
        const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
        const txtEl = [...a.querySelectorAll('*')].find((e) => /\d|@|Connect/.test(e.textContent) && e.children.length === 0);
        const icon = a.querySelector('svg,img');
        pills.push({ t, ...V(r), bg: cs.backgroundColor, radius: cs.borderRadius, padding: cs.padding, gap: cs.gap, textColor: txtEl ? getComputedStyle(txtEl).color : null, textSize: txtEl ? getComputedStyle(txtEl).fontSize : null, iconTag: icon ? icon.tagName : null, iconW: icon ? Math.round(icon.getBoundingClientRect().width) : null });
      }
    }
    // badge
    const bimg = [...document.querySelectorAll('img')].find((im) => /jx8W2T5lbEY3/.test(im.currentSrc || im.src));
    const badge = bimg ? { ...V(bimg.getBoundingClientRect()), fromRight: Math.round(innerWidth - bimg.getBoundingClientRect().right) } : null;
    // resume link in footer
    const resume = [...document.querySelectorAll('a')].filter((a) => /^R.sum.$/.test((a.textContent || '').trim())).map((a) => { const r = a.getBoundingClientRect(); return { ...V(r), href: a.getAttribute('href') }; }).filter((o) => o.y > 0);
    return { vw: innerWidth, heads, pills, badge, resume };
  });
  console.log(`\n##### ${W} (vw ${d.vw}) #####`);
  console.log(' HEADS:'); for (const h of d.heads) console.log(`   "${h.t}" ${h.size}/${h.weight} ${h.color} lh${h.lh} ls${h.ls} ${h.align} @(${h.x},${h.y}) ${h.w}x${h.h}`);
  console.log(' PILLS:'); for (const pl of d.pills) console.log(`   "${pl.t}" box(${pl.x},${pl.y}) ${pl.w}x${pl.h} bg${pl.bg} r${pl.radius} pad${pl.padding} gap${pl.gap} txt${pl.textColor}/${pl.textSize} icon${pl.iconTag}/${pl.iconW}`);
  console.log(' BADGE:', JSON.stringify(d.badge));
  console.log(' RESUME(footer):', JSON.stringify(d.resume));
  await p.close();
}
for (const W of [1440, 1280, 1200, 1024, 810, 390]) await measure(W);
await b.close();
