// Mine vs live: capture each O (ring visible, portrait hidden, solid bg), centre the crop on the
// ring's purple centroid (= counter centre since both are concentric), same CSS size + scale.
// Output side-by-side + overlay (mine tinted red over live), for desktop and mobile.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'ocmp');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const DSF = 3;
const CROP = 260; // css

async function grabO(url, mobile) {
  const ctx = await b.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200);
  await p.mouse.move(3, 700); await p.waitForTimeout(200);
  const box = await p.evaluate((isMine) => {
    document.querySelectorAll('img,canvas,video,picture').forEach((e) => { if (e.getBoundingClientRect().height > 120) e.style.visibility = 'hidden'; });
    const s = document.querySelector('.hero') || document.body; s.style.background = '#0c0c1f'; document.body.style.background = '#0c0c1f';
    if (isMine) { const bs = document.querySelector('.badge__svg'); if (bs) { bs.style.animation = 'none'; bs.style.transform = 'rotate(0deg)'; } }
    // O element: mine has .hero__o; both have the glyph span "O"
    const o = document.querySelector('.hero__o') || [...document.querySelectorAll('span,div,p,h1,a')].find((e) => e.children.length === 0 && e.textContent.trim() === 'O');
    const r = o.getBoundingClientRect();
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  }, url.includes('localhost'));
  await p.waitForTimeout(150);
  // generous crop, then locate purple ring centroid, then sub-crop centred there
  const G = 360;
  const gclip = { x: box.cx - G / 2, y: box.cy - G / 2, width: G, height: G };
  const gbuf = await p.screenshot({ clip: gclip });
  await ctx.close();
  const { data, info } = await sharp(gbuf).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const isP = (x, y) => { const i = (y * W + x) * C; const r = data[i], g = data[i + 1], b2 = data[i + 2]; return Math.abs(r - 108) < 60 && Math.abs(g - 55) < 60 && Math.abs(b2 - 178) < 65 && b2 > r && r > g; };
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isP(x, y)) { sx += x; sy += y; n++; }
  const ccx = n ? sx / n : W / 2, ccy = n ? sy / n : H / 2; // ring centroid in gbuf px
  // sub-crop CROP css (×DSF) centred on centroid
  const half = (CROP * DSF) / 2;
  const left = Math.round(ccx - half), top = Math.round(ccy - half);
  const sub = await sharp(gbuf).extract({ left: Math.max(0, left), top: Math.max(0, top), width: CROP * DSF, height: CROP * DSF }).toBuffer();
  return sub;
}

for (const mobile of [false, true]) {
  const mine = await grabO('http://localhost:5199/', mobile);
  const live = await grabO('https://uxuiuv.framer.website/', mobile);
  const px = CROP * DSF;
  const tag = mobile ? 'mobile' : 'desktop';
  await sharp({ create: { width: px * 2 + 20, height: px, channels: 3, background: '#111' } })
    .composite([{ input: mine, left: 0, top: 0 }, { input: live, left: px + 20, top: 0 }]).png().toFile(join(OUT, `sbs_${tag}.png`));
  if (!mobile) {
    const mineTint = await sharp(mine).ensureAlpha().tint({ r: 255, g: 40, b: 40 }).composite([{ input: Buffer.from([255, 255, 255, 130]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' }]).toBuffer();
    await sharp(live).composite([{ input: mineTint, blend: 'over' }]).png().toFile(join(OUT, 'overlay_desktop.png'));
  }
  console.log('wrote', tag);
}
await b.close();
console.log('done');
