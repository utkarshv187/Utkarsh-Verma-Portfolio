import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport:{width:1440,height:1000}, deviceScaleFactor:2 })).newPage();
await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
await p.waitForTimeout(900);
const c4 = await p.evaluate(()=>[...document.querySelectorAll('.rw-card')][3].getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
await p.evaluate((y)=>{const t=y-20;window.scrollTo(0,t);document.documentElement.scrollTop=t;document.body.scrollTop=t;}, c4); await p.waitForTimeout(1200);
const info = await p.evaluate(()=>{
  const scene = document.querySelector('.rw-card:nth-of-type(4) .rw-collage__scene') || [...document.querySelectorAll('.rw-collage__scene')][0];
  const media = scene.closest('.rw-card__media');
  const els = [...scene.children].map(el=>{ const cs=getComputedStyle(el); const r=el.getBoundingClientRect(); const inner = el.querySelector('img,video')||el; const src=(inner.currentSrc||inner.src||'').split('/').pop(); return { cls:(el.className.baseVal||el.className||'').toString().replace('rw-collage__',''), src, z:cs.zIndex, pos:cs.position }; });
  return { mediaOverflow: getComputedStyle(media).overflow, sceneOverflow: getComputedStyle(scene).overflow, els };
});
console.log(JSON.stringify(info,null,1));
await p.screenshot({ path:'audit/out/diff/c4_now.png', clip:{x:120,y:90,width:600,height:600} });
await b.close();
