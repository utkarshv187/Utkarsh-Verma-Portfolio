import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const URL = 'http://localhost:5199/';
const b = await chromium.launch({ headless: true });

// ---------- helpers ----------
const pillState = (p) => p.evaluate(() => {
  const bg = document.querySelector('.cursor');
  const txt = document.querySelector('.cursor-text__label');
  const shown = bg?.classList.contains('cursor--label');
  return { shown: !!shown, label: shown ? (txt?.textContent || '').trim() : '' };
});

// =====================================================================
// PART A — pill appears/disappears on SCROLL with a STATIONARY cursor
// =====================================================================
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
  await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(900);
  const secTop = await p.evaluate(() => document.querySelector('#recent-work').getBoundingClientRect().top + scrollY);

  const settle = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const labelAt = (dy, cx, cy) => p.evaluate(async ({ dy, cx, cy, secTop }) => {
    window.scrollTo(0, secTop + dy); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el = document.elementFromPoint(cx, cy);
    const lab = el?.closest?.('[data-cursor-label]');
    return lab ? (lab.getAttribute('data-cursor-label') || '∅') : null;
  }, { dy, cx, cy, secTop });

  // Search several viewport heights for a point that flips card("View") -> gap(no label)
  // purely by scrolling. Sticky cards keep mid-viewport labelled, so the flip lives near
  // the section's leading edge / trailing edge.
  const cx = 500;
  let chosen = null; // { cy, dyCard, dyGap }
  for (const cy of [120, 170, 240, 700, 760, 820, 860]) {
    let dyCard = null, dyGap = null;
    for (let dy = -500; dy <= 3400; dy += 80) {
      const l = await labelAt(dy, cx, cy);
      const isView = l && l.includes('View');
      const isGap = (l === null);
      if (isView && dyCard === null) dyCard = dy;
      if (dyCard !== null && isGap && dy > dyCard) { dyGap = dy; break; }
      if (isGap && dyCard === null) dyGap = dy; // remember a leading gap too
      if (dyGap !== null && dyCard === null && isView) { /* gap-then-card also fine */ }
    }
    // prefer a clean card->gap pair; else accept gap(before)->card
    if (dyCard !== null && dyGap !== null) { chosen = { cy, a: { dy: dyGap < dyCard ? dyGap : dyCard }, b: { dy: dyGap < dyCard ? dyCard : dyGap }, cardFirst: dyGap > dyCard }; break; }
  }
  console.log('[A] chosen flip point:', JSON.stringify(chosen));

  const cap = async (dy, file) => {
    await p.evaluate(({ dy, secTop }) => window.scrollTo(0, secTop + dy), { dy, secTop });
    await p.waitForTimeout(480); // let onScroll re-eval + React + spring settle
    const st = await pillState(p);
    const clipY = Math.max(0, chosen.cy - 150);
    await sharp(await p.screenshot({ clip: { x: 120, y: clipY, width: 900, height: 360 } })).resize(620).toFile(join(OUT, file));
    return st;
  };

  // Park the cursor ONCE at (cx, cy); never move it again — only scroll changes.
  const parkDy = chosen ? (chosen.cardFirst ? chosen.a.dy : chosen.b.dy) : 400; // park where a card is under the cursor
  await p.evaluate(({ dy, secTop }) => window.scrollTo(0, secTop + dy), { dy: parkDy, secTop });
  await p.waitForTimeout(150);
  await p.mouse.move(cx - 30, chosen.cy - 18);
  await p.mouse.move(cx, chosen.cy, { steps: 6 });
  await p.waitForTimeout(300);

  // State 1 = cursor over card (pill "View"); State 2 = SAME cursor, scrolled to the gap (no pill)
  const cardDy = chosen.cardFirst ? chosen.a.dy : chosen.b.dy;
  const gapDy = chosen.cardFirst ? chosen.b.dy : chosen.a.dy;
  const s1 = await cap(cardDy, 'p_scroll_1.png');
  const s2 = await cap(gapDy, 'p_scroll_2.png');
  console.log('[A] state1 (over card):', JSON.stringify(s1), ' state2 (scrolled, cursor still):', JSON.stringify(s2));
  const works = s1.shown && s1.label.includes('View') && !s2.shown;
  console.log('[A] SCROLL-REEVAL WORKS:', works);

  const a = await sharp(join(OUT, 'p_scroll_1.png')).toBuffer();
  const c = await sharp(join(OUT, 'p_scroll_2.png')).toBuffer();
  const w = (await sharp(a).metadata()).width, h = (await sharp(a).metadata()).height;
  await sharp({ create: { width: w, height: h * 2 + 44, channels: 3, background: '#111' } })
    .composite([
      { input: Buffer.from(`<svg width="${w}" height="22"><rect width="100%" height="100%" fill="#111"/><text x="8" y="16" font-family="monospace" font-size="13" fill="#7CFC9E">1 — cursor parked over a card  ->  "View" pill visible</text></svg>`), top: 0, left: 0 },
      { input: a, top: 22, left: 0 },
      { input: Buffer.from(`<svg width="${w}" height="22"><rect width="100%" height="100%" fill="#111"/><text x="8" y="16" font-family="monospace" font-size="13" fill="#FF9E7C">2 — cursor UNMOVED, page scrolled  ->  pill gone (re-evaluated on scroll)</text></svg>`), top: h + 22, left: 0 },
      { input: c, top: h + 44, left: 0 },
    ]).png().toFile(join(OUT, 'proof_pill_scroll.png'));
  await p.close();
}

