import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });

// ===== LIVE: whitespace below card 4 before TTS; insert reveal sequence =====
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.55) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } });

// find the last RW card ("beyond"/"150+ PROJECTS") bottom in doc coords, and TTS section top (5756)
const gap = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  // the beyond card contains "PROJECTS" and "BEYOND"
  const cards = [...document.querySelectorAll('*')].filter(e => /150\+/.test(n(e.textContent)) && /BEYOND/i.test(n(e.textContent)) && n(e.textContent).length < 120);
  const card = cards.map(e => ({ e, r: e.getBoundingClientRect() })).filter(o => o.r.width > 600).sort((a, b) => b.r.width - a.r.width)[0];
  // TTS purple section top
  const tts = [...document.querySelectorAll('div')].map(e => ({ e, r: e.getBoundingClientRect(), bg: getComputedStyle(e).backgroundColor })).find(o => o.bg === 'rgb(155, 80, 255)' && o.r.width >= 1440);
  return { cardBottomDoc: card ? Math.round(card.r.bottom + scrollY) : null, cardH: card ? Math.round(card.r.height) : null, ttsTopDoc: tts ? Math.round(tts.r.top + scrollY) : null };
});
console.log('LIVE: card4 bottom(doc)=', gap.cardBottomDoc, ' TTS top(doc)=', gap.ttsTopDoc, ' => whitespace below card4 =', gap.ttsTopDoc - gap.cardBottomDoc, 'px (card fully settled)');

// insert reveal sequence: approach fresh, sample all 5 opacities rapidly
const insY = await p.evaluate(() => { const n = (s) => (s || '').replace(/\s+/g, ' ').trim(); const e = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /mentor, storyteller/i.test(n(e.textContent))); return e ? e.getBoundingClientRect().top + scrollY : null; });
await p.evaluate((y) => scrollTo(0, y - 1400), insY);
await p.waitForTimeout(600);
// scroll to just-trigger and sample fast
await p.evaluate((y) => scrollTo(0, y - 500), insY);
const phrases = ['mentor, storyteller', '& improving', 'products & businesses', 'sometimes unconventional', 'if not, then'];
console.log('\nINSERT reveal opacities over time (order = when each reaches opacity>0.5):');
for (let i = 0; i < 12; i++) {
  const ops = await p.evaluate((phs) => { const n = (s) => (s || '').replace(/\s+/g, ' ').trim(); return phs.map(ph => { const e = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && n(e.textContent).toLowerCase().includes(ph.toLowerCase())).sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0]; return e ? +(+getComputedStyle(e).opacity).toFixed(2) : null; }); }, phrases);
  console.log('  t=' + (i * 200) + 'ms', JSON.stringify(ops));
  await p.waitForTimeout(200);
}
await p.close();
await b.close();
console.log('done');
