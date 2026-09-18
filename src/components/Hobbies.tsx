import './hobbies.css';
import { useCallback, useEffect, useRef, useState } from 'react';

// WHEN I AM NOT DESIGNING — three photo piles (GAMING / SOCIALIZING / ADVENTURING) you can SWIPE
// to cycle through, and a big "& PHOTOGRAPHING" grid whose images scale in on scroll. Clicking a
// pile opens all four of its photos in a blurred popup; clicking a grid photo opens a lightbox
// with prev/next. (Live's swipe params couldn't be captured via automation — a natural drag-to-
// advance deck is used; the grid scale + radii + lightbox behaviour are from live / the spec.)

type Slot = { dx: number; dy: number; rot: number; z: number };
type Stack = { key: string; title: string; caption: string; photos: string[]; slots: Slot[] };

// slots are the four pile positions (front -> back); `photos[0]` sits at slot 0 (front) at rest —
// the front photos match live (TEKKEN / arcade / scuba).
const STACKS: Stack[] = [
  {
    key: 'gaming', title: 'GAMING', caption: 'very very competitive!',
    photos: ['hob-game-4', 'hob-game-3', 'hob-game-2', 'hob-game-1'],
    slots: [
      { dx: 0, dy: 0, rot: -10, z: 4 }, { dx: 16, dy: -6, rot: -10, z: 3 },
      { dx: -14, dy: 8, rot: -20, z: 2 }, { dx: -28, dy: 16, rot: -30, z: 1 },
    ],
  },
  {
    key: 'socializing', title: 'SOCIALIZING', caption: 'extrovert like a designer should be',
    photos: ['hob-social-4', 'hob-social-3', 'hob-social-2', 'hob-social-1'],
    slots: [
      { dx: 0, dy: 0, rot: 0, z: 4 }, { dx: 12, dy: -4, rot: 6, z: 3 },
      { dx: 20, dy: 6, rot: 12, z: 2 }, { dx: 30, dy: 14, rot: 18, z: 1 },
    ],
  },
  {
    key: 'adventuring', title: 'ADVENTURING', caption: 'whenever work allows',
    photos: ['hob-adv-3', 'hob-adv-4', 'hob-adv-2', 'hob-adv-1'],
    slots: [
      { dx: 4, dy: 0, rot: 10, z: 4 }, { dx: -8, dy: -8, rot: -10, z: 3 },
      { dx: -18, dy: 8, rot: -20, z: 2 }, { dx: -30, dy: 16, rot: -30, z: 1 },
    ],
  },
];

const GRID = Array.from({ length: 15 }, (_, i) => `hob-grid-${i + 1}`);

function Pic({ src, alt, w, h, drag }: { src: string; alt: string; w: number; h: number; drag?: boolean }) {
  return (
    <picture>
      <source srcSet={`/images/${src}.avif`} type="image/avif" />
      <img src={`/images/${src}.webp`} alt={alt} width={w} height={h} loading="lazy" draggable={drag ?? false} />
    </picture>
  );
}

// one swipeable pile: drag horizontally to cycle (advance/retreat by one), a tap opens the popup.
function Pile({ stack, onOpen }: { stack: Stack; onOpen: () => void }) {
  const [order, setOrder] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let downX = 0, downY = 0, moved = 0, dragging = false;
    const down = (e: PointerEvent) => { dragging = true; moved = 0; downX = e.clientX; downY = e.clientY; };
    const move = (e: PointerEvent) => { if (!dragging) return; moved = Math.max(moved, Math.abs(e.clientX - downX)); };
    const up = (e: PointerEvent) => {
      if (!dragging) return; dragging = false;
      const dx = e.clientX - downX, dy = e.clientY - downY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) setOrder((o) => (o + (dx < 0 ? 1 : -1) + stack.photos.length) % stack.photos.length); // swipe -> cycle
      else if (moved < 6) onOpen(); // tap -> popup
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', () => { dragging = false; });
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); };
  }, [stack.photos.length, onOpen]);

  return (
    <div className="hob__pile" ref={ref} role="button" tabIndex={0} aria-label={`${stack.title} photos`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}>
      {stack.photos.map((src, i) => {
        const slot = stack.slots[(i - order + stack.photos.length) % stack.photos.length];
        return (
          <div className="hob__card" key={src} style={{ zIndex: slot.z, transform: `translate(${slot.dx}px, ${slot.dy}px) rotate(${slot.rot}deg)` }}>
            <Pic src={src} alt="" w={296} h={370} />
          </div>
        );
      })}
    </div>
  );
}

