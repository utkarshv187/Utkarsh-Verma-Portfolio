import './hero.css';
import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { RoleTicker, ROLES } from './RoleTicker';
import { RotatingBadge } from './RotatingBadge';
import { LINKS, EXTERNAL } from '../config/site';
import { usePrefersReducedMotion } from '../lib/hooks';

// Aurora runtime:
// 1) cursor-follow — each .hero__aurora-follow wrapper eases toward the pointer's offset from the
//    hero centre (x its data-depth), with a time-based lerp so the glow LAGS behind the mouse. The
//    rAF loop only runs while a wrapper is still travelling, and only for a real mouse.
// 2) pause — the drift + grain are paused (animation-play-state) once the hero is fully hidden:
//    covered by Work Experience (desktop/tablet, where the hero is pinned) or scrolled off (phone).
function useAurora(ref: React.RefObject<HTMLDivElement | null>, reduced: boolean) {
  useEffect(() => {
    const root = ref.current;
    const hero = root?.parentElement;
    if (!root || !hero) return;

    let pauseRaf = 0;
    const checkPaused = () => {
      pauseRaf = 0;
      const h = hero.getBoundingClientRect();
      const we = document.querySelector('.we')?.getBoundingClientRect();
      const hidden = h.bottom <= 0 || (!!we && we.top <= Math.max(0, h.top));
      root.classList.toggle('is-paused', hidden);
    };
    const onScroll = () => { if (!pauseRaf) pauseRaf = requestAnimationFrame(checkPaused); };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    checkPaused();

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const wraps = reduced || !fine ? [] : [...root.querySelectorAll<HTMLElement>('.hero__aurora-follow')];
    const items = wraps.map((el) => {
      const depth = parseFloat(el.dataset.depth || '0.5');
      return { el, depth, ease: depth > 0.7 ? 0.085 : 0.05, x: 0, y: 0 }; // smaller + nearer = quicker
    });
    let px = 0, py = 0, inside = false, raf = 0, last = 0;
    const tick = (t: number) => {
      raf = 0;
      const dt = last ? Math.min(64, t - last) : 16.7;
      last = t;
      let moving = false;
      if (!root.classList.contains('is-paused')) {
        const r = hero.getBoundingClientRect();
        for (const it of items) {
          const tx = inside ? (px - (r.left + r.width / 2)) * it.depth : 0;
          const ty = inside ? (py - (r.top + r.height * 0.35)) * it.depth * 0.6 : 0; // glow lives in the upper band
          const k = 1 - Math.pow(1 - it.ease, dt / 16.7);
          it.x += (tx - it.x) * k;
          it.y += (ty - it.y) * k;
          if (Math.abs(tx - it.x) > 0.3 || Math.abs(ty - it.y) > 0.3) moving = true;
          it.el.style.transform = `translate3d(${it.x.toFixed(1)}px, ${it.y.toFixed(1)}px, 0)`;
        }
      }
      if (moving) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const kick = () => { if (!raf && items.length) raf = requestAnimationFrame(tick); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      px = e.clientX;
      py = e.clientY;
      inside = py >= r.top && py <= r.bottom && !root.classList.contains('is-paused');
      kick();
    };
    const onLeave = () => { inside = false; kick(); };
    if (items.length) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    }
    return () => {
      cancelAnimationFrame(pauseRaf);
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      wraps.forEach((el) => { el.style.transform = ''; });
    };
  }, [ref, reduced]);
}

