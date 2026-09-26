// Filmstrip of the page-load intro: records real frames with Chrome's screencast during a normal
// load (after a discarded warm-up load), then tiles frames at ~+0/100/200/350/500/800ms from the
// first frame that shows the hero into one PNG.  usage: OUT=<dir> node tools/audit/intro_film.mjs [url] [desktop|phone]
import { chromium } from 'playwright';
import sharp from 'sharp';
const PAGE = process.argv[2] || 'http://localhost:4199/';
const phone = process.argv[3] === 'phone';
const OUT = process.env.OUT || '.';
const opts = phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : { viewport: { width: 1440, height: 900 } };
const b = await chromium.launch({ args: ['--use-angle=d3d11'] });
{ const w = await b.newContext(opts); await (await w.newPage()).goto(PAGE, { waitUntil: 'load' }); await w.close(); } // warm-up
const ctx = await b.newContext(opts);
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => { frames.push({ t: f.metadata.timestamp * 1000, data: f.data }); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 80, everyNthFrame: 1 });
await p.goto(PAGE, { waitUntil: 'commit' });
await p.waitForTimeout(2500);
await cdp.send('Page.stopScreencast');
// first frame with the hero visible = first frame noticeably different from the blank page
const imgs = await Promise.all(frames.map(async (f) => ({ ...f, buf: Buffer.from(f.data, 'base64') })));
const stats = await Promise.all(imgs.map((f) => sharp(f.buf).stats()));
const startIdx = stats.findIndex((s) => s.channels[0].mean + s.channels[1].mean + s.channels[2].mean > 60);
const t0 = imgs[Math.max(0, startIdx)].t;
const picks = [0, 100, 200, 350, 500, 800].map((ms) => imgs.slice(startIdx).find((f) => f.t - t0 >= ms) || imgs[imgs.length - 1]);
const W = phone ? 260 : 480, meta = await sharp(picks[0].buf).metadata(), H = Math.round((meta.height / meta.width) * W);
const tiles = await Promise.all(picks.map((f) => sharp(f.buf).resize(W, H).toBuffer()));
const cols = phone ? 6 : 3, rows = Math.ceil(tiles.length / cols);
await sharp({ create: { width: cols * W + (cols - 1) * 6, height: rows * (H + 22) , channels: 3, background: '#ffffff' } })
  .composite([
    ...tiles.map((t, i) => ({ input: t, left: (i % cols) * (W + 6), top: Math.floor(i / cols) * (H + 22) + 22 })),
    ...picks.map((f, i) => ({ input: Buffer.from(`<svg width="${W}" height="20"><text x="4" y="15" font-family="Arial" font-size="14" fill="#000">+${Math.round(f.t - t0)}ms</text></svg>`), left: (i % cols) * (W + 6), top: Math.floor(i / cols) * (H + 22) })),
  ])
  .png().toFile(`${OUT}/intro_film_${phone ? 'phone' : 'desktop'}.png`);
console.log(`${frames.length} frames captured; strip written (${picks.map((f) => '+' + Math.round(f.t - t0)).join(' ')}ms)`);
await b.close();
