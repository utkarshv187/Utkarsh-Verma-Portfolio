import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => { const s = innerHeight * 0.5; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)); });
const SIGS = [{ key: 'card2', sig: 'Introduced a', top: 146 }, { key: 'card3', sig: 'Established the Spinny', top: 160 }, { key: 'card4', sig: 'Other small', top: 204 }];
for (const { key, sig } of SIGS) {
  const pin = await p.evaluate((sig) => { const c = [...document.querySelectorAll('a,div')].find((e) => getComputedStyle(e).position === 'sticky' && (e.innerText || '').includes(sig) && e.getBoundingClientRect().width > 1000); return Math.round(c.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(c).top) || 0)); }, sig);
  const rows = [];
  for (let off = -200; off <= 900; off += 100) {
    await p.evaluate((y) => scrollTo(0, y), pin + off);
    await p.waitForTimeout(180);
    const s = await p.evaluate((sig) => {
      const c = [...document.querySelectorAll('a,div')].find((e) => getComputedStyle(e).position === 'sticky' && (e.innerText || '').includes(sig) && e.getBoundingClientRect().width > 1000);
      if (!c) return null;
      const cr = c.getBoundingClientRect();
      // tallest visible img
      const imgs = [...c.querySelectorAll('img')].filter((i) => i.getBoundingClientRect().height > 300).sort((a, z) => z.getBoundingClientRect().height - a.getBoundingClientRect().height);
      const im = imgs[0]; if (!im) return { none: true };
      const ir = im.getBoundingClientRect();
      return { file: (im.currentSrc || im.src).split('?')[0].split('/').pop().slice(0, 10), imgTop: Math.round(ir.top - cr.top), h: Math.round(ir.height), pinnedTop: Math.round(cr.top) };
    }, sig);
    rows.push({ off, s });
  }
  console.log(`\n=== ${key} (${sig}) pin@${pin} ===`);
  let prev = null;
  for (const r of rows) { if (!r.s || r.s.none) { console.log(` off=${r.off} (no tall img)`); continue; } const it = r.s.imgTop; const d = prev == null ? '' : ' d=' + (it - prev); console.log(` off=${String(r.off).padStart(4)}  imgTop=${String(it).padStart(5)}${d}  cardTop=${r.s.pinnedTop}  (${r.s.file} h${r.s.h})`); prev = it; }
}
await b.close();
