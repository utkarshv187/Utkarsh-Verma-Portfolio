import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/hob/mine2'; fs.mkdirSync(dir, { recursive: true });
const widths = [1920, 1440, 1280, 1024, 390];
const b = await chromium.launch({ headless: true });
const errs = [];
for (const W of widths) {
  const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  p.on('pageerror', (e) => errs.push(`[${W}] ${e.message.slice(0, 80)}`));
  await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(700);
  const y = await p.evaluate(() => { const el = document.querySelector('#not-designing'); return el ? el.getBoundingClientRect().top + scrollY : 0; });
  await p.evaluate((yy) => scrollTo(0, yy - 40), y);
  await p.waitForTimeout(700);
  const data = await p.evaluate(() => {
    const dec = (m) => { const mm = m.match(/matrix\(([^)]+)\)/); if (!mm) return { rot: 0, tx: 0, ty: 0 }; const [a, b2, , , e, f] = mm[1].split(',').map(parseFloat); return { rot: Math.round(Math.atan2(b2, a) * 180 / Math.PI), tx: Math.round(e), ty: Math.round(f) }; };
    return [...document.querySelectorAll('.hob__col')].map((col) => {
      const title = col.querySelector('.hob__title');
      const tr = title.getBoundingClientRect();
      const cards = [...col.querySelectorAll('.hob__card')].map((c) => { const r = c.getBoundingClientRect(); const img = c.querySelector('img'); return { left: r.left, right: r.right, z: +getComputedStyle(c).zIndex || 0, radius: img ? getComputedStyle(img).borderRadius : '?', ...dec(getComputedStyle(c).transform) }; });
      const left = Math.min(...cards.map((c) => c.left)), right = Math.max(...cards.map((c) => c.right));
      return { title: title.textContent, n: cards.length, titleCx: Math.round(tr.left + tr.width / 2), stackCx: Math.round((left + right) / 2), left: Math.round(left), right: Math.round(right), radii: [...new Set(cards.map((c) => c.radius))], rots: cards.map((c) => c.rot).sort((a, b2) => a - b2), txs: [...new Set(cards.map((c) => c.tx))] };
    });
  });
  console.log(`\n===== W=${W} =====`);
  for (const s of data) console.log(`  ${s.title.padEnd(12)} n=${s.n} titleCx=${s.titleCx} stackCx=${s.stackCx} (off ${s.stackCx - s.titleCx}) ext[${s.left}-${s.right}] rots=[${s.rots}] tx=${s.txs} r=${s.radii}`);
  for (let i = 0; i < data.length - 1; i++) { const gap = data[i + 1].left - data[i].right; if (Math.abs(data[i].titleCx - data[i + 1].titleCx) > 30) console.log(`  gap ${data[i].title}->${data[i + 1].title}: ${gap}px ${gap < 0 ? 'OVERLAP!!' : 'ok'}`); }
  await p.screenshot({ path: `${dir}/mine_${W}.png`, clip: { x: 0, y: 0, width: Math.min(W, 1440), height: 760 } });
  await p.close();
}
console.log('\nerrors:', errs.length, errs);
await b.close();
