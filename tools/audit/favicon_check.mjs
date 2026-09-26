// Theme-adaptive favicon check: renders /favicon.svg under light + dark color schemes in each
// Playwright engine and samples the mark's pixel colour (expect dark ~#0E0C20 on light, white on
// dark); also logs which icon files each engine requests for the page itself.
// usage: node tools/audit/favicon_check.mjs [origin]
import { chromium, firefox, webkit } from 'playwright';
const ORIGIN = process.argv[2] || 'http://localhost:5199';
for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  let b;
  try { b = await type.launch(); } catch (e) { console.log(name.padEnd(9), 'not installed'); continue; }
  const out = [];
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ colorScheme: scheme, viewport: { width: 400, height: 300 } });
    const p = await ctx.newPage();
    const icons = [];
    p.on('request', (r) => { if (/favicon|apple-touch/.test(r.url())) icons.push(new URL(r.url()).pathname); });
    await p.goto(ORIGIN + '/', { waitUntil: 'load' });
    await p.waitForTimeout(800);
    // render the SVG as an image (it follows the embedding page's scheme) and sample the mark:
    // (13%, 35%) of the square lands inside the U's left bar
    const px = await p.evaluate(async (src) => {
      const img = new Image(); img.src = src + '?v=' + Math.random(); await img.decode();
      const c = document.createElement('canvas'); c.width = c.height = 200;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, 200, 200);
      const d = g.getImageData(Math.round(200 * 0.07), Math.round(200 * 0.4), 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('') + ` a${d[3]}`;
    }, ORIGIN + '/favicon.svg').catch((e) => 'err ' + e.message);
    out.push(`${scheme}: mark ${px}  icons requested: ${[...new Set(icons)].join(', ') || '(none)'}`);
    await ctx.close();
  }
  console.log(name.padEnd(9), out.join('   |   '));
  await b.close();
}
