import { chromium } from 'playwright'; import sharp from 'sharp';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname=dirname(fileURLToPath(import.meta.url)); const OUT=join(__dirname,'out','hero','deliver');
const b=await chromium.launch({headless:true});
async function shot(url,tag){const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await ctx.newPage();await p.goto(url,{waitUntil:'networkidle',timeout:45000}).catch(()=>{});await p.waitForTimeout(1600);await p.screenshot({path:join(OUT,tag+'_m.png'),clip:{x:0,y:0,width:390,height:844}});await ctx.close();}
await shot('http://localhost:5199/','mine'); await shot('https://uxuiuv.framer.website/','live'); await b.close();
const m=await sharp(join(OUT,'mine_m.png')).resize(380).toBuffer(); const l=await sharp(join(OUT,'live_m.png')).resize(380).toBuffer();
const H=Math.max((await sharp(m).metadata()).height,(await sharp(l).metadata()).height);
await sharp({create:{width:780,height:H,channels:3,background:'#ff00ff'}}).composite([{input:m,left:0,top:0},{input:l,left:400,top:0}]).png().toFile(join(OUT,'cmp_mobile.png'));
console.log('done');
