import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
// warm lazy render
const H = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < Math.min(H, 6000); y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);

const start = 800, end = 4200, step = 340;
const shots = [];
for (let y = start; y <= end; y += step) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(260);
  const buf = await p.screenshot();
  shots.push({ y, buf: await sharp(buf).resize(360).png().toBuffer() });
}
await b.close();
const cols = 5, cw = 360, ch = Math.round(360 * 900 / 1440), gap = 6;
const rows = Math.ceil(shots.length / cols);
const comp = [];
shots.forEach((s, i) => { const r = Math.floor(i / cols), c = i % cols; comp.push({ input: s.buf, left: gap + c * (cw + gap), top: gap + r * (ch + gap + 16) }); });
// labels
const svgLabels = shots.map((s, i) => { const r = Math.floor(i / cols), c = i % cols; return `<text x="${gap + c * (cw + gap) + 4}" y="${gap + r * (ch + gap + 16) + ch + 13}" font-size="12" fill="#fff" font-family="monospace">scrollY ${s.y}</text>`; }).join('');
const W = cols * cw + (cols + 1) * gap, HH = rows * (ch + gap + 16) + gap;
const label = Buffer.from(`<svg width="${W}" height="${HH}" xmlns="http://www.w3.org/2000/svg">${svgLabels}</svg>`);
await sharp({ create: { width: W, height: HH, channels: 3, background: '#000' } }).composite([...comp, { input: label, left: 0, top: 0 }]).png().toFile(join(OUT, 'we_scrollgrid.png'));
console.log('wrote we_scrollgrid.png', shots.length, 'frames', start, '->', end);
