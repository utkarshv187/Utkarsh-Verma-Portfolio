// Smooth-scroll helpers. The BODY is the scroll container here (body has overflow-x:hidden, so its
// overflow-y computes to auto), so we drive scrollTop on both <body> and <html> each frame — the
// real scroller responds, the other no-ops — and run our own rAF tween so the easing/offset are
// under our control (native scroll-behavior can't offset for the fixed header).

export function readScroll(): number {
  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

function writeScroll(y: number): void {
  document.documentElement.scrollTop = y;
  document.body.scrollTop = y;
}

let rafId = 0;
// easeInOutCubic — smooth start/stop, matching live's gentle scroll feel
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function smoothScrollTo(targetY: number, duration = 640): void {
  cancelAnimationFrame(rafId);
  const startY = readScroll();
  const dist = Math.max(0, targetY) - startY;
  if (Math.abs(dist) < 2) return;
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    writeScroll(startY + dist * ease(t));
    if (t < 1) rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

// Scroll a section into view below the fixed header (offset = header height + a small gap).
export function smoothScrollToId(id: string, offset = 0): void {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + readScroll() - offset;
  smoothScrollTo(y);
}
