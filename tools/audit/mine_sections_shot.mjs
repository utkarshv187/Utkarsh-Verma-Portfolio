import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'about');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 100)));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1000);

const secY = (sel) => p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
async function shot(y, name, h = 820) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(900); await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: h } })).resize(720).toFile(join(OUT, name)); }

const ttsY = await secY('#things-they-say');
const aboutY = await secY('#more-about-me');
console.log('tts docY', ttsY, 'about docY', aboutY);
await shot(ttsY - 60, 'mine_tts.png');
await shot(aboutY - 40, 'mine_about_top.png');
await shot(aboutY + 240, 'mine_about_bio.png');
// icon grid
await p.evaluate((y) => scrollTo(0, y), aboutY + 640);
await p.waitForTimeout(900);
await sharp(await p.screenshot({ clip: { x: 0, y: 300, width: 1440, height: 400 } })).resize(720).toFile(join(OUT, 'mine_about_grid.png'));

console.log('errors:', errs.length); errs.slice(0, 8).forEach((e) => console.log('  ', e));
await b.close();
console.log('done');
