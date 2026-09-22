import { chromium } from 'playwright';
const URL = process.argv[2] || 'https://uxuiuv.framer.website/';
const widths = [1920, 1600, 1440, 1360, 1281, 1279, 1152, 1024, 900, 810, 809, 768, 600, 430, 390, 360];
const b = await chromium.launch({ headless: true });
const rows = [];
for (const W of widths) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(URL.includes('framer') ? 2200 : 700);
  const d = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.02 && r.width > 1 && r.height > 1; };
    // PRODUCT: biggest visible element whose text is PRODUCT-ish
    let hero = null, hs = 0;
    for (const el of document.querySelectorAll('h1,h2,span,div,p')) {
      const t = norm(el.textContent);
      if (/^PR.?DUCT$|PRODUCT/.test(t) && t.length < 12 && vis(el)) {
        const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
        if (fs > hs) { hs = fs; hero = el; }
      }
    }
    // role: biggest single-word role
    const roleWords = ['DESIGNER', 'RESEARCHER', 'STRATEGIST', 'STORYTELLER', 'ANIMATOR', 'COPY WRITER'];
    let role = null, rs = 0;
    for (const el of document.querySelectorAll('h1,h2,span,div,p')) {
      const t = norm(el.textContent);
      if (roleWords.includes(t) && vis(el) && el.children.length <= 2) {
        const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
        if (fs > rs) { rs = fs; role = el; }
      }
    }
    const info = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { fs: Math.round(parseFloat(cs.fontSize) * 10) / 10, lh: cs.lineHeight, ls: cs.letterSpacing, w: cs.fontWeight, cx: Math.round(r.left + r.width / 2), left: Math.round(r.left), bw: Math.round(r.width) };
    };
    return { vw: innerWidth, product: info(hero), role: info(role) };
  });
  const pc = d.product ? `${d.product.fs}px cx${d.product.cx}(vc${Math.round(d.vw / 2)}) ls${d.product.ls}` : '—';
  const rc = d.role ? `${d.role.fs}px cx${d.role.cx} ls${d.role.ls} lh${d.role.lh}` : '—';
  rows.push(`${String(W).padEnd(5)} PRODUCT ${pc.padEnd(40)} role ${rc}`);
  await ctx.close();
}
console.log('\n== LIVE hero across widths (cx = center-x; vc = viewport center) ==');
console.log(rows.join('\n'));
await b.close();
