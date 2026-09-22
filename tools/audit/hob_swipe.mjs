import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', hasTouch: true })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });
await p.evaluate(() => scrollTo(0, 7600));
await p.waitForTimeout(500);

const gameIds = ['LPldbLZ', 'OCxNlm00', '0xM0Lwgl', 'RgYfjJzg'];
const snap = () => p.evaluate((ids) => ids.map((id) => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id)); if (!im) return null; const r = im.getBoundingClientRect(); let n = im, tf = 'none', op = 1, z = 'auto'; for (let k = 0; k < 4 && n; k++) { const cs = getComputedStyle(n); if (cs.transform !== 'none' && cs.transform.includes('matrix')) tf = cs.transform; if (parseFloat(cs.opacity) < 1) op = cs.opacity; if (cs.zIndex !== 'auto') z = cs.zIndex; n = n.parentElement; } const m = tf.match(/matrix\(([^)]+)\)/); const rot = m ? +(Math.atan2(+m[1].split(',')[1], +m[1].split(',')[0]) * 180 / Math.PI).toFixed(0) : 0; return { id: id.slice(0, 6), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), rot, op: +op, z }; }), gameIds);

// center of the GAMING pile
const c = await p.evaluate(() => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes('0xM0Lwgl')); const r = im.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
console.log('pile center', JSON.stringify(c));
console.log('\nBEFORE swipe:'); for (const s of await snap()) console.log('  ', JSON.stringify(s));

// perform a left swipe across the pile
await p.mouse.move(c.x + 90, c.y);
await p.mouse.down();
for (let i = 1; i <= 12; i++) { await p.mouse.move(c.x + 90 - i * 18, c.y); await p.waitForTimeout(16); }
console.log('\nDURING drag (mid):'); for (const s of await snap()) console.log('  ', JSON.stringify(s));
await p.mouse.up();
await p.waitForTimeout(700);
console.log('\nAFTER swipe + settle:'); for (const s of await snap()) console.log('  ', JSON.stringify(s));

// swipe again to see cycling
await p.mouse.move(c.x + 90, c.y); await p.mouse.down();
for (let i = 1; i <= 12; i++) { await p.mouse.move(c.x + 90 - i * 18, c.y); await p.waitForTimeout(16); }
await p.mouse.up(); await p.waitForTimeout(700);
console.log('\nAFTER 2nd swipe:'); for (const s of await snap()) console.log('  ', JSON.stringify(s));
await b.close();
