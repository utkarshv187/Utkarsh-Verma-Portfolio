import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless:true });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil:'load', timeout:60000 });
await p.waitForTimeout(2000);
// warm scroll to mount work experience
await p.evaluate(async()=>{const m=document.body.scrollHeight;for(let y=0;y<m;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,140));}scrollTo(0,0);await new Promise(r=>setTimeout(r,400));});
// find an italic Satoshi node
const found = await p.evaluate(()=>{
  const els=[...document.querySelectorAll('*')].filter(e=>e.children.length===0 && e.textContent.trim().length>3 && getComputedStyle(e).fontStyle==='italic' && /Satoshi/.test(getComputedStyle(e).fontFamily));
  return els.slice(0,5).map((e,i)=>{ e.setAttribute('data-it', 'it'+i); const c=getComputedStyle(e); return {i, text:e.textContent.trim().slice(0,40), fontStyle:c.fontStyle, fontWeight:c.fontWeight, fam:c.fontFamily.split(',')[0], docY: Math.round(e.getBoundingClientRect().top+scrollY)}; });
});
// for the first italic node, sample its transform (skew) at several scroll positions
let samples=[];
if(found.length){
  const y0 = found[0].docY;
  for(const off of [-300,-150,0,150,300]){
    const target = Math.max(0, y0 - 450 + off);
    await p.evaluate(t=>scrollTo(0,t), target);
    await p.waitForTimeout(400);
    const s = await p.evaluate(()=>{ const e=document.querySelector('[data-it="it0"]'); if(!e) return null; const c=getComputedStyle(e); const m=new DOMMatrix(c.transform); return { scrollY:Math.round(scrollY), transform:c.transform, shear_c: Math.round(m.c*1000)/1000, a:Math.round(m.a*1000)/1000, b:Math.round(m.b*1000)/1000, d:Math.round(m.d*1000)/1000 }; }).catch(()=>null);
    samples.push(s);
  }
}
await writeFile(join(__dirname,'out','hero','italic.json'), JSON.stringify({found, samples},null,2));
console.log('italic nodes:', found.length, found.map(f=>f.text));
console.log('samples:', JSON.stringify(samples,null,1));
await b.close();
