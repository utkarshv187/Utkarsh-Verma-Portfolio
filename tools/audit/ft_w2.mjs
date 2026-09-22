import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport:{width:1440,height:900} })).newPage();
await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
await p.waitForTimeout(800);
const w = await p.evaluate(()=>{
  const mk=(t,ls)=>{ const s=document.createElement('span'); s.style.cssText=`font-family:"Clash Display";font-weight:700;font-size:140px;letter-spacing:${ls};white-space:nowrap;position:absolute;visibility:hidden`; s.textContent=t; document.body.appendChild(s); const wd=s.getBoundingClientRect().width; s.remove(); return Math.round(wd); };
  return {
    pale_SCROLLED_THIS: mk('SCROLLED THIS','-0.02em'),
    pale_SCROLLED: mk('SCROLLED','-0.02em'),
    white_LETS_WORK: mk('LET\u2019S WORK','normal'),
    white_TOGETHER: mk('TOGETHER','normal'),
    white_LETS_WORK_TOG: mk('LET\u2019S WORK TOGETHER','normal'),
  };
});
console.log(JSON.stringify(w));
await b.close();
