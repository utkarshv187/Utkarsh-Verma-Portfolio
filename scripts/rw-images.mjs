// RECENT WORK section assets: stills -> webp+avif; GIFs copied as-is (kept animated).
import sharp from 'sharp';
import { copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = dirname(dirname(fileURLToPath(import.meta.url)));
const O = join(R, 'assets', 'original'), P = join(R, 'public', 'images');

// stills: [src, name, outputWidth]  (2x the CSS display size for retina)
const stills = [
  ['PqGj8J2MVkxfOEclM8s4LM1lfiY.jpg', 'rw-plp-new', 1048],   // card1 before/after — NEW scene (524 display)
  ['eKISVOiUdQcSF8TrYhBxq1COg.jpg', 'rw-plp-old', 1048],     // card1 before/after — OLD scene
  ['upit0LYDKKJSw1HtFId1F3CeUM.jpg', 'rw-designsystem', 1348], // card3 figma screenshot (674 display)
  ['BeRbTT6Zpf9Eybwmy9WStsO0hGg.jpg', 'rw-dots', 1050],      // card2 dotted panel bg
];
for (const [src, name, w] of stills) {
  await sharp(join(O, src)).resize({ width: w }).webp({ quality: 90 }).toFile(join(P, name + '.webp'));
  await sharp(join(O, src)).resize({ width: w }).avif({ quality: 72 }).toFile(join(P, name + '.avif'));
  const m = await sharp(join(P, name + '.webp')).metadata();
  console.log(name, m.width + 'x' + m.height, 'webp+avif');
}
// GIFs kept animated (copied verbatim)
const gifs = [
  ['bAXnzVrKeF5riTiESNxjpvqOWWM.gif', 'rw-gamify-a.gif'], // front phone
  ['xkzkmWXB2AV2EIqCliUZyQEHw.gif', 'rw-gamify-b.gif'],   // back phone
];
for (const [src, name] of gifs) {
  await copyFile(join(O, src), join(P, name));
  const m = await sharp(join(O, src), { animated: true }).metadata();
  console.log(name, m.width + 'x' + m.height, '(' + m.pages + 'f) gif copied');
}
