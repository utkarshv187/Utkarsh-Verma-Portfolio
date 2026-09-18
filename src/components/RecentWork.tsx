import './recent-work.css';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { usePrefersReducedMotion } from '../lib/hooks';

type Stat = { num: string; label: [string, string] };
type Card = {
  key: string;
  bg: 'navy' | 'purple';
  accent: 'teal' | 'gold';
  title: string;
  href?: string;
  cursor: string; // custom-cursor pill label
  media: 'beforeafter' | 'gamify' | 'figma' | 'collage';
  stats: Stat[];
};

const CARDS: Card[] = [
  {
    key: 'auction', bg: 'navy', accent: 'teal', media: 'beforeafter', cursor: 'View',
    title: "Spinny's car auction app PLP redesign",
    href: 'https://auction-plp-redesign-by-uv.vercel.app/',
    stats: [
      { num: '13%', label: ['MORE USER', 'RETENTION'] },
      { num: '9%', label: ['REVENUE', 'GROWTH'] },
      { num: '40%', label: ['DROP IN', 'CARS MISSED'] },
      { num: '2x', label: ['SHOOT UP', 'IN NPS'] },
    ],
  },
  {
    key: 'gamification', bg: 'purple', accent: 'gold', media: 'gamify', cursor: 'View',
    title: 'Introduced a tier based gamification',
    href: 'https://gamification-by-uv.vercel.app/',
    stats: [
      { num: '18%', label: ['MORE USER', 'RETENTION'] },
      { num: '7%', label: ['SURGE IN', 'REVENUE'] },
      { num: '31%', label: ['RISE IN', 'BIDS MADE'] },
      { num: '14%', label: ['REDUCED T.A.T OF', 'CAR DELIVERIES'] },
    ],
  },
  {
    key: 'designsystem', bg: 'navy', accent: 'teal', media: 'figma', cursor: 'View',
    title: 'Established the Spinny design system',
    href: 'https://www.figma.com/design/iBOEPZFnnHc4BZ3FtVsQZ7/Spinny-Design-System---Styles---Components?node-id=2-4101',
    stats: [
      { num: '1000+', label: ['VARIANTS DESIGNED', '& DEVELOPED'] },
      { num: '1/3', label: ['DESIGN', 'BANDWIDTH SAVED'] },
      { num: '1/4', label: ['DEVELOPMENT TIME', 'REDUCED'] },
      { num: 'MAX', label: ['CONSISTENCY', 'ACHIEVED'] },
    ],
  },
  {
    key: 'beyond', bg: 'purple', accent: 'gold', media: 'collage', cursor: 'View',
    title: 'Other small & big projects with big & BIG impact',
    href: 'https://www.figma.com/design/6opGa7ReycSavcFyuBy5ic/Spinny-Redesign?node-id=0-1',
    stats: [
      { num: '150+', label: ['PROJECTS', 'DONE'] },
      { num: '0 to 10', label: ['AND', 'BEYOND'] },
    ],
  },
];

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// Decode/scramble the final value on scroll-in (same effect as the hero / Work Experience counters).
function ScrambleNum({ final, active }: { final: string; active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [text, setText] = useState(reduced ? final : final.replace(/[^\s]/g, ' '));
  useEffect(() => {
    if (reduced) { setText(final); return; }
    if (!active) { setText(final.replace(/[^\s]/g, ' ')); return; }
    const chars = final.split('');
    const DURATION = 1000;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const locked = Math.floor(p * chars.length + 0.0001);
      setText(chars.map((c, i) => {
        if (i < locked || p >= 1) return c;
        if (/[\s%+/x]/i.test(c)) return c;
        return SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }).join(''));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setText(final);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, final, reduced]);
  return <span className="rw-stat__num" aria-label={final}>{text}</span>;
}

// Card 1: before/after comparison that FOLLOWS the mouse on hover (spring), with a rippling
// divider that animates by default and halts on hover — matching live's slider.
function BeforeAfter() {
  const [hovering, setHovering] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const target = useMotionValue(50); // divider %, from left
  const pct = useSpring(target, { stiffness: 170, damping: 24, mass: 0.55 }); // springy trail (matches live's lag)
  const oldClip = useTransform(pct, (v) => `inset(0 ${100 - v}% 0 0)`);
  const left = useTransform(pct, (v) => `${v}%`);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!hovering) return;
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    target.set(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  };

  return (
    <div
      className="rw-card__media rw-ba"
      ref={boxRef}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => { setHovering(false); target.set(50); }}
      onPointerMove={onPointerMove}
    >
      <div className="rw-ba__layer rw-ba__new" />
      <motion.div className="rw-ba__layer rw-ba__old" style={{ clipPath: oldClip }} />
      <motion.div className={`rw-ba__divider${hovering ? '' : ' rw-ba__divider--idle'}`} style={{ left }}>
        <div className="rw-ba__bar" aria-hidden="true" />
        {/* two-sided arrow control — suppress the card's "View" pill here (empty cursor label) */}
        <div className="rw-ba__handle" data-cursor-label="">
          <span className="rw-ba__arrows" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="15" height="15"><path d="M10 3.5 5.5 8 10 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <svg viewBox="0 0 16 16" width="15" height="15"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function CardMedia({ media, pan, spin }: { media: Card['media']; pan: MotionValue<number>; spin: MotionValue<number> }) {
  // card 2: the two phones START stacked (smaller behind the bigger) and ROTATE APART as the card
  // scrolls in — smaller swings right to +20°, bigger swings left to -12° — AND slide apart
  // horizontally (smaller +100px right, bigger -100px left), both scrubbed 1:1 to scroll (spin
  // 0→1) and unwinding on scroll up. framer-motion composes x + rotate into ONE transform
  // (translateX(...) rotate(...)), so the horizontal slide is in screen space and neither overrides
  // the other. Horizontal only — no vertical movement (top stays visible, overflow only at bottom).
  const rotSmall = useTransform(spin, (p) => p * 20);
  const rotBig = useTransform(spin, (p) => p * -12);
  const xSmall = useTransform(spin, (p) => p * 100);  // 0 → +100px (right)
  const xBig = useTransform(spin, (p) => p * -100);   // 0 → -100px (left)
  if (media === 'beforeafter') return <BeforeAfter />;
  if (media === 'gamify') {
    return (
      <div className="rw-card__media rw-gamify">
        <div className="rw-gamify__bg" />
        <div className="rw-gamify__scene">
          {/* smaller phone — BEHIND, rotates RIGHT (+20°) + slides RIGHT (+100px) */}
          <motion.div className="rw-gamify__wrap rw-gamify__a" style={{ x: xSmall, rotate: rotSmall }}><img src="/images/rw-gamify-a.gif" alt="" loading="lazy" /></motion.div>
          {/* bigger phone — ON TOP, rotates LEFT (-12°) + slides LEFT (-100px) */}
          <motion.div className="rw-gamify__wrap rw-gamify__b" style={{ x: xBig, rotate: rotBig }}><img src="/images/rw-gamify-b.gif" alt="" loading="lazy" /></motion.div>
        </div>
      </div>
    );
  }
  if (media === 'collage') {
    // 5 overlapping screenshots in a 524-coord scene (scaled per breakpoint), z-order = DOM order.
    // The tall listing (rw-c4-a) pans up with scroll — live's 0.67x scroll-linked effect.
    return (
      <div className="rw-card__media rw-collage">
        <div className="rw-collage__scene">
          <motion.img className="rw-collage__a" style={{ y: pan }} src="/images/rw-c4-a.webp" alt="" loading="lazy" />
          <picture><source srcSet="/images/rw-c4-b.avif" type="image/avif" /><img className="rw-collage__b" src="/images/rw-c4-b.webp" alt="" loading="lazy" /></picture>
          <img className="rw-collage__c" src="/images/rw-c4-c.gif" alt="" loading="lazy" />
          <picture><source srcSet="/images/rw-c4-d.avif" type="image/avif" /><img className="rw-collage__d" src="/images/rw-c4-d.webp" alt="" loading="lazy" /></picture>
          <picture><source srcSet="/images/rw-c4-e.avif" type="image/avif" /><img className="rw-collage__e" src="/images/rw-c4-e.webp" alt="" loading="lazy" /></picture>
        </div>
      </div>
    );
  }
  // figma design-system board pans up with scroll
  return (
    <div className="rw-card__media rw-figma">
      <picture>
        <source srcSet="/images/rw-designsystem.avif" type="image/avif" />
        <motion.img style={{ y: pan }} src="/images/rw-designsystem.webp" alt="" width={674} height={814} loading="lazy" />
      </picture>
    </div>
  );
}

