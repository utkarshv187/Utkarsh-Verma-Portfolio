import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function m(W){
 const p = await (await b.newContext({ viewport:{width:W,height:900}, reducedMotion:'no-preference' })).newPage();
 await p.goto('https://uxuiuv.framer.website/',{waitUntil:'load'}).catch(()=>{});
 await p.waitForTimeout(2200);
 await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=innerHeight*0.5){scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}});
 await p.waitForTimeout(400);
 const pageH = await p.evaluate(()=>document.body.scrollHeight);
 await p.evaluate((y)=>scrollTo(0,y), pageH-3500); await p.waitForTimeout(800);
 const heads = await p.evaluate(()=>{
   const V=r=>({x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)});
   const out=[];
   for(const el of document.querySelectorAll('h1,h2,h3,p,div,span')){
     const t=(el.textContent||'').replace(/\s+/g,' ').trim();
     if(/^(SCROLLED|THIS FAR\?|LET.S WORK|TOGETHER|CAME THIS|FAR\?|LET.S TALK|LET.S|TALK|WORK)$/.test(t)){const cs=getComputedStyle(el);const r=el.getBoundingClientRect();if(parseInt(cs.fontSize)<60||r.width<1)continue;out.push({t,...V(r),size:cs.fontSize,color:cs.color,lh:cs.lineHeight,ls:cs.letterSpacing,align:cs.textAlign});}
   }
   return out.sort((a,bb)=>a.y-bb.y);
 });
 console.log(`\n### ${W} ###`);
 for(const h of heads) console.log(`  "${h.t}" ${h.size} ${h.color} lh${h.lh} ls${h.ls} ${h.align} @(${h.x},${h.y}) ${h.w}x${h.h}`);
 await p.close();
}
await m(1440); await m(1024);
await b.close();
