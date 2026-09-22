import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hob');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0, 90)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1200);
const y = await p.evaluate(() => document.querySelector('#not-designing').getBoundingClientRect().top + scrollY);
console.log('hobbies docY', Math.round(y), 'errors', errs.length, errs.slice(0, 3));
// warm images
await p.evaluate(async () => { const t = document.querySelector('#not-designing').getBoundingClientRect().top + scrollY; for (let d = 0; d < 2600; d += 300) { scrollTo(0, t + d - 100); await new Promise(r => setTimeout(r, 120)); } });
// intro + stacks
await p.evaluate((yy) => scrollTo(0, yy - 40), y);
await p.waitForTimeout(500);
await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } })).resize(560).toFile(join(OUT, 'mine_stacks.png'));
// & photographing + grid
await p.evaluate((yy) => scrollTo(0, yy + 560), y);
await p.waitForTimeout(500);
await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } })).resize(560).toFile(join(OUT, 'mine_grid.png'));
console.log('wrote mine_stacks + mine_grid');
await b.close();
