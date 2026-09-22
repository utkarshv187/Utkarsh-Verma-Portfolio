import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
async function shot(W, H, label, doHover) {
  const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(() => { const el=document.getElementById('more-about-me'); const y=el.getBoundingClientRect().top+(window.scrollY||document.body.scrollTop)+600; window.scrollTo(0,y); document.documentElement.scrollTop=y; document.body.scrollTop=y; });
  await p.waitForTimeout(500);
  // wait until show=true
  for (let i=0;i<20;i++){ if(await p.evaluate(()=>document.querySelector('.gtt')?.classList.contains('gtt--show'))) break; await p.waitForTimeout(100); }
  await p.waitForTimeout(700); // settle slide-in
  if (doHover) { await p.hover('.gtt'); await p.waitForTimeout(700); }
  const clip = { x: W-220, y: H-220, width: 210, height: 210 };
  await p.screenshot({ path: `audit/out/gtt2/corner_${label}.png`, clip });
  console.log(label, 'show=', await p.evaluate(()=>document.querySelector('.gtt').classList.contains('gtt--show')));
  await p.close();
}
await shot(1440, 900, 'desktop_default', false);
await shot(1440, 900, 'desktop_hover', true);
await shot(390, 844, 'mobile_default', false);
await b.close();
