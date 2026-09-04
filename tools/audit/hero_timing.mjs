import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless:true });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil:'load', timeout:60000 });
await p.waitForTimeout(2000);
const data = await p.evaluate(async ()=>{
  const roles=['DESIGNER','STRATEGIST','RESEARCHER','STORYTELLER','COPY WRITER','ANIMATOR'];
  // find the ticker: element whose text is a role and has an animated ancestor with transform translateY
  let roleEl=[...document.querySelectorAll('*')].find(e=>e.children.length===0 && roles.includes(e.textContent.trim()) && e.getBoundingClientRect().height>40);
  // climb to the moving stack (ancestor with transform matrix ty changing) - pick parent that has transform
  let stack=roleEl; for(let i=0;i<5&&stack.parentElement;i++){ if(getComputedStyle(stack).transform!=='none'){break;} stack=stack.parentElement; }
  // badge rotating svg
  const badgeSvg=[...document.querySelectorAll('svg')].find(s=>/curve/.test(s.innerHTML)&&s.closest('*')&&/TOGETHER/i.test((s.closest('[data-framer-name]')||document.body).textContent||''));
  const samples=[];
  const t0=performance.now();
  // which role is centered (top of viewport area ~ y 400-700)
  function centeredRole(){
    let best=null,bestd=1e9;
    for(const e of document.querySelectorAll('*')){ if(e.children.length) continue; const t=e.textContent.trim(); if(!roles.includes(t)) continue; const r=e.getBoundingClientRect(); if(r.height<60) continue; const cy=r.top+r.height/2; const d=Math.abs(cy-620); if(r.top>300&&r.top<900&&d<bestd){bestd=d;best=t;} }
    return best;
  }
  let last=null;
  while(performance.now()-t0<16000){
    const now=Math.round(performance.now()-t0);
    const cr=centeredRole();
    const stf=getComputedStyle(stack).transform;
    const btf=badgeSvg?getComputedStyle(badgeSvg).transform:'none';
    if(cr!==last){ samples.push({t:now, role:cr, stackTf:stf.slice(0,30), badgeTf:btf.slice(0,40)}); last=cr; }
    await new Promise(r=>setTimeout(r,50));
  }
  return {samples, badgeFound:!!badgeSvg};
});
await writeFile(join(__dirname,'out','hero','hero_timing.json'), JSON.stringify(data,null,2));
console.log('badgeFound',data.badgeFound);
for(const s of data.samples) console.log('t='+s.t, 'role='+s.role, 'badgeTf='+s.badgeTf);
await b.close();
