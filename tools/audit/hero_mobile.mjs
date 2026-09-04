import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless:true });
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil:'load', timeout:60000 });
await p.waitForTimeout(2500);
const res = await p.evaluate(()=>{
  const info=(el,tag)=>{if(!el)return null;const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return{tag,x:Math.round(r.x),y:Math.round(r.y+scrollY),w:Math.round(r.width),h:Math.round(r.height),fs:cs.fontSize,opacity:cs.opacity,color:cs.color,z:cs.zIndex};};
  const out={};
  const prod=[...document.querySelectorAll('*')].find(e=>e.children.length===0 && /PR\s*DUCT|PRODUCT/.test(e.textContent.trim()) && e.getBoundingClientRect().width>100);
  out.product=info(prod,'PRODUCT');
  const roles=['DESIGNER','STRATEGIST','RESEARCHER','STORYTELLER','COPY WRITER','ANIMATOR'];
  out.roles=roles.map(rr=>{const e=[...document.querySelectorAll('*')].find(x=>x.children.length===0&&x.textContent.trim()===rr&&x.getBoundingClientRect().width>50);return info(e,rr);});
  out.portrait=info([...document.querySelectorAll('img')].find(i=>i.src.includes('IWdo08dy')),'portrait');
  out.graffiti=info([...document.querySelectorAll('img')].find(i=>i.src.includes('eNT4Xgz')),'graffiti');
  out.badge=info([...document.querySelectorAll('*')].find(e=>/TOGETHER/i.test(e.textContent)&&e.querySelector('svg,path')&&e.getBoundingClientRect().width<300&&e.getBoundingClientRect().width>30),'badge');
  // yellow graphic: element with yellow bg/stroke in hero region
  const yellows=[];
  for(const el of document.querySelectorAll('div')){const cs=getComputedStyle(el);const bi=cs.backgroundImage;const r=el.getBoundingClientRect();if(r.top<1600&&r.width>40&&(bi.includes('255, 18')||bi.includes('rgb(255, 183')||bi.includes('yellow')||cs.backgroundColor.includes('255, 18'))){yellows.push({w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.x),y:Math.round(r.y+scrollY),bi:bi.slice(0,60)});}}
  out.yellows=yellows.slice(0,6);
  // hero section container radius
  const hero=[...document.querySelectorAll('[data-framer-name]')].find(e=>{const r=e.getBoundingClientRect();return r.width>300&&r.top<300&&r.height>600;});
  out.heroSection = hero?{name:hero.getAttribute('data-framer-name'),radius:getComputedStyle(hero).borderRadius,bg:getComputedStyle(hero).backgroundColor,h:Math.round(hero.getBoundingClientRect().height)}:null;
  return out;
});
await writeFile(join(__dirname,'out','hero','hero_mobile.json'), JSON.stringify(res,null,2));
console.log(JSON.stringify(res,null,1));
await b.close();
