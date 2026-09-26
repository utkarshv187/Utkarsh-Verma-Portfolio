// UI sound check (src/lib/sound.ts): silent + nothing loaded by default; each trigger plays the right
// sound once enabled; nothing plays on scroll (except the 5 More About Me phrase ticks, which are
// reveal-driven by design); rate limiting; touch. Instruments Web Audio to log every buffer start.
// usage: node tools/audit/sound_check.mjs [url]
import { chromium } from 'playwright';
const PAGE = process.argv[2] || 'http://localhost:5199/';
const instrument = () => {
  window.__snd = { ctx: 0, fetches: [], plays: [] };
  const names = new WeakMap();
  const f0 = window.fetch;
  window.fetch = async (...a) => {
    const r = await f0(...a);
    const u = String(a[0]);
    if (u.includes('/sounds/')) {
      window.__snd.fetches.push(u);
      const ab0 = r.arrayBuffer.bind(r);
      r.arrayBuffer = async () => { const ab = await ab0(); names.set(ab, u.split('/').pop().replace('.wav', '')); return ab; };
    }
    return r;
  };
  const AC = window.AudioContext;
  window.AudioContext = class extends AC { constructor(...a) { super(...a); window.__snd.ctx++; } };
  const dec = AC.prototype.decodeAudioData;
  AC.prototype.decodeAudioData = async function (ab, ...rest) { const n = names.get(ab); const buf = await dec.call(this, ab, ...rest); buf.__name = n; return buf; };
  const st = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { window.__snd.plays.push(this.buffer?.__name || '?'); return st.apply(this, a); };
};
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const snap = (p) => p.evaluate(() => JSON.parse(JSON.stringify(window.__snd)));
const plays = async (p) => (await snap(p)).plays;
const center = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
const rectOf = (p, sel) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
const setY = (p, y) => p.evaluate((v) => { document.scrollingElement.scrollTop = v; }, y);
const scrollAll = async (p, from = 0) => { const H = await p.evaluate(() => document.scrollingElement.scrollHeight); for (let y = from; y < H; y += 300) { await setY(p, y); await p.waitForTimeout(40); } };
const log = (k, v) => console.log(k.padEnd(46), v);

// ---------- 1) default: muted ----------
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.addInitScript(instrument);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.mouse.move(1250, 40); await p.mouse.move(1000, 40); // hover header buttons
  let c = await center(p, '.hero__graffiti'); await p.mouse.move(c.x, c.y); await p.waitForTimeout(200); // pill
  await scrollAll(p);
  c = await center(p, '.hob__grid-cell:nth-child(3)'); await p.mouse.click(c.x, c.y); await p.waitForTimeout(400); await p.keyboard.press('Escape');
  const s = await snap(p);
  log('MUTED: AudioContexts created', s.ctx);
  log('MUTED: sound files fetched', s.fetches.length);
  log('MUTED: sounds played', s.plays.length ? s.plays.join(',') : 0);
  log('MUTED: toggle aria-pressed / label', await p.evaluate(() => { const t = document.querySelector('.sound-toggle'); return `${t.getAttribute('aria-pressed')} / "${t.getAttribute('aria-label')}"`; }));
  await p.context().close();
}

