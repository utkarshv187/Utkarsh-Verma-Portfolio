import './work-experience.css';
import { useEffect, useRef, useState } from 'react';
import { SpinnyLogo } from './SpinnyLogo';
import { usePointerWithin, usePrefersReducedMotion } from '../lib/hooks';
import { playSequence } from '../lib/sound';

type Row = { company: 'spinny' | string; roleFull: string; roleShort: string; date: string };
const ROWS: Row[] = [
  { company: 'spinny', roleFull: 'Senior Product Designer', roleShort: 'Sr. Product Designer', date: 'May 2019 — Jun 2026' },
  { company: 'TLC', roleFull: 'UX UI Designer', roleShort: 'UX UI Designer', date: 'Jan 2019 — May 2019' },
  { company: 'GameZop', roleFull: 'UI Design Intern', roleShort: 'UI Intern', date: 'Oct 2018 — Dec 2018' },
];
const STATS: { value: string; label: [string, string] }[] = [
  { value: '7+', label: ['YEARS OF', 'EXPERIENCE'] },
  { value: '30+', label: ['SUCCESSFUL', 'PRODUCTS'] },
  { value: '1M+', label: ['DIVERSIFIED', 'USERS'] },
];

// pale-cream lightning "Z" motif, 1:1 from live (viewBox 188x73, stroke 16 bevel #FFE197)
function ZBolt() {
  return (
    <svg className="we-card__z" viewBox="0 0 188 73" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M 5 12 L 181 20 L 11.5 46 L 148.5 62" fill="transparent" stroke="#FFE197" strokeWidth="16" strokeLinejoin="bevel" />
    </svg>
  );
}

