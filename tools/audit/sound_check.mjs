// UI sound check (src/lib/sound.ts). Sound is OFF on every load and reload: nothing plays or loads
// until the toggle turns it on, and that state is never persisted. Instruments Web Audio: every buffer start
// is logged with its sound name and its absolute scheduled time on the audio clock (so sequences can
// be checked against the animations), and every stop() is logged (so loops can be checked to end).
// usage: node tools/audit/sound_check.mjs [url]
import { chromium } from 'playwright';
const PAGE = process.argv[2] || 'http://localhost:5199/';
const instrument = () => {
  window.__snd = { ctx: 0, fetches: [], plays: [], stops: [] };
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
  for (const C of [AC, window.OfflineAudioContext]) {
    const dec = C.prototype.decodeAudioData;
    C.prototype.decodeAudioData = async function (ab, ...rest) { const n = names.get(ab); const buf = await dec.call(this, ab, ...rest); buf.__name = n; return buf; };
  }
  const st = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when = 0, ...a) {
    window.__snd.plays.push({ n: this.buffer?.__name || '?', w: when || this.context.currentTime, loop: this.loop }); // w = absolute audio-clock time
    return st.call(this, when, ...a);
  };
  const sp = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.stop = function (...a) { window.__snd.stops.push(this.buffer?.__name || '?'); return sp.apply(this, a); };
};
const b = await chromium.launch();
const snap = (p) => p.evaluate(() => JSON.parse(JSON.stringify(window.__snd)));
const rectOf = (p, sel) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
const setY = (p, y) => p.evaluate((v) => { document.scrollingElement.scrollTop = v; }, y);
const log = (k, v) => console.log(k.padEnd(50), v);
const names = (arr) => { const c = {}; arr.forEach((x) => { c[x.n] = (c[x.n] || 0) + 1; }); return Object.entries(c).map(([k, v]) => (v > 1 ? `${k}×${v}` : k)).join(', ') || '(silent)'; };

