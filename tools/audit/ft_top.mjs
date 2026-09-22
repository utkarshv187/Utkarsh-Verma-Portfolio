import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(()=>{});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=innerHeight*0.5){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} });
await p.waitForTimeout(500);
const pageH = await p.evaluate(()=>document.body.scrollHeight);
// footer top ~ pageH-8074; scan down from there
let i=0;
for (let y=pageH-8100; y<=pageH-5600; y+=800){ await p.evaluate(v=>scrollTo(0,v),y); await p.waitForTimeout(700); await p.screenshot({path:`audit/out/footer/top_${String(i).padStart(2,'0')}_y${Math.round(y)}.png`}); i++; }
console.log('captured', i, 'top frames, pageH', pageH, 'footerTop~', pageH-8074);
await b.close();
