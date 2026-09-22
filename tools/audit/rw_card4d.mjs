import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.5; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 170)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
// scroll near card4
await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find((e) => e.children.length <= 4 && /Other small/.test(e.textContent || '')); if (el) el.scrollIntoView({ block: 'center' }); });
await p.waitForTimeout(800);

const d = await p.evaluate(() => {
  // find the card: nearest <a> ancestor of the "Other small" text that is card-sized & visible
  const txt = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Other small/.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
  let a = txt;
  while (a && a.tagName !== 'A') a = a.parentElement;
  if (!a) return { error: 'no anchor' };
  const r = a.getBoundingClientRect();
  const cs = getComputedStyle(a);
  const rel = (el) => { const rr = el.getBoundingClientRect(); return { x: Math.round(rr.left - r.left), y: Math.round(rr.top - r.top), w: Math.round(rr.width), h: Math.round(rr.height) }; };
  const desc = [...a.querySelectorAll('*')];
  const title = desc.filter((e) => e.children.length === 0 && e.textContent.trim().length > 4).sort((x, y) => parseFloat(getComputedStyle(y).fontSize) - parseFloat(getComputedStyle(x).fontSize))[0];
  // stat tiles
  const tiles = desc.filter((e) => { const c = getComputedStyle(e).backgroundColor; return c.includes('37, 197, 179') || c.includes('255, 182, 1'); }).map((e) => ({ bg: getComputedStyle(e).backgroundColor, ...rel(e), text: e.innerText.replace(/\n+/g, ' ') })).filter((t) => t.w > 60);
  const numColors = desc.filter((e) => e.children.length === 0 && /^\d|to/.test(e.textContent.trim())).map((e) => ({ t: e.textContent.trim(), fs: getComputedStyle(e).fontSize, color: getComputedStyle(e).color })).slice(0, 6);
  const imgs = [...a.querySelectorAll('img')].map((i) => ({ file: (i.currentSrc || i.src).split('?')[0].split('/').pop(), ...rel(i) }));
  const bgs = desc.filter((e) => getComputedStyle(e).backgroundImage.includes('url')).map((e) => ({ file: getComputedStyle(e).backgroundImage.split('/').pop().split('?')[0].replace(/["')]/g, ''), ...rel(e) }));
  return {
    href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'),
    docY: Math.round(r.top + scrollY), box: { w: Math.round(r.width), h: Math.round(r.height) },
    position: cs.position, stickyTop: cs.top, bg: cs.backgroundColor, radius: cs.borderRadius, padding: cs.padding,
    title: title ? { text: title.textContent.trim(), fs: getComputedStyle(title).fontSize, ...rel(title) } : null,
    tiles, numColors, innerText: a.innerText, imgs, bgs,
  };
});
writeFileSync(join(OUT, 'card4.json'), JSON.stringify(d, null, 2));
console.log(JSON.stringify(d, null, 2));
await b.close();
