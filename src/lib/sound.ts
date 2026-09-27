import { useEffect, useSyncExternalStore } from 'react';

// UI sound — ALWAYS OFF on every page load / reload / new session; the visitor turns it ON with the
// SoundToggle. Until then nothing plays and nothing audio-related is even created or fetched.
// - The on/off state lives ONLY in memory for the current page view: it is never saved to
//   localStorage / sessionStorage / cookies, so any reload brings it back to OFF.
// - Turning it on is a click on the toggle — the user gesture browsers require before audio — so
//   the AudioContext is created + resumed right there, and the small WAVs are fetched + decoded then
//   (on an OfflineAudioContext, which needs no gesture).
// - Muted = fully silent: play/sequence/loop are no-ops, running loops stop, the context suspends.
// - Anti-noise: each sound has a minimum re-trigger gap and at most 4 voices overlap at once
//   (a scheduled sequence — the typewriter, the scramble flurry — counts as one voice).
// Files: public/sounds/ — the .wav files are rendered by scripts/make-sounds.mjs; wow.mp3 is a
// supplied recording played exactly as-is. Swap any file at the same path.

export type SoundName =
  | 'click' | 'hover' | 'whoosh' | 'swish' | 'pop-open' | 'pop-close' | 'whoosh-up' | 'load'
  | 'stopwatch' | 'blip' | 'type' | 'wind' | 'wow' | 'wa-pop';

const NAMES: SoundName[] = ['click', 'hover', 'whoosh', 'swish', 'pop-open', 'pop-close', 'whoosh-up', 'load', 'stopwatch', 'blip', 'type', 'wind', 'wow', 'wa-pop'];
const FILE: Partial<Record<SoundName, string>> = { wow: 'wow.mp3' }; // everything else: <name>.wav
// minimum ms between two plays of the same sound (rapid triggers never stack into noise)
const MIN_GAP: Record<SoundName, number> = {
  click: 90, hover: 80, whoosh: 350, swish: 250, 'pop-open': 150, 'pop-close': 150, 'whoosh-up': 500, load: 0,
  stopwatch: 0, blip: 0, type: 0, wind: 400, wow: 0, 'wa-pop': 600,
};
// one-shots that must never overlap themselves: a re-trigger while one is still playing is ignored
// (one hover = one play, never stacked copies)
const NO_OVERLAP = new Set<SoundName>(['wow', 'wa-pop']);
const playing = new Set<SoundName>();
const MAX_VOICES = 4;
const MASTER = 0.9;

let enabled = false; // in memory only: every page load starts OFF, whatever was chosen before
let loadPlayed = false; // the sound-on chime plays once per page load, the first time sound is turned on
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let loading: Promise<void> | null = null;
let voices = 0;
const buffers = new Map<SoundName, AudioBuffer>();
const lastAt = new Map<string, number>();
const loops = new Map<SoundName, () => void>();
const subs = new Set<() => void>();

function loadAll(): Promise<void> {
  if (!loading) {
    // decode on an OfflineAudioContext (logs no autoplay warning); AudioBuffers are context-
    // independent. Decoded at the live context's own sample rate, so files are resampled at most once
    // (e.g. the 48 kHz wow.mp3 plays untouched on a 48 kHz output).
    const OAC = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    const dec = new OAC(1, 1, ctx?.sampleRate ?? 48000);
    loading = Promise.all(
      NAMES.map(async (n) => {
        try {
          const res = await fetch(`/sounds/${FILE[n] ?? `${n}.wav`}`);
          buffers.set(n, await dec.decodeAudioData(await res.arrayBuffer()));
        } catch { /* a missing/undecodable file just stays silent */ }
      }),
    ).then(() => { maybePlayLoad(); });
  }
  return loading;
}

function ensureContext(): void {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER;
    master.connect(ctx.destination);
  }
  void ctx.resume();
}

function maybePlayLoad(): void {
  if (enabled && ctx && !loadPlayed && buffers.has('load')) { loadPlayed = true; play('load'); }
}

// usable = unmuted + unlocked (a queued start on a still-resuming context plays as soon as it runs)
const usable = () => enabled && !!ctx && !!master && ctx.state !== 'closed';

function gapOk(key: string, gap: number): boolean {
  const now = performance.now();
  if (now - (lastAt.get(key) ?? -Infinity) < gap) return false;
  lastAt.set(key, now);
  return true;
}

