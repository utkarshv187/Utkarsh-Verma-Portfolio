import './hero.css';
import { RoleTicker, ROLES } from './RoleTicker';
import { RotatingBadge } from './RotatingBadge';
import { WhatsAppIcon } from './Icons';
import { LINKS, EXTERNAL } from '../config/site';

export function Hero() {
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

      {/* Wordmark + role ticker (behind the portrait) */}
      <div className="hero__text">
        <h1 className="hero__product">
          PR
          <a className="hero__o" href={LINKS.whatsapp} {...EXTERNAL} aria-label="Chat on WhatsApp">
            O
            <RotatingBadge />
            <span className="hero__o-wa" aria-hidden="true">
              <span className="hero__ripple" />
              <span className="hero__ripple" />
              <span className="hero__ripple" />
              <span className="hero__wa">
                <WhatsAppIcon size={54} />
              </span>
            </span>
          </a>
          DUCT
        </h1>
        <RoleTicker />
        {/* Mobile: full role list, decreasing size, fading downward */}
        <ul className="hero__roles-m" aria-hidden="true">
          {ROLES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      {/* graffiti wordmark (front, over portrait chest) — hover reveals the info card */}
      <div className="hero__graffiti">
        <picture>
          <source srcSet="/images/graffiti.avif" type="image/avif" />
          <img src="/images/graffiti.webp" alt="Utkarsh Verma" width={700} height={424} />
        </picture>
        <span className="hero__thatsme" aria-hidden="true">That&rsquo;s me</span>
      </div>

      {/* bottom ramp: fades the portrait's lower edge + the background into black */}
      <div className="hero__fade" aria-hidden="true" />

      {/* graffiti-hover info card (bottom of hero) */}
      <div className="hero__tooltip" aria-hidden="true">
        <p className="hero__tooltip-title">ENGINEER TURNED ARTIST</p>
        <p className="hero__tooltip-body">
          7+ years of shaping ideas into sleek digital realities with intent, speed, functionality, business &amp; visual clarity
        </p>
      </div>
    </section>
  );
}
