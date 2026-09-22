import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } });
await p.evaluate(() => scrollTo(0, 7600));
await p.waitForTimeout(500);

const gameIds = ['LPldbLZ', 'OCxNlm00', '0xM0Lwgl', 'RgYfjJzg'];
const snap = () => p.evaluate((ids) => ids.map((id) => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes(id)); if (!im) return null; const r = im.getBoundingClientRect(); let n = im, tf = 'none'; for (let k = 0; k < 4 && n; k++) { const cs = getComputedStyle(n); if (cs.transform !== 'none' && cs.transform.includes('matrix')) tf = cs.transform; n = n.parentElement; } const m = tf.match(/matrix\(([^)]+)\)/); const p2 = m ? m[1].split(',').map(parseFloat) : [1, 0, 0, 1, 0, 0]; return { id: id.slice(0, 4), x: Math.round(r.left), y: Math.round(r.top), rot: +(Math.atan2(p2[1], p2[0]) * 180 / Math.PI).toFixed(0), tx: Math.round(p2[4]), ty: Math.round(p2[5]) }; }), gameIds);

const box = await p.evaluate(() => { const im = [...document.querySelectorAll('img')].find((x) => (x.currentSrc || x.src).includes('0xM0Lwgl')); const r = im.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), cy: Math.round(r.top + r.height / 2) }; });
console.log('pile x range', box.left, '-', box.right, 'cy', box.cy);
console.log('\nHOVER-MOVE across the pile (left -> right), sampling image transforms:');
const xs = [box.left - 20, box.left + 40, box.left + 120, box.left + 200, box.left + 280, box.right + 20];
for (const x of xs) {
  await p.mouse.move(x, box.cy, { steps: 4 });
  await p.waitForTimeout(250);
  const s = await snap();
  console.log(`  x=${x}: ` + s.map((o) => `${o.id}(rot${o.rot},tx${o.tx},ty${o.ty})`).join(' '));
}
// also: does a quick FLING (fast drag) do anything?
await p.mouse.move(box.right - 20, box.cy);
await p.mouse.down();
await p.mouse.move(box.left + 20, box.cy, { steps: 3 });
await p.mouse.up();
await p.waitForTimeout(600);
console.log('\nafter FAST fling:'); console.log('  ' + (await snap()).map((o) => `${o.id}(rot${o.rot},tx${o.tx})`).join(' '));
await b.close();
