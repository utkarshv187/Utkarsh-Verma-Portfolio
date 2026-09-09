import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);
const styles = () => p.evaluate(() => {
  const g = (sel) => { const e = document.querySelector(sel); if (!e) return null; const cs = getComputedStyle(e); return { inlineTransform: e.style.transform || '(none)', inlineTranslate: e.style.translate || '(none)', compTransform: cs.transform, compTranslate: cs.translate, willChange: cs.willChange }; };
  return { product: g('.hero__product'), role: g('.hero__role-shift') };
});
await p.evaluate(() => window.scrollTo(0, 800)); await p.waitForTimeout(200);
console.log('=== @scroll 800 ===');
console.log(JSON.stringify(await styles(), null, 1));
// pixel test: leftmost bright pixel on the PRODUCT row
async function leftEdge(y, rowY) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(180);
  const buf = await p.screenshot({ clip: { x: 0, y: rowY, width: 720, height: 8 } });
  const sharp = (await import('sharp')).default;
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  for (let x = 0; x < info.width; x++) { const i = (0 * info.width + x) * info.channels; if (data[i] > 180 && data[i + 1] > 180 && data[i + 2] > 180) return x; }
  return -1;
}
// PRODUCT row ~ y 300 in viewport (pinned). find a good rowY by sampling
const pL0 = await leftEdge(0, 320);
const pL800 = await leftEdge(800, 320);
console.log('PRODUCT left-edge px @scroll0:', pL0, ' @scroll800:', pL800, ' shift:', pL800 - pL0);
await b.close();
