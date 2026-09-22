import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport:{width:1440,height:900}, reducedMotion:'no-preference' })).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,90)));
await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
await p.waitForTimeout(900);
const fy = await p.evaluate(()=>document.querySelector('.footer').getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
await p.evaluate((y)=>{const t=y+700;window.scrollTo(0,t);document.documentElement.scrollTop=t;document.body.scrollTop=t;}, fy); await p.waitForTimeout(700);
const items=[['wa','+91 8869808079'],['mail','utkarshv187@gmail.com'],['in','Connect']];
for(const [cls,txt] of items){
  const loc = p.locator(`.footer__pill--${cls}`);
  const read = ()=>p.evaluate((c)=>{ const a=document.querySelector(`.footer__pill--${c}`); const arw=a.querySelector('.footer__pill-arrow'); const svg=arw.querySelector('svg'); const cs=getComputedStyle(arw); const scs=svg?getComputedStyle(svg):null; return { pillW:Math.round(a.getBoundingClientRect().width), arrowW:Math.round(arw.getBoundingClientRect().width), arrowOpacity:cs.opacity, arrowColor:scs?scs.color:null, textColor:getComputedStyle(a.querySelector('.footer__pill-text')).color, textDecoration:getComputedStyle(a.querySelector('.footer__pill-text')).textDecorationLine }; }, cls);
  await p.mouse.move(30,30); await p.waitForTimeout(250);
  const before = await read();
  await loc.hover(); await p.waitForTimeout(400);
  const after = await read();
  console.log(cls, 'BEFORE', JSON.stringify(before));
  console.log(cls, 'HOVER ', JSON.stringify(after), '=> widen', after.pillW-before.pillW);
}
console.log('errors', errs.length, errs);
await b.close();
