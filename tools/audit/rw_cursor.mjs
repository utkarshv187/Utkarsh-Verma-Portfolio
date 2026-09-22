import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.5; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
// bring card1 into view (pinned)
const cardDocY = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); return Math.round(a.getBoundingClientRect().top + scrollY); });
await p.evaluate((y) => scrollTo(0, y - 132), cardDocY);
await p.waitForTimeout(800);
// find a point over the card (right side, over title) and move the mouse there
const pt = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp')); const r = a.getBoundingClientRect(); return { x: r.left + r.width * 0.75, y: r.top + r.height * 0.4 }; });
await p.mouse.move(pt.x - 40, pt.y - 30);
await p.mouse.move(pt.x, pt.y, { steps: 6 });
await p.waitForTimeout(600);

// find the cursor element: a fixed/absolute element (not a card) containing "See" or an arrow, near the pointer
const info = await p.evaluate((pt) => {
  const cands = [...document.querySelectorAll('div,span,p')].filter((e) => {
    const t = (e.textContent || '').trim();
    const cs = getComputedStyle(e);
    return /See|view|→|↗/i.test(t) && t.length < 12 && (cs.position === 'fixed' || cs.position === 'absolute');
  });
  const dump = (e) => {
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    // the pill is likely e or its parent — inspect e and parent
    const pill = e.closest('[style*="border-radius"],div');
    const pcs = pill ? getComputedStyle(pill) : cs;
    return {
      text: e.textContent.trim(),
      box: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      color: cs.color, fontFamily: cs.fontFamily.split(',')[0], fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      pill: { bg: pcs.backgroundColor, radius: pcs.borderRadius, padding: pcs.padding, w: Math.round((pill || e).getBoundingClientRect().width), h: Math.round((pill || e).getBoundingClientRect().height), backdrop: pcs.backdropFilter },
      html: (pill || e).outerHTML.slice(0, 400),
    };
  };
  return cands.map(dump);
}, pt);
writeFileSync(join(OUT, 'cursor.json'), JSON.stringify(info, null, 2));
console.log('cursor candidates:', JSON.stringify(info, null, 2));
// screenshot around the pointer to see the pill
await sharp(await p.screenshot({ clip: { x: Math.max(0, pt.x - 120), y: Math.max(0, pt.y - 80), width: 300, height: 200 } })).toFile(join(OUT, 'cursor_pill.png'));
console.log('wrote cursor_pill.png at pointer', JSON.stringify(pt));
await b.close();
