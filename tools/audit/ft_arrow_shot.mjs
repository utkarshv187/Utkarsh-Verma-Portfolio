import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2 })).newPage();
await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
await p.waitForTimeout(900);
const fy = await p.evaluate(()=>document.querySelector('.footer').getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
await p.evaluate((y)=>{const t=y+700;window.scrollTo(0,t);document.documentElement.scrollTop=t;document.body.scrollTop=t;}, fy); await p.waitForTimeout(700);
await p.locator('.footer__pill--wa').hover(); await p.waitForTimeout(450);
// clip around the pills row
const box = await p.evaluate(()=>{ const pills=[...document.querySelectorAll('.footer__pill')]; const rs=pills.map(a=>a.getBoundingClientRect()); const l=Math.min(...rs.map(r=>r.left)), t=Math.min(...rs.map(r=>r.top)), r=Math.max(...rs.map(x=>x.right)), bt=Math.max(...rs.map(x=>x.bottom)); return {x:Math.round(l)-14,y:Math.round(t)-14,w:Math.round(r-l)+28,h:Math.round(bt-t)+28}; });
await p.screenshot({ path:'audit/out/footer/mine_pill_hover.png', clip: box });
console.log('saved');
await b.close();
