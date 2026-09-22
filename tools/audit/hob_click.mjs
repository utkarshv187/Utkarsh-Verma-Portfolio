import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });

// snapshot of full-screen overlays present
const overlays = () => p.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('div')) {
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    if (cs.position !== 'fixed') continue;
    if (r.width < innerWidth * 0.7 || r.height < innerHeight * 0.7) continue;
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) continue;
    out.push({ w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, blur: cs.backdropFilter, z: cs.zIndex, imgs: e.querySelectorAll('img').length });
  }
  return out;
});

// click a PHOTOGRAPHING grid image
await p.evaluate(() => scrollTo(0, 8700)); await p.waitForTimeout(500);
const g = await p.evaluate(() => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes('fam52Jvb')); const r = im.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), inView: r.top > 0 && r.bottom < 900 }; });
console.log('grid img center', JSON.stringify(g), 'overlays before:', JSON.stringify(await overlays()));
await p.mouse.click(g.x, g.y);
await p.waitForTimeout(800);
console.log('overlays AFTER clicking grid image:', JSON.stringify(await overlays()));
// close (esc) then test a stack photo
await p.keyboard.press('Escape'); await p.waitForTimeout(500);

await p.evaluate(() => scrollTo(0, 7600)); await p.waitForTimeout(500);
const s = await p.evaluate(() => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes('RgYfjJ')); const r = im.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
await p.mouse.click(s.x, s.y);
await p.waitForTimeout(800);
console.log('overlays AFTER clicking stack photo:', JSON.stringify(await overlays()));
await b.close();
