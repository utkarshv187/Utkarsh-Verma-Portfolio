import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out', 'we');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(()=>{});
await p.waitForTimeout(1400);
await p.evaluate(() => { window.scrollTo(0,0); ['.hero__portrait','.hero__product','.hero__o','.hero__role-shift','.hero__graffiti','.hero__face'].forEach(s=>document.querySelectorAll(s).forEach(e=>e.style.visibility='hidden')); });
await p.waitForTimeout(300);
const W=1440,H=620, NF=6, DT=1600;
const shots=[], cents=[];
for(let i=0;i<NF;i++){
  const buf = await p.screenshot({clip:{x:0,y:0,width:W,height:H}});
  shots.push(buf);
  const {data,info}=await sharp(buf).resize(240,103).raw().toBuffer({resolveWithObject:true});
  let sx=0,n=0; for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const k=(y*info.width+x)*info.channels;const R=data[k],G=data[k+1],B=data[k+2];if(R>35&&B>55&&G<R){sx+=x;n++;}}
  cents.push({cx:n?Math.round(sx/n/240*W):null,area:n});
  if(i<NF-1) await p.waitForTimeout(DT);
}
const xs=cents.map(c=>c.cx), ar=cents.map(c=>c.area);
console.log('centroid-x per frame:', JSON.stringify(xs), ' range:', Math.min(...xs)+'-'+Math.max(...xs), '('+(Math.max(...xs)-Math.min(...xs))+'px)');
console.log('area per frame:', JSON.stringify(ar), ' range x'+(Math.max(...ar)/Math.min(...ar)).toFixed(2));
const w=Math.round(W*0.31),gap=5,bufs=[];
for(const s of shots) bufs.push(await sharp(s).resize(w).toBuffer());
const h=(await sharp(bufs[0]).metadata()).height;
await sharp({create:{width:(w+gap)*NF-gap,height:h,channels:3,background:'#000'}}).composite(bufs.map((bf,i)=>({input:bf,left:i*(w+gap),top:0}))).png().toFile(join(OUT,'aurora_mine_frames.png'));
console.log('wrote aurora_mine_frames.png (6 frames ~1.6s apart)');
await b.close();
