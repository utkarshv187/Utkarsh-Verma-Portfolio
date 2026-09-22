import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/footer'; fs.mkdirSync(dir, { recursive: true });
const W = Number(process.argv[2] || 1440);
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
await p.waitForTimeout(600);
const pageH = await p.evaluate(() => document.body.scrollHeight);
// footer likely starts ~ pageH - 3000; capture frames from there to bottom
const start = Math.max(0, pageH - 900 - 2600);
let i = 0;
for (let y = start; y <= pageH - 900 + 10; y += 760) {
  const yy = Math.min(y, pageH - 900);
  await p.evaluate((v) => scrollTo(0, v), yy); await p.waitForTimeout(700);
  await p.screenshot({ path: `${dir}/frame_${W}_${String(i).padStart(2, '0')}_y${Math.round(yy)}.png` });
  i++;
}
console.log('captured', i, 'frames at', W, 'pageH', pageH);
await b.close();
