import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'interactions', 'compare');
const LIVE = join(__dirname, 'out', 'interactions', 'full');
await mkdir(OUT, { recursive: true });

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:5199/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);
const clip = { x: 0, y: 0, width: 1440, height: 92 };

async function center(sel) { return page.evaluate((s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel); }
async function away() { await page.mouse.move(3, 400); await page.waitForTimeout(500); }
async function shot(n) { await page.screenshot({ path: join(OUT, `mine_${n}.png`), clip }); }

await away(); await shot('default');
let c = await center('.nav-link'); if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(700); await shot('hover_about'); }
await away(); c = await center('.contact'); if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(800); await shot('hover_contact'); }
await away(); c = await center('.intro'); if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(700); await shot('hover_counter'); }
await away(); c = await center('.header__nav--desktop .resume'); if (c) { await page.mouse.move(c.x, c.y); await page.waitForTimeout(700); await shot('hover_resume'); }
await b.close();

// stack mine (top) + live (bottom) per state
for (const st of ['default', 'hover_about', 'hover_contact', 'hover_counter', 'hover_resume']) {
  try {
    const mine = await sharp(join(OUT, `mine_${st}.png`)).toBuffer();
    const live = await sharp(join(LIVE, `${st}.png`)).toBuffer();
    const mM = await sharp(mine).metadata(); const lM = await sharp(live).metadata();
    const W = Math.max(mM.width, lM.width); const gap = 16;
    await sharp({ create: { width: W, height: mM.height + lM.height + gap, channels: 3, background: '#ff00ff' } })
      .composite([{ input: mine, top: 0, left: 0 }, { input: live, top: mM.height + gap, left: 0 }])
      .png().toFile(join(OUT, `cmp_${st}.png`));
    console.log('cmp_' + st + '.png');
  } catch (e) { console.log('skip', st, e.message); }
}
