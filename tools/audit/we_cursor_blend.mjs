import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1800);

// crisp crop centred on the cursor after it settles
async function shot(file, cx, cy, w = 150, h = 96) {
  await p.mouse.move(cx, cy, { steps: 8 });
  await p.waitForTimeout(280); // spring settle
  const clip = { x: Math.max(0, cx - w / 2), y: Math.max(0, cy - h / 2), width: w, height: h };
  const buf = await p.screenshot({ clip });
  await sharp(buf).toFile(join(OUT, file));
  return buf;
}

const crops = [];
const label = [];

// 1) "That's me" pill over the graffiti (hero) — hovering also lifts the badge + card
const g = await p.evaluate(() => { const r = document.querySelector('.hero__graffiti').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
crops.push(await shot('cb_thatsme.png', g.x, g.y, 170, 110)); label.push('"Thats me" pill / hero+card');

// 2) DOT over pure dark navy (top-right of hero, above portrait)
crops.push(await shot('cb_dark.png', 1250, 120)); label.push('dot / dark navy');

// 3) DOT over the white PRODUCT glyph
const pr = await p.evaluate(() => { const r = document.querySelector('.hero__product').getBoundingClientRect(); return { x: r.x + 60, y: r.y + r.height * 0.5 }; });
crops.push(await shot('cb_white.png', pr.x, pr.y)); label.push('dot / white PRODUCT text');

// reveal + hover the Spinny bento: enter the WE section, then move to the image
await p.evaluate(() => { const we = document.querySelector('.we'); window.scrollTo(0, we.getBoundingClientRect().top + window.scrollY - 40); });
await p.waitForTimeout(400);
const we = await p.evaluate(() => { const r = document.querySelector('.we__heading').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await p.mouse.move(we.x, we.y, { steps: 6 }); // triggers the latch
await p.waitForTimeout(700); // reveal expands

// 4) "Highlights / at Spinny" pill over a LIGHT bento card
const imgLight = await p.evaluate(() => { const r = document.querySelector('.we__reveal-img').getBoundingClientRect(); return { x: r.x + r.width * 0.12, y: r.y + r.height * 0.22, top: r.top, h: r.height }; });
crops.push(await shot('cb_spinny_light.png', imgLight.x, imgLight.y, 190, 120)); label.push('"Highlights/at Spinny" / light card');

// 5) same pill over a DARK navy area of the bento
const imgDark = await p.evaluate(() => { const r = document.querySelector('.we__reveal-img').getBoundingClientRect(); return { x: r.x + r.width * 0.5, y: r.y + r.height * 0.5 }; });
crops.push(await shot('cb_spinny_dark.png', imgDark.x, imgDark.y, 190, 120)); label.push('"Highlights/at Spinny" / dark navy');

// 6) DOT over the yellow WE background (below the image, plain yellow band)
const yellow = await p.evaluate(() => { const r = document.querySelector('.we__subtitle').getBoundingClientRect(); return { x: r.x + r.width + 40, y: r.y }; });
crops.push(await shot('cb_yellow.png', Math.min(1400, yellow.x), yellow.y)); label.push('dot / yellow WE bg');

console.log('captured:', label.join('  |  '));

// montage (2 cols x 3 rows), scaled up 1.6x with labels
const scale = 1.6;
const items = [];
for (let i = 0; i < crops.length; i++) {
  const meta = await sharp(crops[i]).metadata();
  const W = Math.round(meta.width * scale), H = Math.round(meta.height * scale);
  const img = await sharp(crops[i]).resize(W, H).toBuffer();
  const strip = Buffer.from(`<svg width="${W}" height="22"><rect width="100%" height="100%" fill="#111"/><text x="6" y="15" font-family="monospace" font-size="12" fill="#fff">${label[i]}</text></svg>`);
  const cell = await sharp({ create: { width: W, height: H + 22, channels: 3, background: '#111' } })
    .composite([{ input: strip, top: 0, left: 0 }, { input: img, top: 22, left: 0 }]).png().toBuffer();
  items.push({ buf: cell, w: W, h: H + 22 });
}
const cols = 2, gap = 8;
const colW = Math.max(...items.map((it) => it.w));
const rowHs = [];
for (let r = 0; r < Math.ceil(items.length / cols); r++) rowHs.push(Math.max(...items.slice(r * cols, r * cols + cols).map((it) => it.h)));
const totalW = colW * cols + gap * (cols + 1);
const totalH = rowHs.reduce((a, h) => a + h, 0) + gap * (rowHs.length + 1);
const comp = [];
let y = gap;
for (let r = 0; r < rowHs.length; r++) { let x = gap; for (let c = 0; c < cols; c++) { const it = items[r * cols + c]; if (it) comp.push({ input: it.buf, left: x, top: y }); x += colW + gap; } y += rowHs[r] + gap; }
await sharp({ create: { width: totalW, height: totalH, channels: 3, background: '#000' } }).composite(comp).png().toFile(join(OUT, 'cursor_blend.png'));
console.log('wrote cursor_blend.png');
await b.close();
