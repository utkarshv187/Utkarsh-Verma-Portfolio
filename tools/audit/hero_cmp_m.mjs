import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname,'out','hero');
const b = await chromium.launch({ headless:true });
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil:'networkidle', timeout:30000 });
await p.waitForTimeout(1200);
await p.screenshot({ path: join(OUT,'mine_hero_m.png'), fullPage:false });
await b.close();
// side by side with live hero_phone.png (crop both to 780x1580)
const mine=await sharp(join(OUT,'mine_hero_m.png')).resize(390).toBuffer();
const live=await sharp(join(OUT,'hero_phone.png')).resize(390).toBuffer();
const mh=(await sharp(mine).metadata()).height, lh=(await sharp(live).metadata()).height;
const H=Math.max(mh,lh);
await sharp({create:{width:800,height:H,channels:3,background:'#ff00ff'}}).composite([{input:mine,left:0,top:0},{input:live,left:410,top:0}]).png().toFile(join(OUT,'hero_side_m.png'));
console.log('done mh',mh,'lh',lh);
