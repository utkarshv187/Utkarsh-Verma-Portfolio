import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function view(W,H,label,mode){
  const p = await (await b.newContext({ viewport:{width:W,height:H}, reducedMotion:'no-preference' })).newPage();
  await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
  await p.waitForTimeout(900);
  const fy = await p.evaluate(()=>document.querySelector('.footer').getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
  let y;
  if(mode==='pin') y = fy + Math.round(H*0.4); // desktop: into the pin
  else { // tablet/mobile: scroll so pills+badge sit in view (footer top + heading block)
    const pillY = await p.evaluate(()=>{ const pl=document.querySelector('.footer__pill'); return pl? pl.getBoundingClientRect().top+(window.scrollY||document.body.scrollTop):0; });
    y = pillY - Math.round(H*0.45);
  }
  await p.evaluate((v)=>{window.scrollTo(0,v);document.documentElement.scrollTop=v;document.body.scrollTop=v;}, y);
  await p.waitForTimeout(700);
  await p.screenshot({ path:`audit/out/footer/view_${label}.png` });
  console.log('saved view_'+label);
  await p.close();
}
await view(1440,900,'1440','pin');
await view(1024,900,'1024','flow');
await view(390,844,'390','flow');
await b.close();
