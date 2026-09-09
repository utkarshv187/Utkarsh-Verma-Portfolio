import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
import sharp from 'sharp';
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out', 'we');
const b = await chromium.launch({ headless: true });
// desktop full hero
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 820 } })).newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(()=>{});
  await p.waitForTimeout(1500);
  await p.screenshot({ path: join(OUT, 'aurora_mine_desktop_full.png') });
  await p.close();
}
// mobile aurora: 2 frames, centroid move check
{
  const p = await (await b.newContext({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true })).newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(()=>{});
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.scrollTo(0,0); ['.hero__portrait','.hero__product','.hero__o','.hero__roles-m','.hero__graffiti','.hero__face'].forEach(s=>document.querySelectorAll(s).forEach(e=>e.style.visibility='hidden')); });
  await p.waitForTimeout(300);
  const cent = async () => { const buf = await p.screenshot({clip:{x:0,y:0,width:390,height:500}}); const {data,info}=await sharp(buf).resize(130,166).raw().toBuffer({resolveWithObject:true}); let sx=0,n=0; for(let i=0;i<data.length;i+=info.channels){const R=data[i],G=data[i+1],B=data[i+2]; if(R>35&&B>55&&G<R){sx+=(i/info.channels)%info.width;n++;}} return {cx:n?Math.round(sx/n):null,area:n}; };
  const c1 = await cent(); await p.waitForTimeout(4000); const c2 = await cent();
  console.log('MOBILE aurora centroid t0:', JSON.stringify(c1), ' t4s:', JSON.stringify(c2), c1.cx!==c2.cx||c1.area!==c2.area ? '=> MOVING' : '=> static?');
  await p.screenshot({ path: join(OUT, 'aurora_mine_mobile.png'), clip:{x:0,y:0,width:390,height:500} });
  await p.close();
}
await b.close();
console.log('wrote aurora_mine_desktop_full.png + aurora_mine_mobile.png');
