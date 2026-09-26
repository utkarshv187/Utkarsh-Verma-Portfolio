// Résumé beam: current (@property --beam-angle animation, repainted on the main thread every frame)
// vs a compositor candidate (same conic gradients on a ::before square rotated with transform, inside
// the same ring mask / glow blur). Freezes both at identical angles and diffs the pixels.
// usage: OUT=<dir> node tools/audit/beam_diff.mjs [url]
import { chromium } from 'playwright';
import sharp from 'sharp';
const PAGE = process.argv[2] || 'http://localhost:4199/';
const OUT = process.env.OUT || '.';
const CANDIDATE = `
.resume__beam, .resume__glow { background: none !important; animation: none !important; overflow: hidden; }
.resume__beam::before, .resume__glow::before {
  content: ''; position: absolute; left: 50%; top: 50%; width: 400px; height: 400px; margin: -200px 0 0 -200px;
  animation: beam-rot 2.6s linear infinite; will-change: transform;
}
.resume__beam::before { background: conic-gradient(from 0deg, transparent 0deg, transparent 250deg, #ffe29a 300deg, #ffb601 320deg, #ffe29a 340deg, transparent 360deg); }
.resume__glow::before { background: conic-gradient(from 0deg, transparent 220deg, rgba(255, 182, 1, 0.85) 310deg, transparent 360deg); }
@keyframes beam-rot { to { transform: rotate(360deg); } }`;
// freeze at an exact angle, statically (pausing an already-running animation doesn't reliably take a new delay)
const freezeCurrent = (deg) => `.resume__beam, .resume__glow { animation: none !important; --beam-angle: ${deg}deg !important; }`;
const freezeCandidate = (deg) => `.resume__beam::before, .resume__glow::before { animation: none !important; transform: rotate(${deg}deg) !important; }`;
const b = await chromium.launch({ args: ['--use-angle=d3d11'] });
const rows = [];
for (const dpr of [1, 2]) {
  for (const variant of ['current', 'candidate']) {
    const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr })).newPage();
    await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1200);
    const clip = await p.evaluate(() => { const r = document.querySelector('.header__nav--desktop .resume').getBoundingClientRect(); return { x: Math.floor(r.left) - 16, y: Math.floor(r.top) - 16, width: Math.ceil(r.width) + 32, height: Math.ceil(r.height) + 32 }; });
    await p.mouse.move(5, 895);
    const handle = await p.addStyleTag({ content: variant === 'candidate' ? CANDIDATE : '/* current */' });
    for (const deg of [0, 45, 137, 222, 300]) {
      const tag = await p.addStyleTag({ content: variant === 'candidate' ? freezeCandidate(deg) : freezeCurrent(deg) });
      await p.waitForTimeout(250);
      const buf = await p.screenshot({ clip });
      rows.push({ dpr, variant, deg, buf });
      await tag.evaluate((n) => n.remove());
    }
    void handle;
    await p.context().close();
  }
}
await b.close();
console.log('angle  dpr  max|Δ| (0-255)  mean|Δ|  pixels differing >8');
for (const r of rows.filter((x) => x.variant === 'current')) {
  const c = rows.find((x) => x.variant === 'candidate' && x.dpr === r.dpr && x.deg === r.deg);
  const A = await sharp(r.buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(c.buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let max = 0, sum = 0, big = 0; const n = Math.min(A.data.length, B.data.length);
  for (let i = 0; i < n; i++) { const d = Math.abs(A.data[i] - B.data[i]); max = Math.max(max, d); sum += d; if (d > 8) big++; }
  console.log(`${String(r.deg).padStart(4)}°  ${r.dpr}x   ${String(max).padStart(8)}      ${(sum / n).toFixed(2).padStart(5)}    ${(big / n * 100).toFixed(2)}%`);
  if (r.deg === 137) {
    const up = (buf) => sharp(buf).resize({ width: A.info.width * 4 / r.dpr, kernel: 'nearest' }).toBuffer();
    await sharp({ create: { width: A.info.width * 4 / r.dpr, height: (A.info.height * 4 / r.dpr) * 2 + 8, channels: 3, background: '#fff' } })
      .composite([{ input: await up(r.buf), top: 0, left: 0 }, { input: await up(c.buf), top: A.info.height * 4 / r.dpr + 8, left: 0 }]).png().toFile(`${OUT}/beam_${r.dpr}x.png`);
  }
}
