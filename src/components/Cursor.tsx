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

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const spring = { stiffness: reduced ? 1500 : 550, damping: reduced ? 90 : 34, mass: 0.4 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);

  useEffect(() => {
    if (!fine) return;
    document.body.classList.add('custom-cursor');
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = (e.target as Element | null)?.closest?.('[data-cursor-label]') as HTMLElement | null;
      setLabel(el ? el.getAttribute('data-cursor-label') : null);
      setSize(el ? el.getAttribute('data-cursor-size') || 'sm' : 'sm');
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      document.body.classList.remove('custom-cursor');
    };
  }, [fine, x, y]);

  if (!fine) return null;

  return (
    <>
      {/* Layer 1: the dot / pill BACKGROUND — mix-blend-mode:difference so it inverts against
          any backdrop. No text lives here (text in a blended layer would invert too). */}
      <motion.div
        className={`cursor ${label ? 'cursor--label' : ''} ${label && size === 'lg' ? 'cursor--label-lg' : ''}`}
        aria-hidden="true"
        style={{ x: sx, y: sy }}
      />
      {/* Layer 2: the pill TEXT — a top-level sibling (NOT a child of .cursor, whose stacking
          context would trap the blend), tracking the same pointer spring, with NORMAL blend so
          it renders as true solid black over the (difference-blended) pill background. */}
      <motion.div
        className={`cursor-text ${label ? 'cursor-text--show' : ''} ${label && size === 'lg' ? 'cursor-text--lg' : ''}`}
        aria-hidden="true"
        style={{ x: sx, y: sy }}
      >
        <span className="cursor-text__label">
          {label?.split('\n').map((line, i) => (
            <span className="cursor__line" key={i}>
              {line}
            </span>
          ))}
        </span>
      </motion.div>
    </>
  );
}
