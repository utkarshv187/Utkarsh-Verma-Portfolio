// Renders the site's UI sound family to public/sounds/*.wav — the ORIGINALS (synthesised here, so
// they're our own work: no third-party licence). One family: soft, rounded, low-level; clicks/ticks
// share a warm sine "wood" body, the air sounds share band-passed noise. Deterministic (seeded noise),
// so re-running reproduces the same files. Swap any sound by dropping a replacement file (wav/mp3/
// webm/ogg — anything the browser can decode) at the same path, or tweak its recipe below and re-run.
// usage: node scripts/make-sounds.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../public/sounds/', import.meta.url));

// ---------- tiny DSP kit ----------
let seed = 0x9e3779b9;
const rand = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967296) * 2 - 1; };
const TAU = Math.PI * 2;
const expSweep = (a, b, p) => a * Math.pow(b / a, Math.min(1, Math.max(0, p)));
// raised-cosine attack (0 -> 1 over `a` seconds), then exponential decay with time-constant `tau`
const env = (t, a, tau, hold = 0) => (t < a ? 0.5 - 0.5 * Math.cos((Math.PI * t) / a) : t < a + hold ? 1 : Math.exp(-(t - a - hold) / tau));
// RBJ band-pass (0 dB peak) with a per-sample centre frequency
function bandpass(sr) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f0, q) => {
    const w = (TAU * f0) / sr, al = Math.sin(w) / (2 * q), cw = Math.cos(w), a0 = 1 + al;
    // b0 = al, b1 = 0, b2 = -al, a1 = -2cw, a2 = 1 - al
    const y = (al * x - al * x2 + 2 * cw * y1 - (1 - al) * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}
function render(sr, dur, fn, peak) {
  const n = Math.round(sr * dur), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / sr, i, n);
  // 3 ms fade-out so nothing ends on a click, then normalise to the target peak
  const f = Math.round(sr * 0.003);
  for (let i = 0; i < f; i++) out[n - 1 - i] *= i / f;
  let m = 0; for (const v of out) m = Math.max(m, Math.abs(v));
  for (let i = 0; i < n; i++) out[i] *= peak / (m || 1);
  return { sr, data: out };
}
function wav({ sr, data }) {
  const b = Buffer.alloc(44 + data.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + data.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  return b;
}
const db = (d) => Math.pow(10, d / 20);

// ---------- the family ----------
const SOUNDS = {
  // button click: warm sine "wood" body + a short air transient
  click: () => { const bp = bandpass(22050); return render(22050, 0.045, (t) =>
    Math.sin(TAU * 1500 * t) * env(t, 0.0006, 0.007) * 0.8 +
    Math.sin(TAU * 420 * t) * env(t, 0.0008, 0.012) * 0.35 +
    bp(rand(), 3000, 1.2) * env(t, 0.0004, 0.0025) * 0.9, db(-14)); },
  // button hover: deliberately NOT the click — a tiny glassy "tik": much higher, no wooden body, no
  // air transient, shorter and ~13 dB quieter. Click = warm "tok", hover = light "tik".
  hover: () => render(22050, 0.018, (t) =>
    Math.sin(TAU * 4200 * t) * env(t, 0.0004, 0.0022) + Math.sin(TAU * 6300 * t) * env(t, 0.0004, 0.0015) * 0.4, db(-27)),
  // cursor pill appears: a short rising "wind"
  whoosh: () => { const bp = bandpass(22050); return render(22050, 0.24, (t) =>
    bp(rand(), expSweep(700, 2200, t / 0.24), 0.9) * env(t, 0.07, 0.05), db(-18)); },
  // hobby card drag: a quicker, brighter swish sweeping down
  swish: () => { const bp = bandpass(22050); return render(22050, 0.17, (t) =>
    bp(rand(), expSweep(2800, 1300, t / 0.17), 1.4) * env(t, 0.018, 0.04), db(-16)); },
  // lightbox open: a soft rising bubble pop (+ a breath of air)
  'pop-open': () => { const bp = bandpass(22050); let ph = 0; return render(22050, 0.13, (t) => {
    ph += (TAU * expSweep(280, 820, t / 0.045)) / 22050;
    return Math.sin(ph) * env(t, 0.002, 0.035) + bp(rand(), 1500, 1.5) * env(t, 0.004, 0.02) * 0.35; }, db(-15)); },
  // lightbox close: the same pop falling, a touch softer
  'pop-close': () => { const bp = bandpass(22050); let ph = 0; return render(22050, 0.13, (t) => {
    ph += (TAU * expSweep(760, 300, t / 0.05)) / 22050;
    return Math.sin(ph) * env(t, 0.002, 0.035) + bp(rand(), 1200, 1.5) * env(t, 0.004, 0.02) * 0.3; }, db(-17)); },
  // go to top: a longer "whoosh up" — rising air with a faint rising tone under it
  'whoosh-up': () => { const bp = bandpass(16000); let ph = 0; return render(16000, 0.42, (t) => {
    ph += (TAU * expSweep(320, 960, t / 0.42)) / 16000;
    const e = env(t, 0.12, 0.09, 0.05);
    return bp(rand(), expSweep(450, 3200, t / 0.42), 1.0) * e + Math.sin(ph) * e * 0.15; }, db(-16)); },
  // "sound on" confirmation (plays once, when sound is turned on): a soft two-note glass chime rising
  // a fourth (E5 -> A5) — gentle mallet attack, nearly pure tones with a hint of overtone, a long
  // natural decay and a whisper of air on top. Same 1.0s as before but quieter (-21 dB vs -17) and
  // shaped like a struck chime rather than a flat sustained pad.
  load: () => render(16000, 1.0, (t) => {
    const chime = (f, at, tau, amp) => {
      const tt = t - at; if (tt < 0) return 0;
      const strike = env(tt, 0.004, tau);
      return amp * strike * (Math.sin(TAU * f * tt) + 0.12 * Math.sin(TAU * 2 * f * tt) * Math.exp(-tt / (tau * 0.4)) + 0.035 * Math.sin(TAU * 3 * f * tt) * Math.exp(-tt / (tau * 0.25)));
    };
    const air = Math.sin(TAU * 1760 * (t - 0.12)) * (t < 0.12 ? 0 : env(t - 0.12, 0.09, 0.22)) * 0.06; // faint shimmer an octave up
    return chime(659.26, 0, 0.22, 0.8) + chime(880, 0.12, 0.36, 1) + chime(440, 0.12, 0.3, 0.12) + air; }, db(-21)),
  // ---- added later: keep NEW sounds at the END of this list. The noise generator is one seeded
  // sequence shared in list order, so inserting a sound earlier would change the noise samples of
  // every noise-based sound after it (different bytes for sounds already approved).
  // header "Designing for" counter hover: a seamless 0.4s stopwatch loop — tick (0ms) + tock (200ms),
  // i.e. 5 beats/sec like a mechanical stopwatch; looped while hovered
  stopwatch: () => { const bp = bandpass(16000); return render(16000, 0.4, (t) => {
    const beat = (tt, f) => (tt < 0 ? 0 : Math.sin(TAU * f * tt) * env(tt, 0.0005, 0.0025) + bp(rand(), 4000, 2) * env(tt, 0.0003, 0.001) * 0.6);
    return beat(t, 3000) + beat(t - 0.2, 2500) * 0.8; }, db(-24)); },
  // Work Experience scramble: one soft digital "blip" per digit change (pitch varied at playback);
  // the flurry just stops as the digits land (no closing chime)
  blip: () => render(22050, 0.028, (t) =>
    Math.sin(TAU * 2400 * t) * env(t, 0.0004, 0.004) + Math.sin(TAU * 4800 * t) * env(t, 0.0004, 0.002) * 0.3, db(-26)),
  // More About Me body text: one very quiet typewriter keystroke per word as it types in (a papery
  // strike + a soft low thock + a faint release click)
  type: () => { const bp = bandpass(22050); return render(22050, 0.024, (t) =>
    bp(rand(), 3200, 1.8) * env(t, 0.0003, 0.0018) + Math.sin(TAU * 190 * t) * env(t, 0.0006, 0.005) * 0.5 +
    (t < 0.008 ? 0 : bp(rand(), 4200, 2) * env(t - 0.008, 0.0003, 0.001) * 0.3), db(-26)); },
  // Wall Of Portfolios badge hover: a short heroic flourish — a quick A-major arpeggio (A4 C#5 E5 → A5)
  // with a warm brassy (2nd/3rd harmonic) tone, the last note held briefly
  heroic: () => render(16000, 0.62, (t) => {
    const note = (f, at, tau) => { const tt = t - at; if (tt < 0) return 0; const e = env(tt, 0.008, tau); return (Math.sin(TAU * f * tt) + 0.5 * Math.sin(TAU * 2 * f * tt) + 0.25 * Math.sin(TAU * 3 * f * tt)) * e; };
    return note(440, 0, 0.06) + note(554.37, 0.07, 0.06) + note(659.26, 0.14, 0.07) + note(880, 0.21, 0.18) * 1.1; }, db(-18)),
};

await mkdir(OUT, { recursive: true });
let total = 0;
for (const [name, make] of Object.entries(SOUNDS)) {
  const buf = wav(make());
  await writeFile(OUT + name + '.wav', buf);
  total += buf.length;
  console.log(`${(name + '.wav').padEnd(16)} ${(buf.length / 1024).toFixed(1).padStart(5)} KB`);
}
console.log(`${'total'.padEnd(16)} ${(total / 1024).toFixed(1).padStart(5)} KB`);
