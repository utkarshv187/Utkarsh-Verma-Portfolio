// Work Experience structure + interactions + italic emphasis inventory.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2000);
await p.evaluate(async () => { for (let y = 0; y < 3200; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 130)); } });
await p.waitForTimeout(400);

const data = await p.evaluate(() => {
  // WORK EXPERIENCE heading + section container
  const h = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /WORK\s+EXPERIENCE/i.test(e.textContent));
  let section = h; for (let i = 0; i < 8 && section.parentElement; i++) { if (section.getBoundingClientRect().height > 800) break; section = section.parentElement; }
  const secR = section.getBoundingClientRect();
  const secCs = getComputedStyle(section);
  // experience rows: find role titles + dates + company logos
  const roleTitles = ['Senior Product Designer', 'UX UI Designer', 'UI Design Intern'];
  const rows = roleTitles.map((rt) => {
    const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === rt);
    if (!el) return { role: rt, found: false };
    const r = el.getBoundingClientRect(); const c = getComputedStyle(el);
    return { role: rt, found: true, y: Math.round(r.y + window.scrollY), fontSize: c.fontSize, color: c.color, x: Math.round(r.x) };
  });
  // group labels
  const groups = ['CURRENTLY', 'A  WHILE  BACK', 'A WHILE BACK', 'JOINED  AS  THE  FOUNDING  DESIGNER', 'JOINED AS THE FOUNDING DESIGNER'].map((g) => {
    const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === g);
    return el ? { label: g, y: Math.round(el.getBoundingClientRect().y + window.scrollY), fontSize: getComputedStyle(el).fontSize, ls: getComputedStyle(el).letterSpacing } : null;
  }).filter(Boolean);
  // italic emphasis phrases (Satoshi italic)
  const italics = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && getComputedStyle(e).fontStyle === 'italic' && /Satoshi/.test(getComputedStyle(e).fontFamily)).map((e) => e.textContent.trim());
  // section bg
  return {
    section: { name: section.getAttribute('data-framer-name'), h: Math.round(secR.height), bg: secCs.backgroundColor, radius: secCs.borderTopLeftRadius, y: Math.round(secR.y + window.scrollY) },
    heading: { text: h.textContent.trim(), fontSize: getComputedStyle(h).fontSize, color: getComputedStyle(h).color },
    rows, groups, italics,
  };
});
await writeFile(join(__dirname, 'out', 'we_probe.json'), JSON.stringify(data, null, 2));
console.log('section:', JSON.stringify(data.section));
console.log('heading:', JSON.stringify(data.heading));
console.log('rows:', JSON.stringify(data.rows));
console.log('groups:', JSON.stringify(data.groups));
console.log('italic phrases (' + data.italics.length + '):'); data.italics.forEach((t) => console.log('   ' + JSON.stringify(t)));
await b.close();