type LB = { kind: 'photo'; i: number } | { kind: 'hobby'; s: number } | null;

export function Hobbies() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [lb, setLb] = useState<LB>(null);
  const [lbOpen, setLbOpen] = useState(false);

  // grid images scale 0.5 -> 1 + fade in as each cell enters view (one-way, like live)
  useEffect(() => {
    const cells = gridRef.current?.querySelectorAll('.hob__grid-cell');
    if (!cells) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('hob__grid-cell--in'); io.unobserve(e.target); } }),
      { threshold: 0.2 },
    );
    cells.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  const open = useCallback((v: LB) => { setLb(v); requestAnimationFrame(() => setLbOpen(true)); }, []);
  const close = useCallback(() => { setLbOpen(false); setTimeout(() => setLb(null), 260); }, []);

  // keyboard: Esc closes, arrows move the photo lightbox
  useEffect(() => {
    if (!lb) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (lb.kind === 'photo' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        setLb((c) => (c && c.kind === 'photo' ? { kind: 'photo', i: (c.i + (e.key === 'ArrowRight' ? 1 : -1) + GRID.length) % GRID.length } : c));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lb, close]);

  const step = (d: number) => setLb((c) => (c && c.kind === 'photo' ? { kind: 'photo', i: (c.i + d + GRID.length) % GRID.length } : c));

  return (
    <section className="hob" id="not-designing">
      <div className="hob__inner">
        <h2 className="hob__intro">
          <span className="hob__intro-a">JUST IN CASE </span>
          <span className="hob__intro-b">WHEN I AM NOT DESIGNING</span>
        </h2>
      </div>

      {/* wider than the intro so each pile's fan stays inside its own column (no cross-overlap) */}
      <div className="hob__stacks">
        {STACKS.map((s, si) => (
          <div className={`hob__col hob__col--${s.key}`} key={s.key}>
            <Pile stack={s} onOpen={() => open({ kind: 'hobby', s: si })} />
            <h3 className="hob__title">{s.title}</h3>
            <p className="hob__caption">{s.caption}</p>
          </div>
        ))}
      </div>

      <div className="hob__photo">
        <span className="hob__amp">&amp;</span>
        <h2 className="hob__photo-title">PHOTOGRAPHING</h2>
      </div>

      <div className="hob__grid" ref={gridRef}>
        {GRID.map((src, i) => (
          <button className="hob__grid-cell" key={i} type="button" onClick={() => open({ kind: 'photo', i })} aria-label="View photograph">
            <Pic src={src} alt="Travel photograph by Utkarsh Verma" w={960} h={540} />
          </button>
        ))}
      </div>

      {lb && (
        <div className={`hob__lb${lbOpen ? ' hob__lb--open' : ''}`} onClick={close} role="dialog" aria-modal="true">
          {lb.kind === 'photo' ? (
            <div className="hob__lb-photo" onClick={(e) => e.stopPropagation()}>
              <button className="hob__lb-arrow hob__lb-arrow--prev" type="button" onClick={() => step(-1)} aria-label="Previous">‹</button>
              <Pic src={GRID[lb.i]} alt="Travel photograph by Utkarsh Verma" w={1200} h={800} />
              <button className="hob__lb-arrow hob__lb-arrow--next" type="button" onClick={() => step(1)} aria-label="Next">›</button>
            </div>
          ) : (
            <div className="hob__lb-set" onClick={(e) => e.stopPropagation()}>
              {STACKS[lb.s].photos.map((src) => (
                <div className="hob__lb-set-img" key={src}><Pic src={src} alt="" w={740} h={925} /></div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
