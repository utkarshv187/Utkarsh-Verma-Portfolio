import './hobbies.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { play } from '../lib/sound';

// WHEN I AM NOT DESIGNING — three photo piles (GAMING / SOCIALIZING / ADVENTURING) fanned as a
// clean rotational stack (each card rotates about the SAME centre — no horizontal scatter — so the
// pile sits centred over its own title). Swipe the pile in ANY direction to cycle the cards; tap a
// pile to open all four photos in a blurred 2×2 popup. Below, a big "& PHOTOGRAPHING" grid whose
// images scale in on scroll; click one for a lightbox with prev/next.
//
// Fan angles/offsets/sizes and the 3-col→1-col breakpoint (≤1199px) are measured from live:
//   desktop cards 300×400, fan ±(10·n)°; single-column cards 350×500, tighter ±(6·n)° fan.

type Slot = { r: number; t: number; s: number; z: number }; // rotate°, translateY px, scale, z-index
type Stack = { key: string; title: string; caption: string; photos: string[] };

// slots are front→back (index 0 = front). photos[0] rests at the front. Pure rotation about centre.
const DESKTOP_SLOTS: Record<string, Slot[]> = {
  gaming: [{ r: -10, t: -8, s: 0.98, z: 4 }, { r: -20, t: -16, s: 0.96, z: 3 }, { r: -30, t: -24, s: 0.94, z: 2 }, { r: 8, t: 2, s: 1, z: 1 }],
  socializing: [{ r: 6, t: -4, s: 0.98, z: 4 }, { r: 12, t: -8, s: 0.96, z: 3 }, { r: 18, t: -12, s: 0.94, z: 2 }, { r: 0, t: 2, s: 1, z: 1 }],
  adventuring: [{ r: -10, t: -8, s: 0.98, z: 4 }, { r: -20, t: -16, s: 0.96, z: 3 }, { r: -30, t: -24, s: 0.94, z: 2 }, { r: 10, t: 2, s: 1, z: 1 }],
};
const SINGLE_SLOTS: Record<string, Slot[]> = {
  gaming: [{ r: -6, t: -4, s: 0.98, z: 4 }, { r: -12, t: -8, s: 0.96, z: 3 }, { r: -18, t: -12, s: 0.94, z: 2 }, { r: 6, t: 2, s: 1, z: 1 }],
  socializing: [{ r: 6, t: -4, s: 0.98, z: 4 }, { r: 12, t: -8, s: 0.96, z: 3 }, { r: 18, t: -12, s: 0.94, z: 2 }, { r: 0, t: 2, s: 1, z: 1 }],
  adventuring: [{ r: -6, t: -4, s: 0.98, z: 4 }, { r: -12, t: -8, s: 0.96, z: 3 }, { r: -18, t: -12, s: 0.94, z: 2 }, { r: 6, t: 2, s: 1, z: 1 }],
};

const STACKS: Stack[] = [
  { key: 'gaming', title: 'GAMING', caption: 'very very competitive!', photos: ['hob-game-4', 'hob-game-3', 'hob-game-2', 'hob-game-1'] },
  { key: 'socializing', title: 'SOCIALIZING', caption: 'extrovert like a designer should be', photos: ['hob-social-4', 'hob-social-3', 'hob-social-2', 'hob-social-1'] },
  { key: 'adventuring', title: 'ADVENTURING', caption: 'whenever work allows', photos: ['hob-adv-3', 'hob-adv-4', 'hob-adv-2', 'hob-adv-1'] },
];

const GRID = Array.from({ length: 15 }, (_, i) => `hob-grid-${i + 1}`);

function Pic({ src, alt, w, h }: { src: string; alt: string; w: number; h: number }) {
  return (
    <picture>
      <source srcSet={`/images/${src}.avif`} type="image/avif" />
      <img src={`/images/${src}.webp`} alt={alt} width={w} height={h} loading="lazy" draggable={false} />
    </picture>
  );
}

