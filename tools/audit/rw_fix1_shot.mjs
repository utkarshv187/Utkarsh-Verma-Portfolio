import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1000);

// measure a stat box height (should be 101px desktop) + padding
const m = await p.evaluate(() => {
  const s = document.querySelector('.rw-card--auction .rw-stat');
  const cs = getComputedStyle(s);
  const r = s.getBoundingClientRect();
  return { h: Math.round(r.height), padT: cs.paddingTop, padB: cs.paddingBottom, padL: cs.paddingLeft, padR: cs.paddingRight };
});
console.log('stat box:', JSON.stringify(m));

// full card 1 (stats padding) and card 2 (fan) screenshots
async function shot(key, file, dyFromPin, topPin) {
  const pin = await p.evaluate((k) => { const c = document.querySelector('.rw-card--' + k); return c.getBoundingClientRect().top + scrollY; }, key);
  const cur = await p.evaluate(() => scrollY); const target = pin - topPin + dyFromPin;
  for (let i = 1; i <= 20; i++) { await p.evaluate((y) => window.scrollTo(0, y), cur + (target - cur) * i / 20); await p.waitForTimeout(16); }
  await p.waitForTimeout(300);
  await sharp(await p.screenshot({ clip: { x: 118, y: topPin - 6, width: 1204, height: 632 } })).resize(760).toFile(join(OUT, file));
}
await shot('auction', 'final_card1.png', 60, 132);
await shot('gamification', 'final_card2.png', 300, 146);
console.log('wrote final_card1.png, final_card2.png');
await b.close();
