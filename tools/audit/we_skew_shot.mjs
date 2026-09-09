import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(900);
async function shot(startY, delta) {
  await p.evaluate((y) => window.scrollTo(0, y), startY); await p.waitForTimeout(700);
  await p.evaluate((d) => window.scrollBy(0, d), delta);
  await p.waitForTimeout(210); // near peak skew
  return await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 560 } });
}
const down = await shot(100, 560); // -> scroll 660, hero still visible (pinned), DOWN skew
const up = await shot(660, -560); // -> scroll 100, UP skew
const w = Math.round(1440 * 0.5);
const d = await sharp(down).resize(w).toBuffer();
const u = await sharp(up).resize(w).toBuffer();
const h = (await sharp(d).metadata()).height;
await sharp({ create: { width: w, height: h * 2 + 8, channels: 3, background: '#222' } })
  .composite([{ input: d, left: 0, top: 0 }, { input: u, left: 0, top: h + 8 }]).png().toFile(join(OUT, 'skew_dir.png'));
console.log('wrote skew_dir.png (top: scrolling DOWN -16deg | bottom: scrolling UP +16deg)');
await b.close();