// ---------- desktop ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const warns = []; p.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warns.push(m.text()); });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(instrument);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(3500); // past any idle preload
  const step = async (label, fn, wait = 400) => { const n0 = (await snap(p)).plays.length; await fn(); await p.waitForTimeout(wait); const got = (await snap(p)).plays.slice(n0); log(label, names(got)); return got; };

  // --- default: OFF, and nothing plays / loads until the toggle turns it on ---
  let s = await snap(p);
  log('DEFAULT: toggle aria-pressed / label', await p.evaluate(() => { const t = document.querySelector('.sound-toggle'); return `${t.getAttribute('aria-pressed')} / "${t.getAttribute('aria-label')}"`; }));
  log('DEFAULT: files fetched / AudioContexts', `${s.fetches.length} / ${s.ctx}`);
  let c = await rectOf(p, '.header__nav--desktop .resume');
  await step('OFF: key press, hover Résumé, click Contact', async () => { await p.keyboard.press('Shift'); await p.mouse.move(1430, 400); await p.mouse.move(c.x, c.y, { steps: 3 }); const r = await rectOf(p, '.contact'); await p.mouse.click(r.x, r.y); await p.mouse.move(700, 500); });
  c = await rectOf(p, '.intro');
  await step('OFF: hover "Designing for" counter', async () => { await p.mouse.move(c.x, c.y, { steps: 3 }); await p.waitForTimeout(800); await p.mouse.move(700, 500); });
  s = await snap(p); log('OFF: files fetched / AudioContexts after all that', `${s.fetches.length} / ${s.ctx}`);
  // --- turn it ON with the toggle ---
  c = await rectOf(p, '.sound-toggle');
  await step('click toggle -> ON', () => p.mouse.click(c.x, c.y), 900);
  s = await snap(p); log('  files fetched / AudioContexts after ON', `${s.fetches.length} / ${s.ctx}`);
  log('  toggle aria-pressed / label', await p.evaluate(() => { const t = document.querySelector('.sound-toggle'); return `${t.getAttribute('aria-pressed')} / "${t.getAttribute('aria-label')}"`; }));
  c = await rectOf(p, '.header__nav--desktop .resume');
  await p.mouse.move(1430, 400);
  await step('hover Résumé', () => p.mouse.move(c.x, c.y, { steps: 3 }));
  await p.mouse.move(700, 500);
  c = await rectOf(p, '.contact');
  await step('click Contact (hover + click)', async () => { await p.mouse.move(c.x, c.y, { steps: 3 }); await p.mouse.click(c.x, c.y); }, 300);
  await p.mouse.move(700, 500); await p.waitForTimeout(200);
  c = await rectOf(p, '.intro');
  await step('hover "Designing for" counter (1.2s)', () => p.mouse.move(c.x, c.y, { steps: 3 }), 1200);
  let n0 = (await snap(p)).stops.length;
  await p.mouse.move(700, 500); await p.waitForTimeout(300);
  log('  leave counter -> loop stopped?', (await snap(p)).stops.slice(n0).join(', ') || 'NO STOP');
  await p.mouse.move(c.x, c.y, { steps: 3 }); await p.waitForTimeout(400);
  n0 = (await snap(p)).stops.length;
  await p.evaluate(() => document.querySelector('.sound-toggle').click()); await p.waitForTimeout(300);
  log('  hovering counter, then MUTE -> loop stopped?', (await snap(p)).stops.slice(n0).join(', ') || 'NO STOP');
  await p.evaluate(() => document.querySelector('.sound-toggle').click()); await p.waitForTimeout(300); // unmute
  await p.mouse.move(700, 500); await p.waitForTimeout(200);

  // Work Experience stats scramble
  await p.mouse.move(5, 895);
  // scroll until the stats are genuinely on screen (hovering Work Experience opens the Spinny panel,
  // which pushes the stats down — so re-measure as we go instead of trusting one up-front number)
  const statsOnScreenAt = async () => { for (let y = 0; y < 20000; y += 150) { await setY(p, y); await p.waitForTimeout(40); const t = await p.evaluate(() => document.querySelector('.we__stats').getBoundingClientRect().top); if (t < 450) return y; } return null; };
  let got = await step('scroll to WE stats (scramble)', statsOnScreenAt, 1500);
  const statsTop = await p.evaluate(() => document.querySelector('.we__stats').getBoundingClientRect().top + scrollY);
  const blips = got.filter((x) => x.n === 'blip');
  if (blips.length) log('  flurry span / anything after the flurry (expect <0.95s / none)', `${(blips.at(-1).w - blips[0].w).toFixed(3)}s / ${got.filter((x) => x.n !== 'blip').map((x) => x.n).join(', ') || 'none'}`);
  // More About Me body text
  const bioTop = await p.evaluate(() => document.querySelector('.about__bio').getBoundingClientRect().top + scrollY);
  got = await step('scroll to More About Me bio (typewriter)', async () => { for (let y = statsTop; y <= bioTop - 250; y += 250) { await setY(p, y); await p.waitForTimeout(40); } await setY(p, bioTop - 250); }, 3000);
  const types = got.filter((x) => x.n === 'type');
  const wd = await p.evaluate(() => [...document.querySelectorAll('.about__word')].map((w) => parseFloat(w.style.getPropertyValue('--wd')) || 0));
  if (types.length) {
    const rel = types.map((x) => x.w - types[0].w); // scheduled times on the audio clock
    const maxErr = Math.max(...rel.map((r, i) => Math.abs(r - wd[i])));
    log('  keystrokes vs words / max timing error vs --wd', `${types.length} vs ${wd.length} / ${(maxErr * 1000).toFixed(2)}ms`);
  }
  // footer badge
  await p.evaluate(() => { document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight; }); await p.waitForTimeout(800);
  c = await rectOf(p, '.footer__badge');
  await step('hover Wall Of Portfolios badge', () => p.mouse.move(c.x, c.y, { steps: 3 }), 800);
  await step('leave + re-hover badge within 1.5s', async () => { await p.mouse.move(c.x - 300, c.y); await p.mouse.move(c.x, c.y, { steps: 2 }); }, 400);
  await p.mouse.move(600, 500);
  // MUTE everything
  c = await rectOf(p, '.sound-toggle');
  await step('click toggle -> MUTE', () => p.mouse.click(c.x, c.y));
  await step('muted: hover badge after 2s', async () => { await p.waitForTimeout(1600); const r = await rectOf(p, '.footer__badge'); await p.mouse.move(r.x, r.y, { steps: 3 }); });
  await setY(p, 0); await p.waitForTimeout(400);
  await step('muted: hover Résumé, click Contact, hover counter', async () => { let r = await rectOf(p, '.header__nav--desktop .resume'); await p.mouse.move(r.x, r.y, { steps: 3 }); r = await rectOf(p, '.contact'); await p.mouse.click(r.x, r.y); r = await rectOf(p, '.intro'); await p.mouse.move(r.x, r.y, { steps: 3 }); await p.waitForTimeout(600); });
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
  log('RELOAD: toggle aria-pressed (false = OFF)', await p.evaluate(() => document.querySelector('.sound-toggle').getAttribute('aria-pressed')));
  await p.keyboard.press('Shift'); await p.waitForTimeout(500);
  c = await rectOf(p, '.contact');
  await p.mouse.click(c.x, c.y); await p.waitForTimeout(400);
  s = await snap(p);
  log('RELOAD (muted): key press + click Contact', `${names(s.plays)} · AudioContexts ${s.ctx}`);
  const autoplayWarn = warns.filter((w) => /AudioContext|autoplay|not allowed to start/i.test(w));
  log('autoplay/AudioContext warnings', autoplayWarn.length ? autoplayWarn.slice(0, 2).join(' | ') : 0);
  log('page errors', errs.length ? errs.slice(0, 2).join(' | ') : 0);
  await ctx.close();
}

