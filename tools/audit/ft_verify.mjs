import { chromium } from 'playwright';
import fs from 'fs';
const dir='audit/out/footer'; fs.mkdirSync(dir,{recursive:true});
const b = await chromium.launch({ headless: true });
const errs=[];
// reveal transition at 1440
const p = await (await b.newContext({ viewport:{width:1440,height:900}, reducedMotion:'no-preference' })).newPage();
p.on('pageerror',e=>errs.push(e.message.slice(0,90)));
await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
await p.waitForTimeout(900);
const fy = await p.evaluate(()=>document.querySelector('.footer').getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
const pageH = await p.evaluate(()=>document.body.scrollHeight);
console.log('footer top', Math.round(fy), 'pageH', pageH, 'footer scroll span', Math.round(pageH-fy));
// reveal frames
let i=0;
for(const off of [-500,-250,0,300,700]){ const y=fy+off; await p.evaluate(v=>{window.scrollTo(0,v);document.documentElement.scrollTop=v;document.body.scrollTop=v;},y); await p.waitForTimeout(500); await p.screenshot({path:`${dir}/rev_${i}_off${off}.png`}); i++; }
// GTT click from footer -> scroll to top
await p.evaluate(v=>{window.scrollTo(0,v);document.documentElement.scrollTop=v;document.body.scrollTop=v;}, fy+400); await p.waitForTimeout(400);
const beforeTop = await p.evaluate(()=>window.scrollY||document.body.scrollTop);
await p.evaluate(()=>{ const g=document.querySelector('.gtt'); g && g.click(); }); await p.waitForTimeout(1200);
const afterTop = await p.evaluate(()=>window.scrollY||document.body.scrollTop);
console.log('GTT click: scroll', beforeTop, '->', Math.round(afterTop), afterTop<200?'(to top OK)':'(FAILED)');
await p.close();

// quick check 1280 + 1920 heading wrap
for(const W of [1280,1920]){
  const q = await (await b.newContext({ viewport:{width:W,height:900} })).newPage();
  await q.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
  await q.waitForTimeout(800);
  const f = await q.evaluate(()=>document.querySelector('.footer').getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
  await q.evaluate(v=>{window.scrollTo(0,v);document.documentElement.scrollTop=v;document.body.scrollTop=v;}, f+600); await q.waitForTimeout(600);
  const info = await q.evaluate(()=>{ const q=document.querySelector('.footer__q .footer__t:not([style*="none"])'); const shownQ=[...document.querySelectorAll('.footer__q .footer__t')].find(s=>getComputedStyle(s).display!=='none'); const shownC=[...document.querySelectorAll('.footer__cta .footer__t')].find(s=>getComputedStyle(s).display!=='none'); const badge=document.querySelector('.footer__badge img'); return { qText:shownQ&&shownQ.textContent, qSize:shownQ&&getComputedStyle(shownQ).fontSize, ctaText:shownC&&shownC.textContent, badge: badge? {w:Math.round(badge.getBoundingClientRect().width), fromRight: Math.round(W-badge.getBoundingClientRect().right)}:null }; });
  console.log(`W${W}:`, JSON.stringify(info));
  await q.screenshot({ path:`${dir}/mine_w${W}.png` });
  await q.close();
}
console.log('ERRORS:', errs.length, errs);
await b.close();
