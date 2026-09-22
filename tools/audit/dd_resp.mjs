import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const [url,label] of [['http://localhost:5199/','mine'],['https://uxuiuv.framer.website/','live']]){
  for (const W of [1920,1280,1024,768,430,360]){
    const p = await (await b.newContext({ viewport:{width:W,height:900} })).newPage();
    const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,50)));
    await p.goto(url,{waitUntil:'load'}).catch(()=>{});
    await p.waitForTimeout(url.includes('framer')?2200:800);
    const r = await p.evaluate(()=>({ sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth }));
    const overflow = r.sw - r.cw;
    console.log(`${label} ${String(W).padEnd(5)} overflowX=${overflow>2?('YES +'+overflow):'no'} errors=${errs.length}${errs.length?' '+errs[0]:''}`);
    await p.close();
  }
}
await b.close();
