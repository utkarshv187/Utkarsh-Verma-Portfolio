import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'about');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.55) { scrollTo(0, y); await new Promise(r => setTimeout(r, 180)); } });
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

// ===== testimonial card cursor =====
await p.evaluate(() => scrollTo(0, 5916 - 120));
await p.waitForTimeout(600);
// snapshot cursor-like fixed/absolute elements BEFORE hover
const cursorEls = async (label) => p.evaluate((lbl) => {
  const out = [];
  for (const e of document.querySelectorAll('div,span')) {
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    if ((cs.position === 'fixed' || cs.position === 'absolute') && r.width > 0 && r.width < 200 && r.height < 200 && cs.zIndex && +cs.zIndex > 5) {
      const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
      if (r.width < 8 && !t) continue;
      out.push({ t: t.slice(0, 20), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top), z: cs.zIndex, br: cs.borderRadius, bg: cs.backgroundColor, mix: cs.mixBlendMode });
    }
  }
  return out;
}, label);
const box = await p.evaluate(() => { const a = [...document.querySelectorAll('a')].find(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href)); const r = a.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
await p.mouse.move(box.x - 60, box.y - 40);
await p.mouse.move(box.x, box.y, { steps: 10 });
await p.waitForTimeout(500);
console.log('cursor-ish elements while hovering a testimonial card:');
const els = await cursorEls('hover');
for (const e of els) console.log('  ', JSON.stringify(e));
// screenshot the area around the cursor
await sharp(await p.screenshot({ clip: { x: Math.max(0, box.x - 120), y: Math.max(0, box.y - 90), width: 240, height: 180 } })).resize(360).toFile(join(OUT, 'live_tts_cursor.png'));
// also check the <a> and card computed cursor + any data-* attrs
const cardMeta = await p.evaluate(() => { const a = [...document.querySelectorAll('a')].find(a => /linkedin\.com\/in\/uxuiuv/i.test(a.href)); const attrs = {}; for (const at of a.attributes) attrs[at.name] = at.value.slice(0, 40); return { cursor: getComputedStyle(a).cursor, attrs }; });
console.log('card <a> meta:', JSON.stringify(cardMeta));

// ===== icon ticker full list + Framer + LEARNING clip =====
await p.evaluate(() => scrollTo(0, 7451 - 350));
await p.waitForTimeout(600);
const ticker = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  // the ul holding ticker-item icons
  const learnBadge = [...document.querySelectorAll('*')].find(e => n(e.textContent) === 'LEARNING' && e.children.length === 0);
  let ul = null;
  const anyIcon = [...document.querySelectorAll('img')].find(i => { const r = i.getBoundingClientRect(); const dy = r.top + scrollY; return dy > 7300 && dy < 7600 && Math.abs(r.width - 100) < 10; });
  if (anyIcon) ul = anyIcon.closest('ul');
  const items = ul ? [...ul.querySelectorAll(':scope > li')].map(li => { const im = li.querySelector('img'); return im ? (im.currentSrc || im.src).split('/').pop().split('.')[0] : null; }) : [];
  // LEARNING badge clip context
  let clip = null;
  if (learnBadge) { let node = learnBadge; const chain = []; for (let k = 0; k < 5 && node; k++) { const cs = getComputedStyle(node); const r = node.getBoundingClientRect(); chain.push({ tag: node.tagName.toLowerCase(), overflow: cs.overflow, h: Math.round(r.height), w: Math.round(r.width) }); node = node.parentElement; } clip = chain; }
  return { count: items.length, items, learnBadge: !!learnBadge, clip };
});
console.log('\nTICKER items (', ticker.count, '):', JSON.stringify(ticker.items));
console.log('LEARNING clip chain:', JSON.stringify(ticker.clip, null, 2));
await b.close();
