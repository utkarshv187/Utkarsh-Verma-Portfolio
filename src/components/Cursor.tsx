import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePointerFine, usePrefersReducedMotion } from '../lib/hooks';
import { play } from '../lib/sound';
import './cursor.css';

// Custom cursor: 20px translucent-dark dot that follows the pointer (exact size/color from live).
// Over elements with [data-cursor-label] it morphs into a labelled pill (e.g. the "That's me"
// pill over the UTKARSH badge). Fine pointers only; native cursor stays hidden.
export function Cursor() {
  const fine = usePointerFine();
  const reduced = usePrefersReducedMotion();
  const [label, setLabel] = useState<string | null>(null);
  const [size, setSize] = useState<string>('sm');
  const [arrow, setArrow] = useState<string | null>(null);
  const [variant, setVariant] = useState<string | null>(null);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const spring = { stiffness: reduced ? 1500 : 550, damping: reduced ? 90 : 34, mass: 0.4 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  // Global press-shrink: while the mouse button is held, the whole cursor (dot / any pill + its
  // text) smoothly scales to 75%, then back to 100% on release. Composed with the x/y translate by
  // framer-motion into one transform, so it never clashes with the pill's blend/centring.
  const pressScale = useSpring(1, { stiffness: 700, damping: 32, mass: 0.35 });

  useEffect(() => {
    if (!fine) return;
    document.body.classList.add('custom-cursor');
    // Position follows the pointer; the LABEL (pill) is driven by pointerENTER/LEAVE (via the
    // bubbling pointerover/pointerout) so it switches the instant the pointer enters a labelled
    // element and resets the instant it leaves — never dependent on continuous movement.
    const pos = { x: -1, y: -1 }; // last known pointer position (viewport coords)
    const move = (e: PointerEvent) => { pos.x = e.clientX; pos.y = e.clientY; x.set(e.clientX); y.set(e.clientY); };
    let shown: string | null = null; // the pill currently showing (null = plain dot)
    const apply = (el: HTMLElement | null) => {
      const lbl = el ? el.getAttribute('data-cursor-label') : null; // empty string => suppress pill
      // The whoosh is tied to the cursor-STATE change itself: it plays whenever a pill appears (dot ->
      // pill), whatever caused it — the pointer moving onto a card OR the page scrolling a card under
      // a still cursor. Every path (pointer events, the scroll re-check, the browser's own post-scroll
      // hover events) funnels through here and only the dot->pill transition sounds, so one change =
      // one whoosh; the whoosh's re-trigger gap keeps quick flips from stacking. Silent unless on.
      if (lbl && !shown) play('whoosh');
      shown = lbl || null;
      setLabel(lbl || null);
      setSize(el && lbl ? el.getAttribute('data-cursor-size') || 'sm' : 'sm');
      setArrow(el ? el.getAttribute('data-cursor-arrow') : null);
      setVariant(el ? el.getAttribute('data-cursor-variant') : null); // e.g. "link" => dark dot + ↗
    };
    const labelled = (el: Element | null | undefined) => (el?.closest?.('[data-cursor-label], [data-cursor-variant]') as HTMLElement | null) ?? null;
    const over = (e: PointerEvent) => { const el = labelled(e.target as Element); if (el) apply(el); };
    const out = (e: PointerEvent) => {
      const el = labelled(e.target as Element);
      const to = labelled(e.relatedTarget as Element);
      if (el && el !== to) apply(to); // left this labelled element -> whatever we entered (or none)
    };
    // On SCROLL the page moves under a stationary cursor, so re-evaluate what's under the last
    // pointer position (no mouse-move needed) — pill appears/disappears from scrolling alone.
    const onScroll = () => { if (pos.x < 0) return; apply(labelled(document.elementFromPoint(pos.x, pos.y))); };
    // press-shrink to 75% on button-down, back to 100% on release/cancel
    const press = () => pressScale.set(0.75);
    const release = () => pressScale.set(1);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    window.addEventListener('pointerout', out, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('pointerdown', press, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('pointerout', out);
      window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      document.body.classList.remove('custom-cursor');
    };
  }, [fine, x, y, pressScale]);

  if (!fine) return null;

  return (
    <>
      {/* Layer 1: the dot / pill BACKGROUND — mix-blend-mode:difference so it inverts against
          any backdrop. No text lives here (text in a blended layer would invert too). */}
      <motion.div
        className={`cursor ${label ? 'cursor--label' : ''} ${label && size !== 'sm' ? 'cursor--label-' + size : ''} ${!label && variant === 'link' ? 'cursor--link' : ''}`}
        aria-hidden="true"
        style={{ x: sx, y: sy, scale: pressScale }}
      >
        {/* link cursor (e.g. testimonial cards): a bold (3px stroke) up-right arrow in the dark dot */}
        {!label && variant === 'link' && (
          <svg className="cursor__link-arrow" viewBox="0 0 13 13" width="13" height="13" aria-hidden="true">
            <path d="M3.8 9.2 L9.2 3.8 M4.8 3.8 H9.2 V8.2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </motion.div>
      {/* Layer 2: the pill TEXT — a top-level sibling (NOT a child of .cursor, whose stacking
          context would trap the blend), tracking the same pointer spring, with NORMAL blend so
          it renders as true solid black over the (difference-blended) pill background. */}
      <motion.div
        className={`cursor-text ${label ? 'cursor-text--show' : ''} ${label && size !== 'sm' ? 'cursor-text--' + size : ''}`}
        aria-hidden="true"
        style={{ x: sx, y: sy, scale: pressScale }}
      >
        <span className="cursor-text__label">
          {label?.split('\n').map((line, i) => (
            <span className="cursor__line" key={i}>
              {line}
            </span>
          ))}
          {arrow === 'up-right' && (
            <svg className="cursor-text__arrow" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
              <path d="M3.5 8.5 8.5 3.5M4.2 3.5h4.3v4.3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </motion.div>
    </>
  );
}
