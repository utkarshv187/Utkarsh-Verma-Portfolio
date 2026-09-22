import { chromium } from 'playwright';
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const P = join(R, 'public', 'images');

const map = {
  '6hgoOPOkPPU1z91CqG0uFEgSc': { name: 'tts-1', w: 750 },
  'pPe0FYYV2Bdo8NXv2liWKfjpbBc': { name: 'tts-2', w: 750 },
  'PhGm7gbV4OdzdWCFbVugcu087c': { name: 'tts-3', w: 750 },
  'XqTvKhL5G8EjG5fVvNDgpH3epI': { name: 'about-portrait', w: 1000 },
  'bO02xtM9JYcfcUiukjrM64': { name: 'about-icon-1', w: 200, png: true },
  'MsJmsUbL77zqRuIftz5yWcknMs': { name: 'about-icon-2', w: 200, png: true },
  '69xSoxgfU245sX3TCYLf6LDNpto': { name: 'about-icon-3', w: 200, png: true },
  '9DZGUTgcQ66z9GmmOI9T6hBzxec': { name: 'about-icon-4', w: 200, png: true },
  'xeOY7aHiTe9MkqvSXBIUfXQ9sDo': { name: 'about-icon-5', w: 200, png: true },
  'QBNU6EYsdg0GSdqyj6ADkpNIGoE': { name: 'about-icon-6', w: 200, png: true },
  '6NVvRZDf9rmhOUkfU4OjYz9sIw': { name: 'about-icon-7', w: 200, png: true },
  'C8TZ75OrneZlJaaR9iRpzf4pg': { name: 'about-icon-8', w: 200, png: true },
  'V7NT9mbL1lvcaixAtTJIYMmaTtQ': { name: 'about-icon-9', w: 200, png: true },
};
const ids = Object.keys(map);
const got = {};

const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on('response', async (res) => {
  const u = res.url();
  const id = ids.find((x) => u.includes(x) && !got[x]);
  if (!id) return;
  try { const body = await res.body(); if (body && body.length > 500) got[id] = body; } catch {}
});
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
// scroll slowly to trigger lazy loads of testimonials + icons + portrait
for (let y = 0; y < 8200; y += 300) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(120); }
await p.waitForTimeout(1500);
await b.close();

console.log('captured', Object.keys(got).length, 'of', ids.length);
for (const id of ids) {
  if (!got[id]) { console.log('MISSING', id, map[id].name); continue; }
  const { name, w, png } = map[id];
  const s = sharp(got[id]).resize({ width: w });
  await s.clone().webp({ quality: 92 }).toFile(join(P, name + '.webp'));
  await s.clone().avif({ quality: 74 }).toFile(join(P, name + '.avif'));
  if (png) await s.clone().png().toFile(join(P, name + '.png'));
  const m = await sharp(join(P, name + '.webp')).metadata();
  console.log(name, m.width + 'x' + m.height);
}
console.log('done');
