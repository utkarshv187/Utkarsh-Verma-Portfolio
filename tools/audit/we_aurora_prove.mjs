import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(()=>{});
await p.waitForTimeout(1000);
// environment + blockers
const env = await p.evaluate(() => {
  const a = document.querySelector('.hero__aurora');
  const cs = getComputedStyle(a);
  const bcs = getComputedStyle(a, '::before');
  return {
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    auroraBg: cs.backgroundImage.slice(0,40), auroraZ: cs.zIndex, auroraOpacity: cs.opacity,
    beforeAnimName: bcs.animationName, beforeAnimDur: bcs.animationDuration, beforeAnimPlay: bcs.animationPlayState, beforeContent: bcs.content, beforeDisplay: bcs.display,
  };
});
console.log('ENV:', JSON.stringify(env));
// sample ::before and ::after transform over ~4s
for (let i=0;i<7;i++){
  const t = await p.evaluate(() => {
    const a = document.querySelector('.hero__aurora');
    const gt = (pe) => { const m = new DOMMatrix(getComputedStyle(a, pe).transform); return { sx:+m.a.toFixed(3), tx:+m.e.toFixed(1), ty:+m.f.toFixed(1) }; };
    return { before: gt('::before'), after: gt('::after') };
  });
  console.log('t'+(i*600)+'ms  ::before', JSON.stringify(t.before), '  ::after', JSON.stringify(t.after));
  await p.waitForTimeout(600);
}
await b.close();
