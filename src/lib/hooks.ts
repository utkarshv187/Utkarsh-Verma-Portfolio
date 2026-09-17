import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

// True when the visitor has a fine pointer that can hover (desktop mouse) — gates the custom cursor.
export function usePointerFine(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const on = () => setFine(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return fine;
}

// ---- shared last-known pointer position (viewport coords), tracked once for the whole app ----
const ptr = { x: -1, y: -1, inited: false };
const ptrSubs = new Set<() => void>();
function ensurePointerTracking() {
  if (ptr.inited) return;
  ptr.inited = true;
  const notify = () => ptrSubs.forEach((fn) => fn());
  window.addEventListener('pointermove', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; notify(); }, { passive: true });
  // The body is the scroll container here, so 'scroll' fires on it — a CAPTURE-phase window
  // listener still catches it. Re-evaluate what's under the (possibly stationary) pointer on
  // every scroll, so hover state updates from scrolling alone (no mouse-move required).
  window.addEventListener('scroll', notify, { passive: true, capture: true });
  window.addEventListener('pointerleave', () => { ptr.x = -1; ptr.y = -1; notify(); });
}

// Fires onChange(true/false) when the element under the last-known pointer position enters/leaves
// `ref`, driven by BOTH pointer movement AND scroll. A stationary cursor therefore triggers the
// instant the element scrolls under it — matching live's hover-reveals. Used by every JS-driven
// hover-reveal (e.g. the Work Experience Spinny bento).
export function usePointerWithin(ref: RefObject<HTMLElement | null>, onChange: (inside: boolean) => void): void {
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    ensurePointerTracking();
    let last = false;
    const evaluate = () => {
      const el = ref.current;
      if (!el) return;
      let inside = false;
      if (ptr.x >= 0) { const t = document.elementFromPoint(ptr.x, ptr.y); inside = !!(t && el.contains(t)); }
      if (inside !== last) { last = inside; cb.current(inside); }
    };
    ptrSubs.add(evaluate);
    evaluate();
    return () => { ptrSubs.delete(evaluate); };
  }, [ref]);
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
