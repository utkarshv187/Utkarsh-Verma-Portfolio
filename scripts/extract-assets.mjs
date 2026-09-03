// Download bare-URL originals from framerusercontent (full resolution, query stripped),
// keep them untouched in /assets/original, record intrinsic dimensions, and generate
// optimized AVIF + WebP variants into /public/images.
//
// Usage:
//   node scripts/extract-assets.mjs            # stills only (default)
//   node scripts/extract-assets.mjs --gifs     # include the 3 large GIFs
import sharp from 'sharp';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ORIG = join(ROOT, 'assets', 'original');
const OUT = join(ROOT, 'public', 'images');
const AUDIT = join(ROOT, 'tools', 'audit', 'out');
const withGifs = process.argv.includes('--gifs');
await mkdir(ORIG, { recursive: true });
await mkdir(OUT, { recursive: true });

// ---- Build the URL set from audit captures + known extras ----
const network = JSON.parse(await readFile(join(AUDIT, 'network.json'), 'utf8'));
const assets = JSON.parse(await readFile(join(AUDIT, 'assets.json'), 'utf8'));
const bare = (u) => u.split('?')[0];
const isFrx = (u) => /framerusercontent\.com\/images\//.test(u);

const set = new Map(); // id -> { url, isGif }
function add(u) {
  if (!u || !isFrx(u)) return;
  const b = bare(u);
  const id = b.split('/').pop();
  const isGif = /\.gif$/i.test(b);
  if (isGif && !withGifs) return;
  if (!set.has(id)) set.set(id, { url: b, isGif });
}
for (const r of network) if (r.resourceType === 'image') add(r.url);
for (const im of assets.images) add(im.src);
for (const bg of assets.backgrounds) if (typeof bg.url === 'string') add(bg.url);
// Extras: testimonials, backgrounds, favicons, og (some are lazy / in <head>)
for (const id of [
  'gpjodx2yMjShNO7g2ZqcCr2hkHk.jpg', 'kdSA7tSSazkTsQg4wDo6lUezPU.jpg', 'lCNpjsEvk6trKntPntPBcbFpy8Q.jpg',
  'sB6wpIS7XS4U6nhva4i10xBcI.png', // og
  'Jf2rQVQDTNlCSEYnvhaqoXTaFw.png', 'jrFoxMrr8bYLYwE0r2SC5ipeiM.png', 'aY7J5iXVgHeHCVi132jhQIwkv8.png', // favicons
]) add('https://framerusercontent.com/images/' + id);

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'asset-fetch' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return download(res.headers.location).then(resolve, reject);
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ' ' + url));
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

const manifest = [];
for (const [id, { url, isGif }] of set) {
  const origPath = join(ORIG, id);
  let buf;
  try {
    buf = await stat(origPath).then(() => readFile(origPath)).catch(async () => {
      const b = await download(url);
      await writeFile(origPath, b);
      return b;
    });
  } catch (e) {
    console.log('  FAIL', id, e.message);
    continue;
  }
  let meta = {};
  try { meta = await sharp(buf, { animated: isGif }).metadata(); } catch {}
  manifest.push({ id, url, bytes: buf.length, width: meta.width, height: meta.height, format: meta.format, pages: meta.pages || 1 });
  console.log(`  ${id}  ${meta.width}x${meta.height}  ${(buf.length/1024).toFixed(0)}KB  ${meta.format}${meta.pages>1?' ('+meta.pages+'f)':''}`);
}
await writeFile(join(ROOT, 'assets', 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${manifest.length} originals in /assets/original; manifest written.`);
