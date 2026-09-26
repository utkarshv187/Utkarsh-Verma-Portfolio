// Résumé beam: pixel diff between the OLD beam (animated --beam-angle custom property, repainted on
// the main thread every frame) and the NEW one (conic gradients on ::before squares spun with
// transform on the compositor). Serve the two builds side by side and pass both URLs.
// Both are frozen at identical angles, statically: old via --beam-angle, new via rotate().
// usage: OUT=<dir> node tools/audit/beam_diff.mjs <oldUrl> <newUrl>
import { chromium } from 'playwright';
import sharp from 'sharp';
const [OLD, NEW] = process.argv.slice(2);
const OUT = process.env.OUT || '.';
const freezeOld = (deg) => `.resume__beam, .resume__glow { animation: none !important; --beam-angle: ${deg}deg !important; }`;
const freezeNew = (deg) => `.resume__beam::before, .resume__glow::before { animation: none !important; transform: rotate(${deg}deg) !important; }`;
const ANGLES = [0, 45, 90, 137, 180, 222, 270, 300];
const b = await chromium.launch({ args: ['--use-angle=d3d11'] });
const shots = {};
for (const dpr of [1, 2]) {
  for (const [variant, url, freeze] of [['old', OLD, freezeOld], ['new', NEW, freezeNew]]) {
    for (const [where, vp, sel] of [['desktop', { width: 1440, height: 900 }, '.header__nav--desktop .resume'], ['mobile', { width: 390, height: 844 }, '.resume--mobile']]) {
      const p = await (await b.newContext({ viewport: vp, deviceScaleFactor: dpr })).newPage();
      await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1200);
      const clip = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.floor(r.left) - 16, y: Math.floor(r.top) - 16, width: Math.ceil(r.width) + 32, height: Math.ceil(r.height) + 32 }; }, sel);
      await p.mouse.move(5, vp.height - 5);
      for (const deg of ANGLES) {
        const tag = await p.addStyleTag({ content: freeze(deg) });
        await p.waitForTimeout(200);
        shots[`${dpr}|${where}|${deg}|${variant}`] = await p.screenshot({ clip });
        await tag.evaluate((n) => n.remove());
      }
      await p.context().close();
    }
  }
}
await b.close();
console.log('where    angle  dpr  max|Δ| (0-255)  mean|Δ|  pixels differing >8');
let worst = { max: 0, mean: 0, big: 0 };
for (const key of Object.keys(shots).filter((k) => k.endsWith('|old'))) {
  const [dpr, where, deg] = key.split('|');
  const A = await sharp(shots[key]).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(shots[`${dpr}|${where}|${deg}|new`]).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let max = 0, sum = 0, big = 0; const n = Math.min(A.data.length, B.data.length);
  for (let i = 0; i < n; i++) { const d = Math.abs(A.data[i] - B.data[i]); max = Math.max(max, d); sum += d; if (d > 8) big++; }
  worst = { max: Math.max(worst.max, max), mean: Math.max(worst.mean, sum / n), big: Math.max(worst.big, big / n * 100) };
  console.log(`${where.padEnd(8)} ${String(deg).padStart(4)}°  ${dpr}x   ${String(max).padStart(8)}      ${(sum / n).toFixed(2).padStart(5)}    ${(big / n * 100).toFixed(2)}%`);
  if (deg === '137' && where === 'desktop') {
    const w = A.info.width * 4 / Number(dpr), h = A.info.height * 4 / Number(dpr);
    const up = (buf) => sharp(buf).resize({ width: w, kernel: 'nearest' }).toBuffer();
    await sharp({ create: { width: w, height: h * 2 + 8, channels: 3, background: '#fff' } })
      .composite([{ input: await up(shots[key]), top: 0, left: 0 }, { input: await up(shots[`${dpr}|${where}|${deg}|new`]), top: h + 8, left: 0 }]).png().toFile(`${OUT}/beam_${dpr}x.png`);
  }
}
console.log(`WORST CASE: max ${worst.max}/255, mean ${worst.mean.toFixed(2)}/255, pixels >8: ${worst.big.toFixed(2)}%`);