function ProjectCard({ card, scale, pan, spin }: { card: Card; scale: MotionValue<number>; pan: MotionValue<number>; spin: MotionValue<number> }) {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsIn, setStatsIn] = useState(false);
  // Trigger the number scramble off the STATS row's own visibility (not the whole card): the card
  // is tall + sticky, so a card-level trigger fires long before the stats are on screen and they'd
  // finish resolving before you see them. This starts the ~1s scramble as the stats enter view.
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setStatsIn(e.isIntersecting)),
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const className = `rw-card rw-card--${card.bg} rw-card--${card.accent} rw-card--${card.key}`;
  const inner = (
    <>
      <CardMedia media={card.media} pan={pan} spin={spin} />
      <h3 className="rw-card__title">{card.title}</h3>
      <div className={`rw-card__stats${card.stats.length === 2 ? ' rw-card__stats--pair' : ''}`} ref={statsRef}>
        {card.stats.map((s, i) => (
          <div className="rw-stat" key={i}>
            <ScrambleNum final={s.num} active={statsIn} />
            <p className="rw-stat__label">{s.label[0]}<br />{s.label[1]}</p>
          </div>
        ))}
      </div>
    </>
  );

  // every card is a link (opens in a new tab); the whole card is the click target
  if (card.href) {
    return (
      <motion.a
        className={className}
        style={{ scale }}
        href={card.href}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor-label={card.cursor}
        data-cursor-arrow="up-right"
        data-cursor-size="view"
      >
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.div
      className={className}
      style={{ scale }}
      data-cursor-label={card.cursor}
      data-cursor-arrow="up-right"
      data-cursor-size="view"
    >
      {inner}
    </motion.div>
  );
}

