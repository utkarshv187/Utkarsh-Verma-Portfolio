import { useEffect, useSyncExternalStore } from 'react';

// UI sound — ON by default ("armed"), and the visitor can mute it with the SoundToggle.
// - Browsers only allow audio after a real user gesture (click / tap / key press — NOT scroll or
//   hover). So sound is armed from the start and the FIRST such gesture anywhere silently unlocks the
//   AudioContext; from then on everything plays (unless muted). Nothing broken is ever shown: before
//   the unlock, sounds are simply skipped.
// - The small WAVs are fetched + decoded in the background once the page is idle (decoded on an
//   OfflineAudioContext, which needs no gesture), so even the unlocking click is already audible.
// - The mute choice is remembered for the browser tab (sessionStorage), so a reload keeps it.
// - Muted = fully silent: play/sequence/loop are no-ops, running loops stop, the context suspends.
// - Anti-noise: each sound has a minimum re-trigger gap and at most 4 voices overlap at once
//   (a scheduled sequence — the typewriter, the scramble flurry — counts as one voice).
// Files: public/sounds/*.wav, rendered by scripts/make-sounds.mjs (swap any file at the same path).

export type SoundName =
  | 'click' | 'hover' | 'whoosh' | 'swish' | 'pop-open' | 'pop-close' | 'whoosh-up' | 'load'
  | 'stopwatch' | 'blip' | 'settle' | 'type' | 'heroic';

const NAMES: SoundName[] = ['click', 'hover', 'whoosh', 'swish', 'pop-open', 'pop-close', 'whoosh-up', 'load', 'stopwatch', 'blip', 'settle', 'type', 'heroic'];
// minimum ms between two plays of the same sound (rapid triggers never stack into noise)
const MIN_GAP: Record<SoundName, number> = {
  click: 90, hover: 80, whoosh: 350, swish: 250, 'pop-open': 150, 'pop-close': 150, 'whoosh-up': 500, load: 0,
  stopwatch: 0, blip: 0, settle: 300, type: 0, heroic: 1500,
};
const MAX_VOICES = 4;
const MASTER = 0.9;
const STORE_KEY = 'uv-sound';

const readStored = (): boolean => {
  try { return sessionStorage.getItem(STORE_KEY) !== 'off'; } catch { return true; }
};

let enabled = typeof window === 'undefined' ? false : readStored(); // armed ON unless muted this session
let loadPlayed = false; // the page-load sound plays once per page load, at the first unlock
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
    // decode without a live AudioContext (needs no gesture, logs no autoplay warning); AudioBuffers
    // are context-independent, so the real context plays them once it exists
    const OAC = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    const dec = new OAC(1, 1, 44100);
    loading = Promise.all(
      NAMES.map(async (n) => {
        try {
          const res = await fetch(`/sounds/${n}.wav`);
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

// From the toggle (a click, so it may also create/resume the context right here).
export function setSoundOn(on: boolean): void {
  enabled = on;
  try { sessionStorage.setItem(STORE_KEY, on ? 'on' : 'off'); } catch { /* private mode: in-memory only */ }
  subs.forEach((f) => f());
  if (!on) {
    loops.forEach((stop) => stop());
    void ctx?.suspend();
    return;
  }
  ensureContext();
  void loadAll().then(maybePlayLoad);
}

export function play(name: SoundName, opts: { rate?: number; gain?: number } = {}): void {
  if (!usable()) return;
  const buf = buffers.get(name);
  if (!buf || voices >= MAX_VOICES || !gapOk(name, MIN_GAP[name])) return;
  voices++;
  source(buf, 0, opts.rate, opts.gain, () => { voices--; });
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

// Global wiring: unlock on the first real gesture, background preload, and the button HOVER + CLICK
// sounds via one delegated listener pair (no per-component wiring).
// Go to top has its own "whoosh up" on click (see GoToTop), so it only gets the hover tick here;
// the sound toggle gets no click (turning sound on plays the page-load sound instead).
const HOVER_TARGETS = '.nav-link, .contact, .resume, .nav-icon, .footer__pill, .gtt';
const CLICK_TARGETS = '.nav-link, .contact, .resume, .nav-icon, .footer__pill, .rw-card';

export function useSounds(): void {
  useEffect(() => {
    // first user gesture (the events browsers accept as "activation") unlocks audio
    const GESTURES = ['pointerdown', 'pointerup', 'keydown', 'touchend'] as const;
    const unlock = () => {
      if (!enabled) return; // muted: stay silent; the toggle unlocks when turned back on
      ensureContext();
      void loadAll().then(maybePlayLoad);
      GESTURES.forEach((t) => window.removeEventListener(t, unlock, true));
    };
    GESTURES.forEach((t) => window.addEventListener(t, unlock, { capture: true, passive: true }));

    // preload in the background once the page is idle (never competes with first paint / LCP)
    const preload = () => { if (enabled) void loadAll(); };
    const hasIdle = 'requestIdleCallback' in window; // not in older Safari
    const idle = hasIdle ? window.requestIdleCallback(preload, { timeout: 3000 }) : window.setTimeout(preload, 1500);

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
      GESTURES.forEach((t) => window.removeEventListener(t, unlock, true));
      if (hasIdle) window.cancelIdleCallback(idle); else window.clearTimeout(idle);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);
}
