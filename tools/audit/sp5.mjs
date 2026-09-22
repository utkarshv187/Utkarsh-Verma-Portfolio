import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:5199/';
const b = await chromium.launch({ headless: true });
for (const W of [430,414,390,375,360,320]) {
  const ctx = await b.newContext({ viewport:{width:W,height:800}, deviceScaleFactor:2, isMobile:true, hasTouch:true, userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto(URL,{waitUntil:'load'}).catch(()=>{});
  await p.waitForTimeout(800);
  // scroll bio into view to trigger reveal, then settle
  await p.evaluate(()=>{const b=[...document.querySelectorAll('.about__ins-text')].find(e=>/if not/.test(e.textContent));b?.closest('.about__bio').scrollIntoView({block:'center'});});
  await p.waitForTimeout(1200);
  const d = await p.evaluate(()=>{
    const p5=[...document.querySelectorAll('.about__ins-text')].find(e=>/if not/.test(e.textContent));
    if(!p5) return null;
    const bioIn=p5.closest('.about__bio').classList.contains('about__bio--in');
    const r=p5.getBoundingClientRect(); const a=p5.closest('.about__anchor').getBoundingClientRect();
    return {bioIn, left:Math.round(r.left), right:Math.round(r.right), w:Math.round(r.width), clipLeft:r.left<0, clipRight:r.right>innerWidth, cssLeft:getComputedStyle(p5).left, anchorLeft:Math.round(a.left), anchorW:Math.round(a.width)};
  });
  console.log(W, JSON.stringify(d));
  await ctx.close();
}
await b.close();
