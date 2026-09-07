// PURE-PIXEL diagnosis of MINE: in ONE crop (= the .hero__o box), detect the O counter centre
// (ring hidden) and the ring-text centre (ring shown). Same crop origin => unambiguous offset.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero', 'pixdiff');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const DSF = 3;
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DSF });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 30000 });
await p.waitForTimeout(1400); await p.mouse.move(3, 860); await p.waitForTimeout(200);

const box = await p.evaluate(() => {
  document.querySelectorAll('.hero__portrait,.hero__face,.hero__fade,.hero__aurora,.hero__accent,.hero__product,.hero__role-shift,.hero__roles-m,.hero__o-dot,.hero__graffiti').forEach((e) => (e.style.visibility = 'hidden'));
  const s = document.querySelector('.hero'); if (s) s.style.background = '#0c0c1f'; document.body.style.background = '#0c0c1f';
  const bs = document.querySelector('.badge__svg'); if (bs) { bs.style.animation = 'none'; bs.style.transform = 'rotate(0deg)'; }
  const o = document.querySelector('.hero__o'); const r = o.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2, fs: parseFloat(getComputedStyle(o).fontSize) };
});
const pad = 30;
const clip = { x: box.x - pad, y: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 };
const bufRing = await p.screenshot({ clip });
await sharp(bufRing).png().toFile(join(OUT, 'mine_ring.png'));
await p.evaluate(() => { const b = document.querySelector('.badge'); if (b) b.style.visibility = 'hidden'; });
await p.waitForTimeout(120);
const bufO = await p.screenshot({ clip });
await sharp(bufO).png().toFile(join(OUT, 'mine_oglyph.png'));
await b.close();

async function raw(buf) { const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true }); return { d: data, W: info.width, H: info.height, C: info.channels }; }
const A = await raw(bufO), B = await raw(bufRing);
const boxCx = (box.cx - clip.x) * DSF, boxCy = (box.cy - clip.y) * DSF; // box centre in crop px

// counter (image A): per-row dark run enclosed between the two light strokes
{
  const { d, W, H, C } = A;
  const lum = (x, y) => { const i = (y * W + x) * C; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
  const light = (x, y) => lum(x, y) > 120;
  let sx = 0, sy = 0, n = 0, minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
  for (let y = 0; y < H; y++) { let runs = [], inR = false, s = 0; for (let x = 0; x < W; x++) { const L = light(x, y); if (L && !inR) { inR = true; s = x; } else if (!L && inR) { inR = false; runs.push([s, x - 1]); } } if (inR) runs.push([s, W - 1]); if (runs.length < 2) continue; const le = runs[0][1], rs = runs[runs.length - 1][0]; if (rs - le < 8 || rs - le > W * 0.9) continue; for (let x = le + 1; x < rs; x++) if (!light(x, y)) { sx += x; sy += y; n++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; } }
  var counter = { cx: sx / n, cy: sy / n, rx: (maxX - minX) / 2, ry: (maxY - minY) / 2 };
}
// ring (image B): purple pixels centroid + extent
{
  const { d, W, H, C } = B;
  const isP = (x, y) => { const i = (y * W + x) * C; const r = d[i], g = d[i + 1], b2 = d[i + 2]; return Math.abs(r - 108) < 55 && Math.abs(g - 55) < 55 && Math.abs(b2 - 178) < 60 && b2 > r && r > g; };
  let sx = 0, sy = 0, n = 0, minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isP(x, y)) { sx += x; sy += y; n++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  var ring = { cx: sx / n, cy: sy / n, rx: (maxX - minX) / 2, ry: (maxY - minY) / 2, n };
}
const em = (v) => +(v / DSF / box.fs).toFixed(4);
console.log('box fs', box.fs);
console.log('COUNTER: centre off box =', { dx: em(counter.cx - boxCx), dy: em(counter.cy - boxCy) }, 'radius css', { rx: +(counter.rx / DSF).toFixed(1), ry: +(counter.ry / DSF).toFixed(1) });
console.log('RING   : centre off box =', { dx: em(ring.cx - boxCx), dy: em(ring.cy - boxCy) }, 'outer radius css', { rx: +(ring.rx / DSF).toFixed(1), ry: +(ring.ry / DSF).toFixed(1) }, 'isCircle', Math.abs(ring.rx - ring.ry) / DSF < 3);
console.log('RING vs COUNTER concentricity offset css =', { dx: +((ring.cx - counter.cx) / DSF).toFixed(1), dy: +((ring.cy - counter.cy) / DSF).toFixed(1) });
console.log('=> to make concentric, set --o-cx', em(counter.cx - boxCx), ' --o-cy', em(counter.cy - boxCy));
console.log('ring-outer / counter ratio', +(((ring.rx + ring.ry) / 2) / ((counter.rx + counter.ry) / 2)).toFixed(3));
