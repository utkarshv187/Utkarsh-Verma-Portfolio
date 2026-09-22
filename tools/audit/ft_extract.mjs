import { chromium } from 'playwright';
import fs from 'fs';
const outDir = '../public/images'; fs.mkdirSync(outDir, { recursive: true });
const rawDir = 'audit/out/footer'; fs.mkdirSync(rawDir, { recursive: true });
const WANT = { 'jx8W2T5lbEY3': 'footer-badge', 'eNT4XgzhjkW7': 'footer-img2', 'IWdo08dy1SBt': 'footer-img3' };
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const got = {};
p.on('response', async (res) => {
  const u = res.url();
  for (const id of Object.keys(WANT)) {
    if (u.includes(id) && /framerusercontent/.test(u) && !got[id]) {
      try { const buf = await res.body(); if (buf.length > 2000) { got[id] = buf; fs.writeFileSync(`${rawDir}/${WANT[id]}_raw.png`, buf); console.log('captured', WANT[id], buf.length, u.slice(0, 90)); } } catch {}
    }
  }
});
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2000);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.4) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
await p.waitForTimeout(1000);
// force full-res loads by rewriting the srcs to a bigger width
await p.evaluate((ids) => {
  for (const im of document.querySelectorAll('img')) {
    const s = im.currentSrc || im.src;
    for (const id of ids) { if (s.includes(id)) { const base = s.split('?')[0]; im.src = base + '?width=900'; } }
  }
}, Object.keys(WANT));
await p.waitForTimeout(2500);
console.log('done. captured:', Object.keys(got));
await b.close();
