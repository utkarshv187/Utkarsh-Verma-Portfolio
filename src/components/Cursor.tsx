import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePointerFine, usePrefersReducedMotion } from '../lib/hooks';

// Custom cursor: 20px translucent-dark dot that follows the pointer (exact size/color from the live site).
// - Only on fine pointers that can hover (touch devices keep native behaviour).
// - Reduced motion: 1:1 tracking, no follow-lag.
export function Cursor() {
  const fine = usePointerFine();
  const reduced = usePrefersReducedMotion();

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  // Slight spring lag normally; near-instant under reduced motion.
  const spring = { stiffness: reduced ? 1500 : 550, damping: reduced ? 90 : 34, mass: 0.4 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);

  useEffect(() => {
    if (!fine) return;
    document.body.classList.add('custom-cursor');
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      document.body.classList.remove('custom-cursor');
    };
  }, [fine, x, y]);

  if (!fine) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 20,
        height: 20,
        borderRadius: '100px',
        backgroundColor: 'rgba(14, 12, 32, 0.4)',
        pointerEvents: 'none',
        zIndex: 13,
        x: sx,
        y: sy,
        translateX: '-50%',
        translateY: '-50%',
      }}
    />
  );
}
