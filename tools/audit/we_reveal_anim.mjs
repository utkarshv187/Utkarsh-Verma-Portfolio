import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1600);
await p.evaluate(() => { const c = document.querySelector('[data-framer-name="Experinece Info"]').parentElement; const y = c.children[0].getBoundingClientRect().top + window.scrollY; window.scrollTo(0, y - 120); });
await p.waitForTimeout(400);

const result = await p.evaluate(async () => {
  function fire(el, types) {
    const r = el.getBoundingClientRect(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    types.forEach((t) => { const Ev = t.indexOf('pointer') === 0 ? PointerEvent : MouseEvent; el.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerType: 'mouse' })); });
  }
  const c = document.querySelector('[data-framer-name="Experinece Info"]').parentElement;
  const spinny = c.children[0];
  const rowH0 = Math.round(spinny.getBoundingClientRect().height);
  const t0 = performance.now();
  fire(spinny, ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'pointermove', 'mousemove']);
  [...spinny.children].forEach((ch) => fire(ch, ['pointerover', 'pointerenter', 'mouseover', 'pointermove']));
  const frames = [];
  function findBento() { return document.querySelector('[data-framer-name="Bento"]'); }
  function sample() {
    const t = Math.round(performance.now() - t0);
    const rowH = Math.round(spinny.getBoundingClientRect().height);
    const b = findBento();
    let bento = null;
    if (b) { const cs = getComputedStyle(b); const br = b.getBoundingClientRect(); bento = { op: +(+cs.opacity).toFixed(3), tf: cs.transform, h: Math.round(br.height), y: Math.round(br.top) }; }
    // also the row's outer expanding wrapper: nearest ancestor whose height grows
    frames.push({ t, rowH, bento });
  }
  await new Promise((res) => {
    let n = 0;
    const iv = setInterval(() => { sample(); n++; if (performance.now() - t0 > 1400) { clearInterval(iv); res(); } }, 25);
  });
  return { rowH0, frames };
});
// print compact
console.log('rowH0', result.rowH0);
result.frames.forEach((f) => {
  if (!f.bento) { console.log(String(f.t).padStart(4), 'rowH', f.rowH, 'bento -'); return; }
  console.log(String(f.t).padStart(4), 'rowH', String(f.rowH).padStart(4), 'bentoH', String(f.bento.h).padStart(4), 'op', f.bento.op, f.bento.tf.slice(0, 40));
});
await b.close();
