// Builds public/favicon.png — the PNG fallback for browsers without SVG-favicon support (Safari).
// Neutral so it reads on BOTH light and dark tab bars: the dark UX mark (same paths as
// public/favicon.svg / src/components/Logo.tsx) on the site's gold (#FFB705) rounded tile, the same
// treatment as the apple-touch-icon. usage: node scripts/make-favicon.mjs
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
const S = 64; // rendered at 64 then downscaled to 32 for clean antialiasing
const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" rx="${S * 0.22}" fill="#FFB705"/>
  <g transform="translate(${S * 0.14} ${(S - (S * 0.72 * 30) / 52.918) / 2}) scale(${(S * 0.72) / 52.918})" fill="#0E0C20">
    ${paths.map((d) => `<path d="${d}"/>`).join('')}
  </g>
</svg>`;
await sharp(Buffer.from(tile)).resize(32, 32).png({ compressionLevel: 9 }).toFile(fileURLToPath(new URL('../public/favicon.png', import.meta.url)));
console.log('public/favicon.png written (32x32)');
