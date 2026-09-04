import './hero.css';
import { motion, useScroll, useTransform } from 'framer-motion';
import { RoleTicker, ROLES } from './RoleTicker';
import { RotatingBadge } from './RotatingBadge';
import { WhatsAppIcon } from './Icons';
import { LINKS, EXTERNAL } from '../config/site';
import { usePrefersReducedMotion } from '../lib/hooks';

export function Hero() {
  const reduced = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  // Scroll-linked skew + X-shift on PRODUCT + role (measured on live: ~0.0094°/px, ~-0.0245px/px)
  const skewX = useTransform(scrollY, [0, 1000], [0, reduced ? 0 : 9.4]);
  const x = useTransform(scrollY, [0, 1000], [0, reduced ? 0 : -24]);

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
          PR/DUCT behind (z1), the O and role in front (z5/z4). */}
      <div className="hero__text">
        <motion.h1 className="hero__product" style={{ skewX, x }}>
          PR<span className="hero__o-spacer" aria-hidden="true">O</span>DUCT
        </motion.h1>

        <motion.a
          className="hero__o"
          href={LINKS.whatsapp}
          {...EXTERNAL}
          aria-label="Chat on WhatsApp"
          style={{ skewX, x }}
        >
          O
          <span className="hero__o-fill" aria-hidden="true" />
          <RotatingBadge />
          <span className="hero__o-wa" aria-hidden="true">
            <span className="hero__ripple" />
            <span className="hero__ripple" />
            <span className="hero__ripple" />
            <span className="hero__ripple" />
            <span className="hero__wa">
              <WhatsAppIcon size={54} />
            </span>
          </span>
        </motion.a>

        <motion.div className="hero__role-shift" style={{ skewX, x, y: 64 }}>
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
      <div className="hero__graffiti" data-cursor-label={"That’s me"}>
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
