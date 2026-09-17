// THINGS THEY SAY + MORE ABOUT ME assets: fetch from framerusercontent -> webp+avif.
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = dirname(dirname(fileURLToPath(import.meta.url)));
const P = join(R, 'public', 'images');
const base = 'https://framerusercontent.com/images/';

async function grab(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(url + ' -> ' + res.status);
  return Buffer.from(await res.arrayBuffer());
}
async function out(buf, name, w, { png = false } = {}) {
  const base = sharp(buf).resize({ width: w });
  await base.clone().webp({ quality: 92 }).toFile(join(P, name + '.webp'));
  await base.clone().avif({ quality: 74 }).toFile(join(P, name + '.avif'));
  if (png) await base.clone().png().toFile(join(P, name + '.png'));
  const m = await sharp(join(P, name + '.webp')).metadata();
  console.log(name, m.width + 'x' + m.height);
}

// 3 testimonial cards (native 750x450, display 500x300 -> 1.5x)
const tts = ['6hgoOPOkPPU1z91CqG0uFEgSc', 'pPe0FYYV2Bdo8NXv2liWKfjpbBc', 'PhGm7gbV4OdzdWCFbVugcu087c'];
for (let i = 0; i < tts.length; i++) await out(await grab(base + tts[i] + '.png?width=750&height=450'), 'tts-' + (i + 1), 750);

// portrait (native 1858x2354, display 395x500 -> output 1000w ~2.5x)
await out(await grab(base + 'XqTvKhL5G8EjG5fVvNDgpH3epI.png?width=1858&height=2354'), 'about-portrait', 1000);

// 9 skill icons (native 200x200, display 100x100 -> 2x). keep png too (transparency)
const icons = ['bO02xtM9JYcfcUiukjrM64', 'MsJmsUbL77zqRuIftz5yWcknMs', '69xSoxgfU245sX3TCYLf6LDNpto', '9DZGUTgcQ66z9GmmOI9T6hBzxec', 'xeOY7aHiTe9MkqvSXBIUfXQ9sDo', 'QBNU6EYsdg0GSdqyj6ADkpNIGoE', '6NVvRZDf9rmhOUkfU4OjYz9sIw', 'C8TZ75OrneZlJaaR9iRpzf4pg', 'V7NT9mbL1lvcaixAtTJIYMmaTtQ'];
for (let i = 0; i < icons.length; i++) await out(await grab(base + icons[i] + '.png?width=200&height=200'), 'about-icon-' + (i + 1), 200, { png: true });
console.log('done');
