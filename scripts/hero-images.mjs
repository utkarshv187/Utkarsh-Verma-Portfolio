import sharp from 'sharp';
import { join, dirname } from 'node:path'; import { fileURLToPath } from 'node:url';
const R = dirname(dirname(fileURLToPath(import.meta.url)));
const O = join(R,'assets','original'), P = join(R,'public','images');
const jobs = [
  ['IWdo08dy1SBtkPucLvwPp046Fug.png','portrait', 1300],   // hero portrait (alpha)
  ['eNT4XgzhjkW7AqGWTXtlFa3a230.png','graffiti', 700],     // UTKARSH VERMA graffiti (alpha)
  ['7nuBCHYzW4t5TCODcz3ifgeAc.png','face', 300],           // small face accent (alpha)
];
for (const [src,name,w] of jobs){
  const inp = join(O,src);
  await sharp(inp).resize({width:w}).webp({quality:90}).toFile(join(P,name+'.webp'));
  await sharp(inp).resize({width:w}).avif({quality:72}).toFile(join(P,name+'.avif'));
  const m = await sharp(join(P,name+'.webp')).metadata();
  console.log(name, m.width+'x'+m.height, 'webp+avif');
}
