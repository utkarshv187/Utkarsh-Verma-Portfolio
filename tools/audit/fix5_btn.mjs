import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.waitForTimeout(500);

// locate about section top via the ENGINEER TURNED ARTIST / MORE ABOUT ME text loosely
const aboutY = await p.evaluate(() => {
  for (const el of [...document.querySelectorAll('*')]) { const t = (el.textContent || '').replace(/\s+/g, ' ').trim(); if (/MORE ABOUT ME/i.test(t) && t.length < 40) return Math.round(el.getBoundingClientRect().top + scrollY); }
  return null;
});
console.log('aboutY:', aboutY, ' pageH:', await p.evaluate(() => document.body.scrollHeight));

const sel = '.framer-q53ii-container';
const inner = await p.evaluate((sel) => {
  const c = document.querySelector(sel); if (!c) return null;
  const kids = [...c.querySelectorAll('*')].slice(0, 6).map((el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, radius: cs.borderRadius, boxShadow: cs.boxShadow.slice(0, 40), border: cs.border.slice(0, 30) }; });
  return kids;
}, sel);
console.log('button inner boxes:', JSON.stringify(inner, null, 1));

async function state(label, y) {
  await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(650);
  const s = await p.evaluate((sel) => { const c = document.querySelector(sel); if (!c) return null; const cs = getComputedStyle(c); const r = c.getBoundingClientRect(); return { transform: cs.transform, opacity: cs.opacity, visibility: cs.visibility, pointerEvents: cs.pointerEvents, x: Math.round(r.left), y: Math.round(r.top) }; }, sel);
  console.log(`  [${label} @${y}]`, JSON.stringify(s));
}
console.log('\nvisibility across scroll:');
await state('top', 0);
if (aboutY) {
  await state('about-350above', aboutY - 350);
  await state('about-enter', aboutY - 60);
  await state('about+800', aboutY + 800);
}
await state('near-bottom', await p.evaluate(() => document.body.scrollHeight - 1000));
await state('very-bottom', await p.evaluate(() => document.body.scrollHeight));
await state('back-top', 0);

// hover state: scroll to where it's visible, hover, capture diffs
if (aboutY) { await p.evaluate((y) => scrollTo(0, y + 800), aboutY); await p.waitForTimeout(650); }
const before = await p.evaluate((sel) => { const c = document.querySelector(sel); const inner = c.querySelector('*'); const cs = getComputedStyle(inner || c); return { transform: getComputedStyle(c).transform, innerBg: cs.backgroundColor, innerTransform: cs.transform }; }, sel);
const box = await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
await p.mouse.move(box.x, box.y); await p.waitForTimeout(500);
const after = await p.evaluate((sel) => { const c = document.querySelector(sel); const inner = c.querySelector('*'); const cs = getComputedStyle(inner || c); return { transform: getComputedStyle(c).transform, innerBg: cs.backgroundColor, innerTransform: cs.transform }; }, sel);
console.log('\nhover before:', JSON.stringify(before), '\nhover after :', JSON.stringify(after));
await b.close();
