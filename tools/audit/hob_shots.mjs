import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hob');
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 180)); } });

// real headings (font-size > 28)
const heads = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const want = ['DESIGNING', 'GAMING', 'SOCIALIZING', 'ADVENTURING', 'PHOTOGRAPHING'];
  const out = [];
  for (const n of document.querySelectorAll('h1,h2,h3,h4,div,p,span')) {
    const t = norm(n.textContent);
    if (t.length > 40) continue;
    const fs = parseFloat(getComputedStyle(n).fontSize);
    if (fs < 28) continue;
    if (!want.some((w) => t.toUpperCase().includes(w))) continue;
    const r = n.getBoundingClientRect();
    if (r.width < 20) continue;
    out.push({ t, docY: Math.round(r.top + scrollY), x: Math.round(r.left), fs: Math.round(fs), color: getComputedStyle(n).color });
  }
  return out.sort((a, b) => a.docY - b.docY || a.x - b.x);
});
console.log('REAL headings:'); for (const h of heads) console.log('  ', JSON.stringify(h));

// screenshots every 500px from 7600 to 12500
for (let y = 7600; y <= 12600; y += 500) {
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(400);
  await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } })).resize(560).toFile(join(OUT, `scan_${y}.png`));
}
console.log('wrote scan screenshots 7600..12600');
await b.close();
