import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2200);

const out = {};

// ---- Graffiti hover: read the img + ancestor chain transforms/filter before & during hover ----
const gsel = await p.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('eNT4Xgz'));
  if (!img) return null;
  img.setAttribute('data-gr', '1');
  const r = img.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
function chain() {
  return p.evaluate(() => {
    const img = document.querySelector('[data-gr]');
    if (!img) return [];
    const arr = []; let el = img;
    for (let i = 0; i < 5 && el; i++) { const c = getComputedStyle(el); arr.push({ tag: el.tagName, name: el.getAttribute('data-framer-name') || '', transform: c.transform, filter: c.filter, opacity: c.opacity, transition: c.transition.slice(0, 50) }); el = el.parentElement; }
    return arr;
  });
}
if (gsel) {
  await p.mouse.move(5, 500); await p.waitForTimeout(300);
  const def = await chain();
  await p.mouse.move(gsel.x, gsel.y); await p.waitForTimeout(700);
  const hov = await chain();
  out.graffiti = { default: def, hover: hov };
}

// ---- Italic skew: scroll to work experience, find italic Satoshi node, sample transform vs scroll ----
await p.evaluate(async () => { for (let y = 0; y < 3000; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
await p.waitForTimeout(400);
const found = await p.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim().length > 3 && getComputedStyle(e).fontStyle === 'italic' && /Satoshi/.test(getComputedStyle(e).fontFamily));
  if (!els.length) return null;
  els[0].setAttribute('data-it', '1');
  return { text: els[0].textContent.trim().slice(0, 40), docY: Math.round(els[0].getBoundingClientRect().top + window.scrollY), count: els.length };
});
out.italicFound = found;
if (found) {
  const samples = [];
  for (const target of [found.docY - 700, found.docY - 500, found.docY - 300, found.docY - 100, found.docY + 100]) {
    await p.evaluate((t) => window.scrollTo(0, Math.max(0, t)), target);
    await p.waitForTimeout(350);
    const s = await p.evaluate(() => {
      const e = document.querySelector('[data-it]'); if (!e) return null;
      const c = getComputedStyle(e); const m = new DOMMatrix(c.transform);
      return { scrollY: Math.round(window.scrollY), fontStyle: c.fontStyle, transform: c.transform, a: +m.a.toFixed(3), b: +m.b.toFixed(3), c: +m.c.toFixed(3), d: +m.d.toFixed(3) };
    });
    samples.push(s);
  }
  out.italicSamples = samples;
}

await writeFile(join(__dirname, 'out', 'hero', 'graf_italic.json'), JSON.stringify(out, null, 2));
console.log('graffiti default:', JSON.stringify(out.graffiti?.default?.map((x) => x.transform)));
console.log('graffiti hover:', JSON.stringify(out.graffiti?.hover?.map((x) => x.transform)));
console.log('italic found:', JSON.stringify(found));
console.log('italic samples:', JSON.stringify(out.italicSamples, null, 1));
await b.close();
