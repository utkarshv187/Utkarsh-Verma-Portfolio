// Final: mine's O-hover cropped on the counter — clean (portrait hidden) + real (portrait shown),
// with guide cross at the counter centre to show icon/fill/ripple are centred.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'ohover');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const DSF = 3;
async function cap(hidePortrait, name) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(1300);
  const g = await p.evaluate((hide) => {
    const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect(); const fs = parseFloat(getComputedStyle(o).fontSize);
    if (hide) document.querySelectorAll('.hero__portrait,.hero__face,.hero__fade,.hero__aurora,.hero__accent').forEach((e) => (e.style.visibility = 'hidden'));
    if (hide) { const s = document.querySelector('.hero'); if (s) s.style.background = '#0c0c1f'; }
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 - 0.0165 * fs, fs }; // counter centre
  }, hidePortrait);
  // hover the O (portrait pointer-events:none, so counter hover triggers)
  for (let i = 0; i < 6; i++) { await p.mouse.move(g.cx - 40 + i * 7, g.cy); await p.waitForTimeout(30); }
  await p.mouse.move(g.cx, g.cy); await p.waitForTimeout(900);
  const S = 260; const px = S * DSF; const c = px / 2;
  const buf = await p.screenshot({ clip: { x: g.cx - S / 2, y: g.cy - S / 2, width: S, height: S } });
  const guide = Buffer.from(`<svg width="${px}" height="${px}" xmlns="http://www.w3.org/2000/svg"><line x1="${c}" y1="${c - 16}" x2="${c}" y2="${c + 16}" stroke="#ffd400" stroke-width="2"/><line x1="${c - 16}" y1="${c}" x2="${c + 16}" y2="${c}" stroke="#ffd400" stroke-width="2"/></svg>`);
  await sharp(buf).composite([{ input: guide }]).png().toFile(join(OUT, name));
  await ctx.close();
}
await cap(true, 'mine_hover_clean.png');
await cap(false, 'mine_hover_real.png');
await b.close();
console.log('wrote mine_hover_clean.png + mine_hover_real.png (yellow cross = counter centre)');
