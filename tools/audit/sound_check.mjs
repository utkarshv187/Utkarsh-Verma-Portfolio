// UI sound check (src/lib/sound.ts). Sound is ARMED ON by default and unlocks on the first real
// gesture. Instruments Web Audio: every buffer start is logged with its sound name and its scheduled
// time relative to the audio clock (so sequences can be checked against the animations), and every
// stop() is logged (so loops can be checked to end).
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
  await p.goto(PAGE, { waitUntil: 'load' }); await p.waitForTimeout(3500); // idle preload
  const step = async (label, fn, wait = 400) => { const n0 = (await snap(p)).plays.length; await fn(); await p.waitForTimeout(wait); const got = (await snap(p)).plays.slice(n0); log(label, names(got)); return got; };

  let s = await snap(p);
  log('DEFAULT: toggle aria-pressed / label', await p.evaluate(() => { const t = document.querySelector('.sound-toggle'); return `${t.getAttribute('aria-pressed')} / "${t.getAttribute('aria-label')}"`; }));
  log('DEFAULT: files preloaded (idle) / AudioContexts', `${s.fetches.length} / ${s.ctx}`);
  let c = await rectOf(p, '.header__nav--desktop .resume');
  await step('before any gesture: hover Résumé', async () => { await p.mouse.move(1430, 400); await p.mouse.move(c.x, c.y, { steps: 3 }); await p.mouse.move(700, 500); });
  // unlock with a key press (a hero click can land on a link and open a tab)
  await step('FIRST GESTURE (key press) -> unlock', () => p.keyboard.press('Shift'), 800);
  s = await snap(p); log('  AudioContexts after unlock', s.ctx);
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
  const blips = got.filter((x) => x.n === 'blip'), settle = got.find((x) => x.n === 'settle');
  if (blips.length) log('  blips span / settle offset (expect <0.95 / 1.000s)', `${(blips.at(-1).w - blips[0].w).toFixed(3)}s / ${settle ? (settle.w - blips[0].w).toFixed(3) : 'none'}s`);
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
  log('RELOAD: toggle aria-pressed (false = still muted)', await p.evaluate(() => document.querySelector('.sound-toggle').getAttribute('aria-pressed')));
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
  log('PHONE: armed by default', await p.evaluate(() => document.querySelector('.sound-toggle').getAttribute('aria-pressed')));
  await p.touchscreen.tap(200, 400); await p.waitForTimeout(800);
  log('PHONE: first tap -> unlock', names((await snap(p)).plays));
  const n0 = (await snap(p)).plays.length;
  ctx.on('page', (np) => np.close()); // résumé opens a new tab
  const r = await rectOf(p, '.resume--mobile'); await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(400);
  log('PHONE: tap Résumé (no hover sound on touch)', names((await snap(p)).plays.slice(n0)));
  await ctx.close();
}
await b.close();
