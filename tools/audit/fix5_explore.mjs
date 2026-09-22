import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/fix5'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.waitForTimeout(500);

// find "about me" heading loosely
const aboutY = await p.evaluate(() => {
  for (const el of [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')]) {
    const t = (el.textContent || '').trim();
    if (/^more about me$/i.test(t) && el.children.length <= 1) return { y: Math.round(el.getBoundingClientRect().top + scrollY), tag: el.tagName, txt: t };
  }
  return null;
});
console.log('about heading:', JSON.stringify(aboutY));

// scroll to bottom, list ALL fixed elements
await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(800);
const fixedBottom = await p.evaluate(() => {
  return [...document.querySelectorAll('*')].filter((el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().width > 0).map((el) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { tag: el.tagName, cls: (el.className || '').toString().slice(0, 30), txt: (el.textContent || '').trim().slice(0, 24), svg: el.querySelectorAll('svg,path').length, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), right: cs.right, bottom: cs.bottom, transform: cs.transform, opacity: cs.opacity, bg: cs.backgroundColor, radius: cs.borderRadius };
  }).filter((o) => o.w < 400 && o.h < 200);
});
console.log('\nfixed elements at bottom:', JSON.stringify(fixedBottom, null, 1));
await b.close();
