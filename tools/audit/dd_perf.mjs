import { chromium } from 'playwright';
const URL = process.argv[2], LABEL = process.argv[3];
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
let bytes = 0, reqs = 0; const byType = {};
p.on('response', async (res) => {
  reqs++;
  try {
    const h = res.headers();
    const len = parseInt(h['content-length'] || '0', 10);
    let sz = len;
    if (!sz) { try { const bd = await res.body(); sz = bd.length; } catch { sz = 0; } }
    bytes += sz;
    const ct = (h['content-type'] || 'other').split(';')[0].split('/')[1] || 'other';
    byType[ct] = (byType[ct] || 0) + sz;
  } catch {}
});
const t0 = Date.now();
await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
const loadMs = Date.now() - t0;
// let lazy content + fonts settle, scroll a bit to trigger lazy images
await p.waitForTimeout(URL.includes('framer') ? 2500 : 1200);
await p.evaluate(async () => { for (let y = 0; y < Math.min(document.body.scrollHeight, 20000); y += innerHeight) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); });
await p.waitForTimeout(1500);
const timing = await p.evaluate(() => { const t = performance.getEntriesByType('navigation')[0] || {}; return { domContentLoaded: Math.round(t.domContentLoadedEventEnd || 0), loadEvent: Math.round(t.loadEventEnd || 0), dom: document.querySelectorAll('*').length }; });
const top = Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${(v / 1024).toFixed(0)}k`).join(' ');
console.log(`${LABEL}: totalBytes=${(bytes / 1024 / 1024).toFixed(2)}MB requests=${reqs} loadMs=${loadMs} DOMnodes=${timing.dom} DCL=${timing.domContentLoaded}ms | ${top}`);
await b.close();
