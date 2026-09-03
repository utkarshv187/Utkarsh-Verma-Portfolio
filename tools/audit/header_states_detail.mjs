import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'interactions');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

async function centerOf(fe) { return page.evaluate((f) => { const el = eval(f); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, fe); }
async function away() { await page.mouse.move(3, 400); await page.waitForTimeout(500); }

const out = {};

// About hover -> capture the whole About frame innerHTML + any svg (arrow)
let c = await centerOf(`(function(){var t=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&e.textContent.trim()==='About');return t.closest('[data-framer-name]')||t.parentElement;})()`);
await page.mouse.move(c.x, c.y); await page.waitForTimeout(800);
out.about = await page.evaluate(() => {
  const t = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'About');
  const frame = t.closest('[data-framer-name]') || t.parentElement;
  const svgs = [...frame.querySelectorAll('svg')].map((s) => s.outerHTML.slice(0, 400));
  // arrow could be text; capture all leaf texts
  const texts = [...frame.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim()).map((e) => ({ t: e.textContent.trim(), font: getComputedStyle(e).fontFamily.split(',')[0], size: getComputedStyle(e).fontSize, color: getComputedStyle(e).color }));
  return { texts, svgCount: svgs.length, svgs, transition: getComputedStyle(t).transition, html: frame.innerHTML.slice(0, 500) };
});
await away();

// Résumé hover -> arrow + border
c = await centerOf(`(function(){return [...document.querySelectorAll('a')].find(a=>/Résumé/.test(a.textContent));})()`);
await page.mouse.move(c.x, c.y); await page.waitForTimeout(800);
out.resume = await page.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find((x) => /Résumé/.test(x.textContent));
  const texts = [...a.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim()).map((e) => e.textContent.trim());
  const svgs = [...a.querySelectorAll('svg')].map((s) => s.outerHTML.slice(0, 300));
  return { texts, svgCount: svgs.length, svgs, selfTransition: getComputedStyle(a).transition, transform: getComputedStyle(a).transform };
});
await away();

// Contact hover -> reveal panel structure
c = await centerOf(`(function(){var t=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&e.textContent.trim()==='Contact');return t;})()`);
await page.mouse.move(c.x, c.y); await page.waitForTimeout(900);
out.contact = await page.evaluate(() => {
  // links that became visible: mailto + whatsapp
  const links = [...document.querySelectorAll('a[href^="mailto"], a[href*="whatsapp"]')].map((a) => {
    const r = a.getBoundingClientRect();
    return { href: a.getAttribute('href'), text: a.textContent.trim().replace(/\s+/g, ' '), x: Math.round(r.x), w: Math.round(r.width), visible: r.width > 0, color: getComputedStyle(a).color };
  });
  // the Contact frame
  const t = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Contact');
  const frame = t ? (t.closest('[data-framer-name]') || t.parentElement) : null;
  return { links, contactFrameText: frame ? frame.innerText.replace(/\s+/g, ' ').trim().slice(0, 120) : null };
});

await writeFile(join(OUT, 'states_detail.json'), JSON.stringify(out, null, 2));
console.log('ABOUT texts:', JSON.stringify(out.about.texts), 'svgs:', out.about.svgCount);
console.log('RESUME texts:', JSON.stringify(out.resume.texts), 'svgs:', out.resume.svgCount, 'tf:', out.resume.transform);
console.log('CONTACT links:', JSON.stringify(out.contact.links));
await b.close();