// ---------- touch phone ----------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(instrument);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(3000);
  log('PHONE: default aria-pressed (false = off)', await p.evaluate(() => document.querySelector('.sound-toggle').getAttribute('aria-pressed')));
  ctx.on('page', (np) => np.close()); // résumé opens a new tab
  let r = await rectOf(p, '.resume--mobile'); await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(400);
  let s = await snap(p);
  log('PHONE (off): tap Résumé', `${names(s.plays)} · files ${s.fetches.length} · AudioContexts ${s.ctx}`);
  r = await rectOf(p, '.sound-toggle'); await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(900);
  log('PHONE: tap toggle -> ON', names((await snap(p)).plays));
  const n0 = (await snap(p)).plays.length;
  r = await rectOf(p, '.resume--mobile'); await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(400);
  log('PHONE (on): tap Résumé (no hover sound on touch)', names((await snap(p)).plays.slice(n0)));
  await ctx.close();
}

// ---------- cursor pill (mouse AND scroll-triggered) + marquee swipes ----------
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.addInitScript(instrument);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const step = async (label, fn, wait = 400) => { const n0 = (await snap(p)).plays.length; await fn(); await p.waitForTimeout(wait); const got = (await snap(p)).plays.slice(n0); log(label, names(got)); return got; };
  let c = await rectOf(p, '.sound-toggle'); await p.mouse.click(c.x, c.y); await p.waitForTimeout(900);
  c = await rectOf(p, '.hero__graffiti');
  await p.mouse.move(c.x, 150); await p.waitForTimeout(400);
  await step("pill via MOUSE (That's me)", () => p.mouse.move(c.x, c.y, { steps: 3 }));
  await p.mouse.move(c.x, 150); await p.waitForTimeout(500);
  // park the cursor on the Recent Work card's text side and let the PAGE scroll a card under it
  await p.mouse.move(1150, 450); await p.waitForTimeout(400);
  const rwTop = await p.evaluate(() => document.querySelector('.rw-card').getBoundingClientRect().top + scrollY);
  const got = await step('pill via SCROLL only (cursor still)', async () => { for (let y = rwTop - 1200; y < rwTop + 700; y += 60) { await setY(p, y); await p.waitForTimeout(30); } }, 500);
  log('  pill showing after that scroll? / whooshes', `${await p.evaluate(() => !!document.querySelector('.cursor-text--show'))} / ${got.filter((x) => x.n === 'whoosh').length}`);
  // testimonials: tap = no swoosh; swipe = swoosh
  const cardPt = async (sel) => p.evaluate((s) => { document.querySelector(s).scrollIntoView({ block: 'center' }); const q = document.querySelector(s).getBoundingClientRect(); return { x: q.left + q.width * 0.4, y: q.top + q.height / 2 }; }, sel);
  const ctx = p.context(); ctx.on('page', (np) => np.close());
  c = await cardPt('.tts__marquee'); await p.waitForTimeout(300); c = await cardPt('.tts__marquee');
  await step('testimonials: plain click (no drag)', () => p.mouse.click(c.x, c.y), 600);
  await step('testimonials: swipe', async () => { await p.mouse.move(c.x + 100, c.y); await p.mouse.down(); await p.mouse.move(c.x - 100, c.y, { steps: 10 }); await p.mouse.up(); });
  c = await cardPt('.about__marquee'); await p.waitForTimeout(300); c = await cardPt('.about__marquee');
  await step('tools ticker: swipe', async () => { await p.mouse.move(c.x + 100, c.y); await p.mouse.down(); await p.mouse.move(c.x - 100, c.y, { steps: 10 }); await p.mouse.up(); });
  await p.context().close();
}

