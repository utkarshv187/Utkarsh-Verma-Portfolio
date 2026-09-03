// Subset + convert the project fonts to woff2, self-hosted.
// - Clash Display / Satoshi: variable TTFs in /fonts (weight axis preserved)
// - Square Peg: static TTF in /fonts
// - Caveat Brush: downloaded from the OFL source (Google Fonts repo), 400 only
// Output -> public/fonts/*.woff2
import subsetFont from 'subset-font';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'public', 'fonts');
await mkdir(OUT, { recursive: true });

// Generous Latin charset covering every glyph seen on the site (incl. é, em dash, bullet,
// curly quotes, ellipsis, middle dot, times, carets, ampersands).
const CHARSET =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~' +
  'é–—•…‘’“”·×°™→↑';

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'font-fetch' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function make(srcBuf, outName, label) {
  const sub = await subsetFont(srcBuf, CHARSET, { targetFormat: 'woff2' });
  await writeFile(join(OUT, outName), sub);
  console.log(`  ${label} -> ${outName}  ${srcBuf.length} -> ${sub.length} bytes`);
}

console.log('Subsetting fonts...');
await make(await readFile(join(ROOT, 'fonts', 'ClashDisplay-Variable.ttf')), 'ClashDisplay-subset.woff2', 'Clash Display (var 200-700)');
await make(await readFile(join(ROOT, 'fonts', 'Satoshi-Variable.ttf')), 'Satoshi-subset.woff2', 'Satoshi (var 300-900)');
await make(await readFile(join(ROOT, 'fonts', 'SquarePeg-Regular.ttf')), 'SquarePeg-subset.woff2', 'Square Peg 400');

// Caveat Brush 400 — OFL, self-hosted from the Google Fonts source repo (not Google's CDN).
console.log('Downloading Caveat Brush (OFL source)...');
const cbUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/caveatbrush/CaveatBrush-Regular.ttf';
const cbBuf = await download(cbUrl);
await mkdir(join(ROOT, 'assets', 'original', 'fonts'), { recursive: true });
await writeFile(join(ROOT, 'assets', 'original', 'fonts', 'CaveatBrush-Regular.ttf'), cbBuf);
await make(cbBuf, 'CaveatBrush-subset.woff2', 'Caveat Brush 400');

console.log('Done. Fonts in', OUT);
