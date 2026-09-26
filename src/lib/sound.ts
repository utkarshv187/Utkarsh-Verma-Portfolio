import { useEffect, useSyncExternalStore } from 'react';

// UI sound — OFF by default, on only after the visitor turns it on with the SoundToggle.
// - Web Audio with preloaded, decoded buffers, so playback is instant. Nothing audio-related exists
//   until the first "on": no AudioContext, no file fetches (~79 KB of tiny WAVs, fetched then).
// - The choice lives in memory for this page session only (a reload starts muted again).
// - Muted means fully silent: play() is a no-op and the context is suspended.
// - Anti-noise: each sound has a minimum re-trigger gap, and at most 3 sounds overlap at once.
// Files: public/sounds/*.wav, rendered by scripts/make-sounds.mjs (swap any file at the same path).

export type SoundName = 'click' | 'hover' | 'tick' | 'whoosh' | 'swish' | 'pop-open' | 'pop-close' | 'whoosh-up' | 'load';

const NAMES: SoundName[] = ['click', 'hover', 'tick', 'whoosh', 'swish', 'pop-open', 'pop-close', 'whoosh-up', 'load'];
// minimum ms between two plays of the same sound (rapid triggers never stack into noise)
const MIN_GAP: Record<SoundName, number> = {
  click: 90, hover: 80, tick: 60, whoosh: 350, swish: 250, 'pop-open': 150, 'pop-close': 150, 'whoosh-up': 500, load: 0,
};
const MAX_VOICES = 3;
const MASTER = 0.9;

let enabled = false;
let loadPlayed = false; // the page-load sound plays once per page load: the first time sound is enabled
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let loading: Promise<void> | null = null;
let voices = 0;
const buffers = new Map<SoundName, AudioBuffer>();
const lastAt = new Map<SoundName, number>();
const subs = new Set<() => void>();

function loadAll(c: AudioContext): Promise<void> {
  loading ??= Promise.all(
    NAMES.map(async (n) => {
      try {
        const res = await fetch(`/sounds/${n}.wav`);
        buffers.set(n, await c.decodeAudioData(await res.arrayBuffer()));
      } catch { /* a missing/undecodable file just stays silent */ }
    }),
  ).then(() => undefined);
  return loading;
}

export function isSoundOn(): boolean {
  return enabled;
}

// Must be called from the user's click/tap: the AudioContext is created + resumed synchronously
// inside that gesture (browsers only allow audio to start from one).
export function setSoundOn(on: boolean): void {
  enabled = on;
  subs.forEach((f) => f());
  if (!on) { void ctx?.suspend(); return; }
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER;
    master.connect(ctx.destination);
  }
  void ctx.resume();
  void loadAll(ctx).then(() => {
    if (enabled && !loadPlayed) { loadPlayed = true; play('load'); }
  });
}

export function play(name: SoundName): void {
  if (!enabled || !ctx || !master || ctx.state !== 'running') return;
  const buf = buffers.get(name);
  if (!buf) return;
  const now = performance.now();
  if (now - (lastAt.get(name) ?? -Infinity) < MIN_GAP[name] || voices >= MAX_VOICES) return;
  lastAt.set(name, now);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(master);
  voices++;
  src.onended = () => { voices--; src.disconnect(); };
  src.start();
}

export function useSoundOn(): boolean {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    isSoundOn,
    () => false,
  );
}

// Button HOVER + CLICK sounds via one delegated listener pair (no per-component wiring).
// Go to top has its own "whoosh up" on click (see GoToTop), so it only gets the hover tick here;
// the sound toggle gets no click (turning sound on plays the page-load sound instead).
const HOVER_TARGETS = '.nav-link, .contact, .resume, .nav-icon, .footer__pill, .gtt';
const CLICK_TARGETS = '.nav-link, .contact, .resume, .nav-icon, .footer__pill, .rw-card';

export function useButtonSounds(): void {
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
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('click', onClick, { capture: true });
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('click', onClick, { capture: true });
    };
  }, []);
}
