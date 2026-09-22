import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const decomp = (t) => { if (!t || t === 'none') return { sx: 1, sy: 1, rot: 0 }; const m = t.match(/matrix\(([^)]+)\)/); if (!m) return { sx: 1, sy: 1, rot: 0 }; const [a, bb, c, d] = m[1].split(',').map(parseFloat); return { sx: +Math.hypot(a, bb).toFixed(3), sy: +Math.hypot(c, d).toFixed(3), rot: +(Math.atan2(bb, a) * 180 / Math.PI).toFixed(1) }; };

// ---- 1) About caret directions ----
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.evaluate(async () => { for (let y = 0; y < 9000; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } });
  const carets = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const out = [];
    for (const e of document.querySelectorAll('*')) {
      if (e.children.length) continue; const t = norm(e.textContent);
      if (!['^', 'v', 'V', 'ˇ', '˅', '⌄', '︾'].includes(t)) continue;
      const r = e.getBoundingClientRect(); const dy = r.top + scrollY;
      if (dy < 6800 || dy > 7500) continue;
      out.push({ t, x: Math.round(r.left), y: Math.round(dy), rot: getComputedStyle(e).transform, fs: getComputedStyle(e).fontSize });
    }
    return out.sort((a, b2) => a.y - b2.y || a.x - b2.x);
  });
  console.log('ABOUT carets (near the bio, top->bottom):');
  for (const c of carets) console.log('  ', JSON.stringify({ ...c, dRot: decomp(c.rot).rot }));
  await p.close();
}

// ---- 2) hobbies image radius (stack img + grid img + wrappers) ----
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });
  await p.evaluate(() => scrollTo(0, 7600)); await p.waitForTimeout(400);
  const radii = await p.evaluate(() => {
    const info = (id) => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id)); if (!im) return null; const chain = []; let n = im; for (let k = 0; k < 4 && n; k++) { chain.push(getComputedStyle(n).borderRadius + '|ov:' + getComputedStyle(n).overflow); n = n.parentElement; } return chain; };
    return { stack: info('LPldbLZ'), grid: info('fAjY3sZM'), gridMid: info('fam52Jvb') };
  });
  console.log('\nHOBBIES radii (img -> up 4 ancestors):');
  console.log('  stack:', JSON.stringify(radii.stack));
  console.log('  grid-corner:', JSON.stringify(radii.grid));
  console.log('  grid-mid:', JSON.stringify(radii.gridMid));
  await p.close();
}

// ---- 5) grid scale-on-scroll: fresh approach, sample a grid image scale as it enters ----
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2500);
  // scroll to just ABOVE the grid without passing it (grid ~ docY 8650+); go to 8000 first
  await p.evaluate(() => scrollTo(0, 8000)); await p.waitForTimeout(600);
  console.log('\nGRID scale-on-scroll (fresh approach) — img fam52Jvb & lc9rKGcl as they rise:');
  for (let s = 8000; s <= 9800; s += 150) {
    await p.evaluate((yy) => scrollTo(0, yy), s); await p.waitForTimeout(110);
    const m = await p.evaluate(() => {
      const meas = (id) => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id)); if (!im) return null; const r = im.getBoundingClientRect(); let n = im, tf = 'none', op = 1; for (let k = 0; k < 6 && n; k++) { const cs = getComputedStyle(n); if (cs.transform !== 'none' && cs.transform.includes('matrix')) tf = cs.transform; if (parseFloat(cs.opacity) < 1) op = cs.opacity; n = n.parentElement; } return { vpTop: Math.round(r.top), w: Math.round(r.width), tf, op }; };
      return { a: meas('fam52Jvb'), b: meas('lc9rKGcl') };
    });
    const f = (x) => x ? `vpTop${x.vpTop} w${x.w} sx${decomp(x.tf).sx} op${x.op}` : '-';
    console.log(`  ${s}: [fam52] ${f(m.a)} | [lc9r] ${f(m.b)}`);
  }
  await p.close();
}
await b.close();
console.log('done');
