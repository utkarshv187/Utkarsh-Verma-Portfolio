import sharp from 'sharp';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const [,, src, x, y, w, h, out] = process.argv;
await sharp(join(__dirname,'out','hero',src)).extract({left:+x,top:+y,width:+w,height:+h}).resize(+w*3).png().toFile(join(__dirname,'out','hero',out));
console.log('cropped', out);
