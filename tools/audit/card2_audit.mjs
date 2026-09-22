import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'audit/out/card2'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ headless: true });

async function shots(url, tag, W) {
  const p = await (await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'no-preference' })).newPage();
  await p.goto(url, { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(url.includes('framer') ? 2500 : 800);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.5) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
  await p.waitForTimeout(400);
  // find card 2 (contains "gamification" title or "MORE USER" + purple). Use the media box.
  const cardTop = await p.evaluate(() => {
    // find the title "Introduced a tier based gamification"
    for (const el of [...document.querySelectorAll('h3,h2,p,div')]) { if (/Introduced a tier based gamification/i.test((el.textContent || '')) && (el.textContent || '').length < 60) return Math.round(el.getBoundingClientRect().top + (window.scrollY || document.body.scrollTop)); }
    return null;
  });
  if (cardTop == null) { console.log(`${tag} ${W}: card2 not found`); await p.close(); return; }
  // sample 3 scroll positions around the card
  const positions = [cardTop - 500, cardTop - 150, cardTop + 200];
  for (let i = 0; i < positions.length; i++) {
    await p.evaluate((y) => { window.scrollTo(0, y); document.documentElement.scrollTop = y; document.body.scrollTop = y; }, positions[i]);
    await p.waitForTimeout(700);
    // clip to the card 2 media region
    const box = await p.evaluate(() => {
      // media = the dotted-panel / gamify media inside the purple card
      let media = document.querySelector('.rw-gamify, [class*="gamify"]');
      if (!media) { // live: find the media box near the gamification title
        const t = [...document.querySelectorAll('*')].find((el) => /Introduced a tier based/i.test(el.textContent || '') && el.textContent.length < 60);
        if (t) { const card = t.closest('a,div'); const imgs = card ? [...card.querySelectorAll('img')] : []; if (imgs.length) { const rs = imgs.map((im) => im.getBoundingClientRect()); const l = Math.min(...rs.map((r) => r.left)), tp = Math.min(...rs.map((r) => r.top)), rt = Math.max(...rs.map((r) => r.right)), bt = Math.max(...rs.map((r) => r.bottom)); return { x: Math.round(l) - 10, y: Math.round(tp) - 10, w: Math.round(rt - l) + 20, h: Math.round(bt - tp) + 20 }; } }
        return null;
      }
      const r = media.getBoundingClientRect();
      return { x: Math.round(r.left) - 6, y: Math.round(r.top) - 6, w: Math.round(r.width) + 12, h: Math.round(r.height) + 12 };
    });
    if (!box || box.w < 10 || box.y < -200 || box.y > 900) { console.log(`${tag} ${W} pos${i}: media offscreen/none`, JSON.stringify(box)); continue; }
    const clip = { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(W - Math.max(0, box.x), box.w), height: Math.min(900 - Math.max(0, box.y), box.h) };
    if (clip.width > 10 && clip.height > 10) { await p.screenshot({ path: `${dir}/${tag}_${W}_pos${i}.png`, clip }); console.log(`${tag} ${W} pos${i}: saved`, JSON.stringify(clip)); }
  }
  await p.close();
}
await shots('https://uxuiuv.framer.website/', 'live', 1440);
await shots('http://localhost:5199/', 'mine', 1440);
await b.close();
