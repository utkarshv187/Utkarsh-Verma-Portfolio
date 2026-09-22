import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.evaluate(() => scrollTo(0, 9000)); await p.waitForTimeout(800);
const sel = '.framer-q53ii-container';
const box = await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);

// find the ring element: the one whose textContent has GO TO TOP (once hovered)
await p.mouse.move(box.x, box.y);
async function ringInfo() {
  return await p.evaluate((sel) => {
    const c = document.querySelector(sel);
    // element that directly wraps the circular text
    const cand = [...c.querySelectorAll('*')].filter((el) => /GO\s*TO\s*TOP/i.test((el.textContent || '')) );
    // pick the deepest small one
    cand.sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);
    const ring = cand[0];
    if (!ring) return { found: false, chars: null };
    // per-char spans? sample transforms of a few children
    const kids = [...ring.children].slice(0, 4).map((k) => getComputedStyle(k).transform.slice(0, 30));
    const cs = getComputedStyle(ring);
    // the animated wrapper is likely ring itself or its parent — read rotation of ring + parent
    const parent = ring.parentElement;
    return { found: true, txt: (ring.textContent || '').replace(/\s+/g, ' ').trim(), ringTransform: cs.transform, ringOpacity: cs.opacity, ringAnim: cs.animationName, ringDur: cs.animationDuration, font: cs.fontFamily.slice(0, 20), fontSize: cs.fontSize, fill: cs.color, parentTransform: parent ? getComputedStyle(parent).transform : null, parentAnim: parent ? getComputedStyle(parent).animationName : null, kids };
  }, sel);
}
await p.waitForTimeout(150);
const t0 = await ringInfo();
await p.waitForTimeout(1000);
const t1 = await ringInfo();
console.log('t=0.15s:', JSON.stringify(t0, null, 1));
console.log('\nt=1.15s:', JSON.stringify(t1, null, 1));
// unhover -> does it disappear?
await p.mouse.move(box.x - 400, box.y - 400); await p.waitForTimeout(500);
const off = await p.evaluate((sel) => { const c = document.querySelector(sel); return { allText: (c.textContent || '').replace(/\s+/g, ' ').trim() }; }, sel);
console.log('\nafter unhover:', JSON.stringify(off));
await b.close();
