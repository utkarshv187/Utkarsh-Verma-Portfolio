import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'about');
const b = await chromium.launch({ headless: true });
const WORDS = { 1: 'designer', 2: 'building', 3: 'experiences', 4: 'thoughtful', 5: 'work' };

async function check(w, h, label, shoot) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'no-preference' })).newPage();
  await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(900);
  const y = await p.evaluate(() => document.querySelector('#more-about-me').getBoundingClientRect().top + scrollY);
  await p.evaluate((yy) => scrollTo(0, yy - 30), y);
  await p.waitForTimeout(3200); // full reveal
  const rows = await p.evaluate(() => {
    const out = {};
    for (const n of [1, 2, 3, 4, 5]) {
      const word = document.querySelector('.about__anchor--' + n);
      const phrase = document.querySelector('.about__anchor--' + n + ' .about__ins-text');
      const caret = document.querySelector('.about__anchor--' + n + ' .about__caret');
      if (!word || !phrase) { out[n] = null; continue; }
      const wr = word.getBoundingClientRect(), pr = phrase.getBoundingClientRect(), cr = caret.getBoundingClientRect();
      out[n] = {
        word: word.textContent.replace(/[^a-zA-Z]/g, '').slice(0, 12),
        dxPhraseFromWordRight: Math.round(pr.left - wr.right),
        dyPhraseFromWordTop: Math.round(pr.top - wr.top),
        dxCaretFromWordRight: Math.round(cr.left - wr.right),
        phraseVisible: +getComputedStyle(phrase).opacity > 0.9,
        // sanity: is the phrase within a reasonable band of its word (attached, not drifted)?
        attachedX: Math.abs(pr.left - wr.right) < wr.width + 260,
      };
    }
    return out;
  });
  console.log(`\n[${label} ${w}x${h}]`);
  for (const n of [1, 2, 3, 4, 5]) console.log(`  ${n} ${WORDS[n]}:`, JSON.stringify(rows[n]));
  if (shoot) await sharp(await p.screenshot({ clip: { x: 0, y: 150, width: w, height: Math.min(620, h - 150) } })).resize(Math.min(760, w)).toFile(join(OUT, shoot));
  await p.close();
}
await check(1920, 1080, 'DESKTOP-XL', 'anchor_1920.png');
await check(1440, 900, 'DESKTOP', 'anchor_1440.png');
await check(1280, 900, 'DESKTOP-MIN', null);
await check(1024, 900, 'TABLET', 'anchor_1024.png');
await check(390, 840, 'MOBILE', 'anchor_390.png');
await b.close();
console.log('\ndone');