// ---------- a whole muted visit: scroll the full page (scramble + typewriter triggers) ----------
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.addInitScript(instrument);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  await p.keyboard.press('Shift');
  const H = await p.evaluate(() => document.scrollingElement.scrollHeight);
  for (let y = 0; y < H; y += 250) { await setY(p, y); await p.waitForTimeout(50); }
  await p.waitForTimeout(1500);
  const s = await snap(p);
  log('OFF, whole-page scroll: plays / files / contexts', `${s.plays.length} / ${s.fetches.length} / ${s.ctx}`);
  await p.context().close();
}

// ---------- turned ON, then reload: must come back OFF (state is in memory only) ----------
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.addInitScript(instrument);
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  let r = await rectOf(p, '.sound-toggle'); await p.mouse.click(r.x, r.y); await p.waitForTimeout(800);
  log('ON (before reload): aria-pressed / played', `${await p.evaluate(() => document.querySelector('.sound-toggle').getAttribute('aria-pressed'))} / ${names((await snap(p)).plays)}`);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(3500);
  log('ON + RELOAD: aria-pressed (false = back to OFF)', await p.evaluate(() => document.querySelector('.sound-toggle').getAttribute('aria-pressed')));
  log('  storage keys (expect none)', await p.evaluate(() => JSON.stringify({ session: Object.keys(sessionStorage), local: Object.keys(localStorage), cookie: document.cookie })));
  await p.keyboard.press('Shift');
  r = await rectOf(p, '.contact'); await p.mouse.move(r.x, r.y, { steps: 3 }); await p.mouse.click(r.x, r.y);
  r = await rectOf(p, '.intro'); await p.mouse.move(r.x, r.y, { steps: 3 }); await p.waitForTimeout(800);
  let s = await snap(p);
  log('  after reload: key press, hover + click Contact, counter', `${names(s.plays)} · files ${s.fetches.length} · AudioContexts ${s.ctx}`);
  r = await rectOf(p, '.sound-toggle'); await p.mouse.click(r.x, r.y); await p.waitForTimeout(800);
  s = await snap(p);
  log('  toggle ON again in this session', `${await p.evaluate(() => document.querySelector('.sound-toggle').getAttribute('aria-pressed'))} / ${names(s.plays)}`);
  r = await rectOf(p, '.contact'); await p.mouse.move(700, 500); await p.mouse.move(r.x, r.y, { steps: 3 }); await p.mouse.click(r.x, r.y); await p.waitForTimeout(400);
  log('  then hover + click Contact', names((await snap(p)).plays.slice(s.plays.length)));
  await p.context().close();
}
await b.close();
