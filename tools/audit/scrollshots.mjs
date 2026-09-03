// Viewport screenshots down the page at a given width (works with pinned sections).
// Usage: node audit/scrollshots.mjs <width> <label>
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const width = Number(process.argv[2] || 1440);
const label = process.argv[3] || String(width);
const OUT = join(__dirname, 'out', 'scroll_' + label);
const SITE = 'https://uxuiuv.framer.website/';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
await page.goto(SITE, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(1500);

// warm-scroll to load lazy content
await page.evaluate(async () => {
  const max = document.body.scrollHeight;
  for (let y = 0; y < max; y += window.innerHeight) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); }
  window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 500));
});

const max = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
const vh = 900;
let i = 0;
for (let y = 0; y <= max; y += vh) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(700);
  const label2 = String(i).padStart(2, '0');
  await page.screenshot({ path: join(OUT, `s${label2}_y${y}.png`) });
  i++;
}
console.log('captured', i, 'viewport shots up to y', max, 'in', OUT);
await browser.close();
