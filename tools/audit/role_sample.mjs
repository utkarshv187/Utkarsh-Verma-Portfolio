import { chromium } from 'playwright';
const URL = process.argv[2] || 'https://uxuiuv.framer.website/';
const W = +(process.argv[3] || 1440);
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 })).newPage();
await p.goto(URL, { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2000);
const seen = {};
for (let t = 0; t < 30; t++) {
  const rec = await p.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const words = ['DESIGNER', 'RESEARCHER', 'STRATEGIST', 'STORYTELLER', 'ANIMATOR', 'COPY WRITER'];
    const out = [];
    for (const el of document.querySelectorAll('h1,h2,span,div,p')) {
      const tx = norm(el.textContent);
      if (!words.includes(tx) || el.children.length > 1) continue;
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      const fsv = parseFloat(cs.fontSize) || 0;
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.4 || r.height < 20 || fsv < 80) continue;
      // only the one currently in view (near vertical center of its slot / opacity 1)
      out.push({ word: tx, fs: Math.round(parseFloat(cs.fontSize) * 10) / 10, bw: Math.round(r.width), top: Math.round(r.top) });
    }
    return out;
  });
  for (const r of rec) { seen[r.word] = seen[r.word] || r; }
  await p.waitForTimeout(400);
}
console.log(`\n== LIVE role words @${W} (fs per word; if all equal => fixed size, if varying => fit-to-width) ==`);
for (const k of Object.keys(seen)) console.log(`${k.padEnd(13)} fs ${seen[k].fs}  width ${seen[k].bw}`);
await b.close();