// Progressive shrink: each card scales down 0.1 for every card that stacks on top of it
// (final: card1 .7, card2 .8, card3 .9, card4 1.0), scrubbed to scroll, transform-origin center.
const STEP_T = 300; // px over which each shrink step scrubs, ending as the next card pins
// Scroll-pan on each card's tall image [rate, offset, maxPan] — the image pans up as you scroll
// past the card (like live; card 4's listing = 0.67x). Card 0 (before/after) has no pan.
// [rate, startOffset, maxPan]: pan = -rate * clamp((scrollY - pin) + startOffset, 0, maxPan).
// startOffset ~ the entrance distance so the image begins panning as the card scrolls into view
// (like live) and continues through the pinned window.
const PAN: [number, number, number][] = [
  [0, 0, 0],         // auction (before/after) — no pan
  [0, 0, 0],         // gamification — NO pan; card 2 is rotation-only (phones fan apart, see spin)
  [0.4, 640, 300],   // design system — max ~120, clamped so the image always covers the box
  [0.72, 740, 1360], // beyond (long listing) — long smooth travel (max ~979; base -20 => ~40px cover margin)
];
// Card 2 rotation scrub: the fan (0→full angle) plays as the card rises into its pin. spin = 0→1
// over SPIN_RANGE px, starting SPIN_START px before the pin and completing just before it (live).
const SPIN_START = 640;
const SPIN_RANGE = 540;
function useStack(count: number): { scales: MotionValue<number>[]; pans: MotionValue<number>[]; spins: MotionValue<number>[] } {
  const scrollY = useMotionValue(0);
  const reduced = usePrefersReducedMotion();
  const pinsRef = useRef<number[]>([]);
  const phoneRef = useRef(false);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useEffect(() => {
    // Sync scroll via rAF rather than a 'scroll' event: the body is the scroll container here
    // (overflow-x:hidden makes overflow-y computed auto), so window 'scroll' events don't fire
    // reliably. Polling window.scrollY each frame tracks it regardless, and useTransform only
    // recomputes when the value actually changes.
    let raf = 0;
    let last = -1;
    const tick = () => {
      const y = window.scrollY;
      if (y !== last) { last = y; scrollY.set(y); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollY]);

  useEffect(() => {
    const measure = () => {
      phoneRef.current = window.matchMedia('(max-width: 809.98px)').matches; // phone: cards don't shrink (non-sticky)
      const container = document.querySelector<HTMLElement>('.rw__cards');
      const cards = [...document.querySelectorAll<HTMLElement>('.rw__cards > .rw-card')];
      if (!container) return;
      // The container is NOT sticky, so its rect top is always the natural doc position; sum each
      // card's layout height + the flex gap to get each card's natural top (scroll-independent).
      const gap = parseFloat(getComputedStyle(container).rowGap) || 0;
      let y = container.getBoundingClientRect().top + window.scrollY;
      pinsRef.current = cards.map((c) => {
        const st = parseFloat(getComputedStyle(c).top) || 0;
        const pin = y - st;
        y += c.offsetHeight + gap;
        return pin;
      });
    };
    measure();
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 600);
    return () => { window.removeEventListener('resize', measure); clearTimeout(t); };
  }, []);

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  // one transform per card (hooks must be unconditional; count is fixed)
  const scale = (i: number) => useTransform(scrollY, (v) => {
    if (reducedRef.current || phoneRef.current) return 1;
    const pins = pinsRef.current;
    let s = 1;
    for (let j = i + 1; j < count; j++) {
      const p = pins[j];
      if (p == null) continue;
      s -= 0.1 * clamp((v - (p - STEP_T)) / STEP_T, 0, 1);
    }
    return s;
  });
  const pan = (i: number) => useTransform(scrollY, (v) => {
    if (reducedRef.current || phoneRef.current) return 0;
    const p = pinsRef.current[i];
    if (p == null) return 0;
    const [rate, offset, maxPan] = PAN[i];
    return -rate * clamp((v - p) + offset, 0, maxPan);
  });
  // 0→1 rotation progress for the card-2 fan; static (fully fanned) when reduced-motion or phone.
  const spin = (i: number) => useTransform(scrollY, (v) => {
    if (reducedRef.current || phoneRef.current) return 1;
    const p = pinsRef.current[i];
    if (p == null) return 0;
    return clamp((v - (p - SPIN_START)) / SPIN_RANGE, 0, 1);
  });
  return {
    scales: [scale(0), scale(1), scale(2), scale(3)],
    pans: [pan(0), pan(1), pan(2), pan(3)],
    spins: [spin(0), spin(1), spin(2), spin(3)],
  };
}

export function RecentWork() {
  const { scales, pans, spins } = useStack(CARDS.length);
  return (
    <section className="rw" id="recent-work">
      <div className="rw__inner">
        <h2 className="rw__heading">RECENT WORK</h2>
        <p className="rw__subtitle">I LOVE BLENDING ART &amp; TECHNOLOGY</p>
        <div className="rw__cards">
          {CARDS.map((c, i) => (
            <ProjectCard card={c} scale={scales[i]} pan={pans[i]} spin={spins[i]} key={c.key} />
          ))}
          {/* scroll room so all cards can stay pinned together before the stack releases */}
          <div className="rw__spacer" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
