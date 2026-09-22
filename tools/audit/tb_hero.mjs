import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const W of [1920,1600,1440,1360,1281,1279,1200,1024,900,810,809,768]){
  const p = await (await b.newContext({ viewport:{width:W,height:900} })).newPage();
  await p.goto('https://uxuiuv.framer.website/',{waitUntil:'load'}).catch(()=>{});
  await p.waitForTimeout(2200);
  const d = await p.evaluate(()=>{
    const vis=(el)=>{const cs=getComputedStyle(el);const r=el.getBoundingClientRect();return cs.display!=='none'&&+cs.opacity>0.02&&r.width>0;};
    let hero=null,hs=0; for(const el of document.querySelectorAll('h1,h2,span,div')){const t=(el.textContent||'').replace(/\s+/g,' ').trim(); if(/PR.?DUCT|PRODUCT/.test(t)&&t.length<12&&vis(el)){const fs=parseFloat(getComputedStyle(el).fontSize)||0; if(fs>hs){hs=fs;hero=el;}}}
    let role=null,rs=0; for(const el of document.querySelectorAll('h1,h2,span,div')){const t=(el.textContent||'').replace(/\s+/g,' ').trim(); if(/^(DESIGNER|RESEARCHER|STRATEGIST|STORYTELLER|COPY WRITER|ANIMATOR)$/.test(t)&&vis(el)){const fs=parseFloat(getComputedStyle(el).fontSize)||0; if(fs>rs){rs=fs;role=el;}}}
    return { product: hero?Math.round(parseFloat(getComputedStyle(hero).fontSize)):null, role: role?Math.round(parseFloat(getComputedStyle(role).fontSize)):null };
  });
  console.log(`W${String(W).padEnd(5)} PRODUCT=${d.product}  role=${d.role}`);
  await p.close();
}
await b.close();
