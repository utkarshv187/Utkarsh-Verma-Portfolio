import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
const b = await chromium.launch({ headless: true });

async function shot(w, isMobile, name, delay) {
  const ctx = await b.newContext({ viewport: { width: w, height: isMobile ? 780 : 900 }, deviceScaleFactor: isMobile ? 2 : 1, isMobile, hasTouch: isMobile });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(600);
  // find the stats block top
  const statsTop = await p.evaluate(() => { const s = document.querySelector('.we__stats'); return s ? Math.round(s.getBoundingClientRect().y + window.scrollY) : 1500; });
  // park above so nothing has triggered
  await p.evaluate((y) => window.scrollTo(0, Math.max(0, y - 1400)), statsTop);
  await p.waitForTimeout(300);
  // scroll so stats are ~65% down the viewport -> crosses the 0.4 threshold, count-up starts
  await p.evaluate((y) => window.scrollTo(0, y - (window.innerHeight * 0.62)), statsTop);
  await p.waitForTimeout(delay); // catch mid-scramble
  const buf = await p.screenshot({ fullPage: false });
  await ctx.close();
  const fp = join(OUT, name);
  const fs = await import('node:fs');
  fs.writeFileSync(fp, buf);
  console.log('wrote', name);
}
// desktop mid-scramble (cards visible, values scrambling)
await shot(1440, false, 'mine_midscramble_desktop.png', 380);
// mobile mid-scramble
await shot(390, true, 'mine_midscramble_mobile.png', 380);
await b.close();