// ---------- 2) enabled: each trigger ----------
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.addInitScript(instrument);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const step = async (label, fn, wait = 350) => { const n0 = (await plays(p)).length; await fn(); await p.waitForTimeout(wait); const got = (await plays(p)).slice(n0); log(label, got.length ? got.join(', ') : '(silent)'); };

  let c = await rectOf(p, '.sound-toggle');
  await step('toggle ON', () => p.mouse.click(c.x, c.y), 700);
  const s = await snap(p); log('  files fetched / AudioContexts', `${s.fetches.length} / ${s.ctx}`);
  await step('toggle OFF, then hover + click Contact', async () => { await p.mouse.click(c.x, c.y); const a = await rectOf(p, '.contact'); await p.mouse.move(a.x, a.y, { steps: 3 }); await p.mouse.click(a.x, a.y); await p.mouse.move(700, 450); });
  await step('toggle ON again (load not repeated)', async () => { await setY(p, 0); await p.waitForTimeout(200); await p.mouse.click(c.x, c.y); }, 600);
  await setY(p, 0); await p.waitForTimeout(300);
  c = await rectOf(p, '.header__nav--desktop .resume');
  await p.mouse.move(1430, 300);
  await step('hover Résumé', () => p.mouse.move(c.x, c.y, { steps: 3 }));
  await p.mouse.move(700, 450);
  c = await rectOf(p, '.nav-link');
  await step('click About', () => p.mouse.click(c.x, c.y), 900);
  await setY(p, 0); await p.waitForTimeout(300);
  c = await rectOf(p, '.hero__graffiti');
  await p.mouse.move(c.x, 150);
  await step("pill appears (That's me)", () => p.mouse.move(c.x, c.y, { steps: 3 }));
  await p.mouse.move(c.x, 150); await p.waitForTimeout(500);
  await step('pill: on, off, on again within ~100ms', async () => { await p.mouse.move(c.x, c.y); await p.mouse.move(c.x, 150); await p.mouse.move(c.x, c.y); });
  // stationary cursor; the page scrolls a card's pill in under it -> must stay silent
  await p.mouse.move(1150, 450); await p.waitForTimeout(200); // the card's title/stats side (the slider handle mid-image suppresses the pill)
  const rwTop = await p.evaluate(() => document.querySelector('.rw-card').getBoundingClientRect().top + document.scrollingElement.scrollTop);
  await step('pill appears only via SCROLL (still cursor)', async () => { for (let y = rwTop - 1200; y < rwTop + 700; y += 60) { await setY(p, y); await p.waitForTimeout(30); } });
  log('  (pill showing after that scroll?)', await p.evaluate(() => document.querySelector('.cursor-text--show') !== null));
  // rest of the page with the mouse parked in a dead corner: only the 5 phrase ticks expected
  await p.mouse.move(5, 895);
  const aboutTop = await p.evaluate(() => document.getElementById('more-about-me').getBoundingClientRect().top + document.scrollingElement.scrollTop);
  await step('scroll through More About Me (bio already revealed by the About click)', async () => { for (let y = rwTop; y < aboutTop + 300; y += 250) { await setY(p, y); await p.waitForTimeout(40); } }, 2800);
  await step('scroll the rest of the page', () => scrollAll(p, aboutTop + 300), 400);
  // hobbies
  c = await center(p, '.hob__col--gaming .hob__pile');
  await step('hobby card drag (swipe left)', async () => { await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.mouse.move(c.x - 120, c.y, { steps: 8 }); await p.mouse.up(); }, 500);
  await step('hobby pile tap -> popup opens', () => p.mouse.click(c.x, c.y), 500);
  await step('Esc -> popup closes', () => p.keyboard.press('Escape'), 500);
  c = await center(p, '.hob__grid-cell:nth-child(4)');
  await step('photo -> lightbox opens', () => p.mouse.click(c.x, c.y), 500);
  await step('click backdrop -> lightbox closes', () => p.mouse.click(20, 450), 500);
  // footer pill + go to top
  await p.evaluate(() => { document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight; }); await p.waitForTimeout(700);
  c = await rectOf(p, '.footer__pill--mail');
  await step('hover footer email pill', () => p.mouse.move(c.x, c.y, { steps: 3 }));
  c = await rectOf(p, '.gtt');
  await step('hover + click GO TO TOP', async () => { await p.mouse.move(c.x, c.y, { steps: 3 }); await p.mouse.click(c.x, c.y); }, 1200);
  // rate limit: 12 rapid clicks on About
  await setY(p, 0); await p.waitForTimeout(300);
  c = await rectOf(p, '.nav-link');
  await p.mouse.move(c.x, c.y);
  await step('12 rapid clicks on About (~25ms apart)', async () => { for (let i = 0; i < 12; i++) { await p.mouse.click(c.x, c.y); await p.waitForTimeout(25); } }, 900);
  log('page errors', errs.length ? errs.slice(0, 3).join(' | ') : 0);
  await p.context().close();
}

// ---------- 2a) phrase ticks: scroll to the bio and stay -> one tick per phrase (5) ----------
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.addInitScript(instrument);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const c = await rectOf(p, '.sound-toggle'); await p.mouse.click(c.x, c.y); await p.waitForTimeout(700);
  await p.mouse.move(5, 895);
  const n0 = (await plays(p)).length;
  const bioTop = await p.evaluate(() => document.querySelector('.about__bio').getBoundingClientRect().top + document.scrollingElement.scrollTop);
  const t0 = Date.now();
  for (let y = bioTop - 2500; y <= bioTop - 250; y += 250) { await setY(p, y); await p.waitForTimeout(40); }
  await p.waitForTimeout(2800);
  log(`scroll to the bio + stay (${Date.now() - t0}ms)`, (await plays(p)).slice(n0).join(', ') || '(silent)');
  await p.context().close();
}

// ---------- 2b) phrase ticks: scrolled away before the phrases appear -> no ticks ----------
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.addInitScript(instrument);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const c = await rectOf(p, '.sound-toggle'); await p.mouse.click(c.x, c.y); await p.waitForTimeout(700);
  await p.mouse.move(5, 895);
  const n0 = (await plays(p)).length;
  const bioTop = await p.evaluate(() => document.querySelector('.about__bio').getBoundingClientRect().top + document.scrollingElement.scrollTop);
  await setY(p, bioTop - 300); await p.waitForTimeout(250); // bio reveals…
  await setY(p, 0); await p.waitForTimeout(2800); // …but we leave before the phrases (0.9s+) appear
  log('reveal bio, scroll away within 0.25s', (await plays(p)).slice(n0).join(', ') || '(silent)');
  await p.context().close();
}

// ---------- 3) touch phone ----------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(instrument);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const t = async (sel) => { const c = await rectOf(p, sel); await p.touchscreen.tap(c.x, c.y); };
  await t('.sound-toggle'); await p.waitForTimeout(700);
  log('PHONE: tap toggle ON', (await plays(p)).join(', ') || '(silent)');
  const n0 = (await plays(p)).length;
  ctx.on('page', (np) => np.close()); // résumé opens a new tab
  await t('.resume--mobile'); await p.waitForTimeout(400);
  log('PHONE: tap Résumé (no hover tick on touch)', (await plays(p)).slice(n0).join(', ') || '(silent)');
  await ctx.close();
}
await b.close();