export function Hero() {
  const reduced = usePrefersReducedMotion();
  const auroraRef = useRef<HTMLDivElement>(null);
  useAurora(auroraRef, reduced);
  const { scrollY } = useScroll();
  // Pure scroll-POSITION → transform mapping (timeline scrub): bound to scroll offset, so it
  // HOLDS when you stop and unwinds as you scroll back up (no velocity/spring/settle). Both a
  // skew AND a real translateX are applied together, in opposite directions:
  //   PRODUCT (+ the O): skews LEFT  + shifts LEFT   (skewX 0->+18.7deg, x 0->-160px)
  //   ROLE text        : skews RIGHT + shifts RIGHT  (skewX 0->-11.68deg, x 0->+160px)
  // The skew pivots at each element's vertical line-centre (see hero.css transform-origins) so it
  // is symmetric and NEVER cancels the translateX. The X-shift is deliberately large so the slide
  // is unmistakable on these full-width words (a small shift is imperceptible when the word
  // overflows both screen edges). Skew is 2x the live-measured lean.
  const productSkew = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, 18.7], { clamp: true });
  const productX = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, -160], { clamp: true });
  const roleSkew = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, -11.68], { clamp: true });
  const roleX = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, 160], { clamp: true });

  return (
    <section className="hero" id="home">
      {/* Living aurora — six soft glow blobs of mixed sizes, each drifting on its own eased CSS
          loop (compositor-thread: transform/opacity/hue only), two of them also easing toward the
          cursor, under an animated film grain. See hero.css + useAuroraFollow. */}
      <div className="hero__aurora" ref={auroraRef} aria-hidden="true">
        <div className="hero__aurora-blob hero__aurora-blob--a" />
        <div className="hero__aurora-blob hero__aurora-blob--b" />
        <div className="hero__aurora-blob hero__aurora-blob--c" />
        <div className="hero__aurora-blob hero__aurora-blob--e" />
        {/* cursor-follow glows: the wrapper takes the eased pointer parallax, the blob inside keeps
            its own autonomous drift, so the two motions compose */}
        <div className="hero__aurora-follow" data-depth="0.55">
          <div className="hero__aurora-blob hero__aurora-blob--f" />
        </div>
        <div className="hero__aurora-follow" data-depth="0.9">
          <div className="hero__aurora-blob hero__aurora-blob--d" />
        </div>
        <div className="hero__grain" />
      </div>
      {/* Yellow diagonal accent (phone only) */}
      <div className="hero__accent" aria-hidden="true" />

      {/* Foreground media */}
      <picture className="hero__portrait">
        <source srcSet="/images/portrait.avif" type="image/avif" />
        {/* lowercase `fetchpriority` (spread) is the DOM attribute React passes through cleanly — the
            camelCase `fetchPriority` prop isn't recognised by this React version and logs a console warning */}
        <img src="/images/portrait.webp" alt="Utkarsh Verma" width={1300} height={1503} {...({ fetchpriority: 'high' } as any)} />
      </picture>

      {/* small cropped-face accent (behind portrait, upper-left over PRODUCT) */}
      <picture className="hero__face" aria-hidden="true">
        <source srcSet="/images/face.avif" type="image/avif" />
        <img src="/images/face.webp" alt="" width={300} height={642} />
      </picture>

      {/* Wordmark + role ticker. Each piece skews with scroll around the SAME origin
          (.hero__text top-left) so they shear as one, but layer independently vs the portrait:
          PR/DUCT and the O (with its ring) sit BEHIND the portrait (z1); the role is in front (z4). */}
      <div className="hero__text">
        <motion.h1 className="hero__product" style={{ skewX: productSkew, x: productX }}>
          PR<span className="hero__o-spacer" aria-hidden="true">O</span>DUCT
        </motion.h1>

        {/* The O letter + rotating ring sit BEHIND the portrait (like live). The anchor's
            exposed edges are the hover/click target for the WhatsApp link. */}
        <motion.a
          className="hero__o"
          href={LINKS.whatsapp}
          {...EXTERNAL}
          aria-label="Chat on WhatsApp"
          style={{ skewX: productSkew, x: productX }}
        >
          O
          <span className="hero__o-dot" aria-hidden="true" />
          <RotatingBadge />
        </motion.a>

        <motion.div className="hero__role-shift" style={{ skewX: roleSkew, x: roleX, y: 0 }}>
          <RoleTicker />
          {/* Tablet/phone: full role list, decreasing size, fading downward. Living inside
              .hero__role-shift means the tablet waterfall inherits the same scroll skew+shift as
              the desktop cycler (the phone overrides role-shift's transform to none). */}
          <ul className="hero__roles-m" aria-hidden="true">
            {ROLES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* bottom ramp: fades the portrait's lower edge + the background into black */}
      <div className="hero__fade" aria-hidden="true" />

      {/* graffiti "UTKARSH VERMA" badge — top-most. Hover: lifts 80px revealing the card; cursor → "That's me" pill. */}
      <div className="hero__graffiti" data-cursor-label={"That's me"}>
        <div className="hero__graffiti-card" aria-hidden="true">
          <p className="hero__gcard-title">ENGINEER TURNED ARTIST</p>
          <p className="hero__gcard-body">
            7+ years of shaping ideas into sleek digital realities with intent, speed, functionality, business &amp; visual clarity
          </p>
        </div>
        <picture className="hero__graffiti-img">
          <source srcSet="/images/graffiti.avif" type="image/avif" />
          <img src="/images/graffiti.webp" alt="Utkarsh Verma" width={700} height={424} />
        </picture>
      </div>
    </section>
  );
}
