import { chromium } from 'playwright';
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const P = join(R, 'public', 'images');
const base = 'https://framerusercontent.com/images/';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext();

async function grab(url) { const res = await ctx.request.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }); if (!res.ok()) throw new Error(url + ' ' + res.status()); return Buffer.from(await res.body()); }
async function out(buf, name, w, png = false) {
  const s = sharp(buf).resize({ width: w });
  await s.clone().webp({ quality: 92 }).toFile(join(P, name + '.webp'));
  await s.clone().avif({ quality: 74 }).toFile(join(P, name + '.avif'));
  if (png) await s.clone().png().toFile(join(P, name + '.png'));
  const m = await sharp(join(P, name + '.webp')).metadata();
  console.log(name, m.width + 'x' + m.height);
}

const tts = ['6hgoOPOkPPU1z91CqG0uFEgSc', 'pPe0FYYV2Bdo8NXv2liWKfjpbBc', 'PhGm7gbV4OdzdWCFbVugcu087c'];
for (let i = 0; i < tts.length; i++) await out(await grab(base + tts[i] + '.png?width=750&height=450'), 'tts-' + (i + 1), 750);
await out(await grab(base + 'XqTvKhL5G8EjG5fVvNDgpH3epI.png?width=1858&height=2354'), 'about-portrait', 1000);
const icons = ['bO02xtM9JYcfcUiukjrM64', 'MsJmsUbL77zqRuIftz5yWcknMs', '69xSoxgfU245sX3TCYLf6LDNpto', '9DZGUTgcQ66z9GmmOI9T6hBzxec', 'xeOY7aHiTe9MkqvSXBIUfXQ9sDo', 'QBNU6EYsdg0GSdqyj6ADkpNIGoE', '6NVvRZDf9rmhOUkfU4OjYz9sIw', 'C8TZ75OrneZlJaaR9iRpzf4pg', 'V7NT9mbL1lvcaixAtTJIYMmaTtQ'];
for (let i = 0; i < icons.length; i++) await out(await grab(base + icons[i] + '.png?width=200&height=200'), 'about-icon-' + (i + 1), 200, true);
await b.close();
console.log('done');