// =====================================================================
// PART B — card4 bg + scroll-pan on cards 2 / 3 / 4 (two scroll states)
// =====================================================================
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(900);
  const secTop = await p.evaluate(() => document.querySelector('#recent-work').getBoundingClientRect().top + scrollY);

  // smooth incremental scroll so the rAF pan tracker keeps up
  const scrollTo = async (target) => { const cur = await p.evaluate(() => scrollY); for (let i = 1; i <= 20; i++) { await p.evaluate((y) => window.scrollTo(0, y), cur + (target - cur) * i / 20); await p.waitForTimeout(16); } await p.waitForTimeout(160); };

  // Each card is front-and-centre around a different scroll window. Grab 2 frames per card.
  const shots = {}; // key -> [near, far]
  const windows = { gamify: [900, 1250], figma: [1550, 1900], beyond: [2250, 2750] };
  for (const [k, [d1, d2]] of Object.entries(windows)) {
    await scrollTo(secTop + d1); shots[k] = [await p.screenshot({ clip: { x: 40, y: 70, width: 760, height: 740 } })];
    await scrollTo(secTop + d2); shots[k].push(await p.screenshot({ clip: { x: 40, y: 70, width: 760, height: 740 } }));
  }

  const cellW = 300, gap = 6, labelH = 22;
  const rows = [];
  const titles = { gamify: 'Card 2 — back phone GIF pans up', figma: 'Card 3 — design-system image pans (stays covered)', beyond: 'Card 4 — long listing pans on #ECECF5 panel' };
  for (const k of ['gamify', 'figma', 'beyond']) {
    const c0 = await sharp(shots[k][0]).resize(cellW).toBuffer();
    const c1 = await sharp(shots[k][1]).resize(cellW).toBuffer();
    const ch = (await sharp(c0).metadata()).height;
    const row = await sharp({ create: { width: cellW * 2 + gap, height: ch + labelH, channels: 3, background: '#141414' } })
      .composite([
        { input: Buffer.from(`<svg width="${cellW * 2 + gap}" height="${labelH}"><rect width="100%" height="100%" fill="#141414"/><text x="6" y="15" font-family="monospace" font-size="12" fill="#fff">${titles[k]}  (scroll →)</text></svg>`), top: 0, left: 0 },
        { input: c0, top: labelH, left: 0 },
        { input: c1, top: labelH, left: cellW + gap },
      ]).png().toBuffer();
    rows.push({ buf: row, h: ch + labelH, w: cellW * 2 + gap });
  }
  const totalH = rows.reduce((s, r) => s + r.h + 6, 0);
  const comp = []; let ty = 0;
  for (const r of rows) { comp.push({ input: r.buf, top: ty, left: 0 }); ty += r.h + 6; }
  await sharp({ create: { width: rows[0].w, height: totalH, channels: 3, background: '#000' } }).composite(comp).png().toFile(join(OUT, 'proof_card_pans.png'));
  console.log('[B] wrote proof_card_pans.png');
  await p.close();
}

