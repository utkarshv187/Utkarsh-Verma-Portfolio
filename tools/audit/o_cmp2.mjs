// Mine vs live overlay, centred on the COUNTER (robust, phase-independent).
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'ocmp');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const DSF = 3, CROP = 260;

// detect counter centre (page px) by per-row dark-run on a tight isolated crop
async function counterCentre(p, oc, fs) {
  const g = fs * 0.72;
  const clip = { x: oc.x - g / 2, y: oc.y - g * 0.62, width: g, height: g * 1.24 };
  const buf = await p.screenshot({ clip });
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const lum = (x, y) => { const i = (y * W + x) * C; return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };
  const light = (x, y) => lum(x, y) > 120;
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < H; y++) { let runs = [], inR = false, s = 0; for (let x = 0; x < W; x++) { const L = light(x, y); if (L && !inR) { inR = true; s = x; } else if (!L && inR) { inR = false; runs.push([s, x - 1]); } } if (inR) runs.push([s, W - 1]); if (runs.length < 2) continue; const le = runs[0][1], rs = runs[runs.length - 1][0]; if (rs - le < 8 || rs - le > W * 0.9) continue; for (let x = le + 1; x < rs; x++) if (!light(x, y)) { sx += x; sy += y; n++; } }
  return { x: clip.x + (sx / n) / DSF, y: clip.y + (sy / n) / DSF };
}

async function grab(url) {
  const isMine = url.includes('localhost');
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
  await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(2200); await p.mouse.move(3, 860); await p.waitForTimeout(200);
  const oc = await p.evaluate((mine) => {
    document.querySelectorAll('img,canvas,video,picture').forEach((e) => { if (e.getBoundingClientRect().height > 120) e.style.visibility = 'hidden'; });
    const s = document.querySelector('.hero'); if (s) s.style.background = '#0c0c1f'; document.body.style.background = '#0c0c1f';
    if (mine) { const bs = document.querySelector('.badge__svg'); if (bs) { bs.style.animation = 'none'; bs.style.transform = 'rotate(0deg)'; } }
    const o = document.querySelector('.hero__o') || [...document.querySelectorAll('span,div,p,h1,a')].find((e) => e.children.length === 0 && e.textContent.trim() === 'O');
    const r = o.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, fs: parseFloat(getComputedStyle(o).fontSize) };
  }, isMine);
  await p.waitForTimeout(120);
  // hide the ring to detect the counter cleanly
  await p.evaluate((mine) => {
    if (mine) { const bd = document.querySelector('.badge'); if (bd) bd.style.visibility = 'hidden'; }
    else { const svg = [...document.querySelectorAll('svg')].find((s) => { const t = s.querySelector('textPath'); return t && /TOGETHER/i.test(t.textContent); }); if (svg) svg.style.visibility = 'hidden'; }
  }, isMine);
  await p.waitForTimeout(120);
  const cc = await counterCentre(p, oc, oc.fs);
  // show ring again, screenshot real O centred on counter
  await p.evaluate((mine) => {
    if (mine) { const bd = document.querySelector('.badge'); if (bd) bd.style.visibility = 'visible'; }
    else { const svg = [...document.querySelectorAll('svg')].find((s) => { const t = s.querySelector('textPath'); return t && /TOGETHER/i.test(t.textContent); }); if (svg) svg.style.visibility = 'visible'; }
  }, isMine);
  await p.waitForTimeout(120);
  const buf = await p.screenshot({ clip: { x: cc.x - CROP / 2, y: cc.y - CROP / 2, width: CROP, height: CROP } });
  await ctx.close();
  return buf;
}

const mine = await grab('http://localhost:5199/');
const live = await grab('https://uxuiuv.framer.website/');
await b.close();
const px = CROP * DSF;
await sharp({ create: { width: px * 2 + 20, height: px, channels: 3, background: '#111' } })
  .composite([{ input: mine, left: 0, top: 0 }, { input: live, left: px + 20, top: 0 }]).png().toFile(join(OUT, 'sbs_counter.png'));
const mineTint = await sharp(mine).ensureAlpha().tint({ r: 255, g: 40, b: 40 }).composite([{ input: Buffer.from([255, 255, 255, 130]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' }]).toBuffer();
await sharp(live).composite([{ input: mineTint, blend: 'over' }]).png().toFile(join(OUT, 'overlay_counter.png'));
console.log('wrote sbs_counter.png + overlay_counter.png (counter-centred)');
