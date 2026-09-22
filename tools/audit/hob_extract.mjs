import { chromium } from 'playwright';
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const P = join(R, 'public', 'images');
const base = 'https://framerusercontent.com/images/';

// [id, ext, outName, outWidth]
const stacks = [
  ['LPldbLZleWCHQ8iStdXpnTncYF8', 'jpeg', 'hob-game-1', 740], ['OCxNlm00yTsoxQzANqF3TpPYXUU', 'jpeg', 'hob-game-2', 740],
  ['0xM0LwglmLoHfQRMpkOlhGbDgyc', 'jpeg', 'hob-game-3', 740], ['RgYfjJzg7L04gQLcwSFiI7tk', 'jpeg', 'hob-game-4', 740],
  ['XFUk3SputOPAbgYFMLDMcrnX8Y', 'jpeg', 'hob-social-1', 740], ['m0vqge19PPkSIHepKAhwB81OaI0', 'jpeg', 'hob-social-2', 740],
  ['xCgmx8FtzEwRjJtPxk7YH88x2r4', 'jpeg', 'hob-social-3', 740], ['SeM8KGSZkzUU4JSxsa8ta2ej9g', 'jpeg', 'hob-social-4', 740],
  ['TvEhfYnaj6QGKK2ZUzI5NCAUc4', 'jpeg', 'hob-adv-1', 740], ['gxxPbKBLTmYKpDAIdJnG11wEs9E', 'jpeg', 'hob-adv-2', 740],
  ['ZnNaPG8g8s6CjiTfBbx4sjIzYc', 'jpeg', 'hob-adv-3', 740], ['p6SftsAXebn0PD0DRTpHftXgtxI', 'jpeg', 'hob-adv-4', 740],
];
const gridIds = ['fAjY3sZMtoOmgk0K1AbuGlpxjDQ', 'MCMC39dWjQoyR16Qhu1vMVXG2o', 'T6GU5fpUbmjGprcBvM2KY0yQXCw', 'FaL0M4R6cqyRCQhSbLkFMU7XE', 'QSmoWDnIop8JNyYsf8C0PiChYvw', '2cD9WEgEOGBQGS27eQprlUYXY', 'Gfl1bEmWmNTHgeMdtSQ5RNlSEjk', 'fam52JvbE1D2gdOqYBRjTLcLvM', 'lMUlaXDNBcJu7Aasn7z9ycvZYo', 'lc9rKGcl59LXihMaXxz370c0g', 'f5xGBN7io1y6cnGNvwxvOdLsP8', 'tqxOpuj4Mmym1Q2nMxNjoPrbek', 'cU7578HBrLjvhh1ubnSaBkT4Oho', 'QE4vgMweqF5iH85QvsDIlsakE', 'E4i0mD95ZWMdQWSOiO82xVsSDoA'];
const grid = gridIds.map((id, i) => [id, 'png', 'hob-grid-' + (i + 1), 960]);
const all = [...stacks, ...grid];

const got = {};
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on('response', async (res) => { const u = res.url(); const hit = all.find((a) => u.includes(a[0]) && u.includes('width=1400')); if (!hit || got[hit[0]]) return; try { const buf = await res.body(); if (buf && buf.length > 800) got[hit[0]] = buf; } catch { } });
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2000);
// force high-res loads: append a new <img> per id at width=1400
await p.evaluate(({ ids, base }) => { for (const [id, ext] of ids) { const im = new Image(); im.src = base + id + '.' + ext + '?width=1400'; im.style.position = 'fixed'; im.style.left = '-9999px'; document.body.appendChild(im); } }, { ids: all.map((a) => [a[0], a[1]]), base });
await p.waitForTimeout(6000);
await b.close();

console.log('captured', Object.keys(got).length, 'of', all.length);
for (const [id, ext, name, w] of all) {
  if (!got[id]) { console.log('MISSING', name, id); continue; }
  const s = sharp(got[id]).resize({ width: w });
  await s.clone().webp({ quality: 82 }).toFile(join(P, name + '.webp'));
  await s.clone().avif({ quality: 60 }).toFile(join(P, name + '.avif'));
  const m = await sharp(join(P, name + '.webp')).metadata();
  console.log(name, m.width + 'x' + m.height);
}
console.log('done');
