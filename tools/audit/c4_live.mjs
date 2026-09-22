import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/',{waitUntil:'load'}).catch(()=>{});
await p.waitForTimeout(2500);
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=innerHeight*0.5){scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}});
await p.waitForTimeout(400);
// find the card with "Welcome Mr" / "Dream It" collage — scroll so it's pinned & visible
// locate the tall listing image or the collage; use the "Other small & big projects" title
const y = await p.evaluate(()=>{ for(const el of document.querySelectorAll('*')){ if(/Other small & big projects/i.test(el.textContent||'') && el.textContent.length<70){ const card=el.closest('a'); return (card||el).getBoundingClientRect().top+scrollY; } } return null; });
if(y!=null){ await p.evaluate((yy)=>scrollTo(0,yy-60), y); await p.waitForTimeout(900); }
await p.screenshot({ path:'audit/out/diff/c4_live.png', clip:{x:60,y:120,width:640,height:640} });
console.log('saved c4_live, y=',y);
await b.close();
