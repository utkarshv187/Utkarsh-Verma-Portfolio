import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../lib/hooks';

export const ROLES = ['DESIGNER', 'STRATEGIST', 'RESEARCHER', 'STORYTELLER', 'COPY WRITER', 'ANIMATOR'];

// Hero role cycler. Each word is fit-to-width (like the live site, so the font-size differs per word);
// desktop shows one word at a time, sliding up to the next on a loop.
export function RoleTicker() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const measRef = useRef<HTMLSpanElement>(null);
  const [sizes, setSizes] = useState<number[]>(ROLES.map(() => 120));
  const [slot, setSlot] = useState(300);
  const [i, setI] = useState(0);
  const [animate, setAnimate] = useState(true);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const fit = () => {
      const w = wrapRef.current?.clientWidth || 0;
      const meas = measRef.current;
      if (!meas || !w) return;
      meas.style.fontSize = '100px';
      const s = ROLES.map((word) => { meas.textContent = word; return 100 * (w / meas.scrollWidth); });
      setSizes(s);
      setSlot(Math.max(...s) * 1.02); // window height ~ tallest word
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setI((v) => v + 1), 1500); // measured: 1.5s/step on live
    return () => window.clearInterval(id);
  }, [reduced]);

  // seamless loop: after reaching the appended duplicate, snap back to 0 without animation
  const onTransitionEnd = () => {
    if (i >= ROLES.length) {
      setAnimate(false);
      setI(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    }
  };

  const items = [...ROLES, ROLES[0]];
  return (
    <div className="role" ref={wrapRef} style={{ height: slot }} aria-label={ROLES.join(', ')}>
      <div
        className="role__stack"
        style={{
          transform: `translateY(${-i * slot}px)`,
          transition: animate && !reduced ? 'transform 0.6s cubic-bezier(0.7, 0, 0.2, 1)' : 'none',
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {items.map((word, idx) => (
          <span key={idx} className="role__word" style={{ height: slot, fontSize: sizes[idx % ROLES.length] }}>
            {word}
          </span>
        ))}
      </div>
      {/* hidden measurer */}
      <span ref={measRef} className="role__meas" aria-hidden="true" />
    </div>
  );
}
