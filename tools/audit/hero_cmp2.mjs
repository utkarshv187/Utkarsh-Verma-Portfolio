import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname,'out','hero');
const b = await chromium.launch({ headless:true });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil:'networkidle', timeout:30000 });
await p.waitForTimeout(1200);
await p.screenshot({ path: join(OUT,'mine_hero2.png'), clip:{x:0,y:0,width:1440,height:900} });
// O hover
const oc = await p.evaluate(()=>{ const a=document.querySelector('.hero__o'); const r=a.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
await p.mouse.move(oc.x, oc.y); await p.waitForTimeout(700);
await p.screenshot({ path: join(OUT,'mine_ohover.png'), clip:{x:280,y:180,width:520,height:420} });
await b.close();
// side by side hero (mine left, live right)
const mine=await sharp(join(OUT,'mine_hero2.png')).resize(700).toBuffer();
const live=await sharp(join(OUT,'hero_full_ref.png')).resize(700).toBuffer();
const H=Math.max((await sharp(mine).metadata()).height,(await sharp(live).metadata()).height);
await sharp({create:{width:1420,height:H,channels:3,background:'#ff00ff'}}).composite([{input:mine,left:0,top:0},{input:live,left:720,top:0}]).png().toFile(join(OUT,'hero_side2.png'));
console.log('done oc',JSON.stringify(oc));
