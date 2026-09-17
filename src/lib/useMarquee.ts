import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './hooks';

type Opts = {
  speed: number; // auto-scroll px/sec, leftward
  hoverFactor?: number; // multiply speed while hovered (e.g. 0.5 = half). 1 = no change.
};

// A seamless leftward auto-scroll marquee (track holds two copies of the content, wraps at -50%)
// that is ALSO grab-and-drag scrollable (pointer + touch), with optional release momentum and a
// smooth hover speed change. JS drives the transform each frame (not a CSS animation) so drag and
// auto-scroll share one source of truth.
export function useMarquee({ speed, hoverFactor = 1 }: Opts) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    let half = track.scrollWidth / 2; // width of one copy
    const measure = () => { half = track.scrollWidth / 2; };
    const settle = setTimeout(measure, 600); // re-measure once fonts/images settle
    window.addEventListener('resize', measure);

    let offset = 0;
    let cur = reduced ? 0 : speed;
    let target = reduced ? 0 : speed;
    let dragging = false;
    let moved = 0;
    let lastX = 0, lastT = 0, velocity = 0;
    let raf = 0, prev = performance.now();

    const wrap = () => { if (half > 0) { while (offset <= -half) offset += half; while (offset > 0) offset -= half; } };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      cur += (target - cur) * Math.min(1, dt * 5); // ease speed toward target (smooth hover change)
      if (!dragging) {
        offset -= cur * dt; // auto-scroll
        if (Math.abs(velocity) > 2) { offset += velocity * dt; velocity *= Math.exp(-dt * 3.5); } // release momentum
      }
      wrap();
      track.style.transform = `translate3d(${offset.toFixed(2)}px,0,0)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // ---- grab-drag ----
    const onDown = (e: PointerEvent) => {
      if (e.button != null && e.button !== 0) return;
      dragging = true; moved = 0; velocity = 0;
      lastX = e.clientX; lastT = performance.now();
      try { container.setPointerCapture(e.pointerId); } catch { /* noop */ }
      document.body.classList.add('marquee-grabbing');
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      offset += dx; moved += Math.abs(dx);
      const now = performance.now(); const dtm = (now - lastT) / 1000;
      if (dtm > 0) velocity = dx / dtm;
      lastX = e.clientX; lastT = now;
      wrap();
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try { container.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      document.body.classList.remove('marquee-grabbing');
    };
    // if the pointer moved (a drag, not a tap), swallow the click so links don't navigate
    const onClickCapture = (e: MouseEvent) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } };

    // ---- hover speed ----
    const onEnter = () => { if (!reduced) target = speed * hoverFactor; };
    const onLeave = () => { if (!reduced) target = speed; };

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerup', onUp);
    container.addEventListener('pointercancel', onUp);
    container.addEventListener('click', onClickCapture, true);
    container.addEventListener('pointerenter', onEnter);
    container.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      window.removeEventListener('resize', measure);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointercancel', onUp);
      container.removeEventListener('click', onClickCapture, true);
      container.removeEventListener('pointerenter', onEnter);
      container.removeEventListener('pointerleave', onLeave);
      document.body.classList.remove('marquee-grabbing');
    };
  }, [reduced, speed, hoverFactor]);

  return { containerRef, trackRef };
}
