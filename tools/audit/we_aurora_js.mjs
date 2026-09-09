import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs=[]; p.on('console', m=>{ if(m.type()==='error' && !/fetchPriority|fetchpriority/i.test(m.text())) errs.push(m.text().slice(0,90)); });
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(()=>{});
await p.waitForTimeout(1000);
console.log('errors:', errs.slice(0,3));
const n = await p.evaluate(() => document.querySelectorAll('.hero__aurora-blob').length);
console.log('blob divs:', n);
for (let i=0;i<6;i++){
  const t = await p.evaluate(() => { const g=(s)=>{const e=document.querySelector(s); const cs=getComputedStyle(e); const m=new DOMMatrix(cs.transform); return {tx:+m.e.toFixed(1),ty:+m.f.toFixed(1),sc:+m.a.toFixed(3),op:+cs.opacity}}; return {a:g('.hero__aurora-blob--a'), b:g('.hero__aurora-blob--b')}; });
  console.log('t'+(i*500)+'ms  A', JSON.stringify(t.a), ' B', JSON.stringify(t.b));
  await p.waitForTimeout(500);
}
await b.close();
