import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/footer'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });

async function audit(W) {
  const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 110)); } });
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(1000);

  const info = await p.evaluate(() => {
    const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.02 && r.width > 0 && r.height > 0; };
    // which of the target headings is visible
    const targets = ['SCROLLED THIS FAR?', 'LET’S WORK TOGETHER', "LET'S WORK TOGETHER", 'CAME THIS FAR?', 'LET’S TALK WORK', "LET'S TALK WORK"];
    const foundHeads = [];
    for (const el of document.querySelectorAll('h1,h2,h3,h4,p,span,div')) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (targets.some((tg) => t === tg) && el.children.length <= 1) { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); foundHeads.push({ text: t, visible: vis(el), fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily.split(',')[0].replace(/"/g, ''), color: cs.color, absY: Math.round(r.top + scrollY) }); }
    }
    // links in the footer region (bottom 1500px of page)
    const pageH = document.body.scrollHeight;
    const links = [...document.querySelectorAll('a')].map((a) => { const r = a.getBoundingClientRect(); return { a, r, absY: r.top + scrollY }; }).filter((o) => o.absY > pageH - 1500 && o.r.width > 0).map((o) => ({ text: (o.a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30), href: o.a.getAttribute('href'), target: o.a.getAttribute('target'), rel: o.a.getAttribute('rel'), absY: Math.round(o.absY) }));
    // footer images
    const imgs = [...document.querySelectorAll('img')].map((im) => { const r = im.getBoundingClientRect(); return { im, r, absY: r.top + scrollY }; }).filter((o) => o.absY > pageH - 1500 && o.r.width > 20).map((o) => ({ src: (o.im.currentSrc || o.im.src).split('/').pop(), w: Math.round(o.r.width), h: Math.round(o.r.height), absY: Math.round(o.absY) }));
    return { pageH, heads: foundHeads, links, imgs, vw: innerWidth };
  });
  console.log(`\n===== WIDTH ${W} (vw ${info.vw}, pageH ${info.pageH}) =====`);
  console.log('HEADINGS visible in footer:');
  for (const h of info.heads) if (h.visible) console.log(`   "${h.text}"  ${h.fontFamily} ${h.fontSize}/${h.fontWeight} ${h.color} @${h.absY}`);
  console.log('HEADINGS present-but-hidden:', info.heads.filter((h) => !h.visible).map((h) => h.text));
  console.log('LINKS:'); for (const l of info.links) console.log(`   "${l.text}" -> ${l.href} [target=${l.target} rel=${l.rel}]`);
  console.log('IMAGES:'); for (const im of info.imgs) console.log(`   ${im.src} ${im.w}x${im.h} @${im.absY}`);
  await p.close();
}
for (const W of [1920, 1440, 1280, 1024, 390]) await audit(W);
await b.close();
