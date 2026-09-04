import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless:true });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil:'load', timeout:60000 });
await p.waitForTimeout(2500);
// full hero first
await p.screenshot({ path: join(__dirname,'out','hero','hero_full_ref.png'), clip:{x:0,y:0,width:1440,height:900} });
// hide foreground: imgs + text spans + the badge link + svgs in hero
await p.evaluate(()=>{
  for(const img of document.querySelectorAll('img')){ const r=img.getBoundingClientRect(); if(r.top<1100) img.style.visibility='hidden'; }
  for(const el of document.querySelectorAll('span,p,h1,h2,a')){ const r=el.getBoundingClientRect(); if(r.top<1100 && r.width>0) el.style.visibility='hidden'; }
});
await p.waitForTimeout(300);
await p.screenshot({ path: join(__dirname,'out','hero','hero_bg_only.png'), clip:{x:0,y:0,width:1440,height:900} });
console.log('done');
await b.close();
