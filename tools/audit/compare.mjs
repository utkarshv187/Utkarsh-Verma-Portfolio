// Screenshot the local build at given widths (DSF2) and stack it above the live reference.
// Usage: node audit/compare.mjs <label> <width> <liveRefPng> <cropH>
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'compare');
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const label = process.argv[2] || 'desktop';
const width = Number(process.argv[3] || 1440);
const liveRef = process.argv[4]; // path relative to out/hero
const cropH = Number(process.argv[5] || 0); // 0 = full viewport height

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width, height: width < 810 ? 844 : 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(1200);
const minePath = join(OUT, `mine_${label}.png`);
await p.screenshot({ path: minePath });
await b.close();

// Build side-by-side (mine on top, live below), cropped to cropH if given.
let mine = sharp(minePath);
let live = sharp(join(__dirname, 'out', 'hero', liveRef));
const mMeta = await mine.metadata();
const lMeta = await live.metadata();
const w = Math.min(mMeta.width, lMeta.width);
const h = cropH ? cropH * 2 : Math.min(mMeta.height, lMeta.height);
const mineBuf = await sharp(minePath).extract({ left: 0, top: 0, width: w, height: Math.min(h, mMeta.height) }).toBuffer();
const liveBuf = await sharp(join(__dirname, 'out', 'hero', liveRef)).extract({ left: 0, top: 0, width: w, height: Math.min(h, lMeta.height) }).toBuffer();
const gap = 20;
const mh = (await sharp(mineBuf).metadata()).height;
const lh = (await sharp(liveBuf).metadata()).height;
await sharp({ create: { width: w, height: mh + lh + gap, channels: 3, background: '#ff00ff' } })
  .composite([
    { input: mineBuf, top: 0, left: 0 },
    { input: liveBuf, top: mh + gap, left: 0 },
  ])
  .png()
  .toFile(join(OUT, `cmp_${label}.png`));
console.log('wrote', join(OUT, `cmp_${label}.png`), `(mine top ${mh}px, live bottom ${lh}px, w${w})`);
