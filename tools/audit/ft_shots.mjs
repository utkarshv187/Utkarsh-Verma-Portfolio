import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/footer'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });

async function shot(W, H) {
  const p = await (await b.newContext({ viewport: { width: W, height: H }, reducedMotion: 'no-preference' })).newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(1000);
  // full-page footer screenshot: capture the bottom viewport
  await p.screenshot({ path: `${dir}/live_${W}.png` });
  // dump all visible text lines in the bottom region
  const txt = await p.evaluate(() => {
    const pageH = document.body.scrollHeight;
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; const seen = new Set();
    while ((n = walk.nextNode())) {
      const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > 60) continue;
      const el = n.parentElement; if (!el) continue;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (r.top + scrollY < pageH - 1400) continue;
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.03 || r.width < 1) continue;
      const key = t + '@' + Math.round(r.top + scrollY);
      if (seen.has(key)) continue; seen.add(key);
      out.push({ t, size: cs.fontSize, weight: cs.fontWeight, fam: cs.fontFamily.split(',')[0].replace(/"/g, ''), color: cs.color, y: Math.round(r.top + scrollY), x: Math.round(r.left) });
    }
    return out.sort((a, bb) => a.y - bb.y || a.x - bb.x);
  });
  console.log(`\n===== ${W} =====`);
  for (const l of txt) console.log(`  y${l.y} x${l.x} [${l.fam} ${l.size}/${l.weight} ${l.color}] "${l.t}"`);
  await p.close();
}
for (const W of [1440, 1024, 810, 390]) await shot(W, 900);
await b.close();
