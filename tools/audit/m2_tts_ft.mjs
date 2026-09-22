import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function shots(url, label){
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' }).catch(()=>{});
  await p.waitForTimeout(url.includes('framer')?2400:1200);
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=380){scrollTo(0,y);await new Promise(r=>setTimeout(r,70));}scrollTo(0,0);await new Promise(r=>setTimeout(r,300));});
  // testimonials
  const tY = await p.evaluate(()=>{const norm=s=>(s||'').replace(/\s+/g,' ').trim();for(const el of document.querySelectorAll('h1,h2,h3,span,div')){if(/THINGS THEY SAY|KIND WORDS|WHAT.*SAY/i.test(norm(el.textContent))&&norm(el.textContent).length<30){return el.getBoundingClientRect().top+window.scrollY;}}return null;});
  if(tY){await p.evaluate(y=>scrollTo(0,y-20),tY);await p.waitForTimeout(500);await p.screenshot({path:`audit/out/mobile/${label}_tts.png`});}
  // footer
  const fY = await p.evaluate(()=>{const norm=s=>(s||'').replace(/\s+/g,' ').trim();for(const el of document.querySelectorAll('a,div,span')){if(/8869808079/.test(norm(el.textContent))){let n=el;for(let i=0;i<6;i++){n=n.parentElement;if(!n)break;const r=n.getBoundingClientRect();if(r.height>200)return r.top+window.scrollY-100;}return el.getBoundingClientRect().top+window.scrollY-200;}}return document.body.scrollHeight-844;});
  await p.evaluate(y=>scrollTo(0,Math.max(0,y)),fY);await p.waitForTimeout(500);await p.screenshot({path:`audit/out/mobile/${label}_ft.png`});
  await ctx.close();
}
await shots('https://uxuiuv.framer.website/','live');
await shots('http://localhost:5199/','mine');
await b.close();
console.log('done');
