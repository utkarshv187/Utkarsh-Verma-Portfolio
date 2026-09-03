import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless:true });
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil:'load', timeout:60000 });
await p.waitForTimeout(2000);
const res = await p.evaluate(()=>{
  const out=[];
  for(const el of document.querySelectorAll('*')){
    const bg=getComputedStyle(el).backgroundImage;
    if(bg && bg.includes('52.918')){
      out.push(decodeURIComponent(bg));
    }
  }
  return [...new Set(out)];
});
await writeFile(join(__dirname,'out','hero','logo_full.json'), JSON.stringify(res,null,2));
console.log('found', res.length);
if(res[0]) console.log(res[0].slice(0,1200));
await b.close();
