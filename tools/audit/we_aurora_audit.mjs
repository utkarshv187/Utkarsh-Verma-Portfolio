import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);

const info = await p.evaluate(() => {
  const bigs = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 700 && r.top + window.scrollY < 60 && r.width > 800; });
  const hero = bigs.sort((a, c) => a.getBoundingClientRect().height - c.getBoundingClientRect().height)[0];
  const out = { heroBg: getComputedStyle(hero).background.slice(0, 80), canvas: !!hero.querySelector('canvas'), svg: hero.querySelectorAll('svg').length, layers: [] };
  // scan for gradient / blur / animated background layers
  [...hero.querySelectorAll('*')].forEach((e) => {
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    const hasRadial = /radial-gradient|conic-gradient/.test(cs.backgroundImage);
    const hasBlur = /blur/.test(cs.filter) || /blur/.test(cs.backdropFilter);
    const anim = cs.animationName !== 'none' ? cs.animationName : null;
    const tf = cs.transform !== 'none';
    const isText = /framer-text/.test((e.className || '').toString()) || e.tagName === 'H1' || e.tagName === 'P' || e.tagName === 'SPAN';
    if ((hasRadial || hasBlur || anim) && !isText && r.width > 100 && r.height > 100 && r.top < 950) {
      out.layers.push({
        dfn: e.getAttribute('data-framer-name'), cls: (e.className || '').toString().slice(0, 20),
        w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top),
        bgImg: cs.backgroundImage.slice(0, 90), bgColor: cs.backgroundColor,
        filter: cs.filter, opacity: cs.opacity, mixBlend: cs.mixBlendMode,
        anim, animDur: cs.animationDuration, animTiming: cs.animationTimingFunction, animIter: cs.animationIterationCount,
        transform: tf ? cs.transform.slice(0, 40) : 'none', zIndex: cs.zIndex, position: cs.position,
      });
    }
  });
  return out;
});
console.log(JSON.stringify(info, null, 1));
await b.close();
