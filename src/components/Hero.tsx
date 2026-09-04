import './hero.css';
import { RoleTicker, ROLES } from './RoleTicker';
import { RotatingBadge } from './RotatingBadge';

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
          PR<span className="hero__o">O<RotatingBadge /></span>DUCT
        </h1>
        <RoleTicker />
        {/* Mobile: full role list, decreasing size, fading downward */}
        <ul className="hero__roles-m" aria-hidden="true">
          {ROLES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      {/* graffiti wordmark (front, over portrait chest) */}
      <picture className="hero__graffiti" aria-hidden="true">
        <source srcSet="/images/graffiti.avif" type="image/avif" />
        <img src="/images/graffiti.webp" alt="Utkarsh Verma" width={700} height={424} />
      </picture>
    </section>
  );
}
