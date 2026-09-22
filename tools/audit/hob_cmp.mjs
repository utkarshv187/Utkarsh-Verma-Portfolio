import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hob');
const b = await chromium.launch({ headless: true });

async function cap(url, isLive, stacksFile, gridFile) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto(url, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(isLive ? 2500 : 1000);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });
  // find the intro heading docY
  const y = await p.evaluate(() => { const norm = (s) => (s || '').replace(/\s+/g, ' ').trim(); const h = [...document.querySelectorAll('h1,h2,div,p')].find((n) => /NOT DESIGNING/i.test(norm(n.textContent)) && parseFloat(getComputedStyle(n).fontSize) > 28); return h.getBoundingClientRect().top + scrollY; });
  // stacks: intro at viewport ~40
  await p.evaluate((yy) => scrollTo(0, yy - 40), y);
  await p.waitForTimeout(500);
  await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 780 } })).resize(560).toFile(join(OUT, stacksFile));
  // grid: find PHOTOGRAPHING and scroll it near top
  const py = await p.evaluate(() => { const norm = (s) => (s || '').replace(/\s+/g, ' ').trim(); const h = [...document.querySelectorAll('h1,h2,h3,div,p')].filter((n) => /PHOTOGRAPHING/i.test(norm(n.textContent)) && norm(n.textContent).length < 20 && parseFloat(getComputedStyle(n).fontSize) > 40).sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height)[0]; return h ? Math.round(h.getBoundingClientRect().top + scrollY) : null; });
  if (py) { await p.evaluate((yy) => scrollTo(0, yy - 60), py); await p.waitForTimeout(500); await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 780 } })).resize(560).toFile(join(OUT, gridFile)); }
  await p.close();
}
await cap('https://uxuiuv.framer.website/', true, 'cmp_live_stacks.png', 'cmp_live_grid.png');
await cap('http://localhost:5199/', false, 'cmp_mine_stacks.png', 'cmp_mine_grid.png');

import { existsSync } from 'node:fs';
for (const [l, m, out, title] of [['cmp_live_stacks.png', 'cmp_mine_stacks.png', 'cmp_stacks.png', 'STACKS'], ['cmp_live_grid.png', 'cmp_mine_grid.png', 'cmp_grid.png', 'GRID']]) {
  if (!existsSync(join(OUT, l)) || !existsSync(join(OUT, m))) { console.log('skip', out, '(missing input)'); continue; }
  const L = await sharp(join(OUT, l)).toBuffer(); const M = await sharp(join(OUT, m)).toBuffer();
  const h = (await sharp(L).metadata()).height;
  await sharp({ create: { width: 560 * 2 + 8, height: h + 22, channels: 3, background: '#111' } }).composite([
    { input: Buffer.from(`<svg width="1128" height="20"><rect width="100%" height="100%" fill="#111"/><text x="6" y="15" font-family="monospace" font-size="12" fill="#fff">${title}  LIVE (left)  vs  MINE (right)</text></svg>`), top: 0, left: 0 },
    { input: L, top: 22, left: 0 }, { input: M, top: 22, left: 568 },
  ]).png().toFile(join(OUT, out));
  console.log('wrote', out);
}
await b.close();
