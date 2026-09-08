import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1320 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
await p.waitForTimeout(1200);
for (let y = 0; y < 3200; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
// frame like the live capture: section top ~53px above viewport top
const secTop = await p.evaluate(() => Math.round(document.querySelector('.we').getBoundingClientRect().y + window.scrollY));
await p.evaluate((y) => window.scrollTo(0, y), secTop + 53);
await p.waitForTimeout(2000); // let the count-up settle
await p.screenshot({ path: join(OUT, 'mine_settled.png') });
await b.close();
// side-by-side with live's settled capture (we_desktop_full.png)
const w = 700;
const mb = await sharp(join(OUT, 'mine_settled.png')).resize(w).toBuffer();
const lb = await sharp(join(OUT, 'we_desktop_full.png')).resize(w).toBuffer();
const h = Math.max((await sharp(mb).metadata()).height, (await sharp(lb).metadata()).height);
await sharp({ create: { width: w * 2 + 16, height: h, channels: 3, background: '#222' } })
  .composite([{ input: mb, left: 0, top: 0 }, { input: lb, left: w + 16, top: 0 }]).png().toFile(join(OUT, 'cmp_settled.png'));
console.log('wrote cmp_settled.png (mine settled | live settled)');
