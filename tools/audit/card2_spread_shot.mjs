import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(()=>{});
await p.waitForTimeout(800);
const c2 = await p.evaluate(() => [...document.querySelectorAll('.rw-card')][1].getBoundingClientRect().top + (window.scrollY||document.body.scrollTop));
// pin (full spread) and a mid frame
for (const [name, off] of Object.entries({ mid: -300, pin: -20 })) {
  await p.evaluate((y)=>{window.scrollTo(0,y);document.documentElement.scrollTop=y;document.body.scrollTop=y;}, c2+off);
  await p.waitForTimeout(800);
  const m = await p.evaluate(()=>{ const md=[...document.querySelectorAll('.rw-card')][1].querySelector('.rw-card__media').getBoundingClientRect(); return {x:Math.max(0,Math.round(md.left)-6),y:Math.max(0,Math.round(md.top)-6),w:Math.round(md.width)+12,h:Math.round(md.height)+12}; });
  if(m.y<900) await p.screenshot({ path:`audit/out/card2/spread_${name}.png`, clip:{x:m.x,y:m.y,width:Math.min(1440-m.x,m.w),height:Math.min(1000-m.y,m.h)} });
  console.log(name,'saved');
}
await b.close();