function source(buf: AudioBuffer, when: number, rate = 1, gain = 1, onEnded?: () => void): AudioBufferSourceNode {
  const src = ctx!.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  let node: AudioNode = src;
  if (gain !== 1) { const g = ctx!.createGain(); g.gain.value = gain; src.connect(g); node = g; }
  node.connect(master!);
  src.onended = () => { src.disconnect(); onEnded?.(); };
  src.start(when);
  return src;
}

export function isSoundOn(): boolean {
  return enabled;
}

// From the toggle (a click, so it may also create/resume the context right here). Not persisted.
export function setSoundOn(on: boolean): void {
  enabled = on;
  subs.forEach((f) => f());
  if (!on) {
    loops.forEach((stop) => stop());
    // stop long one-shots outright (a suspended context would otherwise resume them mid-way later)
    oneShots.forEach((src) => { try { src.stop(); } catch { /* already ended */ } });
    void ctx?.suspend();
    return;
  }
  ensureContext();
  void loadAll().then(maybePlayLoad);
}

const oneShots = new Map<SoundName, AudioBufferSourceNode>(); // live NO_OVERLAP sounds (stopped on mute)

export function play(name: SoundName, opts: { rate?: number; gain?: number } = {}): void {
  if (!usable()) return;
  const buf = buffers.get(name);
  if (!buf || voices >= MAX_VOICES || (NO_OVERLAP.has(name) && playing.has(name)) || !gapOk(name, MIN_GAP[name])) return;
  voices++;
  playing.add(name);
  const src = source(buf, 0, opts.rate, opts.gain, () => { voices--; playing.delete(name); oneShots.delete(name); });
  if (NO_OVERLAP.has(name)) oneShots.set(name, src);
}

// Schedules one buffer at several offsets (seconds from now) on the audio clock — sample-accurate,
// so it stays locked to an animation's timeline. Slight per-hit pitch/level jitter keeps repeats
// from sounding mechanical. Counts as ONE voice; `gap` debounces re-triggers of the whole sequence.
export function playSequence(
  name: SoundName,
  offsets: number[],
  opts: { gap?: number; rateJitter?: number; gainJitter?: number; rates?: number[] } = {},
): void {
  if (!usable() || !offsets.length) return;
  const buf = buffers.get(name);
  if (!buf || voices >= MAX_VOICES || !gapOk(`seq:${name}`, opts.gap ?? 1000)) return;
  voices++;
  const t0 = ctx!.currentTime + 0.01;
  let left = offsets.length;
  offsets.forEach((o, i) => {
    const rate = opts.rates ? opts.rates[i % opts.rates.length] : 1 + (Math.random() * 2 - 1) * (opts.rateJitter ?? 0);
    const gain = 1 - Math.random() * (opts.gainJitter ?? 0);
    source(buf, t0 + o, rate, gain, () => { if (--left === 0) voices--; });
  });
}

// Loops a buffer (e.g. the stopwatch while hovered) with a short fade in/out. Returns stop().
export function startLoop(name: SoundName): () => void {
  if (!usable() || loops.has(name)) return loops.get(name) ?? (() => {});
  const buf = buffers.get(name);
  if (!buf) return () => {};
  const c = ctx!;
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(1, c.currentTime + 0.03);
  g.connect(master!);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(g);
  src.start();
  const stop = () => {
    if (loops.get(name) !== stop) return;
    loops.delete(name);
    const t = c.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0, t + 0.08);
    src.stop(t + 0.09);
    src.onended = () => { src.disconnect(); g.disconnect(); };
  };
  loops.set(name, stop);
  return stop;
}

export function useSoundOn(): boolean {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    isSoundOn,
    () => false,
  );
}

// Global wiring: the button HOVER + CLICK sounds via one delegated listener pair (no per-component
// wiring), and stopping loops when the tab is hidden.
// Go to top has its own "whoosh up" on click (see GoToTop), so it only gets the hover tick here;
// the sound toggle gets no click (turning sound on plays the page-load sound instead).
const HOVER_TARGETS = '.nav-link, .contact, .resume, .nav-icon, .footer__pill, .gtt';
const CLICK_TARGETS = '.nav-link, .contact, .resume, .nav-icon, .footer__pill, .rw-card';

export function useSounds(): void {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !fine.matches) return;
      const el = (e.target as Element | null)?.closest?.(HOVER_TARGETS);
      if (!el) return;
      const from = (e.relatedTarget as Element | null)?.closest?.(HOVER_TARGETS);
      if (from !== el) play('hover'); // entering the button, not moving between its children
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.(CLICK_TARGETS)) play('click');
    };
    // stop any loop if the tab is hidden (e.g. the stopwatch while hovering, then switching tabs)
    const onHide = () => { if (document.hidden) loops.forEach((stop) => stop()); };
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);
}