// =====================================================================
// PART C — Spinny pill vs View pill (same stadium shape), desktop
// =====================================================================
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
  await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(1000);

  const pillShot = async (name, cx, cy) => {
    await p.mouse.move(cx - 40, cy - 30);
    await p.mouse.move(cx, cy, { steps: 8 });
    await p.waitForTimeout(450);
    const st = await pillState(p);
    await sharp(await p.screenshot({ clip: { x: Math.max(0, cx - 100), y: Math.max(0, cy - 60), width: 200, height: 120 } }))
      .resize(440, 264, { fit: 'contain', background: { r: 17, g: 17, b: 17 } }).toFile(join(OUT, name));
    return st;
  };

  // Spinny: enter WE section (latches reveal), hover the revealed image
  const weY = await p.evaluate(() => document.querySelector('#work-experience').getBoundingClientRect().top + scrollY);
  await p.evaluate((y) => scrollTo(0, y - 40), weY);
  await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('#work-experience').dispatchEvent(new PointerEvent('pointerenter', { bubbles: true })));
  await p.waitForTimeout(450);
  const sp = await p.evaluate(() => { const im = document.querySelector('.we__reveal-img'); if (!im) return null; const r = im.getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 }; });
  let stSpinny = null;
  if (sp) stSpinny = await pillShot('c_pill_spinny.png', sp.x, sp.y);
  else console.log('[C] spinny image not visible');

  // View: hover card 1
  await p.evaluate(() => { const a = document.querySelector('.rw-card--auction'); scrollTo(0, a.getBoundingClientRect().top + scrollY - 132); });
  await p.waitForTimeout(500);
  const vp = await p.evaluate(() => { const a = document.querySelector('.rw-card--auction'); const r = a.getBoundingClientRect(); return { x: r.left + r.width * 0.72, y: r.top + r.height * 0.42 }; });
  const stView = await pillShot('c_pill_view.png', vp.x, vp.y);
  console.log('[C] spinny pill:', JSON.stringify(stSpinny), ' view pill:', JSON.stringify(stView));

  if (stSpinny) {
    const ps = await sharp(join(OUT, 'c_pill_spinny.png')).resize(440, 264, { fit: 'contain', background: { r: 17, g: 17, b: 17 } }).toBuffer();
    const pv = await sharp(join(OUT, 'c_pill_view.png')).resize(440, 264, { fit: 'contain', background: { r: 17, g: 17, b: 17 } }).toBuffer();
    const w = 440, h = 264;
    await sharp({ create: { width: w * 2 + 6, height: h + 22, channels: 3, background: '#333' } })
      .composite([
        { input: Buffer.from(`<svg width="${w * 2 + 6}" height="20"><rect width="100%" height="100%" fill="#111"/><text x="6" y="15" font-family="monospace" font-size="12" fill="#fff">Highlights/at Spinny        |        View  — identical stadium ends</text></svg>`), top: 0, left: 0 },
        { input: ps, top: 22, left: 0 },
        { input: pv, top: 22, left: w + 6 },
      ]).png().toFile(join(OUT, 'proof_pills_both.png'));
    console.log('[C] wrote proof_pills_both.png');
  }
  await p.close();
}

// =====================================================================
// PART D — mobile: card4 bg + section render (custom cursor is desktop-only)
// =====================================================================
{
  const p = await (await b.newContext({ viewport: { width: 390, height: 840 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(1200);
  // warm lazy images
  await p.evaluate(async () => { const s = innerHeight * 0.6; for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 250)); });
  const cardTop = (sel) => p.evaluate((s) => { const c = document.querySelector(s); scrollTo(0, c.getBoundingClientRect().top + scrollY - 20); }, sel);
  await cardTop('.rw-card--beyond'); await p.waitForTimeout(500);
  await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 780 } })).toFile(join(OUT, 'proof_mobile_card4.png'));
  await cardTop('.rw-card--designsystem'); await p.waitForTimeout(400);
  await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 780 } })).toFile(join(OUT, 'proof_mobile_card3.png'));
  console.log('[D] wrote mobile card3/card4');
  await p.close();
}

await b.close();
console.log('DONE');
