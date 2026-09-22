import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/footer'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', deviceScaleFactor: 2 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
await p.waitForTimeout(500);
const pageH = await p.evaluate(() => document.body.scrollHeight);
await p.evaluate((y) => scrollTo(0, y), pageH - 2200); await p.waitForTimeout(900);

const items = [
  { n: 'phone', txt: '+91 8869808079' },
  { n: 'email', txt: 'utkarshv187@gmail.com' },
  { n: 'connect', txt: 'Connect' },
];
for (const it of items) {
  const loc = p.locator('a', { hasText: it.txt }).first();
  const box = await loc.boundingBox();
  if (!box) { console.log(it.n, 'no box'); continue; }
  const clip = { x: Math.max(0, box.x - 14), y: Math.max(0, box.y - 18), width: box.width + 28, height: box.height + 40 };
  await p.mouse.move(30, 30); await p.waitForTimeout(300);
  await p.screenshot({ path: `${dir}/H_${it.n}_before.png`, clip });
  await loc.hover(); await p.waitForTimeout(650);
  await p.screenshot({ path: `${dir}/H_${it.n}_after.png`, clip });
  console.log(it.n, 'shot', JSON.stringify(clip.width && clip.height ? 'ok' : 'bad'));
}
await b.close();
