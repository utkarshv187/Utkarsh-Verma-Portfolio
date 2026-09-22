import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const W of [1440, 390]){
  const p = await (await b.newContext({ viewport:{width:W,height:1000} })).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,60)));
  await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
  await p.waitForTimeout(800);
  const c4 = await p.evaluate(()=>[...document.querySelectorAll('.rw-card')][3].getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
  await p.evaluate((y)=>{const t=y-20;window.scrollTo(0,t);document.documentElement.scrollTop=t;document.body.scrollTop=t;}, c4); await p.waitForTimeout(600);
  const r = await p.evaluate(()=>{ const bImg=document.querySelector('.rw-collage__b'); const z=bImg?getComputedStyle(bImg).zIndex:null; // is any pixel of b covered? check b is topmost at its bottom-right corner
    const r=bImg.getBoundingClientRect(); const px=r.right-8, py=r.bottom-8; const top=document.elementFromPoint(px,py); const bTop = top===bImg || bImg.contains(top); return { z, bottomRightIsB:bTop, topEl:(top&&(top.className.baseVal||top.className||top.tagName))+'' }; });
  console.log(`W${W}: b z-index=${r.z} bottomRightCornerTopmost=${r.bottomRightIsB} (${r.topEl}) errors=${errs.length}`);
  await p.close();
}
await b.close();
