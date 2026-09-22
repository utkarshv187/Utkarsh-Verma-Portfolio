import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const W of [1920,1440,1281,1024,768]){
  const p = await (await b.newContext({ viewport:{width:W,height:900} })).newPage();
  await p.goto('https://uxuiuv.framer.website/',{waitUntil:'load'}).catch(()=>{});
  await p.waitForTimeout(2200);
  const d = await p.evaluate(()=>{
    const vis=(el)=>{const cs=getComputedStyle(el);const r=el.getBoundingClientRect();return cs.display!=='none'&&+cs.opacity>0.02&&r.width>0;};
    let hero=null,hs=0; for(const el of document.querySelectorAll('h1,h2,span,div')){const t=(el.textContent||'').replace(/\s+/g,' ').trim(); if(/PR.?DUCT|PRODUCT/.test(t)&&t.length<12&&vis(el)){const fs=parseFloat(getComputedStyle(el).fontSize)||0; if(fs>hs){hs=fs;hero=el;}}}
    const port=[...document.querySelectorAll('img')].filter(im=>vis(im)&&im.getBoundingClientRect().top<800&&im.getBoundingClientRect().width>200).sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];
    const pr=hero?hero.getBoundingClientRect():null; const ir=port?port.getBoundingClientRect():null;
    return { productX: pr?Math.round(pr.left):null, productR: pr?Math.round(pr.right):null, productTop: pr?Math.round(pr.top):null, portraitX: ir?Math.round(ir.left):null, portraitR: ir?Math.round(ir.right):null, portraitW: ir?Math.round(ir.width):null };
  });
  console.log(`W${String(W).padEnd(5)} PRODUCT x=${d.productX} r=${d.productR} top=${d.productTop} | portrait x=${d.portraitX} r=${d.portraitR} w=${d.portraitW}`);
  await p.close();
}
await b.close();
