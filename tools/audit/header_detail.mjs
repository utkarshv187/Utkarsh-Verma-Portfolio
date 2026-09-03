import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'hero');
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2000);

const detail = await p.evaluate(() => {
  const out = {};
  const nav = [...document.querySelectorAll('[data-framer-name="navbar"]')].find((el) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().top < 200);
  // Logo svg (first svg in nav)
  const logoSvg = nav.querySelector('svg');
  out.logoSvg = logoSvg ? logoSvg.outerHTML.slice(0, 2000) : null;
  // Contact pill (Normal) border/stroke
  const contactPill = [...nav.querySelectorAll('*')].find((el) => el.getAttribute('data-framer-name') === 'Normal');
  if (contactPill) {
    const cs = getComputedStyle(contactPill);
    out.contactPill = { border: cs.border, boxShadow: cs.boxShadow, bg: cs.backgroundColor, radius: cs.borderRadius, outline: cs.outline };
    // check for an svg stroke child
    const svg = contactPill.querySelector('svg');
    out.contactPillSvg = svg ? svg.outerHTML.slice(0, 400) : null;
  }
  // Resume pill (Top/Fill) shadow
  const resumeTop = [...nav.querySelectorAll('*')].find((el) => el.getAttribute('data-framer-name') === 'Top');
  if (resumeTop) {
    const cs = getComputedStyle(resumeTop);
    out.resumeTop = { boxShadow: cs.boxShadow, bg: cs.backgroundColor, radius: cs.borderRadius, filter: cs.filter };
    const parent = resumeTop.parentElement; const pcs = getComputedStyle(parent);
    out.resumeParent = { boxShadow: pcs.boxShadow, filter: pcs.filter, name: parent.getAttribute('data-framer-name') };
  }
  // Résumé glow — look for element with orange box-shadow near resume
  return out;
});
await writeFile(join(OUT, 'header_detail.json'), JSON.stringify(detail, null, 2));

// progress fill: scroll to 50% and read the progress element's fill child
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
await p.waitForTimeout(600);
const prog = await p.evaluate(() => {
  const nav = [...document.querySelectorAll('[data-framer-name="navbar"]')].find((el) => el.getBoundingClientRect().width > 0);
  const cands = [...nav.querySelectorAll('*')].filter((el) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return r.height <= 4 && r.width > 20 && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)');
  });
  return cands.map((el) => ({ name: el.getAttribute('data-framer-name') || el.tagName, bg: getComputedStyle(el).backgroundColor, w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height), transform: getComputedStyle(el).transform }));
});
console.log('progress fills:', JSON.stringify(prog));
console.log('logoSvg len:', detail.logoSvg ? detail.logoSvg.length : 0);
console.log('contactPill:', JSON.stringify(detail.contactPill));
console.log('resumeTop:', JSON.stringify(detail.resumeTop), 'parent:', JSON.stringify(detail.resumeParent));
await b.close();
