import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/fix5'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.evaluate(() => scrollTo(0, 9000)); await p.waitForTimeout(900);

const sel = '.framer-q53ii-container';
// dump text/paths inside the button + any nearby ring text
const before = await p.evaluate((sel) => {
  const c = document.querySelector(sel); if (!c) return null;
  const texts = [...c.querySelectorAll('text, textPath, tspan')].map((t) => t.textContent);
  const paths = [...c.querySelectorAll('path')].map((pp) => (pp.getAttribute('d') || '').slice(0, 40));
  const allText = (c.textContent || '').replace(/\s+/g, ' ').trim();
  // any child with opacity 0 (hidden ring waiting to appear)?
  const hidden = [...c.querySelectorAll('*')].filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.05).map((el) => ({ tag: el.tagName, cls: (el.className.baseVal || el.className || '').toString().slice(0, 24), txt: (el.textContent || '').trim().slice(0, 24), svgTexts: [...el.querySelectorAll('text,textPath')].map((t) => t.textContent).join('|') }));
  return { allText, texts, paths, hiddenCount: hidden.length, hidden: hidden.slice(0, 6) };
}, sel);
console.log('BEFORE hover:', JSON.stringify(before, null, 1));

const box = await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r0: JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }) }; }, sel);
console.log('button box:', box.r0);
// screenshot before + after hover
await p.screenshot({ path: `${dir}/gtt_live_before.png`, clip: { x: box.x - 90, y: box.y - 90, width: 180, height: 180 } });
await p.mouse.move(box.x, box.y); await p.waitForTimeout(400);
await p.screenshot({ path: `${dir}/gtt_live_hover1.png`, clip: { x: box.x - 90, y: box.y - 90, width: 180, height: 180 } });
await p.waitForTimeout(700);
await p.screenshot({ path: `${dir}/gtt_live_hover2.png`, clip: { x: box.x - 90, y: box.y - 90, width: 180, height: 180 } });

const after = await p.evaluate((sel) => {
  const c = document.querySelector(sel); if (!c) return null;
  const texts = [...c.querySelectorAll('text, textPath, tspan')].map((t) => t.textContent);
  const visRingEls = [...c.querySelectorAll('*')].filter((el) => { const cs = getComputedStyle(el); return parseFloat(cs.opacity) > 0.1 && (el.querySelectorAll('textPath,text').length || /GO TO TOP/i.test(el.textContent || '')); }).map((el) => ({ tag: el.tagName, op: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform.slice(0, 40), anim: getComputedStyle(el).animationName, txt: (el.textContent || '').trim().slice(0, 30) }));
  return { texts, allText: (c.textContent || '').replace(/\s+/g, ' ').trim(), visRingEls: visRingEls.slice(0, 8) };
}, sel);
console.log('\nAFTER hover:', JSON.stringify(after, null, 1));
await b.close();
