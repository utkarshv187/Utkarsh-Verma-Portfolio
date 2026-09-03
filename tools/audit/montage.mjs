import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const dir = process.argv[2];
const outName = process.argv[3] || 'contact.png';
const cols = Number(process.argv[4] || 4);
const cellW = 320;
const files = (await readdir(dir)).filter(f => /^s\d+.*\.png$/.test(f)).sort();
const cells = [];
for (const f of files) {
  const img = sharp(join(dir, f));
  const meta = await img.metadata();
  const cellH = Math.round(cellW * meta.height / meta.width);
  const buf = await img.resize(cellW, cellH).png().toBuffer();
  cells.push({ buf, cellH, name: f });
}
const rows = Math.ceil(cells.length / cols);
const maxH = Math.max(...cells.map(c => c.cellH));
const gap = 6, labelH = 0;
const W = cols * cellW + (cols + 1) * gap;
const H = rows * (maxH + gap) + gap;
const composites = [];
cells.forEach((c, idx) => {
  const r = Math.floor(idx / cols), col = idx % cols;
  composites.push({ input: c.buf, left: gap + col * (cellW + gap), top: gap + r * (maxH + gap) });
});
await sharp({ create: { width: W, height: H, channels: 3, background: '#333' } })
  .composite(composites).png().toFile(join(dir, outName));
console.log('montage', outName, W + 'x' + H, 'files', files.join(','));
