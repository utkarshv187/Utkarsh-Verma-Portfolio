import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function shot(W, label, doHover) {
  const p = await (await b.newContext({ viewport: { width: W, height: 900 } })).newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(()=>{});
  await p.waitForTimeout(800);
  await p.evaluate(() => { const el=document.getElementById('more-about-me'); const y=el.getBoundingClientRect().top+(window.scrollY||document.body.scrollTop)+500; window.scrollTo(0,y); document.documentElement.scrollTop=y; document.body.scrollTop=y; });
  await p.waitForTimeout(700);
  if (doHover) { await p.hover('.gtt'); await p.waitForTimeout(600); }
  const r = await p.evaluate(()=>{ const b=document.querySelector('.gtt').getBoundingClientRect(); return {l:Math.round(b.left),t:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height)}; });
  const pad = 34;
  await p.screenshot({ path: `audit/out/gtt2/final_${label}.png`, clip: { x: Math.max(0,r.l-pad), y: Math.max(0,r.t-pad), width: r.w+pad*2, height: r.h+pad*2 } });
  console.log(label, 'saved', JSON.stringify(r));
  await p.close();
}
await shot(1440, 'desktop_default', false);
await shot(1440, 'desktop_hover', true);
await shot(390, 'mobile_default', false);
await b.close();
