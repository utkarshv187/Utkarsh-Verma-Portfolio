import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless:true });
const c = await b.newContext({ viewport:{width:1440,height:1200}, deviceScaleFactor:2 });
const p = await c.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil:'load', timeout:60000 });
await p.waitForTimeout(2000);
await p.evaluate(async()=>{const m=document.body.scrollHeight;for(let y=0;y<m;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,200));}scrollTo(0,0);await new Promise(r=>setTimeout(r,500));});
// locate testimonial heading
const y = await p.evaluate(()=>{const e=[...document.querySelectorAll('*')].find(x=>x.children.length===0 && /REAL\s+WORK,\s+REAL\s+WORDS/i.test(x.textContent)); return e?e.getBoundingClientRect().top+scrollY:0;});
for (let k=0;k<4;k++){
  await p.evaluate(yy=>scrollTo(0,yy), y-60);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: join(__dirname,'out',`testi_${k}.png`), clip:{x:0,y:200,width:1440,height:1000} });
}
// also try to read text now that it's in view
const txt = await p.evaluate(()=>{
  const out=[];
  for(const el of document.querySelectorAll('p,div,span')){
    const t=el.innerText?el.innerText.trim():'';
    if(t.length>60 && /Utkarsh|worked|design|product|team|Spinny|Prakash|recommend|asset|first principles/i.test(t) && el.children.length<=3){
      out.push(t.replace(/\s+/g,' '));
    }
  }
  return [...new Set(out)];
});
import('node:fs').then(fs=>fs.writeFileSync(join(__dirname,'out','testi_text.json'), JSON.stringify(txt,null,1)));
console.log('captured 4 frames; text blocks:', txt.length);
await b.close();
