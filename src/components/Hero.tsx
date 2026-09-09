import './hero.css';
import { motion, useScroll, useTransform } from 'framer-motion';
import { RoleTicker, ROLES } from './RoleTicker';
import { RotatingBadge } from './RotatingBadge';
import { LINKS, EXTERNAL } from '../config/site';
import { usePrefersReducedMotion } from '../lib/hooks';

export function Hero() {
  const reduced = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  // Pure scroll-POSITION → transform mapping (timeline scrub): bound to scroll offset, so it
  // HOLDS when you stop and unwinds as you scroll back up (no velocity/spring/settle). Both a
  // skew AND a real translateX are applied together, in opposite directions:
  //   PRODUCT (+ the O): skews LEFT  + shifts LEFT   (skewX 0->+18.7deg, x 0->-60px)
  //   ROLE text        : skews RIGHT + shifts RIGHT  (skewX 0->-11.68deg, x 0->+70px)
  // Skew is 2x the live-measured lean (per request). The transform-origins are kept clean
  // (cy = 0) so the skew never cancels the translateX — the X-shift is genuinely visible.
  const productSkew = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, 18.7], { clamp: true });
  const productX = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, -60], { clamp: true });
  const roleSkew = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, -11.68], { clamp: true });
  const roleX = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, 70], { clamp: true });

  return (
    <section className="hero" id="home">
      <div className="hero__aurora" aria-hidden="true" />
      {/* Yellow diagonal accent (phone only) */}
      <div className="hero__accent" aria-hidden="true" />

      {/* Foreground media */}
      <picture className="hero__portrait">
        <source srcSet="/images/portrait.avif" type="image/avif" />
        <img src="/images/portrait.webp" alt="Utkarsh Verma" width={1300} height={1503} fetchPriority="high" />
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
        </motion.div>

        {/* Mobile: full role list, decreasing size, fading downward */}
        <ul className="hero__roles-m" aria-hidden="true">
          {ROLES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
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
