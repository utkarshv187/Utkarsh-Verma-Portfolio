// Exact header internals: geometry + styles of logo, designing-for block, nav items, buttons,
// plus the scroll-progress bar. Desktop + phone.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero');
const SITE = 'https://uxuiuv.framer.website/';
const b = await chromium.launch({ headless: true });

async function run(width, label) {
  const ctx = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(SITE, { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2000);
  const data = await p.evaluate(() => {
    const nav = [...document.querySelectorAll('[data-framer-name="navbar"]')].find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.top < 200;
    });
    if (!nav) return { error: 'no visible navbar' };
    const navR = nav.getBoundingClientRect();
    const navCs = getComputedStyle(nav);
    // walk visible descendants with text or that are img/button/link
    const items = [];
    for (const el of nav.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const t = (el.childElementCount === 0 ? el.textContent.trim() : '');
      const isImg = el.tagName === 'IMG';
      const isLink = el.tagName === 'A';
      const cs = getComputedStyle(el);
      const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
      const hasBorder = cs.borderTopWidth !== '0px';
      if (t || isImg || isLink || hasBg || hasBorder) {
        items.push({
          tag: el.tagName, name: el.getAttribute('data-framer-name') || '',
          text: t.slice(0, 30), imgSrc: isImg ? el.src.split('/').pop().split('?')[0] : '',
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
          fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: t ? cs.color : '',
          bg: hasBg ? cs.backgroundColor : '', bgImage: cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 60) : '',
          border: hasBorder ? `${cs.borderTopWidth} ${cs.borderTopColor}` : '',
          radius: cs.borderTopLeftRadius, padding: cs.padding, boxShadow: cs.boxShadow.slice(0, 60),
        });
      }
    }
    return {
      nav: { x: Math.round(navR.x), y: Math.round(navR.y), w: Math.round(navR.width), h: Math.round(navR.height),
        bg: navCs.backgroundColor, backdrop: navCs.backdropFilter, transform: navCs.transform, position: navCs.position, padding: navCs.padding },
      items,
    };
  });
  await writeFile(join(OUT, `header_${label}.json`), JSON.stringify(data, null, 2));
  console.log(`\n=== ${label} (vw ${width}) nav`, JSON.stringify(data.nav));
  for (const it of (data.items || [])) {
    console.log(`  ${(it.name||it.tag).padEnd(14)} ${JSON.stringify(it.text||it.imgSrc).padEnd(24)} x${it.x} y${it.y} w${it.w} h${it.h} fs=${it.fontSize} ${it.color} bg=${it.bg} bd=${it.border} r=${it.radius}`);
  }
  await ctx.close();
}
await run(1440, 'desktop');
await run(390, 'phone');
await b.close();
