import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePointerFine, usePrefersReducedMotion } from '../lib/hooks';
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

  useEffect(() => {
    if (!fine) return;
    document.body.classList.add('custom-cursor');
    // Position follows the pointer; the LABEL (pill) is driven by pointerENTER/LEAVE (via the
    // bubbling pointerover/pointerout) so it switches the instant the pointer enters a labelled
    // element and resets the instant it leaves — never dependent on continuous movement.
    const pos = { x: -1, y: -1 }; // last known pointer position (viewport coords)
    const move = (e: PointerEvent) => { pos.x = e.clientX; pos.y = e.clientY; x.set(e.clientX); y.set(e.clientY); };
    const apply = (el: HTMLElement | null) => {
      const lbl = el ? el.getAttribute('data-cursor-label') : null; // empty string => suppress pill
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
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    window.addEventListener('pointerout', out, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('pointerout', out);
      window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
      document.body.classList.remove('custom-cursor');
    };
  }, [fine, x, y]);

  if (!fine) return null;

  return (
    <>
      {/* Layer 1: the dot / pill BACKGROUND — mix-blend-mode:difference so it inverts against
          any backdrop. No text lives here (text in a blended layer would invert too). */}
      <motion.div
        className={`cursor ${label ? 'cursor--label' : ''} ${label && size !== 'sm' ? 'cursor--label-' + size : ''} ${!label && variant === 'link' ? 'cursor--link' : ''}`}
        aria-hidden="true"
        style={{ x: sx, y: sy }}
      >
        {/* link cursor (e.g. testimonial cards): a small up-right arrow inside the dark dot */}
        {!label && variant === 'link' && (
          <svg className="cursor__link-arrow" viewBox="0 0 8 8" width="11" height="11" aria-hidden="true">
            <path d="M 8 0.444 L 8 6.222 C 8 6.467 7.801 6.666 7.556 6.666 C 7.31 6.666 7.111 6.467 7.111 6.222 L 7.111 1.517 L 0.759 7.87 C 0.585 8.043 0.304 8.043 0.13 7.87 C -0.043 7.696 -0.043 7.415 0.13 7.241 L 6.483 0.889 L 1.778 0.889 C 1.533 0.889 1.334 0.69 1.334 0.444 C 1.334 0.199 1.533 0 1.778 0 L 7.556 0 C 7.801 0 8 0.199 8 0.444 Z" fill="#fff" />
          </svg>
        )}
      </motion.div>
      {/* Layer 2: the pill TEXT — a top-level sibling (NOT a child of .cursor, whose stacking
          context would trap the blend), tracking the same pointer spring, with NORMAL blend so
          it renders as true solid black over the (difference-blended) pill background. */}
      <motion.div
        className={`cursor-text ${label ? 'cursor-text--show' : ''} ${label && size !== 'sm' ? 'cursor-text--' + size : ''}`}
        aria-hidden="true"
        style={{ x: sx, y: sy }}
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
