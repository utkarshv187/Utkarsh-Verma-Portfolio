import { motion, useScroll } from 'framer-motion';

// Gold 1px scroll-progress bar at the bottom of the header; scaleX tracks page scroll (origin left).
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="scroll-progress"
      aria-hidden="true"
      style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
    />
  );
}
