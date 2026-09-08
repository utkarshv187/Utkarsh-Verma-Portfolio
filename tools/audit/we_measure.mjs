import { chromium } from 'playwright';
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
await p.waitForTimeout(1500);
for (let y = 0; y < 3000; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);

const data = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const st = (e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { text: norm(e.textContent).slice(0, 60), tag: e.tagName, fs: c.fontSize, fw: c.fontWeight, fst: c.fontStyle, ls: c.letterSpacing, lh: c.lineHeight, color: c.color, fam: c.fontFamily.split(',')[0].replace(/"/g, ''), x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height), bg: c.backgroundColor, radius: c.borderRadius, anim: c.animationName, ta: c.textAlign }; };
  const byText = (re, max = 60) => [...document.querySelectorAll('*')].filter((e) => { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''); return re.test(norm(own)) && norm(own).length < max; });
  const out = {};
  // section bg: the yellow container behind WORK EXPERIENCE
  const heading = byText(/^WORK EXPERIENCE$/i)[0];
  out.heading = heading ? st(heading) : null;
  // walk up to find the yellow bg element
  if (heading) { let n = heading, yellow = null; for (let i = 0; i < 8 && n; i++) { const bg = getComputedStyle(n).backgroundColor; if (bg && bg !== 'rgba(0, 0, 0, 0)') { yellow = n; break; } n = n.parentElement; } out.sectionBg = yellow ? { bg: getComputedStyle(yellow).backgroundColor, cls: (yellow.className || '').toString().slice(0, 30), w: Math.round(yellow.getBoundingClientRect().width), h: Math.round(yellow.getBoundingClientRect().height), pad: getComputedStyle(yellow).padding } : null; }
  out.subtitle = (byText(/BASED IN DELHI NCR/i)[0] && st(byText(/BASED IN DELHI NCR/i)[0])) || null;
  // rows: companies/dates/roles
  out.tlc = (byText(/^TLC$/)[0] && st(byText(/^TLC$/)[0])) || null;
  out.gamezop = (byText(/^GameZop$/)[0] && st(byText(/^GameZop$/)[0])) || null;
  out.dates = byText(/^(May 2019|Jan 2019|Oct 2018)/).map(st);
  out.roles = byText(/(Product Designer|UX UI Designer|UI Intern|UI Design Intern)/).map(st);
  // divider lines: thin elements near rows
  const dividers = [...document.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); const ay = r.y + window.scrollY; const c = getComputedStyle(e); return r.height > 0 && r.height <= 3 && r.width > 300 && ay > 1300 && ay < 2200 && (c.backgroundColor !== 'rgba(0, 0, 0, 0)' || c.borderBottomWidth !== '0px'); }).slice(0, 6).map((e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return { y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height), bg: c.backgroundColor, border: c.borderBottom }; });
  out.dividers = dividers;
  // stat cards
  const values = byText(/^(7\+|30\+|1M\+)$/).map(st);
  out.statValues = values;
  const labels = byText(/(YEARS OF EXPERIENCE|SUCCESSFUL PRODUCTS|DIVERSIFIED USERS)/, 26).map(st);
  out.statLabels = labels.filter((l, i, a) => a.findIndex((x) => x.text === l.text && Math.abs(x.x - l.x) < 5) === i);
  // stat card container (purple)
  if (values[0]) { let n = document.elementsFromPoint(values[0].x + 20, values[0].y - window.scrollY + 20).find(() => true); let card = null, e = [...document.querySelectorAll('*')].find((el) => norm(el.textContent) === '7+'); for (let i = 0; i < 8 && e; i++) { const bg = getComputedStyle(e).backgroundColor; if (/rgb\(1?[0-9]?[0-9], /.test(bg) && bg !== 'rgba(0, 0, 0, 0)' && getComputedStyle(e).borderRadius !== '0px') { card = e; break; } e = e.parentElement; } out.statCard = card ? { bg: getComputedStyle(card).backgroundColor, radius: getComputedStyle(card).borderRadius, w: Math.round(card.getBoundingClientRect().width), h: Math.round(card.getBoundingClientRect().height), cls: (card.className || '').toString().slice(0, 26) } : null; }
  return out;
});
await writeFile(join(OUT, 'we_measure.json'), JSON.stringify(data, null, 2));
console.log(JSON.stringify(data, null, 2));
await b.close();
