import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 80)); });
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 80)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1200);
const secTop = await p.evaluate(() => document.querySelector('#recent-work').getBoundingClientRect().top + scrollY);
const pinTop = await p.evaluate(() => { const c = document.querySelector('.rw-card--gamification'); return c.getBoundingClientRect().top + scrollY; });
console.log('errors during load:', errs.length, errs.slice(0, 4));

const scrollTo = async (target) => { const cur = await p.evaluate(() => scrollY); for (let i = 1; i <= 18; i++) { await p.evaluate((y) => window.scrollTo(0, y), cur + (target - cur) * i / 18); await p.waitForTimeout(16); } await p.waitForTimeout(180); };
const rot = (t) => { if (!t || t === 'none') return 0; const m = t.match(/matrix\(([^)]+)\)/); if (!m) return 0; const [a, bb] = m[1].split(',').map(parseFloat); return +(Math.atan2(bb, a) * 180 / Math.PI).toFixed(1); };
const measure = () => p.evaluate(() => { const a = document.querySelector('.rw-gamify__a'), b2 = document.querySelector('.rw-gamify__b'); return { a: a && getComputedStyle(a).transform, b: b2 && getComputedStyle(b2).transform }; });

// card 2 pins ~ pinTop-146. Sample across its fan window
console.log('\ndy(fromPin) | smallerRot biggerRot');
for (let d = -720; d <= 40; d += 120) {
  await scrollTo(pinTop - 146 + d);
  const m = await measure();
  console.log(String(d).padStart(5), '|', String(rot(m.a)).padStart(6), String(rot(m.b)).padStart(7));
}

// screenshots: stacked (early) vs fanned (pinned)
await scrollTo(pinTop - 146 - 640); await p.waitForTimeout(150);
await sharp(await p.screenshot({ clip: { x: 60, y: 120, width: 620, height: 620 } })).resize(360).toFile(join(OUT, 'v_c2_stacked.png'));
await scrollTo(pinTop - 146 - 40); await p.waitForTimeout(150);
await sharp(await p.screenshot({ clip: { x: 60, y: 120, width: 620, height: 620 } })).resize(360).toFile(join(OUT, 'v_c2_fanned.png'));
console.log('\nwrote v_c2_stacked.png + v_c2_fanned.png; total errors:', errs.length);
await b.close();
