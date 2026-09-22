import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for(const W of [1280,1920]){
  const q = await (await b.newContext({ viewport:{width:W,height:900} })).newPage();
  await q.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
  await q.waitForTimeout(800);
  const f = await q.evaluate(()=>document.querySelector('.footer').getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
  await q.evaluate(v=>{window.scrollTo(0,v);document.documentElement.scrollTop=v;document.body.scrollTop=v;}, f+700); await q.waitForTimeout(600);
  const info = await q.evaluate((vw)=>{ const shownQ=[...document.querySelectorAll('.footer__q .footer__t')].find(s=>getComputedStyle(s).display!=='none'); const shownC=[...document.querySelectorAll('.footer__cta .footer__t')].find(s=>getComputedStyle(s).display!=='none'); const badge=document.querySelector('.footer__badge img'); const br=badge&&badge.getBoundingClientRect(); const pills=[...document.querySelectorAll('.footer__pill')].map(a=>Math.round(a.getBoundingClientRect().top)); return { qText:shownQ&&shownQ.textContent, qSize:shownQ&&getComputedStyle(shownQ).fontSize, ctaText:shownC&&shownC.textContent, badgeW: br&&Math.round(br.width), badgeFromRight: br&&Math.round(vw-br.right), pillsRow: pills }; }, W);
  console.log(`W${W}:`, JSON.stringify(info));
  await q.screenshot({ path:`audit/out/footer/mine_w${W}.png` });
  await q.close();
}
await b.close();
