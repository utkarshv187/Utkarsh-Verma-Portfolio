import { useEffect } from 'react';

// Magnetic + springy buttons, site-wide, via ONE delegated controller.
// - MAGNETIC (fine pointer only): while hovered, a button eases a few px toward the cursor (time-
//   based lerp) and eases back on leave.
// - SPRING (all pointers): on press it dips to 94% and springs back with a slight overshoot.
// Both are written to the individual `translate` / `scale` properties, which the browser composes
// WITH each button's own `transform` (Go-to-top's slide-in, Résumé's hover scaleX, …) instead of
// overriding it; the custom cursor + its press-shrink live on separate elements and are untouched.
// Transform-only (no layout); the rAF loop runs only while something is moving, and every inline
// style is removed once a button is back at rest. prefers-reduced-motion: disabled entirely.

const TARGETS = [
  '.nav-link', '.contact', '.resume', '.nav-icon', // header (desktop About/Contact/Résumé, mobile icons)
  '.footer__pill', // footer contact buttons
  '.gtt', // go to top
].join(',');

const PULL = 0.22; // fraction of the pointer's offset from the button centre
const MAX = 6; // px cap on the magnetic offset
const PRESS = 0.94;

type S = { el: HTMLElement; x: number; y: number; tx: number; ty: number; s: number; v: number; ts: number };

export function useMagneticButtons(): void {
  useEffect(() => {
    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fineMq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const items = new Map<HTMLElement, S>();
    let hovered: HTMLElement | null = null;
    let px = 0, py = 0, raf = 0, last = 0;

    const get = (el: HTMLElement) => {
      let s = items.get(el);
      if (!s) { s = { el, x: 0, y: 0, tx: 0, ty: 0, s: 1, v: 0, ts: 1 }; items.set(el, s); }
      return s;
    };

    const aim = (s: S) => {
      if (s.el !== hovered || !fineMq.matches) { s.tx = 0; s.ty = 0; return; }
      const r = s.el.getBoundingClientRect();
      // centre WITHOUT our own translate, so the pull never feeds back into itself
      const cx = r.left + r.width / 2 - s.x;
      const cy = r.top + r.height / 2 - s.y;
      const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v));
      s.tx = clamp((px - cx) * PULL);
      s.ty = clamp((py - cy) * PULL);
    };

    const tick = (t: number) => {
      raf = 0;
      const dt = Math.min(48, last ? t - last : 16.7) / 1000;
      last = t;
      let moving = false;
      for (const s of items.values()) {
        aim(s);
        const k = 1 - Math.pow(1 - 0.2, dt * 60); // eased magnetic lerp
        s.x += (s.tx - s.x) * k;
        s.y += (s.ty - s.y) * k;
        // damped spring on scale (under-damped -> a small overshoot on release)
        const a = 520 * (s.ts - s.s) - 18 * s.v;
        s.v += a * dt;
        s.s += s.v * dt;
        const rest = Math.abs(s.x) < 0.05 && Math.abs(s.y) < 0.05 && s.tx === 0 && s.ty === 0 &&
          Math.abs(s.s - 1) < 0.0005 && Math.abs(s.v) < 0.005 && s.ts === 1;
        if (rest) {
          s.el.style.removeProperty('translate');
          s.el.style.removeProperty('scale');
          items.delete(s.el);
          continue;
        }
        moving = true;
        s.el.style.setProperty('translate', `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`);
        s.el.style.setProperty('scale', s.s.toFixed(4));
      }
      if (moving) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const target = (e: Event) => ((e.target as Element | null)?.closest?.(TARGETS) as HTMLElement | null) ?? null;

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const el = target(e);
      if (el === hovered) return;
      hovered = el;
      if (el) get(el);
      kick();
    };
    const onOut = (e: PointerEvent) => {
      if (!hovered || e.pointerType !== 'mouse') return;
      const to = (e.relatedTarget as Element | null)?.closest?.(TARGETS) ?? null;
      if (to !== hovered) { hovered = null; kick(); }
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (hovered) kick();
    };
    let pressed: S | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = target(e);
      if (!el) return;
      pressed = get(el);
      pressed.ts = PRESS;
      kick();
    };
    const onUp = () => {
      if (!pressed) return;
      pressed.ts = 1; // spring back (overshoots slightly past 1, then settles)
      pressed = null;
      kick();
    };
    const onScroll = () => { if (hovered) kick(); }; // the button moves under a still cursor

    let on = false;
    const start = () => {
      if (on) return;
      on = true;
      document.addEventListener('pointerover', onOver, { passive: true });
      document.addEventListener('pointerout', onOut, { passive: true });
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('pointerup', onUp, { passive: true });
      window.addEventListener('pointercancel', onUp, { passive: true }); // e.g. a touch turns into a scroll
      window.addEventListener('blur', onUp);
      window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    };
    const stop = () => {
      if (!on) return;
      on = false;
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onUp);
      window.removeEventListener('scroll', onScroll, { capture: true });
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      hovered = null;
      pressed = null;
      for (const s of items.values()) { s.el.style.removeProperty('translate'); s.el.style.removeProperty('scale'); }
      items.clear();
    };
    const sync = () => (reducedMq.matches ? stop() : start());
    sync();
    reducedMq.addEventListener('change', sync);
    return () => { reducedMq.removeEventListener('change', sync); stop(); };
  }, []);
}
