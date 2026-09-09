import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);

const info = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  // WE gold section
  const weHead = [...document.querySelectorAll('*')].find((e) => /^WORK EXPERIENCE$/i.test(norm(e.textContent)) && norm(e.textContent).length < 30 && e.getBoundingClientRect().height > 8);
  let we = weHead; for (let i = 0; i < 12 && we; i++) { if (/255, 183, 5/.test(getComputedStyle(we).backgroundColor)) break; we = we.parentElement; }
  // hero = topmost tall block
  const bigs = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 700 && r.top + window.scrollY < 60 && r.width > 800; });
  const hero = bigs.sort((a, c) => a.getBoundingClientRect().height - c.getBoundingClientRect().height)[0];

  const desc = (el, label) => { if (!el) return { label, null: true }; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { label, tag: el.tagName, dfn: el.getAttribute('data-framer-name'), cls: (el.className || '').toString().slice(0, 26), position: cs.position, top: cs.top, zIndex: cs.zIndex, height: Math.round(r.height), offsetTop: el.offsetTop, mt: cs.marginTop }; };

  // hero ancestor chain
  const heroChain = []; { let n = hero; for (let i = 0; i < 7 && n && n !== document.body; i++) { heroChain.push(desc(n, 'hero+' + i)); n = n.parentElement; } }
  // is there a fixed header?
  const header = [...document.querySelectorAll('*')].find((e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.position === 'fixed' && r.top < 5 && r.height > 20 && r.height < 120 && r.width > 800; });
  // common ancestor of hero & we
  const anc = (a, c) => { const set = new Set(); let n = a; while (n) { set.add(n); n = n.parentElement; } n = c; while (n) { if (set.has(n)) return n; n = n.parentElement; } return null; };
  const common = anc(hero, we);
  return {
    hero: desc(hero, 'hero'),
    heroParent: desc(hero && hero.parentElement, 'heroParent'),
    heroGrand: desc(hero && hero.parentElement && hero.parentElement.parentElement, 'heroGrand'),
    we: desc(we, 'we'),
    weParent: desc(we && we.parentElement, 'weParent'),
    header: header ? desc(header, 'header') : null,
    common: desc(common, 'commonAncestor'),
    heroChain,
  };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
