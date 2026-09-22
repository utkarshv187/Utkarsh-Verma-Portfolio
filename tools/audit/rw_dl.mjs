import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext();
const files = {
  new_PqGj8J2M: 'https://framerusercontent.com/images/PqGj8J2MVkxfOEclM8s4LM1lfiY.jpg',
  old_eKISVOiU: 'https://framerusercontent.com/images/eKISVOiUdQcSF8TrYhBxq1COg.jpg',
  small_7nuBCH: 'https://framerusercontent.com/images/7nuBCHYzW4t5TCODcz3ifgeAc.png',
};
for (const [name, url] of Object.entries(files)) {
  const resp = await ctx.request.get(url);
  const buf = Buffer.from(await resp.body());
  const meta = await sharp(buf).metadata();
  writeFileSync(join(OUT, `${name}.${meta.format}`), buf);
  // also a downscaled preview for quick viewing
  await sharp(buf).resize(360).toFile(join(OUT, `prev_${name}.png`));
  console.log(`${name}: ${meta.width}x${meta.height} ${meta.format} ${Math.round(buf.length / 1024)}KB`);
}
await b.close();
