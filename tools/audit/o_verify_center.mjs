// Verify concentricity reliably: content via element rects, counter via per-row pixel. Same box frame.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const b = await chromium.launch({ headless: true });
const DSF = 3;
async function run(w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(1300); await p.mouse.move(3, 860); await p.waitForTimeout(200);
  // content element rects rel box centre
  const c = await p.evaluate(() => {
    const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect(); const bcy = r.y + r.height / 2; const fs = parseFloat(getComputedStyle(o).fontSize);
    const R = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return +((b.y + b.height / 2 - bcy) / fs).toFixed(4); };
    return { boxY: r.y, boxH: r.height, bcy, fs, badge: R('.badge'), fill: R('.hero__o-fill'), whatsapp: R('.hero__wa'), ripple: R('.hero__ripple'), dot: R('.hero__o-dot') };
  });
  // isolate O, detect counter cyRelBox
  await p.evaluate(() => { document.querySelectorAll('.hero__portrait,.hero__face,.hero__fade,.hero__aurora,.hero__accent,.hero__o-dot,.hero__wa-layer,.hero__product,.hero__role-shift,.hero__roles-m,.badge__svg').forEach((e) => (e.style.visibility = 'hidden')); const s = document.querySelector('.hero'); if (s) s.style.background = '#0c0c1f'; document.body.style.background = '#0c0c1f'; });
  await p.waitForTimeout(150);
  const pad = 30;
  const clip = { x: (await p.evaluate(() => document.querySelector('.hero__o').getBoundingClientRect().x)) - pad, y: c.boxY - pad, width: 0, height: 0 };
  const ob = await p.evaluate(() => { const r = document.querySelector('.hero__o').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const buf = await p.screenshot({ clip: { x: ob.x - pad, y: ob.y - pad, width: ob.w + pad * 2, height: ob.h + pad * 2 } });
  await ctx.close();
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const isLight = (x, y) => { const i = (y * W + x) * C; return (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) > 120; };
  let sy = 0, n = 0;
  for (let y = 0; y < H; y++) { let runs = [], inR = false, s = 0; for (let x = 0; x < W; x++) { const L = isLight(x, y); if (L && !inR) { inR = true; s = x; } else if (!L && inR) { inR = false; runs.push([s, x - 1]); } } if (inR) runs.push([s, W - 1]); if (runs.length < 2) continue; const le = runs[0][1], rs = runs[runs.length - 1][0]; if (rs - le < 8 || rs - le > W * 0.85) continue; for (let x = le + 1; x < rs; x++) if (!isLight(x, y)) { sy += y; n++; } }
  const counterCyPage = ob.y - pad + (sy / n) / DSF;
  const counterRelBox = +((counterCyPage - c.bcy) / c.fs).toFixed(4);
  return { w, counterRelBox, content: { badge: c.badge, fill: c.fill, whatsapp: c.whatsapp, ripple: c.ripple, dot: c.dot }, badgeMinusCounter_px: Math.round((c.badge - counterRelBox) * c.fs), whatsappMinusCounter_px: Math.round((c.whatsapp - counterRelBox) * c.fs) };
}
for (const w of [1440, 1280]) console.log(JSON.stringify(await run(w)));
await b.close();
