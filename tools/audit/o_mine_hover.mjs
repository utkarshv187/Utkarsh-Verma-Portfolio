// Capture + measure MINE's O hover: whatsapp size/centre, fill presence/opacity, all vs ring centre.
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
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
await p.waitForTimeout(1400);
const geo = await p.evaluate(() => {
  const svg = document.querySelector('.badge__svg'); const path = svg.querySelector('path');
  const m = path.getScreenCTM(); const P = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const q = pt.matrixTransform(m); return { x: q.x, y: q.y }; };
  const c = P(50, 50); const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect();
  return { ringCx: c.x, ringCy: c.y, oFS: parseFloat(getComputedStyle(o).fontSize) };
});
// hover the O counter (portrait is pointer-events:none, so this triggers .hero__o:hover)
for (let i = 0; i < 6; i++) { await p.mouse.move(geo.ringCx - 30 + i * 5, geo.ringCy); await p.waitForTimeout(30); }
await p.mouse.move(geo.ringCx, geo.ringCy); await p.waitForTimeout(900);

const meas = await p.evaluate((ring) => {
  const R = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return { w: Math.round(r.width), h: Math.round(r.height), dx: +(r.x + r.width / 2 - ring.x).toFixed(1), dy: +(r.y + r.height / 2 - ring.y).toFixed(1), pos: c.position, ocy: c.getPropertyValue('--o-cy'), fs: c.fontSize }; };
  return { waLayer: R('.hero__wa-layer'), fill: R('.hero__o-fill'), oWa: R('.hero__o-wa'), whatsapp: R('.hero__wa'), ripple: R('.hero__ripple'), oFS: ring.oFS };
}, { x: geo.ringCx, y: geo.ringCy, oFS: geo.oFS });

const S = 300;
await p.screenshot({ clip: { x: geo.ringCx - S / 2, y: geo.ringCy - S / 2, width: S, height: S }, path: join(OUT, 'mine_hover.png') });
await b.close();
console.log('MINE hover:', JSON.stringify(meas, null, 2));
console.log('whatsapp size vs O:', (meas.whatsapp.w / meas.oFS).toFixed(3), 'em (live 0.184)  | fill opacity:', meas.fill.op, '(want 1)');
console.log('whatsapp offset from ring centre dx,dy:', meas.whatsapp.dx, meas.whatsapp.dy, '(want ~0,0)');
