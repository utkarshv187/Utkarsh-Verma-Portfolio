import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });

async function measure(W, label) {
  const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2200);
  // scroll to RECENT WORK
  const ry = await p.evaluate(() => { for (const el of [...document.querySelectorAll('h1,h2,h3')]) if (/RECENT WORK/i.test((el.textContent || '').trim()) && (el.textContent || '').trim().length < 20) return Math.round(el.getBoundingClientRect().top + scrollY); return null; });
  if (ry != null) { await p.evaluate((y) => scrollTo(0, y + 200), ry); await p.waitForTimeout(900); }
  const data = await p.evaluate(() => {
    // find first project card: a big rounded element containing a stat number like "13%"
    const cards = [...document.querySelectorAll('a,div')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 300 && r.height > 300 && /13%|MORE USER/i.test(el.textContent || ''); });
    if (!cards.length) return null;
    // smallest such (the card itself, not a wrapper)
    cards.sort((a, b) => (a.getBoundingClientRect().width * a.getBoundingClientRect().height) - (b.getBoundingClientRect().width * b.getBoundingClientRect().height));
    const card = cards[0];
    const cr = card.getBoundingClientRect();
    // media = biggest img/canvas/div-with-bg in the left half
    const media = [...card.querySelectorAll('img,canvas,div')].map((el) => ({ el, r: el.getBoundingClientRect() })).filter((o) => o.r.width > 150 && o.r.height > 150 && o.r.left < cr.left + cr.width * 0.5).sort((a, b) => (b.r.width * b.r.height) - (a.r.width * a.r.height))[0];
    // stat tiles: small rounded boxes with a % number
    const tiles = [...card.querySelectorAll('div')].filter((el) => { const t = (el.textContent || '').trim(); const r = el.getBoundingClientRect(); return r.width > 80 && r.width < 320 && r.height > 50 && r.height < 200 && /^(\d+%|\d+x|1\/\d|MAX|\d+\+)/i.test(t) && t.length < 40; });
    // dedupe by position
    const seen = new Set(); const tt = [];
    for (const el of tiles) { const r = el.getBoundingClientRect(); const k = Math.round(r.left) + ',' + Math.round(r.top); if (seen.has(k)) continue; seen.add(k); tt.push({ left: Math.round(r.left - cr.left), top: Math.round(r.top - cr.top), right: Math.round(r.right - cr.left), bottom: Math.round(r.bottom - cr.top), w: Math.round(r.width), h: Math.round(r.height) }); }
    tt.sort((a, b) => a.top - b.top || a.left - b.left);
    const m = media ? { left: Math.round(media.r.left - cr.left), top: Math.round(media.r.top - cr.top), right: Math.round(media.r.right - cr.left), bottom: Math.round(media.r.bottom - cr.top), w: Math.round(media.r.width), h: Math.round(media.r.height) } : null;
    return { card: { w: Math.round(cr.width), h: Math.round(cr.height) }, media: m, tiles: tt };
  });
  console.log(`\n===== ${label} (W=${W}) =====`);
  if (!data) { console.log('  card not found'); await p.close(); return; }
  console.log('  card', JSON.stringify(data.card));
  console.log('  media', JSON.stringify(data.media));
  console.log('  #tiles', data.tiles.length);
  data.tiles.forEach((t, i) => console.log(`   tile${i} top=${t.top} bottom=${t.bottom} h=${t.h} [${t.left}-${t.right}]`));
  if (data.media) {
    const imgBelow = data.card.h - data.media.bottom;
    const lowestTileBottom = Math.max(...data.tiles.map((t) => t.bottom));
    const tileBelow = data.card.h - lowestTileBottom;
    console.log(`  => image bottom-gap (card.h - media.bottom) = ${imgBelow}`);
    console.log(`  => lowest tile bottom = ${lowestTileBottom}, tile bottom-gap = ${tileBelow}`);
    console.log(`  => media.bottom=${data.media.bottom} vs lowestTileBottom=${lowestTileBottom} (aligned? ${Math.abs(data.media.bottom - lowestTileBottom) <= 4})`);
  }
  await p.close();
}
await measure(1440, 'DESKTOP');
await measure(390, 'MOBILE');
await b.close();
