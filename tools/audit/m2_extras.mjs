import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(()=>{});
await p.waitForTimeout(2400);
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=380){scrollTo(0,y);await new Promise(r=>setTimeout(r,70));}scrollTo(0,0);await new Promise(r=>setTimeout(r,300));});
const d = await p.evaluate(()=>{
  const norm=s=>(s||'').replace(/\s+/g,' ').trim();
  const vis=el=>{const cs=getComputedStyle(el);const r=el.getBoundingClientRect();return cs.display!=='none'&&+cs.opacity>0.1&&r.width>1&&r.height>1;};
  // ACCENT svg: the div at ~x-51 y136 w493 h347 with svg bg
  let accent=null;
  for(const el of document.querySelectorAll('div')){const cs=getComputedStyle(el);const r=el.getBoundingClientRect();if(r.top>0&&r.top<800&&r.width>300&&r.height>200&&/data:image\/svg/.test(cs.backgroundImage)){accent={x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),z:cs.zIndex,bgSize:cs.backgroundSize,bgPos:cs.backgroundPosition,bgRepeat:cs.backgroundRepeat,bgImg:cs.backgroundImage};break;}}
  // TICKER: tool icons - small squares in a horizontal row in about section
  let ticker=null;
  {const imgs=[...document.querySelectorAll('img')].map(i=>({i,r:i.getBoundingClientRect()})).filter(o=>o.r.width>24&&o.r.width<140&&Math.abs(o.r.width-o.r.height)<25);
   if(imgs.length){const byTop={};for(const o of imgs){const k=Math.round(o.r.top/30)*30;(byTop[k]=byTop[k]||[]).push(o);}const row=Object.values(byTop).sort((a,bb)=>bb.length-a.length)[0];const w=row[0].r.width;const gap=row.length>1?Math.round(row[1].r.left-row[0].r.right):null;const visN=row.filter(o=>o.r.left>=-5&&o.r.right<=innerWidth+5).length;ticker={iconW:Math.round(w),gap,countRow:row.length,visibleInVp:visN};}}
  // TESTIMONIAL card: find "THINGS THEY SAY" or a testimonial card
  let tts=null;
  {let head=null;for(const el of document.querySelectorAll('h1,h2,h3,span,div')){if(/THINGS THEY SAY|KIND WORDS|WHAT.*SAY|TESTIMONIAL/i.test(norm(el.textContent))&&norm(el.textContent).length<30&&vis(el)){head=el;break;}}
   // find a card: a block with a person's quote text
   let card=null,cs2=0;for(const el of document.querySelectorAll('div')){const t=norm(el.textContent);if(t.length>80&&t.length<600&&vis(el)){const r=el.getBoundingClientRect();if(r.width>200&&r.width<innerWidth&&r.height>150&&r.height<700){if(r.height>cs2){cs2=r.height;card=el;}}}}
   tts={heading:head?{t:norm(head.textContent).slice(0,20),fs:getComputedStyle(head).fontSize}:null, cardW:card?Math.round(card.getBoundingClientRect().width):null, cardH:card?Math.round(card.getBoundingClientRect().height):null, cardX:card?Math.round(card.getBoundingClientRect().left):null};}
  return {accent,ticker,tts};
});
console.log(JSON.stringify(d,null,1));
await b.close();
