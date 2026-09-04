import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless:true });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil:'load', timeout:60000 });
await p.waitForTimeout(2500);
const res = await p.evaluate(()=>{
  const out={};
  // badge: smallest element containing all of LET'S/WORK/TOGETHER with an svg/path
  const cands=[...document.querySelectorAll('*')].filter(e=>/TOGETHER/i.test(e.textContent) && e.querySelector('svg,path,textPath') && e.getBoundingClientRect().width>40 && e.getBoundingClientRect().width<400);
  cands.sort((a,b)=>a.getBoundingClientRect().width-b.getBoundingClientRect().width);
  const badge=cands[0];
  if(badge){
    const r=badge.getBoundingClientRect(); const cs=getComputedStyle(badge);
    out.badge={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),href:badge.closest('a')?badge.closest('a').getAttribute('href'):null};
    // the rotating child + its animation
    const rotating=[badge,...badge.querySelectorAll('*')].map(el=>({name:el.getAttribute('data-framer-name')||el.tagName, anim:getComputedStyle(el).animation.slice(0,60), tf:getComputedStyle(el).transform.slice(0,30)})).filter(x=>x.anim&&x.anim!=='none 0s ease 0s 1 normal none running'||x.tf!=='none');
    out.rotating=rotating.slice(0,8);
    // svg outerHTML (circular text)
    const svg=badge.querySelector('svg');
    out.svg = svg? svg.outerHTML.slice(0,600):null;
    // textPath content
    const tp=badge.querySelector('textPath, text');
    out.badgeText = tp? tp.textContent : badge.textContent.trim().slice(0,60);
  }
  // PRODUCT parts
  const prod=[...document.querySelectorAll('*')].filter(e=>e.children.length===0 && /^PR\s+DUCT$|^PRODUCT$/.test(e.textContent.trim()) && e.getBoundingClientRect().width>200)[0];
  const o=[...document.querySelectorAll('*')].filter(e=>e.children.length===0 && e.textContent.trim()==='O' && e.getBoundingClientRect().width>20)[0];
  const info=(el)=>{if(!el)return null;const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return{text:el.textContent.trim(),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),fs:cs.fontSize,ls:cs.letterSpacing,bgClip:cs.webkitBackgroundClip||cs.backgroundClip,bgImage:cs.backgroundImage.slice(0,70)};};
  out.product=info(prod); out.O=info(o);
  return out;
});
await writeFile(join(__dirname,'out','hero','hero_badge.json'), JSON.stringify(res,null,2));
console.log('badge:',JSON.stringify(res.badge));
console.log('badgeText:',res.badgeText);
console.log('rotating:',JSON.stringify(res.rotating));
console.log('product:',JSON.stringify(res.product));
console.log('O:',JSON.stringify(res.O));
console.log('svg:',res.svg?res.svg.slice(0,400):null);
await b.close();
