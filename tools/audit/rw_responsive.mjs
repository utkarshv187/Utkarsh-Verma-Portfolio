import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });

async function grab(width, label) {
  const ctx = await b.newContext({ viewport: { width, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
  await p.waitForTimeout(1600);
  await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
  // find card1 + capture its geometry/layout at this width
  const data = await p.evaluate(() => {
    const a = [...document.querySelectorAll('a[href]')].find((x) => (x.getAttribute('href') || '').includes('auction-plp') && x.getBoundingClientRect().width > 50);
    if (!a) return null;
    const r = a.getBoundingClientRect();
    // find the media (bg-image div) + title + a stat tile, relative to card
    const rel = (el) => { const rr = el.getBoundingClientRect(); return { x: Math.round(rr.left - r.left), y: Math.round(rr.top - r.top), w: Math.round(rr.width), h: Math.round(rr.height) }; };
    const desc = [...a.querySelectorAll('*')];
    const media = desc.filter((e) => { const cs = getComputedStyle(e); return cs.backgroundImage.includes('url') && e.getBoundingClientRect().width > 80; }).map((e) => ({ file: getComputedStyle(e).backgroundImage.split('/').pop().split('?')[0].replace(/["')]/g, ''), ...rel(e) }))[0];
    const titleEl = desc.filter((e) => e.children.length === 0 && e.textContent.trim().length > 6).sort((x, y) => parseFloat(getComputedStyle(y).fontSize) - parseFloat(getComputedStyle(x).fontSize))[0];
    const title = titleEl ? { text: titleEl.textContent.trim().slice(0, 40), fs: getComputedStyle(titleEl).fontSize, ...rel(titleEl) } : null;
    return { cardBox: { x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }, media, title, docY: Math.round(r.top + scrollY) };
  });
  // scroll card1 into view and screenshot
  if (data) { await p.evaluate((y) => scrollTo(0, y - 120), data.docY); await p.waitForTimeout(600); }
  const shot = await p.screenshot({ clip: { x: 0, y: 0, width, height: Math.min(900, 820) } });
  await sharp(shot).toFile(join(OUT, `resp_${label}.png`));
  await ctx.close();
  return data;
}

const out = {};
for (const [w, l] of [[1280, 'desktop1280'], [1024, 'tablet1024'], [834, 'tablet834'], [430, 'phone430'], [390, 'phone390']]) {
  out[l] = await grab(w, l);
  console.log(l, JSON.stringify(out[l]));
}
writeFileSync(join(OUT, 'responsive.json'), JSON.stringify(out, null, 2));
await b.close();
