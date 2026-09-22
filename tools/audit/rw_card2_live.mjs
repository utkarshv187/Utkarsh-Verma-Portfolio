import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
// warm lazy content
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.7) { scrollTo(0, y); await new Promise(r => setTimeout(r, 180)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });

// locate the gamification card by its heading text
const cardInfo = await p.evaluate(() => {
  const nodes = [...document.querySelectorAll('*')];
  const h = nodes.find((n) => /tier based gamification/i.test(n.textContent || '') && n.children.length < 3);
  if (!h) return null;
  // climb to the card container (a big rounded box)
  let el = h;
  for (let i = 0; i < 12 && el.parentElement; i++) { el = el.parentElement; const r = el.getBoundingClientRect(); if (r.width > 900 && r.height > 400) break; }
  const r = el.getBoundingClientRect();
  return { top: r.top + scrollY, height: r.height };
});
console.log('card2 container:', JSON.stringify(cardInfo));
if (!cardInfo) { await b.close(); process.exit(0); }

const decompose = (t) => { if (!t || t === 'none') return { rot: 0, sx: 1, tx: 0, ty: 0 }; const m = t.match(/matrix\(([^)]+)\)/); if (!m) return { rot: 0 }; const [a, bb, c, d, e, f] = m[1].split(',').map(parseFloat); return { rot: +(Math.atan2(bb, a) * 180 / Math.PI).toFixed(2), sx: +Math.hypot(a, bb).toFixed(3), tx: Math.round(e), ty: Math.round(f) }; };

// step scroll through the card's window and log the two media images' rotation/position
console.log('\nrelScroll | images (rot° size@pos tx,ty)');
for (let rel = -400; rel <= 1200; rel += 100) {
  const y = cardInfo.top + rel;
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(160);
  const imgs = await p.evaluate(() => {
    // find imgs whose center is in the LEFT half of the gamification card
    const nodes = [...document.querySelectorAll('*')];
    const h = nodes.find((n) => /tier based gamification/i.test(n.textContent || '') && n.children.length < 3);
    let card = h; for (let i = 0; i < 12 && card.parentElement; i++) { card = card.parentElement; const r = card.getBoundingClientRect(); if (r.width > 900 && r.height > 400) break; }
    const cr = card.getBoundingClientRect();
    const out = [];
    for (const im of card.querySelectorAll('img')) {
      const r = im.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      if (cx > cr.left + cr.width * 0.5) continue; // left half only
      if (r.width < 40 || r.height < 40) continue;
      // walk up to find the transformed wrapper (framer wraps images)
      let node = im, tf = 'none', tw = 0, th = 0, radius = '';
      for (let k = 0; k < 5 && node; k++) { const cs = getComputedStyle(node); if (cs.transform && cs.transform !== 'none') { tf = cs.transform; const rr = node.getBoundingClientRect(); tw = Math.round(rr.width); th = Math.round(rr.height); radius = getComputedStyle(im).borderRadius; break; } node = node.parentElement; }
      out.push({ w: Math.round(r.width), h: Math.round(r.height), tf, tw, th, br: getComputedStyle(im).borderRadius });
    }
    return out;
  });
  const desc = imgs.map((o) => { const d = decompose(o.tf); return `[${o.w}x${o.h} rot=${d.rot} tx=${d.tx} ty=${d.ty} br=${o.br}]`; }).join('  ');
  console.log(String(rel).padStart(5), '|', desc || '(none)');
}
await b.close();
