import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });
// bring THINGS THEY SAY into view
await p.evaluate(() => scrollTo(0, 5916 - 120));
await p.waitForTimeout(600);

// find linkedin anchors + their imgs within the testimonials band
const info = await p.evaluate(() => {
  const band = [5916, 6706];
  const anchors = [...document.querySelectorAll('a')].filter((a) => /linkedin\.com\/in\/uxuiuv/i.test(a.href));
  const imgs = [];
  for (const im of document.querySelectorAll('img')) {
    const r = im.getBoundingClientRect(); const dy = r.top + scrollY;
    if (dy < band[0] - 200 || dy > band[1] + 200) continue;
    if (r.width < 80) continue;
    const a = im.closest('a');
    imgs.push({ w: Math.round(r.width), h: Math.round(r.height), natW: im.naturalWidth, natH: im.naturalHeight, x: Math.round(r.left), src: (im.currentSrc || im.src), href: a?.href || null, target: a?.target || null, rel: a?.getAttribute('rel') || null, radius: getComputedStyle(im).borderRadius });
  }
  // find the marquee track: an ancestor of the first testimonial with a transform
  let track = null;
  if (imgs.length) {
    let node = document.querySelector('img[src*="' + (imgs[0].src.split('/').pop().split('?')[0]) + '"]');
    for (let k = 0; k < 10 && node; k++) { const t = getComputedStyle(node).transform; if (t && t !== 'none' && t.includes('matrix')) { const r = node.getBoundingClientRect(); track = { depth: k, tag: node.tagName.toLowerCase(), transform: t, w: Math.round(r.width), overflow: getComputedStyle(node.parentElement).overflow }; break; } node = node.parentElement; }
  }
  return { nAnchors: anchors.length, sampleAnchor: anchors[0]?.href, imgs, track };
});
console.log('anchors:', info.nAnchors, info.sampleAnchor);
console.log('track:', JSON.stringify(info.track));
console.log('images:');
for (const im of info.imgs) console.log('  ', JSON.stringify(im));

// detect motion: sample first img x over 2s
console.log('\nmotion sampling (img[0].x over time, no hover):');
const first = await p.evaluate(() => { const im = [...document.querySelectorAll('img')].find(i => { const r = i.getBoundingClientRect(); const dy = r.top + scrollY; return dy > 5900 && dy < 6900 && r.width > 80; }); return im ? im.getBoundingClientRect().left : null; });
for (let i = 0; i < 6; i++) { await p.waitForTimeout(350); const x = await p.evaluate(() => { const im = [...document.querySelectorAll('img')].find(i => { const r = i.getBoundingClientRect(); const dy = r.top + scrollY; return dy > 5900 && dy < 6900 && r.width > 80; }); return im ? Math.round(im.getBoundingClientRect().left) : null; }); console.log(`  t=${(i + 1) * 350}ms x=${x}`); }

// pause on hover? hover the track region and sample
await p.mouse.move(720, 460);
await p.waitForTimeout(200);
const hx0 = await p.evaluate(() => { const im = [...document.querySelectorAll('img')].find(i => { const r = i.getBoundingClientRect(); const dy = r.top + scrollY; return dy > 5900 && dy < 6900 && r.width > 80; }); return im ? Math.round(im.getBoundingClientRect().left) : null; });
await p.waitForTimeout(900);
const hx1 = await p.evaluate(() => { const im = [...document.querySelectorAll('img')].find(i => { const r = i.getBoundingClientRect(); const dy = r.top + scrollY; return dy > 5900 && dy < 6900 && r.width > 80; }); return im ? Math.round(im.getBoundingClientRect().left) : null; });
console.log(`\nhover pause test: x ${hx0} -> ${hx1} (delta ${hx1 - hx0})`);
await b.close();
