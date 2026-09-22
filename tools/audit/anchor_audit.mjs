import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.55) { scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } });
// center the bio
await p.evaluate(() => { const n = (s) => (s || '').replace(/\s+/g, ' ').trim(); const e = [...document.querySelectorAll('div,p')].find(e => /Result, impact & delight/i.test(n(e.textContent)) && parseFloat(getComputedStyle(e).fontSize) > 30); scrollTo(0, e.getBoundingClientRect().top + scrollY - 200); });
await p.waitForTimeout(600);

const data = await p.evaluate(() => {
  const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const bio = [...document.querySelectorAll('div,p')].find(e => /Result, impact & delight/i.test(n(e.textContent)) && parseFloat(getComputedStyle(e).fontSize) > 30);
  const bioR = bio.getBoundingClientRect();
  // word-ish leaves (single words) inside the bio
  const words = [...bio.querySelectorAll('*')].filter(e => e.children.length === 0 && n(e.textContent).length > 0 && n(e.textContent).length < 24 && n(e.textContent) !== '^').map(e => { const r = e.getBoundingClientRect(); return { t: n(e.textContent), left: Math.round(r.left - bioR.left), right: Math.round(r.right - bioR.left), top: Math.round(r.top - bioR.top), bottom: Math.round(r.bottom - bioR.top), cx: Math.round((r.left + r.right) / 2 - bioR.left), cy: Math.round((r.top + r.bottom) / 2 - bioR.top) }; });
  const decomp = (t) => { if (!t || t === 'none') return 0; const m = t.match(/matrix\(([^)]+)\)/); if (!m) return 0; const [a, bb] = m[1].split(',').map(parseFloat); return +(Math.atan2(bb, a) * 180 / Math.PI).toFixed(1); };
  const findPhrase = (ph) => { const e = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && n(e.textContent).toLowerCase().includes(ph.toLowerCase())).sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0]; if (!e) return null; const r = e.getBoundingClientRect(); const wrap = (() => { let node = e; for (let k = 0; k < 4; k++) { const t = getComputedStyle(node).transform; if (t && t !== 'none') return node; node = node.parentElement; } return e; })(); return { left: Math.round(r.left - bioR.left), top: Math.round(r.top - bioR.top), w: Math.round(r.width), rot: decomp(getComputedStyle(wrap).transform) }; };
  const carets = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && n(e.textContent) === '^').map(e => { const r = e.getBoundingClientRect(); return { left: Math.round(r.left - bioR.left), top: Math.round(r.top - bioR.top), fs: getComputedStyle(e).fontSize }; }).filter(c => c.left > 0);
  const phrases = {
    designer: findPhrase('mentor, storyteller'),
    building: findPhrase('& improving'),
    experiences: findPhrase('products & businesses'),
    thoughtful: findPhrase('sometimes unconventional'),
    work: findPhrase('if not, then'),
  };
  // for each anchor word, get its word box
  const anchor = {};
  for (const w of ['designer', 'building', 'experiences', 'thoughtful', 'work']) { const wd = words.find(x => x.t.toLowerCase().replace(/[^a-z]/g, '') === w); anchor[w] = wd || null; }
  return { bioW: Math.round(bioR.width), anchor, phrases, carets };
});
console.log('bio width', data.bioW);
console.log('\nANCHOR WORDS:');
for (const [w, box] of Object.entries(data.anchor)) console.log('  ', w, JSON.stringify(box));
console.log('\nPHRASES:');
for (const [w, ph] of Object.entries(data.phrases)) console.log('  ', w, JSON.stringify(ph));
console.log('\nCARETS:', JSON.stringify(data.carets));
console.log('\nPHRASE offset RELATIVE TO ANCHOR WORD (phrase.left - word.right, phrase.top - word.top):');
for (const w of ['designer', 'building', 'experiences', 'thoughtful', 'work']) {
  const a = data.anchor[w], ph = data.phrases[w];
  if (a && ph) console.log(`  ${w}: dxFromWordRight=${ph.left - a.right}  dyFromWordTop=${ph.top - a.top}  rot=${ph.rot}  (word right=${a.right}, top=${a.top})`);
}
await b.close();
