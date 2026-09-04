import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 's3');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });

async function cap(url, tag, width) {
  const ctx = await b.newContext({ viewport: { width, height: width < 810 ? 844 : 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(1800);
  const clip = { x: 0, y: 0, width, height: width < 810 ? 844 : 900 };
  await p.mouse.move(3, width < 810 ? 800 : 860); await p.waitForTimeout(500);
  await p.screenshot({ path: join(OUT, `${tag}_default.png`), clip });
  if (width >= 810) {
    // O hover
    const o = await p.evaluate(() => {
      const mine = document.querySelector('.hero__o');
      if (mine) { const r = mine.getBoundingClientRect(); return { x: r.x + r.width * 0.32, y: r.y + r.height * 0.42 }; }
      const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('textPath') && s.getBoundingClientRect().width > 40);
      if (svg) { const r = svg.getBoundingClientRect(); return { x: r.x + r.width * 0.22, y: r.y + r.height * 0.5 }; }
      return null;
    });
    if (o) { await p.mouse.move(o.x, o.y); await p.waitForTimeout(900); await p.screenshot({ path: join(OUT, `${tag}_ohover.png`), clip }); await p.mouse.move(3, 860); await p.waitForTimeout(500); }
    // badge (graffiti) hover
    const g = await p.evaluate(() => {
      const mine = document.querySelector('.hero__graffiti');
      if (mine) { const r = mine.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }
      const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('eNT4Xgz'));
      if (img) { const r = img.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }
      return null;
    });
    if (g) { await p.mouse.move(g.x, g.y); await p.waitForTimeout(1000); await p.screenshot({ path: join(OUT, `${tag}_badgehover.png`), clip }); }
  }
  await ctx.close();
}

await cap('http://localhost:5199/', 'mine', 1440);
await cap('https://uxuiuv.framer.website/', 'live', 1440);
await cap('http://localhost:5199/', 'mineM', 390);
await cap('https://uxuiuv.framer.website/', 'liveM', 390);
await b.close();

// assemble side-by-sides (mine left, live right)
async function pair(mineF, liveF, out, w = 700) {
  try {
    const m = await sharp(join(OUT, mineF)).resize(w).toBuffer();
    const l = await sharp(join(OUT, liveF)).resize(w).toBuffer();
    const H = Math.max((await sharp(m).metadata()).height, (await sharp(l).metadata()).height);
    await sharp({ create: { width: w * 2 + 20, height: H, channels: 3, background: '#ff00ff' } })
      .composite([{ input: m, left: 0, top: 0 }, { input: l, left: w + 20, top: 0 }]).png().toFile(join(OUT, out));
    console.log('wrote', out);
  } catch (e) { console.log('skip', out, e.message); }
}
await pair('mine_default.png', 'live_default.png', 'cmp_default.png');
await pair('mine_ohover.png', 'live_ohover.png', 'cmp_ohover.png');
await pair('mine_badgehover.png', 'live_badgehover.png', 'cmp_badgehover.png');
await pair('mineM_default.png', 'liveM_default.png', 'cmp_mobile.png', 380);
console.log('done');
