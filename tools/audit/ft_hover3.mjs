import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/footer'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', deviceScaleFactor: 2 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
await p.waitForTimeout(500);
const pageH = await p.evaluate(() => document.body.scrollHeight);
// scroll so the pinned CTA pills sit in the lower viewport
await p.evaluate((y) => scrollTo(0, y), pageH - 2200); await p.waitForTimeout(900);
await p.evaluate(() => {
  for (const a of document.querySelectorAll('a')) {
    const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (/^\+91 8869808079$/.test(t)) a.setAttribute('data-h', 'phone');
    else if (/^utkarshv187@gmail\.com$/.test(t)) a.setAttribute('data-h', 'email');
    else if (/^Connect$/.test(t)) a.setAttribute('data-h', 'connect');
  }
});
const vis = await p.evaluate(() => ['phone', 'email', 'connect'].map((n) => { const a = document.querySelector(`[data-h="${n}"]`); const r = a && a.getBoundingClientRect(); return { n, y: r ? Math.round(r.top) : null, w: r ? Math.round(r.width) : null }; }));
console.log('pill viewport positions:', JSON.stringify(vis));

async function read(nm) {
  return await p.evaluate((nm) => {
    const a = document.querySelector(`[data-h="${nm}"]`); if (!a) return null;
    const acs = getComputedStyle(a);
    const span = [...a.querySelectorAll('*')].find((e) => e.children.length === 0 && /\d|@|Connect/.test(e.textContent)) || a;
    const scs = getComputedStyle(span);
    const aft = getComputedStyle(span, '::after');
    const icon = a.querySelector('svg,img');
    return {
      pillBg: acs.backgroundColor, pillTransform: acs.transform, pillShadow: acs.boxShadow.slice(0, 30),
      spanColor: scs.color, tdLine: scs.textDecorationLine, tdColor: scs.textDecorationColor, tdThick: scs.textDecorationThickness, spanTransform: scs.transform, bgImage: scs.backgroundImage.slice(0, 50), bgSize: scs.backgroundSize, bgPos: scs.backgroundPositionX,
      afterContent: aft.content, afterW: aft.width, afterH: aft.height, afterTransform: aft.transform, afterBg: aft.backgroundColor, afterOrigin: aft.transformOrigin,
      iconW: icon ? Math.round(icon.getBoundingClientRect().width) : null,
    };
  }, nm);
}

for (const nm of ['phone', 'email', 'connect']) {
  const inView = vis.find((v) => v.n === nm);
  if (!inView || inView.y == null || inView.y < 0 || inView.y > 880) { console.log(nm, 'not in view', JSON.stringify(inView)); continue; }
  const before = await read(nm);
  const box = await p.evaluate((nm) => { const r = document.querySelector(`[data-h="${nm}"]`).getBoundingClientRect(); return { x: Math.max(0, Math.round(r.left) - 12), y: Math.max(0, Math.round(r.top) - 16), w: Math.round(r.width) + 24, h: Math.round(r.height) + 34 }; }, nm);
  await p.hover(`[data-h="${nm}"]`);
  const frames = [];
  let last = 0;
  for (const ms of [50, 180, 400, 700]) { await p.waitForTimeout(ms - last); last = ms; frames.push({ ms, s: await read(nm) }); }
  console.log(`\n===== ${nm} =====`);
  console.log(' BEFORE:', JSON.stringify(before));
  for (const f of frames) console.log(`  t+${f.ms}:`, JSON.stringify(f.s));
  await p.mouse.move(30, 30); await p.waitForTimeout(400);
}
await b.close();
