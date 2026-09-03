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
  const nav=[...document.querySelectorAll('[data-framer-name="navbar"]')].find(el=>el.getBoundingClientRect().width>0 && el.getBoundingClientRect().top<200);
  function resolveUse(scope){
    const uses=[...scope.querySelectorAll('use')];
    return uses.map(u=>{
      const href=(u.getAttribute('href')||u.getAttribute('xlink:href')||'').replace('#','');
      const sym=document.getElementById(href);
      return { href, symbol: sym? sym.outerHTML : null, viewBox: sym?sym.getAttribute('viewBox'):null };
    });
  }
  return { navUses: resolveUse(nav) };
});
await writeFile(join(__dirname,'out','hero','logo_svg.json'), JSON.stringify(res,null,2));
console.log('nav uses:', res.navUses.length);
for(const u of res.navUses) console.log(u.href, 'vb='+u.viewBox, 'len='+(u.symbol?u.symbol.length:0));
await b.close();
