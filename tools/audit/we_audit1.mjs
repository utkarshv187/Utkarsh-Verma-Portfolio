// AUDIT pass 1 for WORK EXPERIENCE: locate the heading on live, extract structured copy + type
// styles for the whole section, and screenshot it. Read-only.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(2000);
// scroll through the whole page in steps to force Framer to render lazy content
const H = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(180); }
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
const pageH = await p.evaluate(() => document.body.scrollHeight);

// find the WORK EXPERIENCE heading and its section container
const info = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const heading = [...document.querySelectorAll('h1,h2,h3,h4,p,div,span')].find((e) => /WORK\s*EXPERIENCE/i.test(norm(e.textContent)) && norm(e.textContent).length < 40 && e.getBoundingClientRect().height > 10);
  if (!heading) return { err: 'no heading' };
  const hr = heading.getBoundingClientRect();
  // walk up to a large section container
  let sec = heading; for (let i = 0; i < 8; i++) { if (sec.parentElement) { const pr = sec.parentElement.getBoundingClientRect(); if (pr.height > 600) { sec = sec.parentElement; if (pr.height > 900) break; } else sec = sec.parentElement; } }
  const secR = sec.getBoundingClientRect();
  const scrollY = window.scrollY;
  return {
    pageTop_of_heading: Math.round(hr.top + scrollY),
    headingText: norm(heading.textContent), headingTag: heading.tagName, headingCls: (heading.className || '').toString().slice(0, 40),
    section_top: Math.round(secR.top + scrollY), section_h: Math.round(secR.height), section_cls: (sec.className || '').toString().slice(0, 40),
  };
});
console.log('pageHeight', pageH);
console.log('WE heading/section', JSON.stringify(info, null, 2));

// Extract structured text (leaf text nodes) between the heading top and heading top + 3500px
const dump = await p.evaluate((startY) => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const rows = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const seen = new Set();
  [...document.querySelectorAll('*')].forEach((e) => {
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
    const t = norm(own);
    if (!t) return;
    const r = e.getBoundingClientRect(); const ay = r.top + window.scrollY;
    if (ay < startY - 40 || ay > startY + 4200) return;
    if (r.width < 2 || r.height < 2) return;
    const key = t + '@' + Math.round(ay);
    if (seen.has(key)) return; seen.add(key);
    const cs = getComputedStyle(e);
    rows.push({ y: Math.round(ay), x: Math.round(r.left), text: t.slice(0, 90), fs: cs.fontSize, fw: cs.fontWeight, fst: cs.fontStyle, color: cs.color, fam: cs.fontFamily.split(',')[0].replace(/"/g, ''), ls: cs.letterSpacing, transform: cs.transform === 'none' ? '' : cs.transform.slice(0, 30) });
  });
  rows.sort((a, b) => a.y - b.y || a.x - b.x);
  return rows;
}, info.pageTop_of_heading);
await writeFile(join(OUT, 'we_copy.json'), JSON.stringify(dump, null, 2));
console.log('extracted', dump.length, 'text rows -> we_copy.json');
console.log(dump.map((r) => `${r.y}\t${r.fs}/${r.fw}/${r.fst}\t${r.fam}\t${r.color}\t| ${r.text}`).join('\n'));

// screenshot the section region (full-page tall crop)
await p.evaluate((y) => window.scrollTo(0, y - 40), info.pageTop_of_heading);
await p.waitForTimeout(400);
await p.screenshot({ path: join(OUT, 'we_view1.png') });
await b.close();
console.log('wrote we_view1.png');
