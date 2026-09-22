import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/hob/live2'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });
await p.waitForTimeout(500);

// locate GAMING title Y
const gy = await p.evaluate(() => {
  const all = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')];
  let best = null; for (const el of all) { if ((el.textContent || '').trim() === 'GAMING') { if (!best || el.getBoundingClientRect().width < best.getBoundingClientRect().width) best = el; } }
  return best ? best.getBoundingClientRect().top + scrollY : null;
});
console.log('GAMING title absY', gy, 'scrollHeight', await p.evaluate(() => document.body.scrollHeight));

// section container height + sticky?
const info = await p.evaluate((gy) => {
  const all = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')];
  let g = null; for (const el of all) { if ((el.textContent || '').trim() === 'GAMING') { if (!g || el.getBoundingClientRect().width < g.getBoundingClientRect().width) g = el; } }
  // climb up to find a tall ancestor (the section)
  let n = g, chain = [];
  for (let k = 0; k < 12 && n; k++) { const r = n.getBoundingClientRect(); const cs = getComputedStyle(n); chain.push({ tag: n.tagName, h: Math.round(r.height), pos: cs.position, top: cs.top }); n = n.parentElement; }
  return chain;
}, gy);
console.log('ancestor chain of GAMING:', JSON.stringify(info, null, 1));

// step scroll through the stack region and screenshot the top band (where stacks sit)
const start = gy - 500;
for (let i = 0; i <= 6; i++) {
  const y = Math.round(start + i * 90);
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(450);
  await p.screenshot({ path: `${dir}/scan_${i}_y${y}.png`, clip: { x: 0, y: 0, width: 1440, height: 720 } });
}
console.log('saved scan frames to', dir);
await b.close();
