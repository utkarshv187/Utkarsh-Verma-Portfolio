import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 's4');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });

async function run(url, tag, width) {
  const ctx = await b.newContext({ viewport: { width, height: width < 810 ? 844 : 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(1800);
  const H = width < 810 ? 844 : 900;
  const clip = { x: 0, y: 0, width, height: H };
  const away = width < 810 ? [3, H - 40] : [3, H - 40];
  await p.mouse.move(away[0], away[1]); await p.waitForTimeout(500);
  await p.screenshot({ path: join(OUT, `${tag}_default.png`), clip });

  if (width >= 810) {
    // O hover
    const o = await p.evaluate(() => {
      const mine = document.querySelector('.hero__o');
      if (mine) { const r = mine.getBoundingClientRect(); return { x: r.x + r.width * 0.30, y: r.y + r.height * 0.42 }; }
      const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('textPath') && s.getBoundingClientRect().width > 40);
      const r = svg.getBoundingClientRect(); return { x: r.x + r.width * 0.24, y: r.y + r.height * 0.48 };
    });
    await p.mouse.move(o.x, o.y); await p.waitForTimeout(950); await p.screenshot({ path: join(OUT, `${tag}_ohover.png`), clip });
    await p.mouse.move(away[0], away[1]); await p.waitForTimeout(500);
    // badge hover
    const g = await p.evaluate(() => {
      const mine = document.querySelector('.hero__graffiti');
      if (mine) { const r = mine.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }
      const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('eNT4Xgz'));
      const r = img.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await p.mouse.move(g.x, g.y); await p.waitForTimeout(1000); await p.screenshot({ path: join(OUT, `${tag}_badgehover.png`), clip });
    await p.mouse.move(away[0], away[1]); await p.waitForTimeout(400);
    // counter hover
    const c = await p.evaluate(() => {
      const t = document.querySelector('[role="timer"]');
      if (!t) return null; const r = t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (c) { await p.mouse.move(c.x, c.y); await p.waitForTimeout(800); await p.screenshot({ path: join(OUT, `${tag}_counter.png`), clip: { x: 0, y: 0, width: 560, height: 180 } }); await p.mouse.move(away[0], away[1]); await p.waitForTimeout(400); }
    // mid-scroll (skew)
    await p.evaluate(() => window.scrollTo(0, 400)); await p.waitForTimeout(500);
    await p.screenshot({ path: join(OUT, `${tag}_midscroll.png`), clip });
    await p.evaluate(() => window.scrollTo(0, 0));
  }
  await ctx.close();
}

await run('http://localhost:5199/', 'mine', 1440);
await run('https://uxuiuv.framer.website/', 'live', 1440);
await run('http://localhost:5199/', 'mineM', 390);
await run('https://uxuiuv.framer.website/', 'liveM', 390);
await b.close();

async function pair(m, l, out, w = 700) {
  try {
    const mb = await sharp(join(OUT, m)).resize(w).toBuffer();
    const lb = await sharp(join(OUT, l)).resize(w).toBuffer();
    const HH = Math.max((await sharp(mb).metadata()).height, (await sharp(lb).metadata()).height);
    await sharp({ create: { width: w * 2 + 20, height: HH, channels: 3, background: '#ff00ff' } })
      .composite([{ input: mb, left: 0, top: 0 }, { input: lb, left: w + 20, top: 0 }]).png().toFile(join(OUT, out));
    console.log('wrote', out);
  } catch (e) { console.log('skip', out, e.message); }
}
await pair('mine_default.png', 'live_default.png', 'cmp_default.png');
await pair('mine_ohover.png', 'live_ohover.png', 'cmp_ohover.png');
await pair('mine_badgehover.png', 'live_badgehover.png', 'cmp_badgehover.png');
await pair('mine_counter.png', 'live_counter.png', 'cmp_counter.png', 460);
await pair('mine_midscroll.png', 'live_midscroll.png', 'cmp_midscroll.png');
await pair('mineM_default.png', 'liveM_default.png', 'cmp_mobile.png', 380);
console.log('done');