// true when the section is in its single-column (≤1199px) layout
function useSingleCol() {
  const [single, setSingle] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1199.98px)');
    const on = () => setSingle(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return single;
}

// one swipeable pile: drag in ANY direction past the threshold cycles the cards (dominant axis +
// sign chooses forward/back); the front card follows the pointer and springs on release; a tap
// (barely moved) opens the popup.
function Pile({ stack, slots, onOpen }: { stack: Stack; slots: Slot[]; onOpen: () => void }) {
  const n = stack.photos.length;
  const [order, setOrder] = useState(0);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = 0, startY = 0, moved = 0, active = false, id = -1, swished = false;
    const down = (e: PointerEvent) => {
      active = true; moved = 0; swished = false; startX = e.clientX; startY = e.clientY; id = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    const move = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      moved = Math.max(moved, Math.hypot(dx, dy));
      // one swish per drag, once the card has clearly started moving (a tap stays silent)
      if (!swished && moved > 24) { swished = true; play('swish'); }
      setDrag({ x: dx, y: dy });
    };
    const end = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      try { el.releasePointerCapture(id); } catch { /* ignore */ }
      const dx = e.clientX - startX, dy = e.clientY - startY;
      const dist = Math.hypot(dx, dy);
      if (dist > 45) {
        // any direction cycles: dominant axis + sign → left/up = forward, right/down = back
        const dir = (Math.abs(dx) >= Math.abs(dy) ? dx : dy) < 0 ? 1 : -1;
        setOrder((o) => o + dir);
      } else if (moved < 6) {
        onOpen();
      }
      setDrag(null);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
    };
  }, [onOpen]);

  return (
    <div className="hob__pile" ref={ref} role="button" tabIndex={0} aria-label={`${stack.title} photos — swipe to browse, click to open`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}>
      {stack.photos.map((src, i) => {
        const si = (i - (order % n) + n) % n; // this photo's current slot (0 = front)
        const slot = slots[si];
        const isFront = si === 0;
        const base = `translate(-50%, -50%) translateY(${slot.t}px) rotate(${slot.r}deg) scale(${slot.s})`;
        const style: React.CSSProperties = {
          zIndex: slot.z,
          transform: isFront && drag
            ? `translate(${drag.x}px, ${drag.y}px) ${base} rotate(${drag.x * 0.03}deg)`
            : base,
        };
        return (
          <div className={`hob__card${isFront && drag ? ' hob__card--drag' : ''}`} key={src} style={style}>
            <Pic src={src} alt="" w={350} h={500} />
          </div>
        );
      })}
    </div>
  );
}

type LB = { kind: 'photo'; i: number } | { kind: 'hobby'; s: number } | null;

export function Hobbies() {
  const gridRef = useRef<HTMLDivElement>(null);
  const single = useSingleCol();
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

  const open = useCallback((v: LB) => { play('pop-open'); setLb(v); requestAnimationFrame(() => setLbOpen(true)); }, []);
  const close = useCallback(() => { play('pop-close'); setLbOpen(false); setTimeout(() => setLb(null), 260); }, []);

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
  const slotsFor = (key: string) => (single ? SINGLE_SLOTS : DESKTOP_SLOTS)[key];

  return (
    <section className="hob" id="not-designing">
      <div className="hob__inner">
        <h2 className="hob__intro">
          <span className="hob__intro-a">JUST IN CASE </span>
          <span className="hob__intro-b">WHEN I AM NOT DESIGNING</span>
        </h2>
      </div>

      {/* fixed-pitch columns (centred group) so the stacks never collide across hobbies at any width */}
      <div className="hob__stacks">
        {STACKS.map((s, si) => (
          <div className={`hob__col hob__col--${s.key}`} key={s.key}>
            <Pile stack={s} slots={slotsFor(s.key)} onOpen={() => open({ kind: 'hobby', s: si })} />
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
