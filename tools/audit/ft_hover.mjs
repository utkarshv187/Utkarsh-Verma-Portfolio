import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
await p.waitForTimeout(500);
const pageH = await p.evaluate(() => document.body.scrollHeight);
// pin the CTA in view (footer top ~ pageH-8074, add ~500 so CTA is pinned & fully visible)
await p.evaluate((y) => scrollTo(0, y), pageH - 8074 + 400); await p.waitForTimeout(800);

// heading lines
const heads = await p.evaluate(() => {
  const V = (r) => ({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
  const out = [];
  for (const el of document.querySelectorAll('h1,h2,h3,p,div,span')) {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (/^(SCROLLED|THIS FAR\?|LET.S WORK|TOGETHER)$/.test(t)) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (parseInt(cs.fontSize) < 60) continue; out.push({ t, ...V(r), size: cs.fontSize, weight: cs.fontWeight, color: cs.color, lh: cs.lineHeight, ls: cs.letterSpacing, family: cs.fontFamily.split(',')[0].replace(/"/g, '') }); }
  }
  // CTA container: the parent holding both headings
  return out.sort((a, bb) => a.y - bb.y);
});
console.log('WIDE heading lines:'); for (const h of heads) console.log(`  "${h.t}" ${h.size}/${h.weight} ${h.color} lh${h.lh} ls${h.ls} @(${h.x},${h.y}) ${h.w}x${h.h}`);

// hover each pill: capture underline / bg / transform / cursor attrs before+after
async function hoverPill(re, name) {
  const box = await p.evaluate((reS) => { const re = new RegExp(reS); const a = [...document.querySelectorAll('a')].find((x) => re.test((x.textContent || '').replace(/\s+/g, ' ').trim())); if (!a) return null; const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, re);
  if (!box) { console.log(name, 'not found'); return; }
  const read = () => p.evaluate((reS) => { const re = new RegExp(reS); const a = [...document.querySelectorAll('a')].find((x) => re.test((x.textContent || '').replace(/\s+/g, ' ').trim())); const cs = getComputedStyle(a); const txt = [...a.querySelectorAll('*')].find((e) => e.children.length === 0 && /\d|@|Connect/.test(e.textContent)); const tcs = txt ? getComputedStyle(txt) : null; const aft = txt ? getComputedStyle(txt, '::after') : null; return { pillBg: cs.backgroundColor, pillTransform: cs.transform, scale: cs.scale, textDecoration: tcs ? tcs.textDecorationLine + ' ' + tcs.textDecorationColor : null, afterW: aft ? aft.width : null, afterTransform: aft ? aft.transform : null, cursorLabel: a.getAttribute('data-cursor-label'), cursorVariant: a.getAttribute('data-cursor-variant') }; }, re);
  const before = await read();
  await p.mouse.move(box.x - 300, box.y - 300); await p.waitForTimeout(200);
  await p.mouse.move(box.x, box.y); await p.waitForTimeout(600);
  const after = await read();
  console.log(`\n${name} BEFORE:`, JSON.stringify(before));
  console.log(`${name} HOVER :`, JSON.stringify(after));
}
await hoverPill('^\\+91 8869808079$', 'PHONE');
await hoverPill('^utkarshv187@gmail.com$', 'EMAIL');
await hoverPill('^Connect$', 'CONNECT');
await b.close();
