import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'about');
import { mkdirSync } from 'node:fs'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });

async function shot(y, name, h = 820) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(600); await sharp(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: h } })).resize(720).toFile(join(OUT, name)); }
await shot(5916 - 140, 'tts_full.png');       // things they say
await shot(6706 - 120, 'about_top.png');       // more about me top (heading + bio)
await shot(6965 + 100, 'about_bio.png');       // bio paragraph area
await shot(7451 - 300, 'about_grid.png');      // skill grid + learning
await shot(7451 + 100, 'about_grid2.png');

// real heading styles: pick text elements with big font in each section
const styles = await p.evaluate(() => {
  const pick = (re, band) => { const els = [...document.querySelectorAll('h1,h2,h3,div,p,span')].filter(n => { const t = (n.textContent || '').replace(/\s+/g, ' ').trim(); const r = n.getBoundingClientRect(); const dy = r.top + scrollY; return re.test(t) && parseFloat(getComputedStyle(n).fontSize) > 24 && dy > band[0] && dy < band[1]; }); const e = els.sort((a, b) => parseFloat(getComputedStyle(a).fontSize) - parseFloat(getComputedStyle(b).fontSize))[0]; if (!e) return null; const c = getComputedStyle(e); return { text: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), fs: c.fontSize, lh: c.lineHeight, fw: c.fontWeight, color: c.color, ff: c.fontFamily.split(',')[0] }; };
  return {
    ttsHead: pick(/THINGS THEY SAY/i, [5800, 6100]),
    ttsSub: pick(/REAL WORK/i, [5900, 6200]),
    aboutHead: pick(/MORE ABOUT ME/i, [6600, 6900]),
    aboutSub: pick(/ENGINEER TURNED ARTIST/i, [6700, 7000]),
  };
});
console.log(JSON.stringify(styles, null, 2));
await b.close();
console.log('wrote section screenshots');
