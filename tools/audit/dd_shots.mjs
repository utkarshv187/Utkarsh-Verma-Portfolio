import { chromium } from 'playwright';
import fs from 'fs';
const URL = process.argv[2], LABEL = process.argv[3], W = Number(process.argv[4] || 1440);
const dir = `audit/out/diff/shots`; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(URL.includes('framer') ? 2500 : 900);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } scrollTo(0, 0); });
await p.waitForTimeout(600);
// find Y (absolute) of each section heading
const anchors = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const findY = (t) => { let best = null; for (const el of document.querySelectorAll('h1,h2,h3,p,span,div')) { if (norm(el.textContent).includes(t) && el.children.length <= 3) { const fs = parseFloat(getComputedStyle(el).fontSize) || 0; const r = el.getBoundingClientRect(); if (r.width > 0 && (!best || fs > best.fs)) best = { y: Math.round(r.top + scrollY), fs }; } } return best ? best.y : null; };
  return {
    hero: 0,
    we: findY('WORK EXPERIENCE'),
    rw: findY('RECENT WORK'),
    testi: findY('THEY SAY') || findY('WHAT PEOPLE') || findY('TESTIMONIAL'),
    about: findY('MORE ABOUT ME'),
    hobbies: findY('WHEN I AM NOT') || findY('GAMING'),
    photo: findY('PHOTOGRAPHING'),
    footer: findY('SCROLLED') || findY('CAME THIS'),
  };
});
for (const [name, y] of Object.entries(anchors)) {
  if (y == null) { console.log(name, 'not found'); continue; }
  const scrollY = name === 'hero' ? 0 : Math.max(0, y - 120);
  await p.evaluate((v) => scrollTo(0, v), scrollY); await p.waitForTimeout(650);
  await p.screenshot({ path: `${dir}/${LABEL}_${W}_${name}.png` });
}
console.log(LABEL, W, 'anchors:', JSON.stringify(anchors));
await b.close();
