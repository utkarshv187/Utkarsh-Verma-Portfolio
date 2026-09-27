import { useEffect, useRef } from 'react';

// The O hover ripples: live's own effect, ported 1:1 from its Framer code component (a 2D canvas
// dot-grid ripple, instance props color rgb(39,180,61) / speed 1.5s / dotSize 1 / base dots
// transparent). A 40x40 grid of small green dots; concentric bands light up where a travelling wave
// crosses zero, so the rings keep flowing outward (a new ring every 0.75s, ~72px/s at desktop).
// Changes vs live, both deliberate:
// - rings are drawn only from the O's OUTER EDGE outward (an ellipse matching the O glyph's ink),
//   fading in over ~one dot row there, so they emanate from the O, never from the icon;
// - the glowing dot is rendered once to a sprite and stamped (live re-blurs a shadow for every dot
//   every frame) — same pixels, a fraction of the cost.
// The loop runs only while the O is hovered (plus the fade-out), and only for a fine pointer.
const COLOR = 'rgb(39, 180, 61)';
const SPEED = 1.5; // seconds per wavelength (live's "Speed (s)")
const DOT_SIZE = 1;
// the O's outer edge in canvas-width units: glyph ink half-extents (0.375em x 0.352em of the
// 282px-per-em O) over the canvas' 1.344em width; the fade-in band is ~one dot row wide
const EDGE_X = 0.375 / 1.344;
const EDGE_Y = 0.352 / 1.344;
const EDGE_FADE = 0.03 / 1.344;

export function ORipples() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const host = cv?.parentElement;
    const g = cv?.getContext('2d');
    if (!cv || !host || !g) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    let raf = 0;
    let stopAt = Infinity;
    let sprite: HTMLCanvasElement | null = null;
    let spriteKey = '';

    const size = () => {
      const dpr = window.devicePixelRatio || 1;
      const d = Math.floor(cv.offsetWidth * dpr);
      if (cv.width !== d || cv.height !== d) { cv.width = d; cv.height = d; }
      const p = Math.max(d / 40, 4);
      const m = p * 0.14 * DOT_SIZE;
      const key = `${d}`;
      if (key !== spriteKey) {
        // one glowing dot (fill + live's shadowBlur m*1.2), stamped for every lit dot
        const pad = Math.ceil(m * 3.4 + 2);
        sprite = document.createElement('canvas');
        sprite.width = sprite.height = pad * 2;
        const s = sprite.getContext('2d')!;
        s.fillStyle = COLOR;
        s.shadowColor = COLOR;
        s.shadowBlur = m * 1.2;
        s.beginPath();
        s.arc(pad, pad, m, 0, Math.PI * 2);
        s.fill();
        spriteKey = key;
      }
    };

    const draw = (now: number) => {
      const d = cv.width;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, d, d);
      if (!sprite) return;
      const p = Math.max(d / 40, 4);
      const n = Math.floor(d / p);
      const c0 = d / 2;
      const S = Math.hypot(c0, c0);
      const C = S / 2.5;
      const x = ((now / 1000) % SPEED) / SPEED;
      const half = sprite.width / 2;
      const ex = EDGE_X * d, ey = EDGE_Y * d, ef = EDGE_FADE * d / Math.min(ex, ey);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const px = i * p + p / 2, py = j * p + p / 2;
          const dx = px - c0, dy = py - c0;
          const e = Math.hypot(dx / ex, dy / ey); // 1 = on the O's outer edge
          if (e <= 1) continue;
          const s = Math.hypot(dx, dy);
          const ph = (s / C - x) * Math.PI * 2;
          const l = Math.exp(-((s - x * S) ** 2) / (2 * (S * 0.25) ** 2));
          const u = 0.5 + 0.5 * Math.sin(ph) * l;
          const k = Math.max(0, 1 - Math.abs(Math.sin(ph)) * 1.5);
          const f = Math.max(0, Math.min(1, u * k));
          if (f <= 0.04) continue;
          g.globalAlpha = f * Math.min(1, (e - 1) / ef);
          g.drawImage(sprite, px - half, py - half);
        }
      }
      g.globalAlpha = 1;
    };

    const tick = (now: number) => {
      raf = 0;
      if (performance.now() >= stopAt) { g.clearRect(0, 0, cv.width, cv.height); return; }
      draw(now);
      raf = requestAnimationFrame(tick);
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !fine.matches || reduced.matches) return;
      stopAt = Infinity;
      size();
      if (!raf) { draw(performance.now()); raf = requestAnimationFrame(tick); }
    };
    // keep drawing through the CSS fade-out (0.35s), then stop
    const onLeave = () => { if (raf) stopAt = performance.now() + 400; };

    host.addEventListener('pointerenter', onEnter);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className="hero__o-ripples" aria-hidden="true" />;
}
