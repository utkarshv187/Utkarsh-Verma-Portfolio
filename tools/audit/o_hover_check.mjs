import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
await p.waitForTimeout(1500);
const g = await p.evaluate(() => { const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect(); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, x: r.x, w: r.width, h: r.height }; });
// hover the O counter (left side to avoid portrait)
await p.mouse.move(g.x + g.w * 0.3, g.cy);
await p.waitForTimeout(1000);
const S = 340;
await p.screenshot({ path: join(__dirname, 'out', 'hero', 'overify', 'mine_o_hover.png'), clip: { x: g.cx - S / 2, y: g.cy - S / 2 - 0.0165 * (g.h), width: S, height: S } });
await b.close();
console.log('wrote mine_o_hover.png');