// Only the DIGITS scramble (letters/symbols like "M"/"+" stay fixed); with tabular figures every
// digit is the same width, so the value never changes size while scrambling.
const rndDigit = () => '0123456789'[(Math.random() * 10) | 0];
const scrambleStr = (final: string) => final.replace(/[0-9]/g, rndDigit);
function ScrambleValue({ final, active }: { final: string; active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [text, setText] = useState(reduced ? final : final.replace(/./g, ' '));
  useEffect(() => {
    if (reduced) { setText(final); return; }
    // live re-runs the scramble each time the stats re-enter view; blank it while out of view
    if (!active) { setText(scrambleStr(final)); return; }
    const chars = final.split('');
    const DURATION = 1000;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const locked = Math.floor(p * chars.length + 0.0001); // chars resolve left→right
      setText(chars.map((c, i) => (i < locked || p >= 1 || !/[0-9]/.test(c) ? c : rndDigit())).join(''));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setText(final);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, final, reduced]);
  return (
    <span className="we-card__value" aria-label={final}>
      {/* invisible ghost of the FINAL value reserves the exact box; the live scramble overlays it */}
      <span className="we-card__value-ghost" aria-hidden="true">{final}</span>
      <span className="we-card__value-live" aria-hidden="true">{text}</span>
    </span>
  );
}

export function WorkExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const spinnyFrameRef = useRef<HTMLDivElement>(null);
  const spinnyImgRef = useRef<HTMLImageElement>(null);
  const [statsIn, setStatsIn] = useState(false);
  // Spinny bento is a one-way latch: the FIRST hover of the Work Experience section (which
  // includes the Spinny row) flips this true and it stays true for the rest of the session —
  // the image never hides on mouse-leave/scroll. It's in-memory only, so a page reload resets it.
  const [spinnyOpen, setSpinnyOpen] = useState(false);
  const reduced = usePrefersReducedMotion();

  // Reveal the instant the pointer is over the section — driven by pointer move AND scroll, so
  // holding the mouse still and scrolling the section under it triggers the reveal (no jiggle).
  usePointerWithin(sectionRef, (inside) => { if (inside) setSpinnyOpen(true); });

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { entries.forEach((e) => setStatsIn(e.isIntersecting)); },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // scramble sound, in sync with the ~1s digit scramble (all three cards scramble together, so one
  // sound): a soft flurry of digital blips that thins out as the digits lock left→right, then a
  // gentle two-note "settle" exactly when the values land at 1.0s. No scramble under reduced motion.
  useEffect(() => {
    if (!statsIn || reduced) return;
    const offsets: number[] = [];
    for (let t = 0; t < 0.95; ) {
      offsets.push(t);
      t += 0.028 + 0.035 * Math.pow(t / 0.95, 1.5) + Math.random() * 0.008;
    }
    playSequence('blip', offsets, { gap: 1200, rates: [1, 1.18, 0.86, 1.32, 0.94, 1.1] });
    playSequence('settle', [1.0], { gap: 1200 });
  }, [statsIn, reduced]);

  // Pinch-to-zoom the Spinny highlights image (touch/pen only — mouse users are unaffected). Two
  // fingers scale ONLY the <img> within its clipped frame (.we__reveal-inner has overflow:hidden, so
  // the whole page/UI never scales); lifting the fingers snaps it back to 1. One finger still scrolls
  // the page (touch-action: pan-y on the frame), so the gesture never traps the scroll.
  useEffect(() => {
    const frame = spinnyFrameRef.current;
    const img = spinnyImgRef.current;
    if (!frame || !img) return;
    const pts = new Map<number, { x: number; y: number }>();
    let startDist = 0;
    const twoDist = () => {
      const [a, b] = [...pts.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const setScale = (s: number, animate: boolean) => {
      img.style.transition = animate ? 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
      img.style.transform = `scale(${s})`;
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return; // pinch is a touch/pen gesture only
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) startDist = twoDist();
    };
    const onMove = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && startDist > 0) {
        e.preventDefault(); // don't let the browser pan/zoom the page while pinching the image
        setScale(Math.max(1, Math.min(3, twoDist() / startDist)), false);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size < 2) { startDist = 0; setScale(1, true); } // fingers lifted -> snap back
    };
    frame.addEventListener('pointerdown', onDown);
    frame.addEventListener('pointermove', onMove, { passive: false });
    frame.addEventListener('pointerup', onUp);
    frame.addEventListener('pointercancel', onUp);
    return () => {
      frame.removeEventListener('pointerdown', onDown);
      frame.removeEventListener('pointermove', onMove);
      frame.removeEventListener('pointerup', onUp);
      frame.removeEventListener('pointercancel', onUp);
    };
  }, [spinnyOpen]);

  // fade-up reveal on scroll-in, per element (matches live's appear animation)
  useEffect(() => {
    if (reduced) return;
    const root = sectionRef.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>('.we-reveal')];
    items.forEach((el) => el.classList.add('we-reveal--pending'));
    const io = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('we-reveal--in'); io.unobserve(e.target); } }); },
      { threshold: 0.2 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section
      className="we"
      id="work-experience"
      ref={sectionRef}
    >
      <div className="we__inner">
        <h2 className="we__heading we-reveal">WORK EXPERIENCE</h2>
        <p className="we__subtitle we-reveal">BASED IN DELHI NCR, INDIA&nbsp;&nbsp;•&nbsp;&nbsp;AVAILABLE WORLDWIDE</p>

        <ul className="we__list">
          {ROWS.map((r, i) => (
            <li className={`we__row we-reveal${r.company === 'spinny' ? ' we__row--spinny' : ''}`} key={i}>
              <div className="we__company">
                {r.company === 'spinny' ? <SpinnyLogo className="we__spinny" /> : <span>{r.company}</span>}
              </div>
              <div className="we__role">
                <span className="we__role-full">{r.roleFull}</span>
                <span className="we__role-short">{r.roleShort}</span>
              </div>
              <div className="we__date">{r.date}</div>
              {r.company === 'spinny' && (
                // hover-reveal bento (only the Spinny row has one on live). Over the image the
                // custom cursor becomes the two-line "highlights / at Spinny" pill.
                <div className={`we__reveal${spinnyOpen ? ' we__reveal--open' : ''}`}>
                  <div
                    className="we__reveal-inner"
                    ref={spinnyFrameRef}
                    data-cursor-label={'Highlights\nat Spinny'}
                    data-cursor-size="lg"
                  >
                    <picture>
                      <source srcSet="/images/spinny-highlights.avif" type="image/avif" />
                      <img
                        className="we__reveal-img"
                        ref={spinnyImgRef}
                        src="/images/spinny-highlights.webp"
                        alt="Highlights at Spinny"
                        width={1200}
                        height={612}
                        loading="lazy"
                      />
                    </picture>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="we__stats" ref={statsRef}>
          {STATS.map((s, i) => (
            <div className="we-card we-reveal" key={i}>
              <ScrambleValue final={s.value} active={statsIn} />
              <ZBolt />
              <p className="we-card__label">
                {s.label[0]}{' '}
                <br className="we-card__br" />
                {s.label[1]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
