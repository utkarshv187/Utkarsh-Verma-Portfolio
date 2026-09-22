import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(1000);
const secTop = await p.evaluate(() => document.querySelector('#recent-work').getBoundingClientRect().top + scrollY);

// (1) scroll-through montage of the progressive shrink (4 stack states)
const frames = [];
for (const dy of [300, 1050, 1800, 2450]) {
  await p.evaluate((y) => scrollTo(0, y), secTop + dy);
  await p.waitForTimeout(500);
  frames.push(await p.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 820 } }));
}
const sw = 700, gap = 8;
const bufs = [];
for (const f of frames) bufs.push(await sharp(f).resize(sw).toBuffer());
const fh = (await sharp(bufs[0]).metadata()).height;
await sharp({ create: { width: sw * 2 + gap, height: fh * 2 + gap, channels: 3, background: '#111' } })
  .composite([
    { input: bufs[0], left: 0, top: 0 }, { input: bufs[1], left: sw + gap, top: 0 },
    { input: bufs[2], left: 0, top: fh + gap }, { input: bufs[3], left: sw + gap, top: fh + gap },
  ]).png().toFile(join(OUT, 'shrink_seq.png'));
console.log('wrote shrink_seq.png');

// (2) "View" pill cursor over a card (my Cursor listens to pointermove -> works headless)
await p.evaluate((y) => scrollTo(0, y), secTop + 300);
await p.waitForTimeout(500);
const pt = await p.evaluate(() => { const c = document.querySelector('.rw-card--auction').getBoundingClientRect(); return { x: c.left + c.width * 0.72, y: c.top + c.height * 0.42 }; });
await p.mouse.move(pt.x - 60, pt.y - 40);
await p.mouse.move(pt.x, pt.y, { steps: 8 });
await p.waitForTimeout(500);
await sharp(await p.screenshot({ clip: { x: Math.max(0, pt.x - 130), y: Math.max(0, pt.y - 70), width: 260, height: 150 } })).resize(520).toFile(join(OUT, 'view_pill.png'));
console.log('wrote view_pill.png');
await b.close();
