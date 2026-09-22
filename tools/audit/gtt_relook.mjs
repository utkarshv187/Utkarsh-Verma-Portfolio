import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/gtt2'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', deviceScaleFactor: 2 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.evaluate(() => scrollTo(0, 9000)); await p.waitForTimeout(900);

const sel = '.framer-q53ii-container';
const box = await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; }, sel);
console.log('button box:', JSON.stringify(box));

// DEFAULT screenshot (wide margin so we see any surrounding text)
await p.screenshot({ path: `${dir}/live_default.png`, clip: { x: box.l - 130, y: box.t - 90, width: 340, height: 260 } });

// hover and dump the FULL DOM of the button + any text element geometry
await p.mouse.move(box.x, box.y); await p.waitForTimeout(700);
await p.screenshot({ path: `${dir}/live_hover.png`, clip: { x: box.l - 130, y: box.t - 90, width: 340, height: 260 } });

const dom = await p.evaluate((sel) => {
  const c = document.querySelector(sel);
  const html = c.outerHTML.replace(/\s+/g, ' ').slice(0, 1200);
  // any element whose text includes G,O,T,O,P letters — capture geometry of the text container
  const textEls = [...c.querySelectorAll('*')].filter((el) => /GO|TOP|TO/i.test((el.textContent || '')) && el.children.length === 0 && (el.textContent || '').trim());
  const info = textEls.slice(0, 12).map((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { txt: (el.textContent || '').trim(), tag: el.tagName, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), transform: cs.transform.slice(0, 40), font: cs.fontFamily.slice(0, 14), size: cs.fontSize, color: cs.color, writingMode: cs.writingMode }; });
  // is there an svg textPath (curved) anywhere?
  const hasTextPath = c.querySelectorAll('textPath').length;
  const hasSvgText = c.querySelectorAll('svg text').length;
  return { html, textCount: textEls.length, info, hasTextPath, hasSvgText };
}, sel);
console.log('\nhasTextPath(curved):', dom.hasTextPath, ' svgText:', dom.hasSvgText);
console.log('text elements:', JSON.stringify(dom.info, null, 1));
console.log('\nHTML:', dom.html);
await b.close();
