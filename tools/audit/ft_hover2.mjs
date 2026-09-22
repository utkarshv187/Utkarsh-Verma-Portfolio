import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/footer'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', deviceScaleFactor: 2 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(1000);

// build robust selectors for the 3 pills
const sel = await p.evaluate(() => {
  const map = {};
  for (const a of document.querySelectorAll('a')) {
    const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (/^\+91 8869808079$/.test(t)) { a.setAttribute('data-h', 'phone'); map.phone = 1; }
    else if (/^utkarshv187@gmail\.com$/.test(t)) { a.setAttribute('data-h', 'email'); map.email = 1; }
    else if (/^Connect$/.test(t)) { a.setAttribute('data-h', 'connect'); map.connect = 1; }
  }
  return map;
});
console.log('found pills:', JSON.stringify(sel));

function styleReader(name) {
  return (nm) => document.querySelector(`[data-h="${nm}"]`);
}

async function read(nm) {
  return await p.evaluate((nm) => {
    const a = document.querySelector(`[data-h="${nm}"]`); if (!a) return null;
    const acs = getComputedStyle(a);
    const txt = [...a.querySelectorAll('*')].find((e) => e.children.length === 0 && /\d|@|Connect/.test(e.textContent)) || a;
    const tcs = getComputedStyle(txt);
    const aft = getComputedStyle(txt, '::after'); const bef = getComputedStyle(txt, '::before');
    const icon = a.querySelector('svg,img'); const ics = icon ? getComputedStyle(icon) : null;
    return {
      pill: { bg: acs.backgroundColor, transform: acs.transform, scale: acs.scale, boxShadow: acs.boxShadow.slice(0, 40), padding: acs.padding },
      text: { color: tcs.color, tdLine: tcs.textDecorationLine, tdColor: tcs.textDecorationColor, tdThick: tcs.textDecorationThickness, bgImage: tcs.backgroundImage.slice(0, 60), bgSize: tcs.backgroundSize, transform: tcs.transform },
      after: { content: aft.content, w: aft.width, transform: aft.transform, bg: aft.backgroundColor, origin: aft.transformOrigin, height: aft.height },
      before: { content: bef.content, w: bef.width, transform: bef.transform, bg: bef.backgroundColor },
      icon: ics ? { transform: ics.transform, w: Math.round((icon.getBoundingClientRect().width)) } : null,
      cursorLabel: a.getAttribute('data-cursor-label'), cursorVariant: a.getAttribute('data-cursor-variant'),
    };
  }, nm);
}

for (const nm of ['phone', 'email', 'connect']) {
  const before = await read(nm);
  // screenshot before
  const box = await p.evaluate((nm) => { const a = document.querySelector(`[data-h="${nm}"]`); const r = a.getBoundingClientRect(); return { x: Math.round(r.left) - 10, y: Math.round(r.top) - 14, w: Math.round(r.width) + 20, h: Math.round(r.height) + 28 }; }, nm);
  await p.screenshot({ path: `${dir}/hov_${nm}_before.png`, clip: box });
  await p.hover(`[data-h="${nm}"]`);
  const t = [];
  for (const ms of [40, 150, 350, 650]) { await p.waitForTimeout(ms - (t.length ? [40, 150, 350, 650][t.length - 1] : 0)); t.push({ ms, s: await read(nm) }); }
  await p.screenshot({ path: `${dir}/hov_${nm}_after.png`, clip: box });
  console.log(`\n===== ${nm} =====`);
  console.log(' BEFORE:', JSON.stringify(before));
  for (const fr of t) console.log(`  t+${fr.ms}ms:`, JSON.stringify(fr.s));
  // move away to reset
  await p.mouse.move(50, 50); await p.waitForTimeout(400);
}
await b.close();
