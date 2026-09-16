import './recent-work.css';
import { useEffect, useRef, useState, useCallback } from 'react';
import { usePrefersReducedMotion } from '../lib/hooks';

type Stat = { num: string; label: [string, string] };
type Card = {
  key: string;
  bg: 'navy' | 'purple';
  accent: 'teal' | 'gold';
  title: string;
  href: string;
  media: 'beforeafter' | 'gamify' | 'figma';
  stats: Stat[];
};

const CARDS: Card[] = [
  {
    key: 'auction', bg: 'navy', accent: 'teal', media: 'beforeafter',
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
    key: 'gamification', bg: 'purple', accent: 'gold', media: 'gamify',
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
    key: 'designsystem', bg: 'navy', accent: 'teal', media: 'figma',
    title: 'Established the Spinny design system',
    href: 'https://www.figma.com/design/iBOEPZFnnHc4BZ3FtVsQZ7/Spinny-Design-System---Styles---Components?node-id=2-4101',
    stats: [
      { num: '1000+', label: ['VARIANTS DESIGNED', '& DEVELOPED'] },
      { num: '1/3', label: ['DESIGN', 'BANDWIDTH SAVED'] },
      { num: '1/4', label: ['DEVELOPMENT TIME', 'REDUCED'] },
      { num: 'MAX', label: ['CONSISTENCY', 'ACHIEVED'] },
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

// Card 1: draggable before/after comparison (clip-path wipe), matching live.
function BeforeAfter() {
  const [pct, setPct] = useState(50); // divider position from left, %
  const boxRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPct(Math.max(0, Math.min(100, p)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    movedRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    movedRef.current = true;
    setFromClientX(e.clientX);
  };
  const endDrag = () => { draggingRef.current = false; };
  // prevent the card link from firing when the drag ends on the handle
  const onClickCapture = (e: React.MouseEvent) => { if (movedRef.current) { e.preventDefault(); e.stopPropagation(); movedRef.current = false; } };

  return (
    <div className="rw-card__media rw-ba" ref={boxRef} onClickCapture={onClickCapture}>
      {/* bottom: NEW scene (full) */}
      <div className="rw-ba__layer rw-ba__new" />
      {/* top: OLD scene, clipped so its right side is hidden past the divider */}
      <div className="rw-ba__layer rw-ba__old" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} />
      {/* divider + handle */}
      <div
        className="rw-ba__divider"
        style={{ left: `${pct}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="rw-ba__handle">
          <span className="rw-ba__arrows" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="15" height="15"><path d="M10 3.5 5.5 8 10 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <svg viewBox="0 0 16 16" width="15" height="15"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span className="rw-ba__see" aria-hidden="true">See&nbsp;↗</span>
        </div>
      </div>
    </div>
  );
}

function CardMedia({ media }: { media: Card['media'] }) {
  if (media === 'beforeafter') return <BeforeAfter />;
  if (media === 'gamify') {
    return (
      <div className="rw-card__media rw-gamify">
        <div className="rw-gamify__bg" />
        <div className="rw-gamify__wrap rw-gamify__b"><img src="/images/rw-gamify-b.gif" alt="" loading="lazy" /></div>
        <div className="rw-gamify__wrap rw-gamify__a"><img src="/images/rw-gamify-a.gif" alt="" loading="lazy" /></div>
      </div>
    );
  }
  return (
    <div className="rw-card__media rw-figma">
      <picture>
        <source srcSet="/images/rw-designsystem.avif" type="image/avif" />
        <img src="/images/rw-designsystem.webp" alt="" width={674} height={814} loading="lazy" />
      </picture>
    </div>
  );
}

function ProjectCard({ card, index }: { card: Card; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setInView(true); }),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <a
      ref={ref}
      className={`rw-card rw-card--${card.bg} rw-card--${card.accent}${inView ? ' rw-card--in' : ''}`}
      style={{ top: `${120 + index * 16}px`, zIndex: index + 1 }}
      href={card.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <CardMedia media={card.media} />
      <div className="rw-card__content">
        <h3 className="rw-card__title">{card.title}</h3>
        <div className="rw-card__stats">
          {card.stats.map((s, i) => (
            <div className="rw-stat" key={i}>
              <ScrambleNum final={s.num} active={inView} />
              <p className="rw-stat__label">{s.label[0]}<br />{s.label[1]}</p>
            </div>
          ))}
        </div>
      </div>
    </a>
  );
}

export function RecentWork() {
  return (
    <section className="rw" id="recent-work">
      <div className="rw__inner">
        <h2 className="rw__heading">RECENT WORK</h2>
        <p className="rw__subtitle">I LOVE BLENDING ART &amp; TECHNOLOGY</p>
        <div className="rw__cards">
          {CARDS.map((c, i) => (
            <ProjectCard card={c} index={i} key={c.key} />
          ))}
          {/* scroll room so all three cards can stay pinned together before the stack releases */}
          <div className="rw__spacer" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
