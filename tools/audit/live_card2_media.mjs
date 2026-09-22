import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 2600 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(()=>{});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,90));} scrollTo(0,0); });
await p.waitForTimeout(500);
await p.evaluate(() => { for (const el of document.querySelectorAll('*')) { if (getComputedStyle(el).position==='sticky') el.style.position='relative'; } });
await p.waitForTimeout(300);
const data = await p.evaluate(() => {
  const big = [...document.querySelectorAll('img')].filter(im=>/\.gif/i.test(im.currentSrc||im.src)).map(im=>({im,r:im.getBoundingClientRect()})).filter(g=>Math.abs(g.r.width-253)<6 && g.r.height>500)[0];
  if(!big) return {none:true};
  // find nearest ancestor that is a square-ish panel (500-560 both dims)
  let node=big.im, media=null;
  for(let k=0;k<10 && node;k++){ const r=node.getBoundingClientRect(); if(r.width>=490 && r.width<=560 && r.height>=490 && r.height<=560){ media=node; break; } node=node.parentElement; }
  const mr = media? media.getBoundingClientRect(): null;
  return {
    big:{ w:Math.round(big.r.width), h:Math.round(big.r.height) },
    media: mr? { w:Math.round(mr.width), h:Math.round(mr.height), radius:getComputedStyle(media).borderRadius, overflow:getComputedStyle(media).overflow } : null,
    bigTopRelMedia: mr? Math.round(big.r.top-mr.top):null,
    bigBottomRelMedia: mr? Math.round(big.r.bottom-mr.top):null,
    mediaTopAbs: mr? Math.round(mr.top+scrollY):null,
    mediaLeftAbs: mr? Math.round(mr.left):null,
  };
});
console.log(JSON.stringify(data,null,1));
if(data.media){
  await p.evaluate((y)=>scrollTo(0,y-30), data.mediaTopAbs); await p.waitForTimeout(500);
  await p.screenshot({ path:'audit/out/card2/live_media_clean.png', clip:{ x:Math.max(0,data.mediaLeftAbs-8), y:Math.max(0, (data.mediaTopAbs - (await p.evaluate(()=>scrollY)))-8), width: data.media.w+16, height: data.media.h+16 } });
  console.log('saved');
}
await b.close();
