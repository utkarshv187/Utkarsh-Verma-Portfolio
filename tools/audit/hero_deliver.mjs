import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'deliver');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });

async function shot(url, tag) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(1600);
  await p.mouse.move(3, 860); await p.waitForTimeout(400);
  await p.screenshot({ path: join(OUT, `${tag}_default.png`), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  // contact hover (nav) — crop the header right side
  const c = await p.evaluate(() => {
    const el = document.querySelector('.contact') || [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Contact');
    if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (c) { await p.mouse.move(c.x, c.y); await p.waitForTimeout(700); await p.screenshot({ path: join(OUT, `${tag}_contact.png`), clip: { x: 620, y: 0, width: 820, height: 90 } }); }
  await ctx.close();
}
await shot('http://localhost:5199/', 'mine');
await shot('https://uxuiuv.framer.website/', 'live');
await b.close();

async function pair(m, l, out, w = 700) {
  const mb = await sharp(join(OUT, m)).resize(w).toBuffer();
  const lb = await sharp(join(OUT, l)).resize(w).toBuffer();
  const H = Math.max((await sharp(mb).metadata()).height, (await sharp(lb).metadata()).height);
  await sharp({ create: { width: w * 2 + 20, height: H, channels: 3, background: '#ff00ff' } })
    .composite([{ input: mb, left: 0, top: 0 }, { input: lb, left: w + 20, top: 0 }]).png().toFile(join(OUT, out));
  console.log('wrote', out);
}
await pair('mine_default.png', 'live_default.png', 'cmp_default.png');
await pair('mine_contact.png', 'live_contact.png', 'cmp_contact.png', 760);
console.log('done');
