import { chromium } from 'playwright';
import fs from 'fs';
const URL = process.argv[2], LABEL = process.argv[3];
const dir = 'audit/out/diff'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto(URL, { waitUntil: 'networkidle' }).catch(() => {});
await p.waitForTimeout(URL.includes('framer') ? 3500 : 1500);
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800);
await p.screenshot({ path: `${dir}/hero_${LABEL}.png` });
const data = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const R = {};
  // big hero portrait image (person). find largest img in top viewport
  const imgs = [...document.querySelectorAll('img')].map((im) => ({ im, r: im.getBoundingClientRect(), src: (im.currentSrc || im.src).split('/').pop().slice(0, 20) })).filter((o) => o.r.top < 800 && o.r.width > 40);
  imgs.sort((a, b) => (b.r.width * b.r.height) - (a.r.width * a.r.height));
  R.topImgs = imgs.slice(0, 5).map((o) => ({ src: o.src, w: Math.round(o.r.width), h: Math.round(o.r.height), x: Math.round(o.r.left), y: Math.round(o.r.top) }));
  // O ring diameter: find element with badge/ring text
  let ring = null; for (const el of document.querySelectorAll('*')) { const t = norm(el.textContent); if (/LET.S . WORK . TOGETHER/i.test(t) && el.querySelector('textPath,text,svg')) { ring = el; break; } }
  R.ring = ring ? (() => { const r = ring.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top) }; })() : null;
  // x-positions of key headings for horizontal-offset check
  const hx = (t) => { let best = null; for (const el of document.querySelectorAll('h1,h2,h3,p,div,span')) { if (norm(el.textContent) === t && el.children.length <= 2) { const fs = parseFloat(getComputedStyle(el).fontSize) || 0; const r = el.getBoundingClientRect(); if (r.width > 0 && (!best || fs > best.fs)) best = { x: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), fs }; } } return best; };
  R.xRecentWork = hx('RECENT WORK'); R.xMoreAbout = hx('MORE ABOUT ME'); R.xWorkExp = hx('WORK EXPERIENCE');
  return R;
});
console.log(LABEL, JSON.stringify(data, null, 1));
await b.close();
