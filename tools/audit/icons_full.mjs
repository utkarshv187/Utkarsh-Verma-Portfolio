import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless:true });
const ctx = await b.newContext({ viewport:{width:390,height:844} });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil:'load', timeout:60000 });
await p.waitForTimeout(2000);
const res = await p.evaluate(()=>{
  const nav=[...document.querySelectorAll('[data-framer-name="navbar"]')].find(el=>el.getBoundingClientRect().width>0 && el.getBoundingClientRect().top<200);
  const out=[];
  for(const a of nav.querySelectorAll('a')){
    const href=a.getAttribute('href'); let full=null;
    for(const el of a.querySelectorAll('*')){ const bi=getComputedStyle(el).backgroundImage; if(bi&&bi.includes('svg')){ full=decodeURIComponent(bi); break; } }
    out.push({href, full});
  }
  return out;
});
await writeFile(join(__dirname,'out','hero','icons_full.json'), JSON.stringify(res,null,2));
console.log('done', res.length);
