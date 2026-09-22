import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 600, height: 900 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(()=>{});
await p.waitForTimeout(1200);
await p.evaluate(async()=>{for(let y=0;y<3000;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}scrollTo(0,0);await new Promise(r=>setTimeout(r,300));});
await p.screenshot({ path: `audit/out/mobile/mine_wide_600.png` });
// also measure section widths on both by sampling
const d = await p.evaluate(()=>{
  const secs=['.hero','.we','.rw','.hob','.footer'].map(s=>{const el=document.querySelector(s);if(!el)return[s,null];const r=el.getBoundingClientRect();return[s,{w:Math.round(r.width),x:Math.round(r.left),bg:getComputedStyle(el).backgroundColor}];});
  return {vw:innerWidth, sections:Object.fromEntries(secs), bodyBg:getComputedStyle(document.body).backgroundColor};
});
console.log(JSON.stringify(d));
await ctx.close();
await b.close();
