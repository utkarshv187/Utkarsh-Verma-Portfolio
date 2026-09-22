import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
// measure token widths in MY build at 140px
const p = await (await b.newContext({ viewport:{width:1440,height:900} })).newPage();
await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
await p.waitForTimeout(900);
const w = await p.evaluate(()=>{
  const mk=(t)=>{ const s=document.createElement('span'); s.style.cssText='font-family:"Clash Display";font-weight:700;font-size:140px;letter-spacing:-0.02em;white-space:nowrap;position:absolute;visibility:hidden'; s.textContent=t; document.body.appendChild(s); const wd=s.getBoundingClientRect().width; s.remove(); return Math.round(wd); };
  return { SCROLLED:mk('SCROLLED'), SCROLLED_THIS:mk('SCROLLED THIS'), THIS_FAR:mk('THIS FAR?'), LETS_WORK:mk('LET\u2019S WORK'), LETS_WORK_TOG:mk('LET\u2019S WORK TOGETHER'), TOGETHER:mk('TOGETHER') };
});
console.log('MY 140px token widths:', JSON.stringify(w));
await p.close();
// live 1024 + 390 footer full screenshots
for (const [W,H] of [[1024,900],[390,844]]) {
  const lp = await (await b.newContext({ viewport:{width:W,height:H}, reducedMotion:'no-preference' })).newPage();
  await lp.goto('https://uxuiuv.framer.website/',{waitUntil:'load'}).catch(()=>{});
  await lp.waitForTimeout(2500);
  await lp.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=innerHeight*0.5){scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}});
  await lp.evaluate(()=>scrollTo(0,document.body.scrollHeight)); await lp.waitForTimeout(900);
  await lp.screenshot({ path:`audit/out/footer/live_cta_${W}.png` });
  console.log('saved live_cta_'+W);
  await lp.close();
}
await b.close();
