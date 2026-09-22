import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(()=>{});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=innerHeight*0.5){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} });
await p.waitForTimeout(500);
const pageH = await p.evaluate(()=>document.body.scrollHeight);
// footer top ~9945; capture the dark->gold reveal from ~9200 to ~10000
let i=0;
for (let y=9200; y<=10100; y+=220){ await p.evaluate(v=>scrollTo(0,v),y); await p.waitForTimeout(650); await p.screenshot({path:`audit/out/footer/reveal_${String(i).padStart(2,'0')}_y${y}.png`}); i++; }
console.log('reveal frames', i);
await b.close();
