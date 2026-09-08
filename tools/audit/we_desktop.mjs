import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1320 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
for (let y = 0; y < 3200; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 1120)); await p.waitForTimeout(600);
await p.screenshot({ path: join(OUT, 'we_desktop_full.png') });

const extra = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const out = {};
  // stat card: climb from a label to the purple card
  const label = [...document.querySelectorAll('*')].find((e) => norm(e.textContent) === 'YEARS OF EXPERIENCE');
  if (label) { let e = label, card = null; for (let i = 0; i < 9 && e; i++) { const c = getComputedStyle(e); if (c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.borderRadius !== '0px') { card = e; break; } e = e.parentElement; } if (card) { const c = getComputedStyle(card); const r = card.getBoundingClientRect(); out.card = { bg: c.backgroundColor, radius: c.borderRadius, w: Math.round(r.width), h: Math.round(r.height), pad: c.padding, cls: (card.className || '').toString().slice(0, 30) }; } }
  // the big counter value near YEARS OF EXPERIENCE: find biggest text in the card area
  if (label) { const lr = label.getBoundingClientRect(); const near = [...document.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return e.children.length === 0 && r.height > 30 && Math.abs(r.x - lr.x) < 200 && Math.abs((r.y) - (lr.y - 60)) < 120; }).map((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { t: norm(e.textContent), fs: c.fontSize, fw: c.fontWeight, fam: c.fontFamily.split(',')[0].replace(/"/g, ''), color: c.color, h: Math.round(r.height) }; }); out.counterChars = near.slice(0, 12); }
  // dividers under rows: elements with small height / border between y1500-2000 spanning wide
  const divs = [...document.querySelectorAll('div,hr')].filter((e) => { const r = e.getBoundingClientRect(); const ay = r.y + window.scrollY; const c = getComputedStyle(e); const line = (r.height <= 4 && c.backgroundColor !== 'rgba(0, 0, 0, 0)') || c.borderBottomWidth !== '0px' && c.borderBottomStyle !== 'none'; return line && r.width > 400 && ay > 1480 && ay < 2050; }).slice(0, 8).map((e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return { y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height), bg: c.backgroundColor, borderBottom: c.borderBottom, x: Math.round(r.x) }; });
  out.dividers = divs;
  // Spinny logo: img/svg near y1500 x120
  const logo = [...document.querySelectorAll('img,svg')].find((e) => { const r = e.getBoundingClientRect(); const ay = r.y + window.scrollY; return ay > 1480 && ay < 1600 && r.x < 400 && r.width > 20; });
  if (logo) { const r = logo.getBoundingClientRect(); out.spinnyLogo = { tag: logo.tagName, w: Math.round(r.width), h: Math.round(r.height), src: (logo.getAttribute && (logo.getAttribute('src') || '')) || '', alt: logo.getAttribute && logo.getAttribute('alt') }; }
  // row line layout: y of company vs role vs date for the Spinny/first row
  const role1 = [...document.querySelectorAll('*')].find((e) => norm(e.textContent) === 'Senior Product Designer');
  const date1 = [...document.querySelectorAll('*')].find((e) => norm(e.textContent) === 'May 2019 — Jun 2026');
  out.row1 = { role: role1 && (r=>({x:Math.round(r.x),y:Math.round(r.y+window.scrollY)}))(role1.getBoundingClientRect()), date: date1 && (r=>({x:Math.round(r.x),y:Math.round(r.y+window.scrollY)}))(date1.getBoundingClientRect()), logo: out.spinnyLogo ? 'yes' : 'no' };
  return out;
});
await writeFile(join(OUT, 'we_desktop.json'), JSON.stringify(extra, null, 2));
console.log(JSON.stringify(extra, null, 2));
await b.close();
console.log('wrote we_desktop_full.png');
